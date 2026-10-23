// Ninjutsu : les signes de Naruto devant la caméra
// Hamza Karrouchi - BUT INFO 3
//
// La caméra filme les mains, le modèle YOLOX reconnaît le signe (detection.js),
// les signes validés forment un enchaînement (sequence.js), et quand il correspond
// à un jutsu, son effet est dessiné sur la vidéo (effets.js, et rasengan.js en 3D).
//
// Deux boucles tournent en parallèle :
//  - la détection, aussi vite que le modèle le permet (5 à 20 fois par seconde) ;
//  - l'affichage, à chaque image de l'écran (vidéo + effets).

import { SIGNES, JUTSUS, SIGNE_KAI } from "./donnees.js";
import { DetecteurDeSignes } from "./detection.js";
import { Sequence, ATTENTE } from "./sequence.js";
import { Silhouette } from "./silhouette.js";
import { Effets } from "./effets/index.js";
import { Rasengan3D } from "./rasengan.js";
import { activerSon, couperSon, jouer, crier } from "./son.js";
import { pastille, afficherSignes, afficherJutsus, LISTE_FAMILLES } from "./encyclopedie.js";

const el = id => document.getElementById(id);
const video = el("video");
const toile = el("scene");
const ctx = toile.getContext("2d");

const detecteur = new DetecteurDeSignes();
const sequence = new Sequence();
const silhouette = new Silhouette();
const effets = new Effets();
const rasengan = new Rasengan3D(el("calque3d"));

const OUBLI_NORMAL = 4000;  // ms sans signe avant d'oublier l'enchaînement
const OUBLI_GUIDE = 10000;  // plus long pendant l'entraînement

let flux = null;
let deFace = true;    // caméra de face : l'image est affichée en miroir
let enMarche = false;
let derniere = null;  // dernière détection fiable { signe, score, boite, temps }
let guide = null;     // le jutsu de l'entraînement en cours
let enAttente = null; // un jutsu fini, qu'on lance si le joueur ne continue pas : { jutsu, depuis }
let secousse = 0;


// ---- ce qu'on garde d'une visite à l'autre (localStorage) ----

function lire(cle, defaut) {
  try {
    return JSON.parse(localStorage.getItem(cle)) ?? defaut;
  } catch {
    return defaut;
  }
}

function ecrire(cle, valeur) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // stockage plein ou interdit (navigation privée) : tant pis
  }
}

const photos = lire("ninjutsu-photos", {});          // { signe: { image, score } }
const compteurs = lire("ninjutsu-compteurs", {});    // { signe: réussites }
const decouverts = lire("ninjutsu-decouverts", []);  // identifiants des jutsus réussis


// ---- la caméra ----

async function ouvrirCamera() {
  if (flux) flux.getTracks().forEach(piste => piste.stop());
  flux = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: deFace ? "user" : "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false
  });
  video.srcObject = flux;
  await video.play();
}


// ---- la vidéo à l'écran ----
// Elle remplit l'écran (quitte à être rognée) et, de face, elle est en miroir.

const cadre = { l: 0, h: 0, echelle: 1, x: 0, y: 0, largeur: 0, hauteur: 0 };

function calculerCadre() {
  const r = Math.min(window.devicePixelRatio || 1, 2);
  cadre.l = window.innerWidth;
  cadre.h = window.innerHeight;
  if (toile.width !== Math.round(cadre.l * r) || toile.height !== Math.round(cadre.h * r)) {
    toile.width = Math.round(cadre.l * r);
    toile.height = Math.round(cadre.h * r);
  }
  ctx.setTransform(r, 0, 0, r, 0, 0); // on dessine ensuite en pixels CSS
  cadre.echelle = Math.max(cadre.l / video.videoWidth, cadre.h / video.videoHeight);
  cadre.largeur = video.videoWidth * cadre.echelle;
  cadre.hauteur = video.videoHeight * cadre.echelle;
  cadre.x = (cadre.l - cadre.largeur) / 2;
  cadre.y = (cadre.h - cadre.hauteur) / 2;
}

