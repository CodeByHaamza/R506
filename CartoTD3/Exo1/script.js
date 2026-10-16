// TD3 Exo 1 - Globe Three.js et carte Leaflet
// Hamza Karrouchi - BUT INFO 3
// doc : https://threejs.org/docs/#SphereGeometry
//       https://threejs.org/docs/#OrbitControls
//       https://threejs.org/docs/#Raycaster
//       https://leafletjs.com/examples/extending/extending-3-controls.html

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const infos = document.getElementById("infos");
const infosPays = document.getElementById("pays");
const conteneur = document.getElementById("scene");


// ---- scène, caméra, renderer ----

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02030a);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
conteneur.appendChild(renderer.domElement);

// le globe n'a que la moitié de l'écran : on suit la taille de son conteneur
function redimensionner() {
  camera.aspect = conteneur.clientWidth / conteneur.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(conteneur.clientWidth, conteneur.clientHeight);
}
redimensionner();
new ResizeObserver(redimensionner).observe(conteneur);

// sur un écran étroit on recule pour voir tout le globe
const distance = Math.max(3.5, 1.7 / (camera.aspect * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
camera.position.set(0, distance * 0.15, distance);

// pour tourner autour du globe à la souris ou au doigt
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 1.4;
controls.maxDistance = 8;


// ---- lumières ----

scene.add(new THREE.AmbientLight(0xffffff, 1.6));
// celle-ci suit la caméra : la face qu'on regarde est toujours éclairée
const soleil = new THREE.DirectionalLight(0xffffff, 1.5);
scene.add(soleil);


// ---- la Terre : sphère de rayon 1 avec la texture ----

const texture = new THREE.TextureLoader().load("assets/terre.jpg");
texture.colorSpace = THREE.SRGBColorSpace;

const terre = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({ map: texture })
);
scene.add(terre);


// ---- latitude / longitude <-> position 3D ----

// Même repère que SphereGeometry : y vers le pôle nord, et le méridien de
// Greenwich (lon 0) vers +x. On a donc x = cos(lat)cos(lon), y = sin(lat)
// et z = -cos(lat)sin(lon) (le signe moins vient de la façon dont Three.js
// enroule la texture autour de la sphère).
function latLonToXYZ(lat, lon, rayon = 1) {
  const phi = THREE.MathUtils.degToRad(lat);
  const lambda = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(
    rayon * Math.cos(phi) * Math.cos(lambda),
    rayon * Math.sin(phi),
    -rayon * Math.cos(phi) * Math.sin(lambda)
  );
}

// l'inverse, pour savoir où on a cliqué sur le globe :
// sin(lat) = y et tan(lon) = -z / x
function xyzToLatLon(point) {
  const p = point.clone().normalize();
  return {
    lat: THREE.MathUtils.radToDeg(Math.asin(p.y)),
    lon: THREE.MathUtils.radToDeg(Math.atan2(-p.z, p.x))
  };
}

// place un objet sur le globe, son axe Y pointant vers l'extérieur
function poserSurLeGlobe(objet, lat, lon, hauteur) {
  const normale = latLonToXYZ(lat, lon).normalize();
  objet.position.copy(normale).multiplyScalar(1 + hauteur / 2);
  objet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normale);
}


// ---- Leaflet -> 3D : un "handler" Leaflet ----
// Un handler s'active et se désactive comme ceux de la carte (dragging,
// scrollWheelZoom...) : ici map.globe.enable() / map.globe.disable().
// Il doit être déclaré avant de créer la carte.

const GlobeHandler = L.Handler.extend({
  addHooks() {
    this._map.on("click", this._clic, this);
  },
  removeHooks() {
    this._map.off("click", this._clic, this);
  },
  _clic(e) {
    const p = e.latlng.wrap(); // longitude ramenée entre -180 et 180
    marquerPoint(p.lat, p.lng);
    tournerVers(p.lat, p.lng);
  }
});

L.Map.addInitHook("addHandler", "globe", GlobeHandler);


// ---- la carte Leaflet ----

const map = L.map("map", { globe: true, worldCopyJump: true }).setView([30, 10], 2);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

map.attributionControl.addAttribution(
  'pays <a href="https://github.com/mledoze/countries">mledoze/countries</a> (ODbL), '
  + 'drapeaux <a href="https://flagcdn.com">flagcdn</a>, texture <a href="https://threejs.org">three.js</a>'
);

// la carte change de taille quand on tourne le téléphone
new ResizeObserver(() => map.invalidateSize()).observe(document.getElementById("map"));


// ---- tourner le globe vers un point ----
// La caméra glisse sur une sphère autour de la Terre sans changer de distance :
// c'est elle qui bouge, mais à l'écran c'est la Terre qui tourne.

let vol = null; // le mouvement en cours

function tournerVers(lat, lon) {
  const depart = camera.position.clone().normalize();
  const arrivee = latLonToXYZ(lat, lon).normalize();
  vol = {
    depart,
    rotation: new THREE.Quaternion().setFromUnitVectors(depart, arrivee),
    debut: performance.now()
  };
}

