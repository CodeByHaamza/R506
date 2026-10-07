// TD2 Exo 1 - Three.js
// Hamza Karrouchi - BUT INFO 3
// doc : https://threejs.org/manual/#en/creating-a-scene
//       https://threejs.org/docs/#CanvasTexture
//       https://threejs.org/manual/#en/loading-3d-models

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const infos = document.getElementById("infos");


// ---- scène, caméra, renderer ----

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("scene").appendChild(renderer.domElement);

// sur un écran étroit (téléphone en portrait) on recule la caméra pour tout voir
function ajusterCamera() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.z = Math.max(7, 4.5 / (camera.aspect * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

ajusterCamera();
window.addEventListener("resize", ajusterCamera);


// ---- lumières ----

// ambiante pour que les faces à l'ombre ne soient pas noires, directionnelle pour le relief
scene.add(new THREE.AmbientLight(0xffffff, 1));
const soleil = new THREE.DirectionalLight(0xffffff, 2);
soleil.position.set(3, 5, 4);
scene.add(soleil);


// ---- texture façon Minecraft ----
// une image de 16x16 pixels dessinée dans un canvas, avec un peu de bruit

const HERBE = [100, 50, 38];  // teinte, saturation, luminosité
const TERRE = [28, 45, 33];

function creerTexture(type) {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d");

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let couleur = type === "herbe" ? HERBE : TERRE;
      // sur les côtés, l'herbe déborde un peu en haut
      if (type === "cote" && y < 3 + (x * 5) % 3) couleur = HERBE;

      const bruit = Math.random() * 10 - 5;
      ctx.fillStyle = "hsl(" + couleur[0] + ", " + couleur[1] + "%, " + (couleur[2] + bruit) + "%)";
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;  // pixels nets au lieu d'un rendu flou
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}


// ---- le cube ----

// un matériau par face, dans l'ordre : droite, gauche, dessus, dessous, devant, derrière
const cote = new THREE.MeshStandardMaterial({ map: creerTexture("cote") });
const materiaux = [
  cote,
  cote,
  new THREE.MeshStandardMaterial({ map: creerTexture("herbe") }),
  new THREE.MeshStandardMaterial({ map: creerTexture("terre") }),
  cote,
  cote
];

const cube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), materiaux);
cube.rotation.x = 0.4;
cube.position.x = -2.5;
scene.add(cube);


// ---- modèles 3D (glTF) ----

const MODELES = {
  joker:   { nom: "Joker",        fichier: "assets/joker/scene.gltf" },
  // Object_286 est un morceau perdu loin sous le personnage : on le retire
  morgana: { nom: "Morgana",      fichier: "assets/morgana/scene.gltf", retirer: ["Object_286"] },
  makoto:  { nom: "Makoto",       fichier: "assets/makoto/scene.gltf" },
  futaba:  { nom: "Futaba",       fichier: "assets/futaba/scene.gltf" },
  walter:  { nom: "Walter White", fichier: "assets/walter/walter.glb" }
};

const loader = new GLTFLoader();
// le modèle de Walter White a été compressé avec meshopt
loader.setMeshoptDecoder(MeshoptDecoder);

const pivot = new THREE.Group();
pivot.position.x = 2.5;
scene.add(pivot);

let courant = null; // clé du modèle affiché
let mixer = null;   // joue l'animation du modèle, s'il en a une
let demande = 0;    // pour ignorer un chargement si on a cliqué sur un autre modèle entre-temps

function charger(cle) {
  const numero = ++demande;
  infos.textContent = "Chargement de " + MODELES[cle].nom + "...";

  loader.load(
    MODELES[cle].fichier,
    gltf => {
      if (numero !== demande) return;

      pivot.clear();
      courant = cle;
      son.pause();
      const modele = gltf.scene;
      for (const nom of MODELES[cle].retirer || []) {
        const piece = modele.getObjectByName(nom);
        if (piece) piece.removeFromParent();
      }

      // chaque modèle a sa propre échelle : on le ramène à 3 unités de haut et on le centre
      const boite = new THREE.Box3().setFromObject(modele);
      const taille = boite.getSize(new THREE.Vector3());
      const centre = boite.getCenter(new THREE.Vector3());
      const echelle = 3 / taille.y;
      modele.scale.setScalar(echelle);
      modele.position.copy(centre.multiplyScalar(-echelle));
      pivot.add(modele);

      mixer = null;
      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(modele);
        mixer.clipAction(gltf.animations[0]).play();
      }

      infos.textContent = cle === "walter" ? "Walter White : clique dessus !" : MODELES[cle].nom;
    },
    undefined,
    erreur => {
      console.error(erreur);
      infos.textContent = "Impossible de charger " + MODELES[cle].nom + " (voir la console).";
    }
  );
}

