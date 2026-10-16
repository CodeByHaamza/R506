// TD3 Exo 2 - Objets géolocalisés dans la caméra (réalité augmentée)
// Hamza Karrouchi - BUT INFO 3
// doc : https://developer.mozilla.org/fr/docs/Web/API/MediaDevices/getUserMedia
//       https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Orientation_and_motion_data_explained
//       https://ar-js-org.github.io/AR.js-Docs/location-based/
//       https://wiki.openstreetmap.org/wiki/Overpass_API

import * as THREE from "three";

const el = id => document.getElementById(id);
const RAD = THREE.MathUtils.degToRad;
const NICE = { lat: 43.6975, lon: 7.2708 }; // position par défaut si le GPS ne répond pas


// ---- scène three.js, transparente pour voir la vidéo derrière ----

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 5000);
camera.position.y = 1.6; // à hauteur des yeux

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
el("scene").appendChild(renderer.domElement);

// à peu près le champ de vision de l'appareil photo d'un téléphone :
// ~60° dans la longueur de l'écran, moins dans la largeur
function redimensionner() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = camera.aspect < 1 ? 60 : 45;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
redimensionner();
window.addEventListener("resize", redimensionner);

scene.add(new THREE.AmbientLight(0xffffff, 1.5));
const soleil = new THREE.DirectionalLight(0xffffff, 1.5);
soleil.position.set(2, 5, 3);
scene.add(soleil);


// ---- latitude / longitude -> repère local ----
// Repère de la scène : x vers l'est, y vers le haut, -z vers le nord, en mètres.
// Près de moi la Terre est presque plate : 1° de latitude fait 111,32 km,
// 1° de longitude fait 111,32 km x cos(latitude).

let origine = null; // ma première position : le (0, 0, 0) de la scène
const M_PAR_DEGRE = 111320;

function versLocal(lat, lon) {
  return new THREE.Vector3(
    (lon - origine.lon) * M_PAR_DEGRE * Math.cos(RAD(origine.lat)),
    0,
    -(lat - origine.lat) * M_PAR_DEGRE
  );
}

// Pour les villes lointaines le plan ne suffit plus : distance du grand cercle
// et cap de départ (https://www.movable-type.co.uk/scripts/latlong.html)
function distanceEtCap(a, b) {
  const p1 = RAD(a.lat), p2 = RAD(b.lat), dl = RAD(b.lon - a.lon);
  const h = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return {
    distance: 2 * 6371000 * Math.asin(Math.sqrt(h)),
    // en radians : 0 = nord, PI/2 = est
    cap: Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl))
  };
}

function texteDistance(m) {
  if (m < 1000) return Math.round(m) + " m";
  return (m / 1000).toFixed(m < 10000 ? 1 : 0) + " km";
}


// ---- les objets géolocalisés ----

const objets = []; // { nom, lat, lon, couleur, loin, groupe, etiquette, distance }

// une étiquette : du texte dessiné dans un canvas, affiché par un sprite
function creerEtiquette() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const matiere = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false });
  const sprite = new THREE.Sprite(matiere);
  sprite.scale.set(7.7, 2.4, 1);
  sprite.renderOrder = 1; // toujours devant les objets
  return sprite;
}

function ecrire(sprite, ligne1, ligne2, couleur) {
  const canvas = sprite.material.map.image;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(15, 17, 21, 0.75)";
  ctx.beginPath();
  ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 28);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = couleur;
  ctx.font = "bold 46px system-ui, sans-serif";
  ctx.fillText(ligne1, 256, 70, 480); // le dernier paramètre resserre un nom trop long
  ctx.fillStyle = "#ffffff";
  ctx.font = "36px system-ui, sans-serif";
  ctx.fillText(ligne2, 256, 126, 480);
  sprite.material.map.needsUpdate = true;
}

function matiere(couleur) {
  return new THREE.MeshStandardMaterial({ color: couleur, emissive: couleur, emissiveIntensity: 0.35 });
}

// une borne (poteau + boule), une épingle (pointe + boule) ou une ville (grosse boule)
function creerForme(forme, couleur) {
  const groupe = new THREE.Group();
  if (forme === "borne") {
    const poteau = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.5, 12), matiere(couleur));
    poteau.position.y = 1.25;
    const boule = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), matiere(couleur));
    boule.position.y = 2.7;
    groupe.add(poteau, boule);
  } else if (forme === "epingle") {
    const pointe = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 16), matiere(couleur));
    pointe.rotation.x = Math.PI; // la pointe vers le sol
    pointe.position.y = 0.8;
    const boule = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), matiere(couleur));
    boule.position.y = 2;
    groupe.add(pointe, boule);
  } else {
    groupe.add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 24), matiere(couleur)));
  }
  return groupe;
}

