// Suiton : les effets d'eau
// Hamza Karrouchi - BUT INFO 3

import { hasard, enveloppe, EAU, FUMEE, emettre, emoji, teinte, voile } from "./outils.js";

// une particule d'eau : de la matière, avec parfois un reflet de lumière
const goutte = p => ({ couleurs: EAU, mode: Math.random() < 0.25 ? "lighter" : "source-over", alpha: 0.8, ...p });

// une vague qui ondule en bas de l'écran
function vague(ctx, e, hauteur, couleur) {
  ctx.fillStyle = couleur;
  ctx.beginPath();
  ctx.moveTo(0, e.h);
  for (let x = 0; x <= e.l + 20; x += 20) ctx.lineTo(x, e.h - hauteur + Math.sin(x / 60 + e.t * 4) * 14);
  ctx.lineTo(e.l, e.h);
  ctx.fill();
}

export const EAUX = {

  // un jet d'eau vers le côté de l'écran le plus loin des mains
  jetDEau: {
    duree: 3, son: "eau",
    devant(ctx, e, s, P) {
      if (e.t > 2.4) return;
      const direction = e.main.x < e.l / 2 ? 0 : Math.PI;
      emettre(e.dt, 420, () => {
        const a = direction + hasard(-0.2, 0.2) - 0.15 * Math.cos(direction);
        const v = hasard(900, 1400);
        P.ajouter(goutte({ x: e.main.x, y: e.main.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, ay: 600, taille: hasard(8, 18), croissance: 25, duree: hasard(0.7, 1.1) }));
      });
      teinte(ctx, e, "#1d63b5", 0.1);
    }
  },

  // un requin d'eau part des mains vers le bord le plus loin
  requin: {
    duree: 3.6, son: "eau",
    devant(ctx, e, s, P) {
      const p = Math.min(e.t / 3, 1);
      const sens = e.main.x < e.l / 2 ? 1 : -1;
      const taille = Math.min(e.l, e.h) * (0.14 + 0.2 * p);
      const trajet = (sens > 0 ? e.l - e.main.x : e.main.x) + taille;
      const x = e.main.x + sens * p * trajet;
      const y = e.main.y - e.main.r + Math.sin(e.t * 9) * 18 - p * e.h * 0.1;
      emettre(e.dt, 240, () => P.ajouter(goutte({
        x: x - sens * taille * 0.4 + hasard(-15, 15), y: y + hasard(-taille * 0.2, taille * 0.2),
        vx: -sens * hasard(40, 160), vy: hasard(-120, 60), ay: 300, taille: hasard(8, 18), croissance: 10, duree: hasard(0.5, 0.9)
      })));
      // l'emoji regarde vers la gauche : on le retourne s'il va à droite
      if (p < 1) emoji(ctx, "🦈", x, y, taille, { miroir: sens > 0, halo: "#3a9be8" });
    }
  },

  // le dragon d'eau de Zabuza monte en spirale pendant qu'une vague envahit l'écran
  dragonDEau: {
    duree: 6, son: "eau",
    devant(ctx, e, s, P) {
      vague(ctx, e, e.h * 0.35 * Math.sin(Math.PI * Math.min(e.t / 6, 1)), "rgba(40, 130, 220, 0.5)");
      const p = Math.min(e.t / 5, 1);
      const x = e.l / 2 + Math.sin(e.t * 2.2) * e.l * 0.25;
      const y = e.h * (1.05 - p * 0.8);
      const taille = Math.min(e.l, e.h) * 0.32;
      emettre(e.dt, 300, () => P.ajouter(goutte({
        x: x + hasard(-taille / 3, taille / 3), y: y + hasard(0, taille / 2), vx: hasard(-80, 80), vy: hasard(100, 300),
        ay: 400, taille: hasard(8, 20), duree: hasard(0.6, 1)
      })));
      // le dragon vert devient bleu
      emoji(ctx, "🐉", x, y, taille, { rotation: Math.cos(e.t * 2.2) * 0.4, filtre: "hue-rotate(80deg) saturate(1.4)", halo: "#8fdcff" });
      teinte(ctx, e, "#1d63b5", 0.12);
      e.secouer(3);
    }
  },

  // une muraille d'eau jaillit en cercle autour de toi, puis retombe
  murDEau: {
    duree: 5, son: "eau",
    devant(ctx, e, s, P) {
      const force = enveloppe(e.t, 5, 0.6, 1);
      const hauteur = e.h * 0.85 * force;
      // le mur : un rideau bleu translucide dont le haut ondule
      const g = ctx.createLinearGradient(0, e.h - hauteur, 0, e.h);
      g.addColorStop(0, "rgba(150, 220, 255, 0.55)");
      g.addColorStop(1, "rgba(30, 110, 210, 0.35)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, e.h);
      for (let x = 0; x <= e.l + 15; x += 15) ctx.lineTo(x, e.h - hauteur + Math.sin(x / 35 + e.t * 7) * 18 * force);
      ctx.lineTo(e.l, e.h);
      ctx.fill();
      // des colonnes d'eau qui montent et retombent en gerbes
      emettre(e.dt, 350 * force, () => P.ajouter(goutte({
        x: hasard(0, e.l), y: e.h - hauteur + 10, vx: hasard(-60, 60), vy: hasard(-500, -250), ay: 900,
        taille: hasard(6, 14), duree: hasard(0.6, 1)
      })));
    }
  },

  // la grande cascade s'abat du haut de l'écran
  cascade: {
    duree: 6, son: "eau",
    devant(ctx, e, s, P) {
      const force = enveloppe(e.t, 6, 0.5, 1);
      // la colonne d'eau, au centre
      const largeur = e.l * 0.7 * force;
      const g = ctx.createLinearGradient(0, 0, 0, e.h);
      g.addColorStop(0, "rgba(200, 240, 255, 0.7)");
      g.addColorStop(1, "rgba(40, 120, 210, 0.55)");
      ctx.fillStyle = g;
      ctx.fillRect((e.l - largeur) / 2, 0, largeur, e.h);
      // des filets plus clairs qui descendent vite
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 3;
      for (let i = 0; i < 14; i++) {
        const x = (e.l - largeur) / 2 + (i + 0.5) / 14 * largeur;
        const y = ((e.t * 900 + i * 137) % (e.h + 200)) - 200;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 160);
        ctx.stroke();
      }
      // les éclaboussures en bas, et une vague qui monte
      emettre(e.dt, 300 * force, () => P.ajouter(goutte({
        x: hasard((e.l - largeur) / 2, (e.l + largeur) / 2), y: e.h - 10, vx: hasard(-300, 300), vy: hasard(-600, -200), ay: 1200,
        taille: hasard(8, 18), duree: hasard(0.5, 0.9)
      })));
      vague(ctx, e, e.h * 0.25 * force, "rgba(40, 130, 220, 0.55)");
      e.secouer(6 * force);
    }
  },

  // la brume de Zabuza : un brouillard épais envahit tout, puis se dissipe
  brume: {
    duree: 7, son: "eau",
    devant(ctx, e, s, P) {
      const force = enveloppe(e.t, 7, 1.5, 1.5);
      emettre(e.dt, 25 * force, () => P.ajouter({
        x: hasard(-50, e.l + 50), y: hasard(0, e.h), vx: hasard(-30, 30), vy: hasard(-10, 10),
        taille: hasard(0.1, 0.2) * Math.max(e.l, e.h), croissance: 20, duree: hasard(2.5, 4), couleurs: FUMEE, mode: "source-over", alpha: 0.22
      }));
      voile(ctx, e, "#d9e2ea", 0.45 * force); // on devine encore les formes à travers
    }
  },

  // un fil d'eau sous pression balaie l'écran
  jetTranchant: {
    duree: 3, son: "eau",
    devant(ctx, e, s, P) {
      if (e.t > 2.4) return;
      const sens = e.main.x < e.l / 2 ? 1 : -1;
      const angle = (sens > 0 ? 0 : Math.PI) + sens * (-0.5 + e.t / 2.4 * 1); // il balaie de haut en bas
      const longueur = Math.hypot(e.l, e.h);
      const fin = { x: e.main.x + Math.cos(angle) * longueur, y: e.main.y + Math.sin(angle) * longueur };
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(90, 180, 255, 0.5)";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(e.main.x, e.main.y);
      ctx.lineTo(fin.x, fin.y);
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
      // des gouttes le long du jet
      emettre(e.dt, 200, () => {
        const d = hasard(0.1, 1) * longueur * 0.6;
        P.ajouter(goutte({ x: e.main.x + Math.cos(angle) * d, y: e.main.y + Math.sin(angle) * d, vx: hasard(-80, 80), vy: hasard(-80, 80), ay: 500, taille: hasard(4, 9), duree: 0.5 }));
      });
      e.secouer(2);
    }
  }
};