function animerVol() {
  if (!vol) return;
  const t = Math.min((performance.now() - vol.debut) / 1200, 1);
  // lent au début et à la fin
  const q = new THREE.Quaternion().slerp(vol.rotation, t * t * (3 - 2 * t));
  const recul = camera.position.length(); // à lire avant de modifier la position
  camera.position.copy(vol.depart).applyQuaternion(q).multiplyScalar(recul);
  if (t === 1) vol = null;
}

// si on attrape le globe pendant le mouvement, on le laisse faire
controls.addEventListener("start", () => vol = null);


// ---- le point visé, sur les deux vues ----

// un anneau jaune sur le globe (couché pour que sa normale soit l'axe Y)
const anneauGeo = new THREE.RingGeometry(0.025, 0.04, 32);
anneauGeo.rotateX(-Math.PI / 2);
const cible = new THREE.Mesh(anneauGeo, new THREE.MeshBasicMaterial({ color: 0xffd60a, side: THREE.DoubleSide }));
cible.visible = false;
scene.add(cible);

// et un rond jaune sur la carte
const pointCarte = L.circleMarker([0, 0], { radius: 7, color: "#ffd60a", weight: 3, fillOpacity: 0.3 });

function marquerPoint(lat, lon) {
  poserSurLeGlobe(cible, lat, lon, 0.01);
  cible.visible = true;
  pointCarte.setLatLng([lat, lon]).addTo(map);
  infos.textContent = "Point visé : " + lat.toFixed(2) + ", " + lon.toFixed(2);
  chercherPays(lat, lon);
}

// le pays sous le point, avec le géocodage inverse de Nominatim (OpenStreetMap)
// https://nominatim.org/release-docs/latest/api/Reverse/
let derniereRecherche = 0;

function chercherPays(lat, lon) {
  const numero = ++derniereRecherche;
  infosPays.textContent = "Recherche du pays...";
  fetch("https://nominatim.openstreetmap.org/reverse?format=json&zoom=3&accept-language=fr&lat=" + lat + "&lon=" + lon)
    .then(r => r.json())
    .then(d => {
      if (numero !== derniereRecherche) return; // on a cliqué ailleurs entre-temps
      infosPays.textContent = d.address && d.address.country
        ? "Pays : " + d.address.country
        : "Pas de pays ici (en mer ?)";
    })
    .catch(() => infosPays.textContent = "Pays inconnu (Nominatim ne répond pas)");
}


// ---- ma position ----

let marqueurMoi = null;
let moiCarte = null;

// un petit repère : une pointe et une boule rouge
function creerMarqueur() {
  const rouge = new THREE.MeshStandardMaterial({ color: 0xff3b30 });
  const groupe = new THREE.Group();

  const pointe = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 16), rouge);
  pointe.rotation.x = Math.PI;   // la pointe vers la surface
  pointe.position.y = -0.02;
  groupe.add(pointe);

  const boule = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), rouge);
  boule.position.y = 0.04;
  groupe.add(boule);

  return groupe;
}

function localiser() {
  if (!navigator.geolocation) {
    infos.textContent = "Pas de géolocalisation dans ce navigateur.";
    return;
  }
  infos.textContent = "Recherche de ma position...";

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude, accuracy } = pos.coords;

      if (!marqueurMoi) {
        marqueurMoi = creerMarqueur();
        scene.add(marqueurMoi);
        moiCarte = L.circle([latitude, longitude], { radius: accuracy, color: "#ff3b30" }).addTo(map);
      }
      poserSurLeGlobe(marqueurMoi, latitude, longitude, 0.14);
      moiCarte.setLatLng([latitude, longitude]).setRadius(accuracy)
        .bindPopup("<b>Ma position</b><br>± " + Math.round(accuracy) + " m");

      tournerVers(latitude, longitude);
      map.setView([latitude, longitude], 6);
      infos.textContent = "Ma position : " + latitude.toFixed(4) + ", " + longitude.toFixed(4)
        + " (± " + Math.round(accuracy) + " m)";
    },
    err => {
      infos.textContent = "Position impossible : " + err.message;
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
}

document.getElementById("btnMoi").addEventListener("click", localiser);
localiser();


// ---- les pays et leurs drapeaux ----

// Les coordonnées viennent du jeu de données mledoze/countries, celui qui
// alimentait restcountries. L'API restcountries.com demande maintenant une clé
// (v5) liée au site : je ne peux pas la mettre dans un dépôt public.
// Les drapeaux sont des images flagcdn.com, qui autorise le chargement en WebGL.
const URL_PAYS = "https://cdn.jsdelivr.net/gh/mledoze/countries@master/dist/countries.json";
const CODES = ["FR", "US", "BR", "JP", "AU", "EG", "IN", "CA", "RU", "ZA", "AR", "NO", "IT", "CN", "MA", "MX"];

