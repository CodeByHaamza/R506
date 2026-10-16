# R506 — Sensibilisation à la programmation multimédia

Dépôt des travaux pratiques de la ressource **R506** (semestre 5), publié via
GitHub Pages afin que les exercices soient testables directement au smartphone.

## 🌐 Site en ligne

**https://codebyhaamza.github.io/R506/**

La page d'accueil (`index.html`) sert d'interface d'accès à l'ensemble des exercices,
et renvoie vers ce dépôt pour la consultation du code.

L'adresse courte **https://codebyhaamza.github.io/** redirige également vers ce site.

## Étudiant

| | |
|---|---|
| **Nom** | Karrouchi |
| **Prénom** | Hamza |
| **Classe** | BUT INFO 3 — Alternance |
| **Semestre** | S5 |
| **Ressource** | R506 — Sensibilisation à la programmation multimédia |
| **Année universitaire** | 2026 – 2027 |

## À propos de la ressource

La ressource R506 introduit les principes de la programmation multimédia :
cartographie web interactive (Leaflet), rendu 3D dans le navigateur (Three.js,
Babylon.js), animation, interaction, réalité augmentée et adaptation aux
terminaux mobiles.

Les sujets des TD sont publiés sur le dépôt de l'enseignant :
[vestri/initiation-multimedia](https://github.com/vestri/initiation-multimedia/tree/main).

## Suivi des TD

| TD | Sujet | Dossier | État |
|---|---|---|---|
| TD1 | Géolocalisation et cartographie Leaflet | [`CartoTD1/`](CartoTD1/) | [x] |
| TD2 | 3D : Three.js et Babylon.js | [`CartoTD2/`](CartoTD2/) | [x] |
| TD3 | Globe 3D et Leaflet, objets géolocalisés dans la caméra | [`CartoTD3/`](CartoTD3/) | [x] |

Légende : `[ ]` à faire · `[~]` en cours · `[x]` terminé

### Détail du TD1

| Exercice | Sujet | État |
|---|---|---|
| [Exo 1](CartoTD1/Exo1/) | Géolocalisation : `getCurrentPosition`, `watchPosition`, GPS vs réseau, capteurs du téléphone | [x] |
| [Exo 2](CartoTD1/Exo2/) | Leaflet : carte OSM / Stamen, marqueurs, triangle des Bermudes, cercle de précision, distances, GeoJSON (fichier local + API geo), itinéraires OSRM et Valhalla | [x] |

### Détail du TD2

| Exercice | Sujet | État |
|---|---|---|
| [Exo 1](CartoTD2/Exo1/) | Three.js : scène, caméra, lumières, renderer, cube texturé, modèles glTF, capteurs du téléphone, neige et pluie | [x] |
| [Exo 2](CartoTD2/Exo2/) | Babylon.js : chamboule-tout de fête foraine (contexte), caisses texturées, sol en texture dynamique, modèle glTF, physique Havok, gravité inclinée avec le téléphone et secousse, brouillard, néons (GlowLayer), confettis (particules) | [x] |

### Détail du TD3

| Exercice | Sujet | État |
|---|---|---|
| [Exo 1](CartoTD3/Exo1/) | Three.js + Leaflet : globe de rayon 1 texturé, lat/lon vers XYZ et l'inverse, ma position, drapeaux de 16 pays. Leaflet → 3D avec un `L.Handler` (clic sur la carte ou un drapeau, le globe tourne vers l'endroit), 3D → Leaflet avec un `Raycaster` (clic sur le globe ou un drapeau, la carte se recentre). Autres données : fiche du pays et géocodage inverse Nominatim | [x] |
| [Exo 2](CartoTD3/Exo2/) | Objets géolocalisés dans la caméra : flux vidéo (`getUserMedia`), `watchPosition`, `deviceorientationabsolute` vers la caméra Three.js. Bornes N / E / S / O à 25 m pour vérifier la boussole, lieux OpenStreetMap à moins de 400 m (API Overpass), direction et distance de villes lointaines, objet visé au centre de l'écran, mini-carte Leaflet avec la direction du regard (compas 2D) | [x] |

