// Raiton : les effets de foudre
// Hamza Karrouchi - BUT INFO 3

import { hasard, TOUR, lisse, FOUDRE, sprite, emettre, eclair, tracer, emoji, teinte, voile } from "./outils.js";

// des éclairs dessinés deux fois : un trait large et bleu (le halo), un trait fin et blanc (le cœur)
function dessinerEclairs(ctx, chemins, largeur = 9) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(95, 184, 255, 0.5)";
  ctx.lineWidth = largeur;
  chemins.forEach(points => tracer(ctx, points));
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = largeur / 3.5;
  chemins.forEach(points => tracer(ctx, points));
  ctx.restore();
}

export const FOUDRES = {

  // Chidori : la foudre crépite autour de la main
  chidori: {
    duree: 4, son: "chidori",
    devant(ctx, e, s, P) {
      const { x, y } = e.main;
      const r = Math.max(e.main.r * 0.8, 40) * lisse(e.t / 0.3) * (1 - lisse((e.t - 3.6) / 0.4));
      if (r < 2) return;
      // de nouveaux éclairs toutes les 50 ms
      if (!s.eclairs || e.t - s.dernier > 0.05) {
        s.dernier = e.t;
        s.eclairs = Array.from({ length: 9 }, () => eclair(x, y, hasard(0, TOUR), hasard(r * 1.2, r * 3.4)));
      }
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(sprite("#9fd8ff"), x - r * 1.8, y - r * 1.8, r * 3.6, r * 3.6);
      ctx.drawImage(sprite("#ffffff"), x - r * 0.6, y - r * 0.6, r * 1.2, r * 1.2);
      ctx.globalCompositeOperation = "source-over";
      dessinerEclairs(ctx, s.eclairs);
      if (Math.random() < 0.15) teinte(ctx, e, "#bfe1ff", 0.2); // des flashs sur tout l'écran
      emettre(e.dt, 70, () => {
        const a = hasard(0, TOUR);
        const v = hasard(200, 500);
        P.ajouter({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, taille: hasard(3, 7), duree: hasard(0.2, 0.5), couleurs: FOUDRE });
      });
      e.secouer(2);
    }
  },

  // une flèche d'éclair part de la main et traverse l'écran
  flecheDeFoudre: {
    duree: 2.5, son: "chidori",
    devant(ctx, e, s, P) {
      const sens = e.main.x < e.l / 2 ? 1 : -1;
      const p = lisse(e.t / 0.35); // la flèche part très vite
      const cible = { x: sens > 0 ? e.l + 50 : -50, y: e.main.y - e.h * 0.15 };
      const tete = { x: e.main.x + (cible.x - e.main.x) * p, y: e.main.y + (cible.y - e.main.y) * p };
      if (!s.trait || e.t - s.dernier > 0.06) {
        s.dernier = e.t;
        const angle = Math.atan2(tete.y - e.main.y, tete.x - e.main.x);
        const longueur = Math.hypot(tete.x - e.main.x, tete.y - e.main.y);
        s.trait = [eclair(e.main.x, e.main.y, angle, longueur, 0.15), eclair(e.main.x, e.main.y, angle + 0.05, longueur, 0.3)];
      }
      if (e.t < 1.8) dessinerEclairs(ctx, s.trait, 14 * (1 - lisse((e.t - 1.2) / 0.6)));
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(sprite("#ffffff"), tete.x - 60, tete.y - 60, 120, 120);
      ctx.globalCompositeOperation = "source-over";
      if (e.t < 0.5) teinte(ctx, e, "#cfe9ff", 0.35 * (1 - e.t / 0.5));
      e.secouer(5 * (1 - lisse(e.t / 1)));
    }
  },

  // Kirin : le ciel s'assombrit, puis la foudre tombe d'un coup, en forme de dragon
  kirin: {
    duree: 5, son: "boum",
    devant(ctx, e, s, P) {
      // le ciel noir d'orage
      voile(ctx, e, "#050814", 0.6 * lisse(e.t / 1.2) * (1 - lisse((e.t - 4.3) / 0.7)));
      if (e.t > 0.8 && e.t < 1.5 && Math.random() < 0.08) teinte(ctx, e, "#9fc8ff", 0.25); // des éclairs lointains
      if (e.t < 1.5) return;
      if (!s.frappe) {
        s.frappe = true;
        e.jouer("chidori");
      }
      const p = e.t - 1.5;
      // l'éclair géant du haut de l'écran jusqu'aux mains
      if (!s.trait || p - s.dernier > 0.07) {
        s.dernier = p;
        const angle = Math.atan2(e.main.y, e.main.x - e.l / 2);
        s.trait = [0, 1, 2].map(() => eclair(e.l / 2 + hasard(-40, 40), -20, angle, Math.hypot(e.main.x - e.l / 2, e.main.y + 20), 0.25));
      }
      const force = 1 - lisse((p - 1.8) / 1);
      if (force > 0) dessinerEclairs(ctx, s.trait, 28 * force);
      // la tête du dragon de foudre, blanche et bleue
      if (p < 1.5) emoji(ctx, "🐉", e.main.x, e.main.y - e.h * 0.2, Math.min(e.l, e.h) * 0.4, { filtre: "grayscale(1) brightness(1.8) drop-shadow(0 0 20px #6cbcff)", alpha: 1 - lisse((p - 0.9) / 0.6) });
      teinte(ctx, e, "#ffffff", 0.7 * (1 - lisse(p / 0.4)));
      e.secouer(16 * force);
    }
  }
};
