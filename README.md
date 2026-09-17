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
cartographie web interactive (Leaflet), rendu 3D dans le navigateur (Three.js),
animation, interaction et adaptation aux terminaux mobiles.

## Suivi des TD

| TD | Sujet | Dossier | État |
|---|---|---|---|
| TD1 | Géolocalisation et cartographie Leaflet | [`CartoTD1/`](CartoTD1/) | [~] |
| TD2 | *à compléter* | [`CartoTD2/`](CartoTD2/) | [ ] |
| TD3 | *à compléter* | [`CartoTD3/`](CartoTD3/) | [ ] |

Légende : `[ ]` à faire · `[~]` en cours · `[x]` terminé

### Détail du TD1

| Exercice | Sujet | État |
|---|---|---|
| [Exo 1](CartoTD1/Exo1/) | Géolocalisation (`getCurrentPosition`, `watchPosition`), orientation et mouvement de l'appareil | [x] |
| [Exo 2](CartoTD1/Exo2/) | Leaflet : carte, marqueurs, distances, GeoJSON, itinéraires | [x] |
| [Exo 3](CartoTD1/Exo3/) | *en attente du sujet* | [ ] |

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

### Structure des feuilles de style

Les deux exercices partageaient l'essentiel de leur CSS. Le commun est dans
[`assets/style.css`](assets/style.css) (couleurs, thème sombre, panneaux,
tableaux, boutons), et chaque exercice ajoute son propre `style.css` pour ce qui
lui est particulier — la boussole pour l'Exo 1, la carte et la légende pour
l'Exo 2.

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
│   ├── Exo2/
│   └── Exo3/
├── CartoTD2/
│   ├── Exo1/
│   ├── Exo2/
│   └── Exo3/
└── CartoTD3/
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