function ajouterObjet(nom, lat, lon, couleur, forme) {
  const o = { nom, lat, lon, couleur, loin: forme === "ville", groupe: creerForme(forme, couleur), etiquette: creerEtiquette() };
  o.etiquette.position.y = forme === "ville" ? 2.2 : 4.6;
  o.groupe.add(o.etiquette);
  scene.add(o.groupe);
  objets.push(o);
  placer(o);
  L.circleMarker([lat, lon], { radius: 4, color: couleur, fillOpacity: 1, weight: 1 }).addTo(miniCarte);
}

// position et taille dans la scène, distance sur l'étiquette
function placer(o) {
  if (o.loin) {
    // une ville lointaine est montrée à 80 m, dans sa direction : c'est une boussole
    const { distance, cap } = distanceEtCap(maPos, o);
    o.distance = distance;
    o.groupe.position.set(moi.x + Math.sin(cap) * 80, 6, moi.z - Math.cos(cap) * 80);
  } else {
    o.groupe.position.copy(versLocal(o.lat, o.lon));
    o.distance = Math.hypot(o.groupe.position.x - moi.x, o.groupe.position.z - moi.z);
  }
  // au-delà de 30 m on grossit l'objet pour qu'il garde la même taille à l'écran
  o.groupe.scale.setScalar(Math.max(1, o.groupe.position.distanceTo(moi) / 30));
  ecrire(o.etiquette, o.nom, texteDistance(o.distance), o.couleur);
}


// ---- ce qu'on place autour de moi ----

// quatre bornes à 25 m, pour vérifier que la boussole est juste
function ajouterBornes() {
  const dLat = 25 / M_PAR_DEGRE;
  const dLon = 25 / (M_PAR_DEGRE * Math.cos(RAD(origine.lat)));
  ajouterObjet("Nord", origine.lat + dLat, origine.lon, "#ef4444", "borne");
  ajouterObjet("Est", origine.lat, origine.lon + dLon, "#facc15", "borne");
  ajouterObjet("Sud", origine.lat - dLat, origine.lon, "#3b82f6", "borne");
  ajouterObjet("Ouest", origine.lat, origine.lon - dLon, "#22c55e", "borne");
}

// la direction de quelques villes
const VILLES = [
  { nom: "Nice", lat: 43.6975, lon: 7.2708 },     // place Masséna, comme au TD1
  { nom: "Marseille", lat: 43.2965, lon: 5.3698 },
  { nom: "Paris", lat: 48.8584, lon: 2.2945 },     // tour Eiffel
  { nom: "New York", lat: 40.7484, lon: -73.9857 },
  { nom: "Tokyo", lat: 35.6762, lon: 139.6503 }
];

function ajouterVilles() {
  for (const v of VILLES) {
    if (distanceEtCap(maPos, v).distance > 2000) ajouterObjet(v.nom, v.lat, v.lon, "#c084fc", "ville");
  }
}

// "autres données" : les lieux autour de moi dans OpenStreetMap, avec l'API Overpass
const CATEGORIES = {
  cafe:       { nom: "Café", couleur: "#f59e0b" },
  restaurant: { nom: "Restaurant", couleur: "#f43f5e" },
  fast_food:  { nom: "Restauration rapide", couleur: "#fb923c" },
  pharmacy:   { nom: "Pharmacie", couleur: "#4ade80" },
  bank:       { nom: "Banque", couleur: "#94a3b8" },
  bakery:     { nom: "Boulangerie", couleur: "#fde047" },
  bus_stop:   { nom: "Arrêt de bus", couleur: "#38bdf8" }
};

// le serveur principal est parfois surchargé : on essaie alors le suivant
const SERVEURS_OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter"
];

