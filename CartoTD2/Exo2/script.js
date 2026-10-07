// TD2 Exo 2 - Globe avec Three.js
// Hamza Karrouchi - BUT INFO 3
// doc : https://threejs.org/docs/#SphereGeometry
//       https://threejs.org/docs/#OrbitControls
//       https://threejs.org/docs/#Sprite

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const infos = document.getElementById("infos");
const infosPays = document.getElementById("pays");


// ---- scène, caméra, renderer ----

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02030a);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
// sur un écran étroit on recule pour voir tout le globe
const distance = Math.max(3.5, 1.7 / (camera.aspect * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
camera.position.set(0, distance * 0.15, distance);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("scene").appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

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


// ---- latitude / longitude -> position 3D ----

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

// place un objet sur le globe, son axe Y pointant vers l'extérieur
function poserSurLeGlobe(objet, lat, lon, hauteur) {
  const normale = latLonToXYZ(lat, lon).normalize();
  objet.position.copy(normale).multiplyScalar(1 + hauteur / 2);
  objet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normale);
}


// ---- ma position ----

let marqueurMoi = null;

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

function centrerSur(lat, lon) {
  // on garde la même distance, seule la direction change
  camera.position.copy(latLonToXYZ(lat, lon, camera.position.length()));
  controls.update();
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

      if (marqueurMoi) scene.remove(marqueurMoi);
      marqueurMoi = creerMarqueur();
      poserSurLeGlobe(marqueurMoi, latitude, longitude, 0.14);
      scene.add(marqueurMoi);

      centrerSur(latitude, longitude);
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

function ajouterDrapeau(pays) {
  const [lat, lon] = pays.latlng;

  // le mât
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
  sprite.userData = { nom: pays.name.common, lat, lon };

  matiere.map = chargeur.load("https://flagcdn.com/w160/" + pays.cca2.toLowerCase() + ".png", image => {
    image.colorSpace = THREE.SRGBColorSpace;
    // on respecte les proportions de chaque drapeau
    sprite.scale.set(0.08 * image.image.width / image.image.height, 0.08, 1);
    matiere.needsUpdate = true;
  });

  scene.add(sprite);
  drapeaux.push(sprite);
}

infosPays.textContent = "Chargement des pays...";

fetch(URL_PAYS)
  .then(r => r.json())
  .then(tous => {
    for (const code of CODES) {
      const pays = tous.find(p => p.cca2 === code);
      if (pays) ajouterDrapeau(pays);
    }
    infosPays.textContent = drapeaux.length + " pays. Tourne le globe, clique sur un drapeau.";
  })
  .catch(erreur => {
    console.error(erreur);
    infosPays.textContent = "Pays non chargés : " + erreur.message;
  });


// ---- clic sur un drapeau ----

const raycaster = new THREE.Raycaster();
const souris = new THREE.Vector2();

renderer.domElement.addEventListener("click", e => {
  souris.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(souris, camera);

  // la Terre est dans la liste : un drapeau caché derrière ne compte pas
  const touches = raycaster.intersectObjects([terre, ...drapeaux]);
  if (touches.length === 0 || touches[0].object === terre) return;

  const p = touches[0].object.userData;
  infosPays.textContent = p.nom + " (" + p.lat + ", " + p.lon + ")";
});


// ---- animation ----

function animate() {
  controls.update();
  soleil.position.copy(camera.position);
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