for (const cle in MODELES) {
  document.getElementById(cle).addEventListener("click", () => {
    window.location.hash = cle;
    charger(cle);
  });
}

// on peut ouvrir directement un modèle avec #morgana ou #walter dans l'adresse
const depart = window.location.hash.slice(1);
charger(depart in MODELES ? depart : "joker");


// ---- météo : neige ou pluie ----
// des particules qui tombent, et qui repartent en haut quand elles sortent de l'écran

const NB_GOUTTES = 900;
const HAUT = 7;
const BAS = -7;

const chute = new Float32Array(NB_GOUTTES * 3);
for (let i = 0; i < NB_GOUTTES; i++) {
  chute[i * 3] = (Math.random() - 0.5) * 24;
  chute[i * 3 + 1] = BAS + Math.random() * (HAUT - BAS);
  chute[i * 3 + 2] = (Math.random() - 0.5) * 12;
}

// neige : des points
const geoNeige = new THREE.BufferGeometry();
geoNeige.setAttribute("position", new THREE.BufferAttribute(chute, 3));
const neige = new THREE.Points(geoNeige, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 }));

// pluie : de petits traits, deux points par goutte
const traits = new Float32Array(NB_GOUTTES * 6);
const geoPluie = new THREE.BufferGeometry();
geoPluie.setAttribute("position", new THREE.BufferAttribute(traits, 3));
const pluie = new THREE.LineSegments(geoPluie, new THREE.LineBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.6 }));

// les positions changent à chaque image : on désactive le culling
neige.frustumCulled = false;
pluie.frustumCulled = false;
neige.visible = false;
pluie.visible = false;
scene.add(neige, pluie);

const METEOS = ["aucune", "neige", "pluie"];
const FONDS = [0x87ceeb, 0xb4c4d4, 0x59636e];
let meteo = 0;
const boutonMeteo = document.getElementById("meteo");

boutonMeteo.addEventListener("click", () => {
  meteo = (meteo + 1) % METEOS.length;
  neige.visible = meteo === 1;
  pluie.visible = meteo === 2;
  scene.background.setHex(FONDS[meteo]);
  boutonMeteo.textContent = "Météo : " + METEOS[meteo];
});


// ---- clic sur Walter White : on joue le son ----
// https://threejs.org/manual/#en/picking

const son = new Audio("assets/walter/say-my-name.mp3");
const raycaster = new THREE.Raycaster();
const souris = new THREE.Vector2();

function surWalter(e) {
  if (courant !== "walter") return false;
  souris.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(souris, camera);
  // la boîte englobante suffit : le modèle a 650 000 sommets, trop lourd à tester triangle par triangle
  return raycaster.ray.intersectsBox(new THREE.Box3().setFromObject(pivot));
}

renderer.domElement.addEventListener("click", e => {
  if (!surWalter(e)) return;
  son.currentTime = 0;
  son.play().catch(erreur => {
    console.error(erreur);
    infos.textContent = "Le son n'a pas pu être lu.";
  });
});

renderer.domElement.addEventListener("pointermove", e => {
  renderer.domElement.style.cursor = surWalter(e) ? "pointer" : "default";
});

// ---- animation ----

let dernierTemps = 0;

function animate(temps) {
  const dt = Math.min((temps - dernierTemps) / 1000, 0.1);
  dernierTemps = temps;

  cube.rotation.y += dt * 0.6;
  pivot.rotation.y += dt * 0.4;
  if (mixer) mixer.update(dt);

  if (meteo > 0) {
    const vitesse = meteo === 1 ? 1 : 12;
    for (let i = 0; i < NB_GOUTTES; i++) {
      chute[i * 3 + 1] -= dt * vitesse;
      // la neige se balance doucement de gauche à droite
      if (meteo === 1) chute[i * 3] += Math.sin(temps / 1000 + i) * dt * 0.3;
      if (chute[i * 3 + 1] < BAS) chute[i * 3 + 1] = HAUT;
    }
    if (meteo === 1) {
      geoNeige.attributes.position.needsUpdate = true;
    } else {
      for (let i = 0; i < NB_GOUTTES; i++) {
        traits.set([chute[i * 3], chute[i * 3 + 1], chute[i * 3 + 2], chute[i * 3], chute[i * 3 + 1] + 0.5, chute[i * 3 + 2]], i * 6);
      }
      geoPluie.attributes.position.needsUpdate = true;
    }
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