function interroger(requete, i = 0) {
  return fetch(SERVEURS_OVERPASS[i] + "?data=" + encodeURIComponent(requete))
    .then(r => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .catch(erreur => i + 1 < SERVEURS_OVERPASS.length ? interroger(requete, i + 1) : Promise.reject(erreur));
}

function chargerLieux() {
  const autour = "(around:400," + origine.lat + "," + origine.lon + ")";
  const requete = "[out:json][timeout:25];("
    + "node" + autour + '[amenity~"^(cafe|restaurant|fast_food|pharmacy|bank)$"];'
    + "node" + autour + "[shop=bakery];"
    + "node" + autour + "[highway=bus_stop];"
    + ");out 80;";

  el("infos").textContent = "Recherche des lieux OpenStreetMap autour de moi (Overpass peut mettre jusqu'à 30 s)...";
  interroger(requete)
    .then(d => {
      // on garde les 30 plus proches, sinon les étiquettes se cachent les unes les autres
      const lieux = d.elements
        .map(p => ({ ...p, d: versLocal(p.lat, p.lon).length() }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 30);
      for (const p of lieux) {
        // un arrêt de bus peut aussi avoir amenity=shelter : on prend la première catégorie connue
        const cat = CATEGORIES[p.tags.amenity] || CATEGORIES[p.tags.shop] || CATEGORIES[p.tags.highway];
        ajouterObjet(p.tags.name || cat.nom, p.lat, p.lon, cat.couleur, "epingle");
      }
      el("infos").textContent = lieux.length + " lieux OpenStreetMap à moins de 400 m, 4 bornes à 25 m et "
        + objets.filter(o => o.loin).length + " villes.";
    })
    .catch(erreur => {
      console.error(erreur);
      // Overpass limite le nombre de requêtes par personne : s'il est saturé, il répond
      // une erreur sans en-tête CORS, que le navigateur affiche comme une erreur CORS
      el("infos").textContent = "Lieux OpenStreetMap non chargés : Overpass est saturé, recharge la page dans une minute.";
    });
}


// ---- la mini-carte : le "compas 2D" ----

const miniCarte = L.map("minicarte", {
  zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
  touchZoom: false, boxZoom: false, keyboard: false
}).setView([NICE.lat, NICE.lon], 16);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
}).addTo(miniCarte);
miniCarte.attributionControl.setPrefix(false);

const moiCarte = L.circleMarker([NICE.lat, NICE.lon], { radius: 6, color: "#fff", fillColor: "#2563eb", fillOpacity: 1, weight: 2 });
const regardCarte = L.polyline([], { color: "#2563eb", weight: 3 });

// un trait de 150 m dans la direction où regarde la caméra
function majMiniCarte(cap) {
  if (!maPos) return;
  const fin = [
    maPos.lat + Math.cos(cap) * 150 / M_PAR_DEGRE,
    maPos.lon + Math.sin(cap) * 150 / (M_PAR_DEGRE * Math.cos(RAD(maPos.lat)))
  ];
  regardCarte.setLatLngs([[maPos.lat, maPos.lon], fin]);
}


// ---- ma position ----

const moi = new THREE.Vector3(0, 1.6, 0); // où devrait être la caméra
let maPos = null;
let dernierePlace = null; // position lors de la dernière mise à jour des étiquettes

function surPosition(lat, lon, precision) {
  maPos = { lat, lon };
  if (!origine) {
    origine = { lat, lon };
    camera.position.set(0, 1.6, 0);
    moiCarte.addTo(miniCarte);
    regardCarte.addTo(miniCarte);
    ajouterBornes();
    ajouterVilles();
    chargerLieux();
  }
  moi.copy(versLocal(lat, lon)).setY(1.6);
  moiCarte.setLatLng([lat, lon]);
  miniCarte.setView([lat, lon]);
  el("position").textContent = "Position : " + lat.toFixed(5) + ", " + lon.toFixed(5)
    + (precision ? " (± " + Math.round(precision) + " m)" : "");

  // on ne réécrit les étiquettes que si on a bougé de plus de 5 m
  if (!dernierePlace || dernierePlace.distanceTo(moi) > 5) {
    dernierePlace = moi.clone();
    objets.forEach(placer);
  }
}

function demarrerGeoloc() {
  const parDefaut = raison => {
    el("position").textContent = raison + " : position par défaut à Nice.";
    if (!origine) surPosition(NICE.lat, NICE.lon, 0);
  };
  if (!navigator.geolocation) return parDefaut("Pas de géolocalisation");

  navigator.geolocation.watchPosition(
    pos => surPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
    err => parDefaut("Position impossible (" + err.message + ")"),
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
  );
}


// ---- le flux de la caméra ----

function demarrerCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    el("etat").textContent = "Pas d'accès à la caméra (il faut du HTTPS).";
    return;
  }
  // "environment" : la caméra arrière du téléphone (sur un PC, la webcam)
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
    .then(flux => el("video").srcObject = flux)
    .catch(erreur => el("etat").textContent = "Caméra indisponible : " + erreur.message);
}


// ---- orientation du téléphone -> orientation de la caméra ----
// Calcul des anciens DeviceOrientationControls de three.js, repris par AR.js / LocAR :
// alpha, beta, gamma sont des angles d'Euler (ordre Z-X'-Y'') du téléphone par rapport à la Terre.

