// Genjutsu et Sharingan : les illusions et les techniques des yeux
// Hamza Karrouchi - BUT INFO 3
//
// Les effets marqués "genjutsu" durent jusqu'à ce qu'on fasse le signe du Bélier
// (« Kai ! »), ou au plus 12 secondes.

import { hasard, TOUR, lisse, enveloppe, VIOLET, emettre, kanji, eclair, tracer, vignette, voile, decalerBande, sharingan } from "./outils.js";

// la lune rouge du Tsukuyomi
function lune(ctx, x, y, r) {
  ctx.save();
  ctx.shadowColor = "#ff2a2a";
  ctx.shadowBlur = r * 0.8;
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, "#ff5a5a");
  g.addColorStop(1, "#8a0010");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TOUR);
  ctx.fill();
  ctx.restore();
}

export const GENJUTSUS = {

  // Tsukuyomi : le monde devient rouge et noir, la personne en négatif
  tsukuyomi: {
    duree: 12, son: "genjutsu", sonDepart: "sharingan", silhouette: true, genjutsu: true,
    fond(ctx, e) {
      ctx.filter = "grayscale(1) contrast(1.8) brightness(0.6)";
      e.dessinerCadre(ctx, e.video);
      ctx.filter = "none";
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "#c1121f";
      ctx.fillRect(0, 0, e.l, e.h);
      ctx.globalCompositeOperation = "source-over";
      lune(ctx, e.l * 0.78, e.h * 0.2, Math.min(e.l, e.h) * 0.12);
    },
    personne(ctx, e) {
      if (!e.personne) return false;
      ctx.filter = "invert(1) grayscale(1) contrast(1.5)";
      e.dessinerCadre(ctx, e.personne);
      ctx.filter = "none";
      return true;
    },
    devant(ctx, e) {
      vignette(ctx, e, "#000000", 0.8);
      // le Sharingan s'ouvre au début
      if (e.t < 1.8) sharingan(ctx, e.l / 2, e.h / 2, Math.min(e.l, e.h) * 0.3 * lisse(e.t / 0.4), e.t * 6, 1 - lisse((e.t - 1.3) / 0.5));
    }
  },

  // Vision de l'enfer : des feuilles mortes tourbillonnent, le monde se tord
  visionEnfer: {
    duree: 12, son: "genjutsu", genjutsu: true,
    fond(ctx, e) {
      ctx.filter = "saturate(0.3) brightness(0.7) sepia(0.4)";
      e.dessinerCadre(ctx, e.video);
      ctx.filter = "none";
      // l'image ondule par bandes
      for (let i = 0; i < 12; i++) decalerBande(ctx, e, i * e.h / 12, e.h / 12, Math.sin(e.t * 3 + i * 0.8) * 14);
    },
    devant(ctx, e, s, P) {
      emettre(e.dt, 30, () => {
        const a = hasard(0, TOUR);
        const d = Math.max(e.l, e.h) * 0.6;
        // elles viennent des bords et tournent vers le centre
        P.ajouter({
          texte: "🍂", mode: "source-over", x: e.l / 2 + Math.cos(a) * d, y: e.h / 2 + Math.sin(a) * d,
          vx: -Math.cos(a) * 150 - Math.sin(a) * 250, vy: -Math.sin(a) * 150 + Math.cos(a) * 250,
          taille: hasard(10, 20), duree: 3, vrot: hasard(-6, 6)
        });
      });
      vignette(ctx, e, "#120800", 0.75);
    }
  },

  // Étreinte de l'arbre : un tronc pousse et des branches s'enroulent autour de toi
  arbre: {
    duree: 12, son: "genjutsu", genjutsu: true,
    depart(s, e) {
      s.branches = Array.from({ length: 12 }, (_, i) => {
        const gauche = i % 2 === 0;
        return eclair(gauche ? 0 : e.l, e.h * hasard(0.3, 1), gauche ? hasard(-0.6, 0.3) : Math.PI + hasard(-0.3, 0.6), e.l * hasard(0.35, 0.55), 0.6);
      });
    },
    devant(ctx, e, s, P) {
      const pousse = lisse(e.t / 3);
      voile(ctx, e, "#3a1408", 0.35 * pousse, "multiply");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#3a2210";
      ctx.lineWidth = Math.max(14, e.l * 0.022);
      s.branches.forEach(points => tracer(ctx, points, pousse));
      ctx.strokeStyle = "#5c3a1c";
      ctx.lineWidth = Math.max(5, e.l * 0.008);
      s.branches.forEach(points => tracer(ctx, points, pousse));
      if (e.t > 2) emettre(e.dt, 6, () => P.ajouter({ texte: "🍃", mode: "source-over", x: hasard(0, e.l), y: -10, vy: hasard(60, 140), vx: hasard(-40, 40), taille: hasard(8, 14), duree: 4, vrot: hasard(-3, 3) }));
      vignette(ctx, e, "#000000", 0.5 * pousse);
    }
  },

  // Izanagi : la réalité se brouille par bandes, un flash, et tout revient comme avant
  izanagi: {
    duree: 3.2, son: "sharingan",
    devant(ctx, e) {
      const force = 1 - lisse((e.t - 2) / 0.6);
      if (force > 0) {
        for (let i = 0; i < 10; i++) {
          if (Math.random() < 0.5) decalerBande(ctx, e, hasard(0, e.h), hasard(8, 50), hasard(-60, 60) * force);
        }
        // des couleurs décalées, comme un écran qui grésille
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.25 * force;
        ctx.fillStyle = Math.random() < 0.5 ? "#ff003c" : "#00e5ff";
        ctx.fillRect(0, hasard(0, e.h), e.l, hasard(10, 80));
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
      if (e.t > 2) voile(ctx, e, "#ffffff", 0.9 * (1 - lisse((e.t - 2.1) / 1)));
      if (e.t > 2.1) kanji(ctx, "イザナギ", e.l / 2, e.h / 2, Math.min(e.l, e.h) * 0.14, "#111", 1 - lisse((e.t - 2.6) / 0.6));
    }
  },

  // Kamui : l'image est aspirée en spirale vers un trou noir, puis recrachée
  kamui: {
    duree: 4.5, son: "rasengan",
    depart(s) {
      s.copie = document.createElement("canvas");
    },
    devant(ctx, e, s) {
      const force = enveloppe(e.t, 4.5, 1.2, 1.2);
      const cx = e.l / 2;
      const cy = e.h * 0.45;
      const rayonMax = Math.max(e.l, e.h) * 0.75;
      // une copie de l'image de cette frame, qu'on va faire tourner par anneaux
      s.copie.width = ctx.canvas.width;
      s.copie.height = ctx.canvas.height;
      s.copie.getContext("2d").drawImage(ctx.canvas, 0, 0);
      // des anneaux de plus en plus petits, tournés de plus en plus vers le centre ;
      // la copie est agrandie (1,5) pour que la rotation ne laisse jamais de coin vide
      for (let i = 0; i < 10; i++) {
        const rayon = rayonMax * (1 - i / 10);
        const zoom = 1.5 * (1 - force * i * 0.04);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, rayon, 0, TOUR);
        ctx.clip();
        ctx.translate(cx, cy);
        ctx.rotate(force * i * 0.28);
        ctx.scale(zoom, zoom);
        ctx.translate(-cx, -cy);
        ctx.drawImage(s.copie, 0, 0, e.l, e.h);
        ctx.restore();
      }
      // le trou noir au centre
      const trou = Math.min(e.l, e.h) * 0.12 * force;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, trou * 2);
      g.addColorStop(0, "rgba(0, 0, 0, 1)");
      g.addColorStop(0.5, "rgba(10, 0, 20, 0.9)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, trou * 2, 0, TOUR);
      ctx.fill();
    }
  },

  // Susanoo : un géant de chakra violet se dresse autour de toi
  susanoo: {
    duree: 7, son: "genjutsu", sonDepart: "sharingan", silhouette: true,
    derriere(ctx, e, s, P) {
      const force = enveloppe(e.t, 7, 1, 1);
      const cx = e.l / 2;
      const base = e.h * 0.95;
      // l'aura : des flammes violettes qui montent derrière toi
      emettre(e.dt, 90 * force, () => P.ajouter({
        x: cx + hasard(-e.l * 0.35, e.l * 0.35), y: base - hasard(0, e.h * 0.6), vx: hasard(-20, 20), vy: hasard(-260, -120),
        taille: hasard(0.03, 0.06) * Math.min(e.l, e.h), croissance: 15, duree: hasard(0.5, 1), couleurs: VIOLET, alpha: 0.55
      }));
      // la cage thoracique du géant : des côtes en arcs de chaque côté
      ctx.strokeStyle = "rgba(190, 120, 255, " + 0.85 * force + ")";
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 25;
      ctx.lineWidth = Math.max(8, e.l * 0.012);
      for (let i = 0; i < 5; i++) {
        const y = e.h * (0.3 + i * 0.12);
        const ecart = e.l * (0.3 - i * 0.02) * lisse((e.t - i * 0.15) / 0.6);
        ctx.beginPath();
        ctx.moveTo(cx - 10, y);
        ctx.quadraticCurveTo(cx - ecart * 1.3, y - 40, cx - ecart, y + 50);
        ctx.moveTo(cx + 10, y);
        ctx.quadraticCurveTo(cx + ecart * 1.3, y - 40, cx + ecart, y + 50);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    },
    devant(ctx, e) {
      vignette(ctx, e, "#2b0a4a", 0.6 * enveloppe(e.t, 7, 1, 1));
    }
  },

  // « Kai ! » : le genjutsu est rompu
  kai: {
    duree: 0.9, son: "kai",
    devant(ctx, e) {
      const a = 1 - e.t / 0.9;
      voile(ctx, e, "#ffffff", 0.7 * a);
      kanji(ctx, "解", e.l / 2, e.h / 2, Math.min(e.l, e.h) * (0.5 + e.t * 0.3), "#111", a);
    }
  }
};
