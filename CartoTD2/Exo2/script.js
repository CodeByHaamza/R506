// TD2 Exo 2 - Babylon.js
// Hamza Karrouchi - BUT INFO 3
// doc : https://doc.babylonjs.com/journey
//       https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin
//       https://doc.babylonjs.com/features/featuresDeepDive/importers/glTF
//       https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system

// BABYLON et HavokPhysics sont des variables globales, chargées dans index.html

const infos = document.getElementById("infos");
const score = document.getElementById("score");


// ---- moteur, scène, caméra ----

const canvas = document.getElementById("scene");
const engine = new BABYLON.Engine(canvas, true); // true : antialiasing
const scene = new BABYLON.Scene(engine);

const NUIT = new BABYLON.Color3(0.05, 0.06, 0.15);
scene.clearColor = NUIT.toColor4();

// une caméra qui tourne autour du stand (souris, doigt, molette)
const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, 1.2, 16, new BABYLON.Vector3(0, 2, 0), scene);
camera.attachControl(canvas, true);
camera.lowerRadiusLimit = 6;
camera.upperRadiusLimit = 35;
camera.upperBetaLimit = 1.5; // on ne passe pas sous le sol
camera.wheelDeltaPercentage = 0.01;
// sur un écran étroit (téléphone en portrait) on recule pour voir tout le stand
camera.radius = Math.max(12, 5 / (engine.getAspectRatio(camera) * Math.tan(camera.fov / 2)));

window.addEventListener("resize", () => engine.resize());


// ---- lumières ----

// hémisphérique : l'éclairage ambiant, pour que rien ne soit tout noir
const ambiante = new BABYLON.HemisphericLight("ambiante", new BABYLON.Vector3(0, 1, 0), scene);
ambiante.intensity = 0.6;

// directionnelle : elle donne le relief et les ombres
const lampe = new BABYLON.DirectionalLight("lampe", new BABYLON.Vector3(-0.4, -1, 0.5), scene);
lampe.position = new BABYLON.Vector3(8, 20, -10);
lampe.intensity = 0.9;

const ombres = new BABYLON.ShadowGenerator(1024, lampe);
ombres.usePercentageCloserFiltering = true;


// ---- brouillard, et halo autour des objets lumineux ----

scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
scene.fogDensity = 0.025;
scene.fogColor = NUIT;

// le GlowLayer fait briller tout ce qui a une couleur émissive (ampoules, enseigne)
const halo = new BABYLON.GlowLayer("halo", scene);
halo.intensity = 0.7;


// ---- physique : Havok ----
// HavokPhysics() télécharge le moteur (un fichier .wasm), il faut l'attendre

infos.textContent = "Chargement du moteur physique...";
const havok = await HavokPhysics();
const plugin = new BABYLON.HavokPlugin(true, havok);
scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), plugin);
const physique = scene.getPhysicsEngine();
infos.textContent = "";

// masse 0 : l'objet est fixe, il ne tombe pas
function rendreSolide(mesh, forme) {
  return new BABYLON.PhysicsAggregate(mesh, forme, { mass: 0, friction: 0.7 }, scene);
}


// ---- le sol : un damier dessiné dans une texture dynamique (un canvas) ----

function creerDamier() {
  const texture = new BABYLON.DynamicTexture("damier", 64, scene);
  const ctx = texture.getContext();
  ctx.fillStyle = "#7f1d1d";
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillRect(32, 32, 32, 32);
  texture.update();
  // une texture dynamique ne se répète pas par défaut (CLAMP)
  texture.wrapU = texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
  texture.uScale = texture.vScale = 50; // 50 répétitions : des cases de 4 m
  return texture;
}

// assez grand pour que ses bords se perdent dans le brouillard
const sol = BABYLON.MeshBuilder.CreateGround("sol", { width: 200, height: 200 }, scene);
sol.material = new BABYLON.StandardMaterial("matSol", scene);
sol.material.diffuseTexture = creerDamier();
sol.material.specularColor = BABYLON.Color3.Black();
sol.receiveShadows = true;
rendreSolide(sol, BABYLON.PhysicsShapeType.BOX);


// ---- le stand : comptoir rayé, poteaux, enseigne et ampoules ----

const HAUT_COMPTOIR = 1.2;

function creerRayures() {
  const texture = new BABYLON.DynamicTexture("rayures", { width: 256, height: 64 }, scene);
  const ctx = texture.getContext();
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? "#f8fafc" : "#dc2626";
    ctx.fillRect(i * 32, 0, 32, 64);
  }
  texture.update();
  return texture;
}