// dessine une image à la place de la vidéo ; decalage et zoom servent aux clones
// (le zoom garde le bas de l'image au même endroit : les clones ont les pieds au sol)
function dessinerCadre(c, image, decalage = 0, zoom = 1) {
  const l = cadre.largeur * zoom;
  const h = cadre.hauteur * zoom;
  const x = cadre.x + (cadre.largeur - l) / 2 + decalage;
  const y = cadre.y + cadre.hauteur - h;
  c.save();
  if (deFace) {
    c.translate(x + l, y);
    c.scale(-1, 1);
    c.drawImage(image, 0, 0, l, h);
  } else {
    c.drawImage(image, x, y, l, h);
  }
  c.restore();
}

// un point de la vidéo -> un point de l'écran
function versEcran(x, y) {
  return {
    x: cadre.x + (deFace ? video.videoWidth - x : x) * cadre.echelle,
    y: cadre.y + y * cadre.echelle
  };
}

// où sont les mains à l'écran (si on ne les voit plus, en bas au centre)
function mains() {
  if (derniere && performance.now() - derniere.temps < 1500) {
    const a = versEcran(derniere.boite.x1, derniere.boite.y1);
    const b = versEcran(derniere.boite.x2, derniere.boite.y2);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) / 2 };
  }
  return { x: cadre.l / 2, y: cadre.h * 0.62, r: Math.min(cadre.l, cadre.h) * 0.12 };
}

// tout ce dont un effet a besoin pour se dessiner (voir effets.js)
function contexte(temps, dt) {
  return {
    temps, dt, l: cadre.l, h: cadre.h, main: mains(), video, dessinerCadre, jouer,
    secouer: force => secousse = Math.max(secousse, force),
    couverture: silhouette.pret ? () => silhouette.couverture(video) : null
  };
}


// ---- l'affichage, à chaque image ----

let tempsPrecedent = performance.now();

function rendre(temps) {
  requestAnimationFrame(rendre);
  const dt = Math.min((temps - tempsPrecedent) / 1000, 0.05);
  tempsPrecedent = temps;
  if (!enMarche || video.readyState < 2) return;

  calculerCadre();
  const e = contexte(temps, dt);

  // la secousse (boule de feu...) : toute l'image décalée un peu au hasard
  const force = secousse;
  secousse = 0;
  ctx.save();
  ctx.translate((Math.random() - 0.5) * force * 2, (Math.random() - 0.5) * force * 2);
  ctx.fillStyle = "#000";
  ctx.fillRect(-30, -30, cadre.l + 60, cadre.h + 60);

  dessinerCadre(ctx, video);
  effets.appeler("fond", ctx, e);
  // la personne détourée, seulement si un effet en a besoin (c'est un calcul de plus)
  if (silhouette.pret && effets.besoinSilhouette()) e.personne = silhouette.decouper(video, temps);
  effets.appeler("derriere", ctx, e);
  // la personne repasse devant ce qui a été dessiné derrière elle, sauf si un effet la remplace
  const remplacee = effets.appeler("personne", ctx, e);
  if (e.personne && !remplacee) dessinerCadre(ctx, e.personne);
  effets.appeler("devant", ctx, e);
  effets.dessinerParticules(ctx);
  if (el("voirDetection").checked) dessinerDetection();
  ctx.restore();

  effets.avancer(dt, temps);
  if (rasengan.actif) rasengan.placer(e.main.x, e.main.y); // le Rasengan suit la main
}

requestAnimationFrame(rendre);

// le cadre de la détection, autour des mains
function dessinerDetection() {
  if (!derniere || performance.now() - derniere.temps > 400) return;
  const a = versEcran(derniere.boite.x1, derniere.boite.y1);
  const b = versEcran(derniere.boite.x2, derniere.boite.y2);
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  ctx.strokeStyle = "rgba(249, 115, 22, 0.9)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(x, y, Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  ctx.setLineDash([]);
}