## Choix techniques

### Pourquoi Valhalla et pas Mapbox

Le sujet propose Mapbox comme second calculateur d'itinéraire, avec un jeton
d'accès fourni en clair dans l'énoncé. Impossible de le committer : GitHub
analyse les poussées à la recherche de secrets, reconnaît le format des jetons
Mapbox (`pk.eyJ...`) et **refuse le push**.

```
remote: - GITHUB PUSH PROTECTION
remote:     - Push cannot contain secrets
remote:       —— Mapbox Secret Access Token ——
remote:          path: CartoTD1/Exo2/script.js
```

Deux issues possibles : autoriser explicitement ce secret depuis l'interface
GitHub, ou se passer de Mapbox. J'ai choisi la seconde, et remplacé Mapbox par
[**Valhalla**](https://valhalla.github.io/valhalla/), dont une instance publique
est hébergée par OpenStreetMap et **ne demande aucune clé**.

La consigne « testez d'autres outils et refaites la même chose » reste donc
satisfaite — l'Exo 2 interroge deux calculateurs et affiche leurs deux tracés
superposés — mais aucun secret n'entre dans le dépôt.

Les deux ne donnent d'ailleurs pas le même résultat, ce qui est justement
l'intérêt de la comparaison. Sur Marseille → Nice :

| | OSRM | Valhalla |
|---|---|---|
| Distance | 199,5 km | 206,7 km |
| Durée | 2 h 23 | 2 h 28 |

La clé Stadia Maps, elle, est restée dans le code : elle sert aux fonds de carte
Stamen demandés par le sujet, et son format n'est pas reconnu comme un secret.

### Pourquoi pas l'API restcountries.com directement

L'Exo 1 du TD3 demande les positions des pays via restcountries.com.
L'ancienne API (v2 et v3.1) a été arrêtée : elle répond maintenant une erreur de
dépréciation. La nouvelle (v5) **exige une clé d'API**, et pour l'appeler depuis
un navigateur il faut déclarer le domaine de la page dans les réglages de la clé.
Une clé dans un dépôt public n'a pas sa place (même problème que le jeton Mapbox
du TD1), donc je n'en utilise pas.

À la place :

