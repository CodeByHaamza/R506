// Le chakra pur : Rasengan, Rasenshuriken, et les techniques médicales
// Hamza Karrouchi - BUT INFO 3
// La sphère du Rasengan est en 3D (rasengan.js) : ces effets ajoutent le halo autour.

import { hasard, TOUR, lisse, CHAKRA, VERT, sprite, emettre, teinte } from "./outils.js";

// le halo bleu et le vent aspiré en spirale vers la sphère
function halo(ctx, e, P, r) {
  const { x, y } = e.main;
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(sprite("#4aa8ff"), x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  ctx.globalCompositeOperation = "source-over";
  emettre(e.dt, 90, () => {
    const a = hasard(0, TOUR);
    const d = r * hasard(2, 3);
    P.ajouter({
      x: x + Math.cos(a) * d, y: y + Math.sin(a) * d,
      vx: -Math.sin(a) * 300 - Math.cos(a) * 220, vy: Math.cos(a) * 300 - Math.sin(a) * 220,
      taille: hasard(3, 6), duree: 0.5, couleurs: CHAKRA
    });
  });
}

export const CHAKRAS = {

  rasengan: {
    duree: 4.5, son: "rasengan", rasengan3d: true,
    devant(ctx, e, s, P) {
      const r = Math.max(e.main.r * 0.9, 40) * lisse(e.t / 0.6) * (1 - lisse((e.t - 4) / 0.5));
      if (r > 2) halo(ctx, e, P, r);
    }
  },

  // le Rasengan, avec quatre grandes lames de vent qui tournent autour
  rasenshuriken: {
    duree: 4.5, son: "rasengan", sonDepart: "vent", rasengan3d: true,
    devant(ctx, e, s, P) {
      const r = Math.max(e.main.r * 0.9, 40) * lisse(e.t / 0.6) * (1 - lisse((e.t - 4) / 0.5));
      if (r < 2) return;
      halo(ctx, e, P, r);
      ctx.save();
      ctx.translate(e.main.x, e.main.y);
      ctx.rotate(e.t * 14);
      ctx.fillStyle = "rgba(240, 250, 255, 0.75)";
      ctx.shadowColor = "#bfe9ff";
      ctx.shadowBlur = 25;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(TOUR / 4);
        // une lame : un croissant allongé qui part de la sphère
        ctx.beginPath();
        ctx.moveTo(r * 0.8, -r * 0.15);
        ctx.quadraticCurveTo(r * 2.6, -r * 0.9, r * 3.6, r * 0.2);
        ctx.quadraticCurveTo(r * 2.4, -r * 0.2, r * 0.8, r * 0.25);
        ctx.fill();
      }
      ctx.restore();
      e.secouer(3);
    }
  },

  // Scalpel de chakra : une lame de chakra bleu sort de la main
  scalpel: {
    duree: 4, son: "soin",
    devant(ctx, e, s, P) {
      const force = lisse(e.t / 0.4) * (1 - lisse((e.t - 3.4) / 0.6));
      const longueur = Math.max(e.main.r, 40) * 2.4 * force;
      const { x, y } = e.main;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(x, y);
      for (const [largeur, couleur] of [[18, "rgba(80, 170, 255, 0.35)"], [8, "rgba(170, 225, 255, 0.7)"], [3, "#ffffff"]]) {
        ctx.fillStyle = couleur;
        ctx.beginPath();
        ctx.ellipse(0, -longueur / 2, largeur, longueur / 2, 0, 0, TOUR);
        ctx.fill();
      }
      ctx.restore();
      emettre(e.dt, 40 * force, () => P.ajouter({ x: x + hasard(-10, 10), y: y - hasard(0, longueur), vx: hasard(-30, 30), vy: hasard(-60, -20), taille: hasard(2, 5), duree: 0.5, couleurs: CHAKRA }));
    }
  },

  // Paume mystique : une lueur verte qui soigne, des étincelles qui montent
  soin: {
    duree: 4.5, son: "soin",
    devant(ctx, e, s, P) {
      const force = lisse(e.t / 0.6) * (1 - lisse((e.t - 3.8) / 0.7));
      const r = Math.max(e.main.r, 40) * 1.6 * (1 + 0.08 * Math.sin(e.t * 6));
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = force;
      ctx.drawImage(sprite("#3dff7a"), e.main.x - r, e.main.y - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      emettre(e.dt, 50 * force, () => P.ajouter({
        x: e.main.x + hasard(-r / 2, r / 2), y: e.main.y + hasard(-r / 3, r / 3), vy: hasard(-120, -60),
        taille: hasard(3, 7), duree: hasard(0.8, 1.4), couleurs: VERT
      }));
      teinte(ctx, e, "#1fae4b", 0.08 * force);
    }
  }
};