const comptoir = BABYLON.MeshBuilder.CreateBox("comptoir", { width: 6, height: HAUT_COMPTOIR, depth: 2 }, scene);
comptoir.position.y = HAUT_COMPTOIR / 2;
comptoir.material = new BABYLON.StandardMaterial("matComptoir", scene);
comptoir.material.diffuseTexture = creerRayures();
comptoir.receiveShadows = true;
ombres.addShadowCaster(comptoir);
rendreSolide(comptoir, BABYLON.PhysicsShapeType.BOX);

const bois = new BABYLON.StandardMaterial("bois", scene);
bois.diffuseColor = new BABYLON.Color3(0.45, 0.28, 0.15);

for (const x of [-3.2, 3.2]) {
  const poteau = BABYLON.MeshBuilder.CreateCylinder("poteau", { height: 5, diameter: 0.2 }, scene);
  poteau.position.set(x, 2.5, 0.9);
  poteau.material = bois;
  ombres.addShadowCaster(poteau);
  rendreSolide(poteau, BABYLON.PhysicsShapeType.CYLINDER);
}

// l'enseigne : du texte écrit dans une texture dynamique, émissive comme un néon
const texteEnseigne = new BABYLON.DynamicTexture("texteEnseigne", { width: 1024, height: 160 }, scene);
texteEnseigne.drawText("CHAMBOULE-TOUT", null, 112, "bold 96px sans-serif", "#fde68a", "#431407", true);

const enseigne = BABYLON.MeshBuilder.CreatePlane("enseigne", { width: 6.6, height: 1 }, scene);
enseigne.position.set(0, 5, 0.9);
enseigne.material = new BABYLON.StandardMaterial("matEnseigne", scene);
enseigne.material.emissiveTexture = texteEnseigne;
enseigne.material.disableLighting = true;

// les ampoules : de petites sphères émissives
const matAmpoules = ["#facc15", "#f472b6", "#38bdf8", "#4ade80"].map(couleur => {
  const m = new BABYLON.StandardMaterial("matAmpoule", scene);
  m.emissiveColor = BABYLON.Color3.FromHexString(couleur);
  return m;
});

for (let i = 0; i < 14; i++) {
  const ampoule = BABYLON.MeshBuilder.CreateSphere("ampoule", { diameter: 0.18 }, scene);
  ampoule.position.set(-3.25 + i * 0.5, 4.35, 0.8);
  ampoule.material = matAmpoules[i % matAmpoules.length];
}


// ---- les caisses : un cube texturé avec une image ----

const TAILLE = 0.6;
const matCaisse = new BABYLON.StandardMaterial("matCaisse", scene);
matCaisse.diffuseTexture = new BABYLON.Texture("assets/caisse.gif", scene);

// un PhysicsAggregate relie un mesh (.transformNode) à son corps physique (.body)
let caisses = [];

function creerCaisse(x, y) {
  const caisse = BABYLON.MeshBuilder.CreateBox("caisse", { size: TAILLE }, scene);
  caisse.position.set(x, y, 0);
  caisse.material = matCaisse;
  caisse.receiveShadows = true;
  ombres.addShadowCaster(caisse);

  const objet = new BABYLON.PhysicsAggregate(caisse, BABYLON.PhysicsShapeType.BOX, { mass: 1, friction: 0.5, restitution: 0.1 }, scene);
  // une caisse immobile "s'endort" et ne sentirait plus la gravité changer (capteurs)
  plugin.setActivationControl(objet.body, BABYLON.PhysicsActivationControl.ALWAYS_ACTIVE);
  return objet;
}

function supprimer(objet) {
  objet.dispose();               // le corps physique
  objet.transformNode.dispose(); // le mesh
}

// une pyramide de 4 + 3 + 2 + 1 caisses posée sur le comptoir
function empilerCaisses() {
  caisses.forEach(supprimer);
  caisses = [];
  for (let etage = 0; etage < 4; etage++) {
    const nb = 4 - etage;
    for (let i = 0; i < nb; i++) {
      const x = (i - (nb - 1) / 2) * (TAILLE + 0.02);
      const y = HAUT_COMPTOIR + TAILLE / 2 + etage * TAILLE + 0.01;
      caisses.push(creerCaisse(x, y));
    }
  }
}


// ---- le forain : un modèle glTF, celui de l'Exo 1 ----