- les **coordonnées** viennent de [mledoze/countries](https://github.com/mledoze/countries)
  (licence ODbL), le jeu de données sur lequel s'appuyait restcountries, chargé avec `fetch` ;
- les **drapeaux** viennent de [flagcdn.com](https://flagcdn.com) : le CDN de drapeaux de
  restcountries n'envoie pas d'en-tête CORS, WebGL refuserait ses images comme texture.

La texture de la Terre vient des exemples de [three.js](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets).

### Babylon.js et la physique Havok

Babylon.js, son chargeur glTF et Havok sont chargés depuis jsDelivr dans des
versions fixées (`babylonjs@9.28.0`, `@babylonjs/havok@1.3.14`). Havok est un
module WebAssembly : `await HavokPhysics()` attend son téléchargement avant de
créer la scène physique, d'où le `<script type="module">` (le `await` au premier
niveau n'existe que dans un module).

Les caisses sont réglées en `ALWAYS_ACTIVE` : un corps immobile « s'endort » et
ne réagirait plus quand on incline la gravité avec le téléphone.

### Les capteurs et Chrome

Chrome (version 155) a ajouté `DeviceOrientationEvent.requestPermission()`, qui
n'existait que sur iOS. Sur un PC sans capteurs, la réponse est `denied` : les
pages l'affichent et proposent la souris à la place.

### Overpass, l'API des lieux OpenStreetMap

L'Exo 2 du TD3 interroge [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API),
sans clé. Le serveur public limite les requêtes par adresse IP : s'il est saturé
il répond `502` sans en-tête CORS, et le navigateur l'affiche comme une erreur
CORS. Le script essaie alors un second serveur, puis affiche un message. Une
réponse peut aussi mettre une trentaine de secondes.
### Structure des feuilles de style

Les deux exercices partageaient l'essentiel de leur CSS. Le commun est dans
[`assets/style.css`](assets/style.css) (couleurs, thème sombre, panneaux,
tableaux, boutons), et chaque exercice ajoute son propre `style.css` pour ce qui
lui est particulier — la boussole pour l'Exo 1, la carte et la légende pour
l'Exo 2.

### Crédits des modèles 3D

Les modèles de l'Exo 1 du TD2 viennent de [Sketchfab](https://sketchfab.com) et sont
sous licence [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) (le fichier
`license.txt` de chacun est conservé dans son dossier d'`assets/`).

- [Joker](https://sketchfab.com/3d-models/joker-persona-5-playstation-4-2b13af94c70f41dc865e691a3002bdd7) et
  [Morgana](https://sketchfab.com/3d-models/morgana-persona-5-playstation-4-c39122925d17434b9702714397045ae3)
  par [雨宮レン](https://sketchfab.com/oscar3dmodel)
- [Makoto Niijima](https://sketchfab.com/3d-models/makoto-niijima-casual-persona-5-strikers-cf5ec240adb649309b3628b00058ec98)
  par [jonshipman](https://sketchfab.com/jonshipman)
- [Futaba Sakura](https://sketchfab.com/3d-models/persona-5-futaba-sakura-cbd569ca3c0e43eaa9aaa03bad068d27)
  par [sweetsnowdk64](https://sketchfab.com/sweetsnowdk64)
- [Walter White](https://sketchfab.com/3d-models/walter-white-breaking-bad-f186e48c48dc461c94145f848755482f)
  par [Roberto Domínguez](https://sketchfab.com/vmmaniac), allégé (177 Mo vers 6 Mo,
  maillage simplifié, textures en WebP, compression meshopt) pour pouvoir être publié sur GitHub.

L'Exo 2 du TD2 (Babylon.js) réutilise le Joker de l'Exo 1 sans le copier. La texture
des caisses (`crate.gif`) vient des [exemples de three.js](https://github.com/mrdoob/three.js/tree/dev/examples/textures).
### Documentation

Les liens vers la documentation des API utilisées, en majorité
[MDN](https://developer.mozilla.org), sont en commentaire en tête de chaque
`script.js`.

## Structure du dépôt

```
.
├── index.html          Interface d'accès à tous les exercices
├── README.md
├── .gitignore
├── assets/
│   └── style.css       Styles communs aux pages d'exercices
├── CartoTD1/
│   ├── Exo1/           index.html + script.js + style.css
│   └── Exo2/           + lieux.geojson
├── CartoTD2/
│   ├── Exo1/           index.html + script.js + style.css + assets/ (modèles glTF)
│   └── Exo2/           index.html + script.js + style.css + assets/ (texture)
└── CartoTD3/
    ├── Exo1/           index.html + script.js + style.css + assets/ (Terre)
    └── Exo2/           index.html + script.js + style.css
```

Chaque exercice est autonome dans son dossier `CartoTDn/Exok/` avec son
`index.html`, son `script.js` et son `style.css`, et renvoie vers l'accueil via
un lien « Retour ».

## Développement en local

Leaflet et Three.js chargent des ressources en AJAX : ouvrir les fichiers en
`file://` ne fonctionne pas. Il faut passer par un serveur local.

```bash
# à la racine du dépôt
python -m http.server 8000
```

Puis ouvrir <http://localhost:8000/> dans Firefox ou Chrome.

## Debug

- **Navigateur** : `F12` → onglet Console, puis breakpoints dans les Sources.
- **Simulation mobile** : `F12` → icône « Toggle device toolbar ».
- **Smartphone Android réel** : activer le *mode développeur* et le *débogage USB*
  sur le téléphone, le brancher en USB, puis ouvrir `chrome://inspect/#devices`
  dans Chrome sur le PC — l'appareil doit apparaître sous **Devices**.
  En cas de non-détection, installer les *platform-tools* (adb) et/ou les
  pilotes USB du constructeur, puis vérifier avec `adb devices`.

## Déploiement

Le site est publié par GitHub Pages depuis la branche `main` (racine du dépôt) :
chaque push republie automatiquement le site, en une minute environ.

```bash
git add .
git commit -m "..."
git push
```
