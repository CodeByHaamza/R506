// Des signes vus par la caméra jusqu'au jutsu
// Hamza Karrouchi - BUT INFO 3
//
// Le modèle donne un signe par image, avec des erreurs d'une image à l'autre.
// Un signe n'est donc validé que s'il est vu sur plusieurs images d'affilée,
// puis il s'ajoute à l'historique. Un jutsu part quand l'historique se termine
// par son enchaînement. Quelques jutsus n'ont qu'un signe : il faut le tenir.

import { JUTSUS } from "./donnees.js";

const SEUIL_SCORE = 0.6;  // en dessous, la détection est ignorée
const CONFIRMATIONS = 2;  // nombre d'images d'affilée pour valider un signe
const OUBLI = 4000;       // ms sans nouveau signe : on oublie l'enchaînement commencé
export const TENIR = 2500;  // ms pour les jutsus à un seul signe
export const ATTENTE = 1500; // ms laissées pour continuer vers un jutsu plus long

// les enchaînements d'un jutsu : le principal et l'éventuelle variante
// (les jutsus à tenir n'en ont pas : ils ne partent pas d'un enchaînement)
const enchainements = jutsu => jutsu.tenir ? [] : jutsu.variante ? [jutsu.signes, jutsu.variante] : [jutsu.signes];

// combien de signes du début de "suite" se trouvent à la fin de "historique"
function avancement(historique, suite) {
  for (let n = Math.min(suite.length, historique.length); n > 0; n--) {
    const fin = historique.slice(-n);
    if (fin.every((s, i) => s === suite[i])) return n;
  }
  return 0;
}

export class Sequence {
  constructor() {
    this.historique = [];  // les signes validés
    this.candidat = null;  // le signe vu sur les dernières images
    this.vu = 0;           // depuis combien d'images
    this.debutTenu = 0;    // moment où le signe actuel a été validé
    this.dernierSigne = 0; // moment du dernier signe validé (ms)
    this.oubli = OUBLI;
  }

  // une détection du modèle (ou null) ; renvoie le signe s'il vient d'être validé
  ajouter(detection, maintenant) {
    if (this.historique.length && maintenant - this.dernierSigne > this.oubli) this.historique = [];

    if (!detection || detection.score < SEUIL_SCORE) {
      this.candidat = null;
      this.vu = 0;
      return null;
    }
    if (detection.signe === this.candidat) this.vu++;
    else {
      this.candidat = detection.signe;
      this.vu = 1;
    }
    if (this.vu < CONFIRMATIONS) return null;

    this.dernierSigne = maintenant; // tenir un signe empêche aussi l'oubli
    if (this.vu > CONFIRMATIONS) return null; // le même signe, toujours tenu
    this.debutTenu = maintenant;
    if (detection.signe === this.historique[this.historique.length - 1]) return null;

    this.historique.push(detection.signe);
    if (this.historique.length > 60) this.historique.shift();
    return detection.signe;
  }

  vider() {
    this.historique = [];
  }

  // Le jutsu dont l'enchaînement termine l'historique (le plus long s'il y en a plusieurs).
  // attendre : ces signes sont aussi le début d'un jutsu plus long, il faut laisser
  // au joueur le temps de continuer (le Rasengan est le début du Rasenshuriken).
  jutsuTermine() {
    let trouve = null;
    let longueur = 0;
    for (const jutsu of JUTSUS) {
      for (const suite of enchainements(jutsu)) {
        if (suite.length > longueur && avancement(this.historique, suite) === suite.length) {
          trouve = jutsu;
          longueur = suite.length;
        }
      }
    }
    if (!trouve) return null;
    const attendre = JUTSUS.some(autre => autre !== trouve && enchainements(autre).some(suite =>
      suite.length > longueur && avancement(this.historique, suite) >= longueur));
    return { jutsu: trouve, attendre };
  }

  // Un jutsu à tenir : son signe est le seul de l'historique et il est toujours tenu.
  // part : de 0 à 1, le jutsu part à 1.
  signeTenu(maintenant) {
    if (this.historique.length !== 1 || this.candidat !== this.historique[0] || this.vu < CONFIRMATIONS) return null;
    const jutsu = JUTSUS.find(j => j.tenir && j.signes[0] === this.candidat);
    return jutsu ? { jutsu, part: Math.min((maintenant - this.debutTenu) / TENIR, 1) } : null;
  }

  // où en est-on d'un jutsu : { fait, total, prochain }
  progression(jutsu) {
    if (jutsu.tenir) return { fait: 0, total: 1, prochain: jutsu.signes[0] };
    let meilleur = { fait: 0, total: jutsu.signes.length, prochain: jutsu.signes[0] };
    for (const suite of enchainements(jutsu)) {
      const fait = avancement(this.historique, suite);
      if (fait > meilleur.fait) meilleur = { fait, total: suite.length, prochain: suite[fait] };
    }
    return meilleur;
  }

  // les jutsus commencés, les plus avancés d'abord
  enCours(nombre = 3) {
    return JUTSUS
      .filter(jutsu => !jutsu.tenir)
      .map(jutsu => ({ jutsu, ...this.progression(jutsu) }))
      .filter(p => p.fait > 0 && p.fait < p.total)
      .sort((a, b) => b.fait / b.total - a.fait / a.total || b.fait - a.fait)
      .slice(0, nombre);
  }
}