const chargeur = new THREE.TextureLoader();
const drapeaux = [];   // les sprites, pour pouvoir cliquer dessus
let selection = null;  // le drapeau mis en avant

// la fiche du pays dans le popup de la carte
function fiche(pays, nom) {
  const langues = pays.languages ? Object.values(pays.languages).join(", ") : "-";
  return '<img src="https://flagcdn.com/h20/' + pays.cca2.toLowerCase() + '.png" height="12" alt="">'
    + "<b>" + nom + "</b>"
    + "<br>Capitale : " + (pays.capital[0] || "-")
    + "<br>Région : " + (pays.subregion || pays.region)
    + "<br>Superficie : " + pays.area.toLocaleString("fr-FR") + " km²"
    + "<br>Langues : " + langues;
}

function ajouterPays(pays) {
  const [lat, lon] = pays.latlng;
  const code = pays.cca2.toLowerCase();
  const nom = pays.translations.fra ? pays.translations.fra.common : pays.name.common;

  // sur la carte : un marqueur avec le drapeau, ses proportions sont gardées
  const marqueur = L.marker([lat, lon], {
    icon: L.divIcon({ className: "drapeau", html: '<img src="https://flagcdn.com/h20/' + code + '.png" alt="">', iconSize: null })
  }).addTo(map).bindPopup(fiche(pays, nom));

  // sur le globe : le mât
  const mat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.1, 8),
    new THREE.MeshBasicMaterial({ color: 0xdddddd })
  );
  poserSurLeGlobe(mat, lat, lon, 0.1);
  scene.add(mat);

  // le drapeau : un sprite, il fait toujours face à la caméra
  const matiere = new THREE.SpriteMaterial();
  const sprite = new THREE.Sprite(matiere);
  sprite.scale.set(0.12, 0.08, 1);
  sprite.position.copy(latLonToXYZ(lat, lon, 1.14));
  sprite.userData = { nom, lat, lon, marqueur };

  matiere.map = chargeur.load("https://flagcdn.com/w160/" + code + ".png", image => {
    image.colorSpace = THREE.SRGBColorSpace;
    // on respecte les proportions de chaque drapeau
    sprite.scale.set(0.08 * image.image.width / image.image.height, 0.08, 1);
    matiere.needsUpdate = true;
  });

  scene.add(sprite);
  drapeaux.push(sprite);

  // Leaflet -> 3D : clic sur le marqueur, le globe tourne vers le pays
  marqueur.on("click", () => {
    choisir(sprite);
    tournerVers(lat, lon);
  });
}

// le drapeau choisi est agrandi sur le globe
function choisir(sprite) {
  if (selection) selection.scale.divideScalar(1.6);
  selection = sprite;
  sprite.scale.multiplyScalar(1.6);
  infosPays.textContent = "Pays : " + sprite.userData.nom;
}

infosPays.textContent = "Chargement des pays...";

fetch(URL_PAYS)
  .then(r => r.json())
  .then(tous => {
    for (const code of CODES) {
      const pays = tous.find(p => p.cca2 === code);
      if (pays) ajouterPays(pays);
    }
    infosPays.textContent = drapeaux.length + " pays. Clique sur un drapeau, sur le globe ou sur la carte.";
  })
  .catch(erreur => {
    console.error(erreur);
    infosPays.textContent = "Pays non chargés : " + erreur.message;
  });


// ---- 3D -> Leaflet : clic sur le globe ----

const raycaster = new THREE.Raycaster();
const souris = new THREE.Vector2();
let appui = null;

renderer.domElement.addEventListener("pointerdown", e => appui = { x: e.clientX, y: e.clientY });

renderer.domElement.addEventListener("click", e => {
  // tourner le globe à la souris finit aussi par un "click" : on l'ignore
  if (appui && Math.hypot(e.clientX - appui.x, e.clientY - appui.y) > 5) return;

  // coordonnées entre -1 et 1 dans le canvas (qui ne fait que la moitié de l'écran)
  const rect = renderer.domElement.getBoundingClientRect();
  souris.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(souris, camera);

  // la Terre est dans la liste : un drapeau caché derrière ne compte pas
  const touches = raycaster.intersectObjects([terre, ...drapeaux]);
  if (touches.length === 0) return;

  if (touches[0].object === terre) {
    // clic sur la Terre : on retrouve la latitude / longitude du point touché
    const { lat, lon } = xyzToLatLon(terre.worldToLocal(touches[0].point.clone()));
    marquerPoint(lat, lon);
    map.flyTo([lat, lon], Math.max(map.getZoom(), 4));
  } else {
    // clic sur un drapeau : la carte se recentre sur le pays
    const sprite = touches[0].object;
    const p = sprite.userData;
    choisir(sprite);
    map.flyTo([p.lat, p.lon], 5);
    map.once("moveend", () => p.marqueur.openPopup());
  }
});


// ---- animation ----

function animate() {
  animerVol();
  controls.update();
  soleil.position.copy(camera.position);
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
