# R506 — Sensibilisation à la programmation multimédia

Dépôt des travaux pratiques de la ressource **R506** (semestre 5), publié via
GitHub Pages afin que les exercices soient testables directement au smartphone.

## 🌐 Site en ligne

**https://hamzakarrouchi.github.io/**

La page d'accueil (`index.html`) sert d'interface d'accès à l'ensemble des exercices.

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
| TD1 | Cartographie — Leaflet | [`CartoTD1/`](CartoTD1/) | [~] |
| TD2 | *à compléter* | [`CartoTD2/`](CartoTD2/) | [ ] |
| TD3 | *à compléter* | [`CartoTD3/`](CartoTD3/) | [ ] |

Légende : `[ ]` à faire · `[~]` en cours · `[x]` terminé

## Structure du dépôt

```
.
├── index.html        Interface d'accès à tous les exercices
├── README.md
├── .gitignore
├── CartoTD1/
│   ├── Exo1/         index.html + script.js
│   ├── Exo2/
│   └── Exo3/
├── CartoTD2/
│   ├── Exo1/
│   ├── Exo2/
│   └── Exo3/
└── CartoTD3/
```

Chaque exercice est autonome dans son dossier `CartoTDn/Exok/` avec son
`index.html` et son `script.js`, et renvoie vers l'accueil via un lien « Retour ».

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

Le dépôt est un *user site* GitHub Pages (`HamzaKarrouchi.github.io`) : chaque
push sur `main` republie automatiquement le site, sans configuration.

```bash
git add .
git commit -m "..."
git push
```