// ---- la détection, en boucle ----

async function boucleDetection() {
  while (enMarche) {
    if (video.readyState >= 2) {
      try {
        traiter(await detecteur.detecter(video, video.videoWidth, video.videoHeight));
      } catch (erreur) {
        console.error(erreur);
      }
    }
    await new Promise(suite => requestAnimationFrame(suite));
  }
}

function traiter(detection) {
  const maintenant = performance.now();
  if (detection && detection.score >= 0.5) derniere = { ...detection, temps: maintenant };
  montrerSigneVu(detection);
  const signe = sequence.ajouter(detection, maintenant);
  if (signe) signeValide(signe, detection, maintenant);

  // un jutsu fini attendait une suite qui n'est pas venue : on le lance
  if (enAttente && maintenant - enAttente.depuis > ATTENTE) {
    const jutsu = enAttente.jutsu;
    enAttente = null;
    declencher(jutsu, maintenant);
  }

  // un signe tenu assez longtemps (le Rat pour l'ombre de Shikamaru...)
  const tenu = sequence.signeTenu(maintenant);
  montrerTenu(tenu);
  if (tenu && tenu.part >= 1) declencher(tenu.jutsu, maintenant);

  afficherEnchainement();
}

function signeValide(signe, detection, maintenant) {
  // "Kai !" : le signe du Bélier rompt un genjutsu, comme dans l'anime
  if (signe === SIGNE_KAI && effets.genjutsuActif()) {
    effets.rompreGenjutsu(contexte(maintenant, 0));
    jouer("kai");
    sequence.vider();
    message("解 Kai ! L'illusion est rompue.");
    return;
  }

  jouer("signe", sequence.historique.length);
  if (navigator.vibrate) navigator.vibrate(25);
  compteurs[signe] = (compteurs[signe] || 0) + 1;
  ecrire("ninjutsu-compteurs", compteurs);
  photographier(signe, detection);

  // Un nouveau signe : le jutsu en attente n'est plus d'actualité, on regarde à nouveau.
  // Si ces signes sont aussi le début d'un jutsu plus long, on attend un peu la suite.
  enAttente = null;
  const fini = sequence.jutsuTermine();
  if (fini && fini.attendre) enAttente = { jutsu: fini.jutsu, depuis: maintenant };
  else if (fini) declencher(fini.jutsu, maintenant);
}

function declencher(jutsu, maintenant) {
  sequence.vider();
  enAttente = null;
  const e = contexte(maintenant, 0);
  const def = effets.lancer(jutsu.effet, e);
  if (def.rasengan3d) rasengan.lancer(e.main.x, e.main.y, Math.max(e.main.r * 0.9, 40));
  if (def.silhouette && !silhouette.pret) message("Le détourage se charge encore : effet simplifié.");

  jouer("jutsu");
  if (def.sonDepart) jouer(def.sonDepart);
  setTimeout(() => jouer(def.son), 250); // juste après le coup du jutsu
  crier(jutsu);
  banniere(jutsu);

  if (!decouverts.includes(jutsu.id)) {
    decouverts.push(jutsu.id);
    ecrire("ninjutsu-decouverts", decouverts);
    message("Nouveau jutsu découvert : " + jutsu.nom + " ! (" + decouverts.length + " / " + JUTSUS.length + ")");
  }
  if (guide && guide.id === jutsu.id) message("Bravo, tu maîtrises « " + jutsu.nom + " » !");
}

// la photo du signe pour l'encyclopédie : on garde la plus sûre
function photographier(signe, detection) {
  const ancienne = photos[signe];
  if (detection.score < 0.7 || (ancienne && ancienne.score >= detection.score)) return;

  const { x1, y1, x2, y2 } = detection.boite;
  const cote = Math.max(x2 - x1, y2 - y1) * 1.4; // un carré un peu plus grand que les mains
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const k = c.getContext("2d");
  if (deFace) { // dans le même sens qu'à l'écran
    k.translate(160, 0);
    k.scale(-1, 1);
  }
  k.drawImage(video, (x1 + x2) / 2 - cote / 2, (y1 + y2) / 2 - cote / 2, cote, cote, 0, 0, 160, 160);
  photos[signe] = { image: c.toDataURL("image/jpeg", 0.75), score: Math.round(detection.score * 100) / 100 };
  ecrire("ninjutsu-photos", photos);
}