const forain = new BABYLON.TransformNode("forain", scene);
forain.position.set(2.3, 0, 1.9);

BABYLON.ImportMeshAsync("../Exo1/assets/joker/scene.gltf", scene)
  .then(resultat => {
    const racine = resultat.meshes[0]; // __root__, ajouté par le chargeur glTF

    // chaque modèle a sa propre échelle : on le ramène à 2 m de haut, les pieds au sol
    const { min, max } = racine.getHierarchyBoundingVectors();
    const echelle = 2 / (max.y - min.y);
    racine.scaling.scaleInPlace(echelle);
    racine.position.set(-(min.x + max.x) / 2 * echelle, -min.y * echelle, -(min.z + max.z) / 2 * echelle);
    racine.parent = forain;

    resultat.meshes.forEach(m => ombres.addShadowCaster(m));
  })
  .catch(erreur => {
    console.error(erreur);
    infos.textContent = "Le forain n'a pas pu être chargé (voir la console).";
  });


// ---- lancer une balle vers le point touché ----

const VITESSE = 25; // m/s
const matBalle = new BABYLON.StandardMaterial("matBalle", scene);
matBalle.diffuseColor = new BABYLON.Color3(1, 0.85, 0.1);

let balles = [];
let lancers = 0;

function lancer(x, y) {
  // le rayon part de la caméra et passe par le point de l'écran touché
  const rayon = scene.createPickingRay(x, y, BABYLON.Matrix.Identity(), camera);
  const cible = scene.pickWithRay(rayon);
  const distance = cible.hit ? cible.distance : 15;

  const balle = BABYLON.MeshBuilder.CreateSphere("balle", { diameter: 0.35 }, scene);
  balle.material = matBalle;
  balle.position = rayon.origin.clone();
  ombres.addShadowCaster(balle);
  const objet = new BABYLON.PhysicsAggregate(balle, BABYLON.PhysicsShapeType.SPHERE, { mass: 0.6, restitution: 0.4 }, scene);

  // Tir en cloche : position(t) = départ + v.t + g.t²/2. Pour passer par la cible
  // au bout de t = distance / VITESSE, on vise un peu au-dessus : v = direction * VITESSE - g.t/2
  const duree = distance / VITESSE;
  objet.body.setLinearVelocity(rayon.direction.scale(VITESSE).subtract(physique.gravity.scale(duree / 2)));

  balles.push(objet);
  if (balles.length > 12) supprimer(balles.shift()); // pas trop de balles en même temps
  lancers++;
  afficherScore();
}

scene.onPointerObservable.add(info => {
  // POINTERTAP : un clic sans glisser (glisser fait tourner la caméra)
  if (info.type === BABYLON.PointerEventTypes.POINTERTAP) lancer(scene.pointerX, scene.pointerY);
});


// ---- particules : des confettis quand tout est tombé ----

function creerConfettis() {
  // un petit carré blanc comme texture : la couleur vient du système de particules
  const carre = new BABYLON.DynamicTexture("carre", 8, scene);
  const ctx = carre.getContext();
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 8, 8);
  carre.update();

  const ps = new BABYLON.ParticleSystem("confettis", 1500, scene);
  ps.particleTexture = carre;
  ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
  ps.emitter = new BABYLON.Vector3(0, 4, 0);
  ps.minEmitBox = new BABYLON.Vector3(-2.5, 0, -0.5);
  ps.maxEmitBox = new BABYLON.Vector3(2.5, 0, 0.5);
  ps.direction1 = new BABYLON.Vector3(-2, 6, -2);
  ps.direction2 = new BABYLON.Vector3(2, 9, 2);
  ps.gravity = new BABYLON.Vector3(0, -6, 0);
  ps.color1 = new BABYLON.Color4(1, 0.85, 0.1, 1);
  ps.color2 = new BABYLON.Color4(0.95, 0.25, 0.6, 1);
  ps.colorDead = new BABYLON.Color4(0.3, 0.6, 1, 0);
  ps.minSize = 0.06;
  ps.maxSize = 0.14;
  ps.minLifeTime = 1.5;
  ps.maxLifeTime = 3;
  ps.minAngularSpeed = -6;
  ps.maxAngularSpeed = 6;
  ps.emitRate = 600;
  ps.targetStopDuration = 1.5; // il s'arrête tout seul
  return ps;
}

const confettis = creerConfettis();


// ---- score ----

let gagne = false;

