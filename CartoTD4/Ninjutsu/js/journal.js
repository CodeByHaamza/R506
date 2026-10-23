// Le journal de bord : ce qui se passe dans l'appli, gardé même si la page se recharge
// Hamza Karrouchi - BUT INFO 3
//
// Un téléphone qui manque de mémoire tue l'onglet puis le recharge : tout ce qui était
// en mémoire est perdu, y compris la console. Ce journal est donc écrit dans le
// localStorage, et un "battement" toutes les 5 secondes permet de savoir, au
// chargement suivant, si la page précédente s'est arrêtée brutalement.

const CLE = "ninjutsu-journal";
const CLE_BATTEMENT = "ninjutsu-battement";
const MAX = 400; // lignes gardées

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
    // stockage plein ou interdit : le journal reste au moins dans la console
  }
}

const lignes = lire(CLE, []);

export function noter(type, texte) {
  const heure = new Date().toLocaleTimeString("fr-FR") + "." + String(Date.now() % 1000).padStart(3, "0");
  const ligne = heure + " [" + type + "] " + texte;
  lignes.push(ligne);
  if (lignes.length > MAX) lignes.splice(0, lignes.length - MAX);
  ecrire(CLE, lignes);
  console.log(ligne);
}

export function texteDuJournal() {
  return lignes.join("\n");
}

export function viderJournal() {
  lignes.length = 0;
  ecrire(CLE, lignes);
}

// la mémoire utilisée par le JavaScript (Chrome seulement), en Mo
export function memoire() {
  const m = performance.memory;
  return m ? Math.round(m.usedJSHeapSize / 1e6) + "/" + Math.round(m.jsHeapSizeLimit / 1e6) + " Mo" : "inconnue";
}

// ---- le battement ----
// etat() renvoie un petit texte sur ce que fait l'appli à cet instant

let etatActuel = () => "";
let quittee = false; // la page a été quittée proprement : on ne bat plus

export function battre(etat) {
  if (etat) etatActuel = etat;
  if (quittee) return;
  ecrire(CLE_BATTEMENT, { temps: Date.now(), etat: etatActuel(), visible: !document.hidden, propre: false });
}

// à appeler une fois, au chargement de la page
export function demarrerJournal() {
  const navigation = performance.getEntriesByType("navigation")[0];
  const precedent = lire(CLE_BATTEMENT, null);
  noter("page", "chargée (" + (navigation ? navigation.type : "?") + ")"
    + (document.wasDiscarded ? ", l'onglet avait été JETÉ par le navigateur (manque de mémoire en arrière-plan)" : "")
    + " · " + navigator.userAgent.replace(/^Mozilla\/5\.0 /, "")
    + " · mémoire de l'appareil " + (navigator.deviceMemory ? navigator.deviceMemory + " Go" : "inconnue")
    + " · écran " + innerWidth + "x" + innerHeight + " x" + devicePixelRatio);

  // la page d'avant battait encore il y a peu et n'a pas été quittée proprement : elle a planté
  if (precedent && !precedent.propre && Date.now() - precedent.temps < 60000) {
    noter("ALERTE", "la page précédente s'est arrêtée brutalement " + Math.round((Date.now() - precedent.temps) / 1000)
      + " s avant ce chargement, " + (precedent.visible ? "pendant qu'on l'utilisait" : "en arrière-plan")
      + ". Dernier état : " + precedent.etat);
  }

  battre();
  setInterval(() => battre(), 5000);
  // "pagehide" arrive AVANT le dernier "visibilitychange" : sans le drapeau "quittee",
  // ce dernier battement effaçait le "propre" et chaque rechargement passait pour un plantage
  addEventListener("pagehide", () => {
    noter("page", "quittée");
    ecrire(CLE_BATTEMENT, { temps: Date.now(), etat: etatActuel(), visible: false, propre: true });
    quittee = true;
  });
  // la page revient du cache du navigateur (bouton retour) : elle bat à nouveau
  addEventListener("pageshow", e => {
    if (e.persisted) {
      quittee = false;
      noter("page", "revenue du cache");
      battre();
    }
  });
  addEventListener("error", e => noter("ERREUR", e.message + " (" + (e.filename || "").split("/").pop() + ":" + e.lineno + ")"));
  addEventListener("unhandledrejection", e => noter("ERREUR", "promesse rejetée : " + (e.reason && e.reason.message || e.reason)));
  document.addEventListener("visibilitychange", () => {
    noter("page", document.hidden ? "passée en arrière-plan" : "revenue au premier plan");
    battre();
  });
}

// prévient si un canvas WebGL perd son contexte (le GPU a été réinitialisé)
export function surveillerWebGL(canvas, nom) {
  canvas.addEventListener("webglcontextlost", () => noter("ALERTE", "contexte WebGL perdu : " + nom));
  canvas.addEventListener("webglcontextrestored", () => noter("info", "contexte WebGL rétabli : " + nom));
}