// ---- l'interface ----

let dernierVu = 0;

// le signe que le modèle voit en ce moment
function montrerSigneVu(detection) {
  if (detection && detection.score >= 0.5) {
    const s = SIGNES[detection.signe];
    el("vuKanji").textContent = s.kanji;
    el("vuNom").textContent = s.nom;
    el("vuScore").style.width = Math.round(detection.score * 100) + "%";
    el("signeVu").classList.add("visible");
    dernierVu = performance.now();
  } else if (performance.now() - dernierVu > 600) {
    el("signeVu").classList.remove("visible");
  }
}

// un signe qu'on tient pour un jutsu à un seul signe : on montre où on en est
function montrerTenu(tenu) {
  const visible = tenu && tenu.part > 0.25; // pas tout de suite, le joueur commence peut-être un enchaînement
  el("vuTenu").textContent = visible ? "Tiens… " + tenu.jutsu.kanji + " " + Math.round(tenu.part * 100) + " %" : "";
}

let dernierAffichage = "";

// l'historique, les jutsus commencés et l'entraînement
function afficherEnchainement() {
  const cle = sequence.historique.join(",") + "|" + (guide ? guide.id : "") + "|" + (enAttente ? enAttente.jutsu.id : "");
  if (cle === dernierAffichage) return;
  dernierAffichage = cle;

  el("historique").innerHTML = sequence.historique.slice(-10).map(s => pastille(s)).join("");
  const attente = enAttente
    ? '<p class="attente"><span class="kanji">' + enAttente.jutsu.kanji + "</span> part dans un instant… ou continue !</p>"
    : "";
  el("enCours").innerHTML = guide ? "" : attente + sequence.enCours(3).map(p =>
    '<p><span class="kanji">' + p.jutsu.kanji + "</span> " + p.fait + "/" + p.total
    + " · ensuite " + pastille(p.prochain) + "</p>").join("");

  if (guide) {
    const p = sequence.progression(guide);
    el("guideSuite").innerHTML = guide.signes.map((s, i) => pastille(s, i < p.fait ? "fait" : i === p.fait ? "prochain" : "")).join("");
    const prochain = SIGNES[p.prochain];
    el("guideProchain").innerHTML = '<span class="kanji">' + prochain.kanji + "</span> " + prochain.nom
      + (guide.tenir ? " · à tenir 2,5 s" : "") + "<small>" + prochain.position + "</small>";
  }
}

let minuteurBanniere = null;

function banniere(jutsu) {
  const b = el("banniere");
  b.querySelector(".type").textContent = jutsu.type;
  b.querySelector(".kanji").textContent = jutsu.kanji;
  b.querySelector(".nom").textContent = jutsu.romaji + " · " + jutsu.nom;
  b.classList.remove("visible");
  void b.offsetWidth; // relance l'animation CSS
  b.classList.add("visible");
  clearTimeout(minuteurBanniere);
  minuteurBanniere = setTimeout(() => b.classList.remove("visible"), 3200);
}

let minuteurMessage = null;

function message(texte, duree = 3500) {
  el("message").textContent = texte;
  el("message").hidden = false;
  clearTimeout(minuteurMessage);
  minuteurMessage = setTimeout(() => el("message").hidden = true, duree);
}

function etat(texte) {
  el("etat").textContent = texte;
}


// ---- démarrage (depuis un clic : caméra et son demandent un geste) ----