const euler = new THREE.Euler();
const versLeDos = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -90° autour de X : on regarde par le dos du téléphone
const axeZ = new THREE.Vector3(0, 0, 1);
const qEcran = new THREE.Quaternion();
const visee = new THREE.Quaternion(); // l'orientation voulue, la caméra la rejoint en douceur
let orientationRecue = false;

// sur Android, "deviceorientationabsolute" donne alpha par rapport au nord
const EVENEMENT = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";

function surOrientation(e) {
  if (e.alpha === null) return;
  if (!orientationRecue) el("etat").textContent = "";
  orientationRecue = true;
  const angleEcran = RAD(screen.orientation ? screen.orientation.angle : window.orientation || 0);

  euler.set(RAD(e.beta), RAD(e.alpha), -RAD(e.gamma), "YXZ");
  visee.setFromEuler(euler);
  visee.multiply(versLeDos);
  visee.multiply(qEcran.setFromAxisAngle(axeZ, -angleEcran)); // téléphone en paysage

  // iOS : alpha ne part pas du nord, mais webkitCompassHeading donne le cap de la caméra
  if (e.webkitCompassHeading !== undefined) {
    euler.setFromQuaternion(visee, "YXZ");
    euler.y = RAD(360 - e.webkitCompassHeading) - angleEcran;
    visee.setFromEuler(euler);
  }
}

function demarrerCapteurs() {
  const E = window.DeviceOrientationEvent;
  // iOS, et Chrome depuis peu, demandent l'autorisation, depuis un clic
  const permission = E && typeof E.requestPermission === "function" ? E.requestPermission() : Promise.resolve("granted");
  permission.then(reponse => {
    if (reponse !== "granted") {
      el("etat").textContent = "Orientation refusée (ou pas de capteur) : glisse la souris pour regarder autour.";
      return;
    }
    window.addEventListener(EVENEMENT, surOrientation);
    // sans mesure au bout d'1,5 s, on est sûrement sur un PC
    setTimeout(() => {
      if (!orientationRecue) el("etat").textContent = "Pas de boussole : glisse la souris pour regarder autour.";
    }, 1500);
  });
}

// sans capteur (PC) : on regarde autour en glissant la souris
let lacet = 0;
let tangage = 0;
let glisse = null;

renderer.domElement.addEventListener("pointerdown", e => glisse = { x: e.clientX, y: e.clientY });
window.addEventListener("pointerup", () => glisse = null);
renderer.domElement.addEventListener("pointermove", e => {
  if (!glisse || orientationRecue) return;
  lacet += (e.clientX - glisse.x) * 0.004;
  tangage = THREE.MathUtils.clamp(tangage + (e.clientY - glisse.y) * 0.004, -1.2, 1.2);
  glisse = { x: e.clientX, y: e.clientY };
  visee.setFromEuler(new THREE.Euler(tangage, lacet, 0, "YXZ"));
});


// ---- démarrage : un clic, pour que le téléphone accepte les demandes d'autorisation ----

el("demarrer").addEventListener("click", () => {
  el("demarrer").disabled = true;
  el("demarrer").textContent = "En cours";
  demarrerCapteurs();
  demarrerCamera();
  demarrerGeoloc();
});


// ---- animation ----

const POINTS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
const devant = new THREE.Vector3();
const versObjet = new THREE.Vector3();
let dernierAffichage = 0;

function animate(temps) {
  camera.quaternion.slerp(visee, 0.25);
  camera.position.lerp(moi, 0.1); // le GPS saute un peu : la caméra glisse au lieu de sauter

  // le cap : direction de la caméra sur le plan horizontal, 0 = nord, PI/2 = est
  camera.getWorldDirection(devant);
  const cap = Math.atan2(devant.x, -devant.z);

  // 10 fois par seconde : le texte du cap, l'objet visé et la mini-carte
  if (temps - dernierAffichage > 100) {
    dernierAffichage = temps;
    const degres = (THREE.MathUtils.radToDeg(cap) + 360) % 360;
    el("cap").textContent = "Cap : " + Math.round(degres) + "° (" + POINTS[Math.round(degres / 45) % 8] + ")";

    // l'objet le plus proche du centre de l'écran, à moins de 8°
    let vise = null;
    let meilleur = RAD(8);
    for (const o of objets) {
      o.etiquette.getWorldPosition(versObjet).sub(camera.position);
      const angle = devant.angleTo(versObjet);
      if (angle < meilleur) {
        meilleur = angle;
        vise = o;
      }
    }
    el("vise").textContent = vise ? "En face : " + vise.nom + " à " + texteDistance(vise.distance) : "";

    majMiniCarte(cap);
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
