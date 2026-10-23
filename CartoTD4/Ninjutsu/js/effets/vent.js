// Fūton : les effets de vent
// Hamza Karrouchi - BUT INFO 3
//
// Le vent ne se voit pas : on montre ce qu'il fait bouger (traits de vitesse,
// feuilles, poussière) et on décale des bandes de l'image comme si l'air la tordait.

import { hasard, TOUR, lisse, enveloppe, FUMEE, emettre, decalerBande, sprite } from "./outils.js";

// des traits de vitesse horizontaux qui filent dans le sens "sens"
function traits(ctx, e, s, nombre, sens, force) {
  if (!s.traits) s.traits = Array.from({ length: nombre }, () => ({ y: hasard(0, e.h), x: hasard(0, e.l), l: hasard(80, 260), v: hasard(1600, 2600) }));
  ctx.strokeStyle = "rgba(255, 255, 255, " + 0.55 * force + ")";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (const t of s.traits) {
    t.x += sens * t.v * e.dt;
    if (sens > 0 && t.x > e.l + t.l) t.x = -t.l;
    if (sens < 0 && t.x < -t.l) t.x = e.l + t.l;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x - sens * t.l, t.y);
    ctx.stroke();
  }
}

function feuilleVolante(P, e, sens) {
  P.ajouter({
    texte: Math.random() < 0.5 ? "🍃" : "🍂", mode: "source-over",
    x: sens > 0 ? -20 : e.l + 20, y: hasard(0, e.h), vx: sens * hasard(900, 1500), vy: hasard(-150, 150),
    taille: hasard(10, 20), duree: 1.6, vrot: hasard(-10, 10)
  });
}

// un croissant de vent (une lame) centré en (x, y), tourné de "angle"
function croissant(ctx, x, y, rayon, angle, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(235, 250, 255, 0.85)";
  ctx.shadowColor = "#bfe9ff";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(0, 0, rayon, -1.1, 1.1);
  ctx.arc(rayon * 0.35, 0, rayon * 0.8, 1.15, -1.15, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const VENTS = {

  // Grande percée : une bourrasque traverse l'écran, l'image tremble par bandes
  bourrasque: {
    duree: 4, son: "vent",
    devant(ctx, e, s, P) {
      const sens = e.main.x < e.l / 2 ? 1 : -1;
      const force = enveloppe(e.t, 4, 0.3, 0.8);
      for (let i = 0; i < 6; i++) {
        const y = (i / 6 + e.t * 0.7) % 1 * e.h;
        decalerBande(ctx, e, y, e.h / 14, sens * hasard(5, 25) * force);
      }
      traits(ctx, e, s, 60, sens, force);
      emettre(e.dt, 25 * force, () => feuilleVolante(P, e, sens));
      e.secouer(5 * force);
    }
  },

  // Sphères de vide : des balles d'air partent de la bouche et grossissent vers toi
  spheresDAir: {
    duree: 3.2, son: "vent",
    devant(ctx, e, s, P) {
      const depart = { x: e.main.x, y: e.main.y - e.main.r };
      for (let i = 0; i < 6; i++) {
        const t = e.t - i * 0.35;
        if (t < 0 || t > 1) continue;
        // chaque sphère s'éloigne un peu de côté et grossit : elle vient vers toi
        const x = depart.x + Math.cos(i * 2.1) * t * e.l * 0.3;
        const y = depart.y + Math.sin(i * 2.1) * t * e.h * 0.2;
        const r = 20 + t * Math.min(e.l, e.h) * 0.35;
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TOUR);
        ctx.stroke();
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(sprite("#cfefff"), x - r, y - r, r * 2, r * 2);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        if (t < 0.05 && !s["impact" + i]) {
          s["impact" + i] = true;
          e.secouer(8);
        }
      }
    }
  },

  // Vague de vide : une lame horizontale coupe l'image en deux
  lameDeVent: {
    duree: 2.6, son: "vent",
    devant(ctx, e, s, P) {
      const p = lisse(e.t / 0.5);
      const y = e.main.y;
      // l'image au-dessus de la coupure glisse d'un côté
      const glisse = 40 * Math.sin(Math.min(e.t / 1.5, 1) * Math.PI);
      if (e.t > 0.3) decalerBande(ctx, e, 0, y, glisse);
      ctx.strokeStyle = "rgba(255, 255, 255, " + (1 - lisse((e.t - 1.6) / 0.8)) + ")";
      ctx.shadowColor = "#bfe9ff";
      ctx.shadowBlur = 20;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(e.main.x - p * e.l, y);
      ctx.lineTo(e.main.x + p * e.l, y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (e.t < 0.6) e.secouer(6);
    }
  },

  // Faux du vent : des croissants de vent tournoient vers les bords
  faux: {
    duree: 3.2, son: "vent",
    depart(s, e) {
      s.lames = Array.from({ length: 5 }, (_, i) => ({ angle: -Math.PI / 2 + (i - 2) * 0.5, retard: i * 0.12 }));
    },
    devant(ctx, e, s, P) {
      for (const lame of s.lames) {
        const t = e.t - lame.retard;
        if (t < 0 || t > 1.4) continue;
        const d = t * Math.max(e.l, e.h) * 0.8;
        const x = e.main.x + Math.cos(lame.angle) * d;
        const y = e.main.y + Math.sin(lame.angle) * d;
        croissant(ctx, x, y, 40 + t * 90, lame.angle + t * 12, 1 - lisse((t - 1) / 0.4));
      }
      emettre(e.dt, 15, () => feuilleVolante(P, e, Math.random() < 0.5 ? 1 : -1));
    }
  },

  // Paume de bourrasque : un souffle part des mains dans toutes les directions
  rafale: {
    duree: 3, son: "vent",
    devant(ctx, e, s, P) {
      const force = enveloppe(e.t, 3, 0.15, 1);
      // des traits de vitesse façon manga, en étoile autour des mains
      ctx.strokeStyle = "rgba(255, 255, 255, " + 0.6 * force + ")";
      ctx.lineWidth = 2;
      for (let i = 0; i < 40; i++) {
        const a = i / 40 * TOUR + e.t * 0.5;
        const debut = Math.min(e.l, e.h) * (0.15 + ((e.t * 2 + i * 0.37) % 1) * 0.6);
        ctx.beginPath();
        ctx.moveTo(e.main.x + Math.cos(a) * debut, e.main.y + Math.sin(a) * debut);
        ctx.lineTo(e.main.x + Math.cos(a) * (debut + 120), e.main.y + Math.sin(a) * (debut + 120));
        ctx.stroke();
      }
      emettre(e.dt, 80 * force, () => {
        const a = hasard(0, TOUR);
        P.ajouter({ x: e.main.x, y: e.main.y, vx: Math.cos(a) * hasard(500, 900), vy: Math.sin(a) * hasard(500, 900), frein: 1.5, taille: hasard(20, 40), croissance: 60, duree: 0.8, couleurs: FUMEE, mode: "source-over", alpha: 0.4 });
      });
      e.secouer(9 * force);
    }
  }
};