async function demarrer() {
  if (enMarche) return;
  activerSon();
  el("btnDemarrer").disabled = true;
  etat("Ouverture de la caméra...");
  try {
    await ouvrirCamera();
  } catch (erreur) {
    etat("Caméra indisponible : " + erreur.message + ". Il faut l'autoriser, et la page doit être en HTTPS.");
    el("btnDemarrer").disabled = false;
    return;
  }
  if (!detecteur.session) {
    etat("Chargement du modèle de détection (4 Mo)...");
    try {
      await detecteur.charger("modele/yolox_nano_with_post.onnx");
    } catch (erreur) {
      etat("Le modèle n'a pas pu être chargé : " + erreur.message);
      el("btnDemarrer").disabled = false;
      return;
    }
  }
  etat("");
  el("accueil").hidden = true;
  enMarche = true;
  boucleDetection();
  // le détourage (clones, permutation, genjutsus) se charge pendant qu'on joue
  silhouette.charger().catch(erreur => console.warn("Détourage indisponible :", erreur));
}


// ---- l'encyclopédie et l'entraînement ----

let famille = "Tous"; // le filtre de la liste des jutsus

function ouvrirEncyclopedie() {
  afficherSignes(el("listeSignes"), photos, compteurs);
  afficherFamilles();
  el("bilan").textContent = decouverts.length + " / " + JUTSUS.length + " jutsus découverts";
  el("encyclo").hidden = false;
}

// les boutons de filtre (Feu, Eau...) et la liste des jutsus de la famille choisie
function afficherFamilles() {
  el("familles").innerHTML = LISTE_FAMILLES.map(f =>
    '<button type="button" data-famille="' + f + '" aria-pressed="' + (f === famille) + '">' + f + "</button>").join("");
  for (const bouton of el("familles").querySelectorAll("button")) {
    bouton.addEventListener("click", () => {
      famille = bouton.dataset.famille;
      afficherFamilles();
    });
  }
  afficherJutsus(el("listeJutsus"), decouverts, famille, entrainer);
}

function choisirOnglet(nom) {
  for (const onglet of document.querySelectorAll("[role=tab]")) {
    const actif = onglet.dataset.onglet === nom;
    onglet.setAttribute("aria-selected", String(actif));
    el(onglet.getAttribute("aria-controls")).hidden = !actif;
  }
}

function entrainer(jutsu) {
  guide = jutsu;
  sequence.vider();
  sequence.oubli = OUBLI_GUIDE;
  el("guideNom").textContent = jutsu.kanji + " · " + jutsu.nom;
  el("guide").hidden = false;
  el("encyclo").hidden = true;
  dernierAffichage = "";
  afficherEnchainement();
  demarrer(); // si la caméra n'est pas encore ouverte
}

function arreterEntrainement() {
  guide = null;
  sequence.oubli = OUBLI_NORMAL;
  el("guide").hidden = true;
  dernierAffichage = "";
  afficherEnchainement();
}


// ---- les boutons ----

el("btnDemarrer").addEventListener("click", demarrer);
el("btnEncyclo").addEventListener("click", ouvrirEncyclopedie);
el("btnEncycloAccueil").addEventListener("click", ouvrirEncyclopedie);
el("btnFermerEncyclo").addEventListener("click", () => el("encyclo").hidden = true);
for (const onglet of document.querySelectorAll("[role=tab]")) {
  onglet.addEventListener("click", () => choisirOnglet(onglet.dataset.onglet));
}
el("btnFinGuide").addEventListener("click", arreterEntrainement);

el("btnCamera").addEventListener("click", async () => {
  deFace = !deFace;
  try {
    await ouvrirCamera();
  } catch {
    deFace = !deFace; // pas d'autre caméra : on revient à la précédente
    message("Pas d'autre caméra sur cet appareil.");
    await ouvrirCamera().catch(() => {});
  }
});

el("btnSon").addEventListener("click", () => {
  const muet = el("btnSon").getAttribute("aria-pressed") !== "true";
  el("btnSon").setAttribute("aria-pressed", String(muet));
  el("btnSon").textContent = muet ? "🔇" : "🔊";
  couperSon(muet);
});
