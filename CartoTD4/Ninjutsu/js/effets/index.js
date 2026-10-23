// Les effets des jutsus, dessinés dans un canvas 2D avec la vidéo
// Hamza Karrouchi - BUT INFO 3
//
// Un effet est un objet { duree, son, depart, fond, derriere, personne, devant } :
//   depart(s, e, P)      au lancement (s : l'état propre à cet effet, P : les particules)
//   fond(ctx, e)         juste après la vidéo, pour la transformer (genjutsu)
//   derriere(ctx, e)     entre le décor et la personne (clones, Susanoo...)
//   personne(ctx, e)     la personne modifiée ; renvoie true s'il l'a dessinée
//   devant(ctx, e)       par-dessus tout (feu, eau, foudre...)
// Options : silhouette (a besoin du détourage), genjutsu (rompu par « Kai »),
// rasengan3d (la sphère 3D de rasengan.js), sonDepart (un son de plus au lancement).
//
// e contient : t (secondes depuis le début de l'effet), dt, l et h (taille de l'écran),
// main { x, y, r } (les mains), video, personne (détourée, si le détourage est prêt),
// couverture (de quoi cacher la personne), dessinerCadre, secouer, jouer.

import { Particules } from "./outils.js";
import { FEUX } from "./feu.js";
import { EAUX } from "./eau.js";
import { FOUDRES } from "./foudre.js";
import { VENTS } from "./vent.js";
import { TERRES } from "./terre.js";
import { CHAKRAS } from "./chakra.js";
import { NINJUTSUS } from "./ninjutsu.js";
import { GENJUTSUS } from "./genjutsu.js";

export const EFFETS = { ...FEUX, ...EAUX, ...FOUDRES, ...VENTS, ...TERRES, ...CHAKRAS, ...NINJUTSUS, ...GENJUTSUS };

export class Effets {
  constructor() {
    this.actifs = [];
    this.particules = new Particules();
  }

  // renvoie la définition de l'effet (pour ses sons et ses options)
  lancer(nom, e) {
    const def = EFFETS[nom];
    if (!def) return null;
    const effet = { def, debut: e.temps, fin: e.temps + def.duree * 1000, etat: {} };
    if (def.depart) def.depart(effet.etat, e, this.particules);
    this.actifs.push(effet);
    return def;
  }

  besoinSilhouette() {
    return this.actifs.some(a => a.def.silhouette);
  }

  genjutsuActif() {
    return this.actifs.some(a => a.def.genjutsu);
  }

  rompreGenjutsu(e) {
    for (const a of this.actifs) if (a.def.genjutsu) a.fin = e.temps;
    this.lancer("kai", e);
  }

  // appelle le moment "moment" (fond, derriere, personne, devant) de chaque effet en cours
  appeler(moment, ctx, e) {
    let dessine = false;
    for (const a of this.actifs) {
      const fonction = a.def[moment];
      if (!fonction || e.temps > a.fin) continue;
      e.t = (e.temps - a.debut) / 1000;
      ctx.save();
      if (fonction(ctx, e, a.etat, this.particules)) dessine = true;
      ctx.restore();
    }
    return dessine;
  }

  avancer(dt, temps) {
    this.actifs = this.actifs.filter(a => temps <= a.fin);
    this.particules.avancer(dt);
  }

  dessinerParticules(ctx) {
    this.particules.dessiner(ctx);
  }
}