// une caisse est tombée quand elle n'est plus sur le comptoir
function nbTombees() {
  return caisses.filter(c => c.transformNode.position.y < HAUT_COMPTOIR).length;
}

function afficherScore() {
  score.textContent = "Caisses tombées : " + nbTombees() + " / " + caisses.length + " · balles : " + lancers;
}

function rejouer() {
  empilerCaisses();
  balles.forEach(supprimer);
  balles = [];
  lancers = 0;
  gagne = false;
  confettis.stop();
  infos.textContent = "";
  afficherScore();
}

document.getElementById("rejouer").addEventListener("click", rejouer);
rejouer();


// ---- capteurs du smartphone ----
// https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events

const GRAVITE = new BABYLON.Vector3(0, -9.81, 0);
let capteursActifs = false;
let derniereSecousse = 0;
const boutonCapteurs = document.getElementById("capteurs");

// incliner le téléphone incline la gravité : les caisses glissent du côté penché
function surOrientation(e) {
  if (e.beta === null) return;
  // comme dans l'Exo 1, le téléphone tenu à ~45° est la position neutre
  const avant = BABYLON.Scalar.Clamp((45 - e.beta) / 45, -1, 1); // haut du téléphone penché en avant
  const droite = BABYLON.Scalar.Clamp(e.gamma / 45, -1, 1);       // téléphone penché à droite

  // l'avant et la droite de la caméra, à plat sur le sol
  const devant = camera.getDirection(BABYLON.Axis.Z);
  const cote = camera.getDirection(BABYLON.Axis.X);
  devant.y = 0;
  cote.y = 0;

  physique.setGravity(GRAVITE
    .add(devant.normalize().scale(avant * 6))
    .add(cote.normalize().scale(droite * 6)));
}

// secouer le téléphone fait sauter les caisses
function surMouvement(e) {
  const a = e.acceleration;
  if (!a || a.x === null) return;
  // acceleration est sans la gravité : une secousse dépasse vite 12 m/s²
  if (Math.hypot(a.x, a.y, a.z) > 12 && performance.now() - derniereSecousse > 1000) {
    derniereSecousse = performance.now();
    for (const c of caisses) {
      const impulsion = new BABYLON.Vector3(Math.random() - 0.5, 3 + Math.random() * 2, Math.random() - 0.5);
      c.body.applyImpulse(impulsion, c.transformNode.getAbsolutePosition());
    }
  }
}

// sur iOS il faut demander l'autorisation, depuis un clic
function demanderPermission() {
  const evenements = [window.DeviceOrientationEvent, window.DeviceMotionEvent];
  return Promise.all(evenements.map(E =>
    E && typeof E.requestPermission === "function" ? E.requestPermission() : "granted"
  ));
}

boutonCapteurs.addEventListener("click", () => {
  if (capteursActifs) {
    window.removeEventListener("deviceorientation", surOrientation);
    window.removeEventListener("devicemotion", surMouvement);
    physique.setGravity(GRAVITE.clone());
    capteursActifs = false;
    boutonCapteurs.textContent = "Activer les capteurs";
    return;
  }

  demanderPermission().then(reponses => {
    if (reponses.includes("denied")) {
      boutonCapteurs.textContent = "Capteurs refusés";
      return;
    }
    window.addEventListener("deviceorientation", surOrientation);
    window.addEventListener("devicemotion", surMouvement);
    capteursActifs = true;
    boutonCapteurs.textContent = "Arrêter les capteurs";
    infos.textContent = "Penche le téléphone pour faire glisser les caisses, secoue-le pour les faire sauter.";
  });
});


// ---- boucle de rendu ----

let dernierNb = 0;

scene.onBeforeRenderObservable.add(() => {
  // le forain suit la caméra du regard
  const regard = camera.position.subtract(forain.position);
  forain.rotation.y = Math.atan2(regard.x, regard.z);

  const nb = nbTombees();
  if (nb !== dernierNb) {
    dernierNb = nb;
    afficherScore();
  }
  if (!gagne && nb === caisses.length) {
    gagne = true;
    confettis.start();
    infos.textContent = "Bravo ! Tout est tombé en " + lancers + " balle(s). « Rejouer » pour recommencer.";
  }

  // les balles parties trop loin sont supprimées
  for (const b of balles.filter(b => b.transformNode.position.y < -10)) {
    balles.splice(balles.indexOf(b), 1);
    supprimer(b);
  }
});

engine.runRenderLoop(() => scene.render());
