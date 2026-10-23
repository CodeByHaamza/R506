// Doton et Mokuton : les effets de terre et de bois
// Hamza Karrouchi - BUT INFO 3

import { hasard, lisse, TERRE, emettre, eclair, tracer, emoji, bois } from "./outils.js";

// de la poussière qui gicle du sol en (x, y)
function poussiere(P, x, y, nombre) {
  for (let i = 0; i < nombre; i++) {
    P.ajouter({ x, y, vx: hasard(-220, 220), vy: hasard(-450, -120), ay: 900, taille: hasard(6, 14), duree: hasard(0.5, 1), couleurs: TERRE, mode: "source-over" });
  }
}

// un mur de pierres : des blocs aux couleurs un peu différentes, posés en quinconce
function pierres(largeur, hauteur) {
  const blocs = [];
  const h = hauteur / 6;
  for (let rang = 0; rang < 6; rang++) {
    for (let x = rang % 2 ? -h * 0.8 : 0; x < largeur; x += h * 1.6) {
      blocs.push({ x, y: rang * h, l: h * 1.55, h: h * 0.95, teinte: hasard(-12, 12) });
    }
  }
  return blocs;
}

// une pointe de roche qui sort du sol
function pointe(ctx, x, base, hauteur, largeur) {
  const g = ctx.createLinearGradient(x - largeur / 2, 0, x + largeur / 2, 0);
  g.addColorStop(0, "#5c4632");
  g.addColorStop(0.5, "#9b7d5c");
  g.addColorStop(1, "#4a3826");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - largeur / 2, base);
  ctx.lineTo(x + largeur * 0.1, base - hauteur);
  ctx.lineTo(x + largeur / 2, base);
  ctx.fill();
}

export const TERRES = {

  // Doton : la meute de chiens ninja jaillit du sol
  chiens: {
    duree: 5, son: "terre",
    depart(s, e) {
      s.chiens = Array.from({ length: 7 }, (_, i) => ({ x: e.l * (0.12 + i * 0.125), retard: 0.2 + Math.random() * 0.7, sens: Math.random() < 0.5 ? -1 : 1 }));
      s.fissures = Array.from({ length: 6 }, () => eclair(e.l / 2, e.h, hasard(-Math.PI * 0.95, -Math.PI * 0.05), hasard(e.h * 0.15, e.h * 0.35), 0.6));
    },
    devant(ctx, e, s, P) {
      if (e.t < 1.6) {
        ctx.globalAlpha = 1 - lisse((e.t - 1) / 0.6);
        ctx.strokeStyle = "#2b1a0c";
        ctx.lineWidth = 5;
        s.fissures.forEach(points => tracer(ctx, points));
        ctx.globalAlpha = 1;
      }
      const taille = Math.min(e.l, e.h) * 0.15;
      for (const c of s.chiens) {
        const t = e.t - c.retard;
        if (t < 0 || t > 3.6) continue;
        if (!c.sorti) {
          c.sorti = true;
          poussiere(P, c.x, e.h - 10, 25);
        }
        // un saut hors du sol, puis la course vers le bord de l'écran
        const saut = Math.sin(Math.min(t / 0.6, 1) * Math.PI / 2);
        const foulee = t > 0.6 ? Math.abs(Math.sin((t - 0.6) * 10)) * 18 : 0;
        const x = c.x + c.sens * Math.max(0, t - 0.6) * e.l * 0.6;
        const y = e.h + taille - saut * e.h * 0.35 - foulee;
        emoji(ctx, "🐕", x, y, taille, { miroir: c.sens > 0 }); // l'emoji regarde vers la gauche
      }
    }
  },

  // Doryūdan : un dragon de boue sort du sol et crache des boulets de terre
  dragonDeTerre: {
    duree: 4.5, son: "terre",
    devant(ctx, e, s, P) {
      const sortie = lisse(e.t / 0.8) * (1 - lisse((e.t - 3.8) / 0.7));
      const taille = Math.min(e.l, e.h) * 0.42;
      const x = e.l * 0.25;
      const y = e.h + taille * 0.3 - sortie * e.h * 0.55;
      if (e.t < 0.1 && !s.parti) {
        s.parti = true;
        poussiere(P, x, e.h - 10, 60);
      }
      emoji(ctx, "🐉", x, y, taille, { miroir: true, filtre: "sepia(1) saturate(0.6) brightness(0.65)" });
      // les boulets de boue partent de sa gueule et grossissent vers toi
      if (e.t > 1 && e.t < 3.6) {
        emettre(e.dt, 6, () => P.ajouter({
          x: x + taille * 0.3, y: y - taille * 0.2, vx: hasard(150, 450), vy: hasard(-250, 50), ay: 300,
          taille: 14, croissance: 90, duree: 1.2, couleurs: ["#7a5a3a", "#5c4430"], mode: "source-over"
        }));
      }
      e.secouer(4 * sortie);
    }
  },

  // Doryūheki : un mur de pierre sort du sol, puis s'effondre
  murDeTerre: {
    duree: 5, son: "terre",
    depart(s, e) {
      s.hauteur = e.h * 0.55;
      s.blocs = pierres(e.l, s.hauteur);
    },
    devant(ctx, e, s, P) {
      const monte = lisse(e.t / 0.7) * (1 - lisse((e.t - 4.2) / 0.8));
      const haut = e.h - s.hauteur * monte;
      if (e.t < 0.7) emettre(e.dt, 80, () => poussiere(P, hasard(0, e.l), e.h - 5, 1));
      for (const b of s.blocs) {
        const y = haut + b.y;
        if (y > e.h) continue;
        ctx.fillStyle = "hsl(30, 18%, " + (38 + b.teinte) + "%)";
        ctx.fillRect(b.x, y, b.l, b.h);
        ctx.strokeStyle = "rgba(20, 12, 5, 0.6)";
        ctx.strokeRect(b.x, y, b.l, b.h);
      }
      e.secouer(e.t < 0.8 || e.t > 4.2 ? 6 : 0);
    }
  },

  // Doryūsō : des pointes de roche jaillissent du sol les unes après les autres
  pieux: {
    duree: 3.6, son: "terre",
    depart(s, e) {
      s.pointes = Array.from({ length: 9 }, (_, i) => ({ x: e.l * (0.06 + i * 0.11) + hasard(-20, 20), retard: i * 0.08, h: hasard(0.3, 0.55) * e.h, l: hasard(60, 110) }));
    },
    devant(ctx, e, s, P) {
      for (const p of s.pointes) {
        const t = e.t - p.retard;
        if (t < 0) continue;
        if (!p.sortie) {
          p.sortie = true;
          poussiere(P, p.x, e.h - 5, 12);
        }
        const sortie = lisse(t / 0.15) * (1 - lisse((e.t - 3) / 0.6));
        pointe(ctx, p.x, e.h + 5, p.h * sortie, p.l);
      }
      e.secouer(e.t < 0.9 ? 5 : 0);
    }
  },

  // Mokuton : une cage de piliers de bois pousse autour de toi
  prisonDeBois: {
    duree: 5, son: "terre",
    devant(ctx, e, s, P) {
      const pousse = lisse(e.t / 0.8) * (1 - lisse((e.t - 4.3) / 0.7));
      const gauche = e.l * 0.2;
      const droite = e.l * 0.8;
      const epaisseur = Math.max(18, e.l * 0.025);
      for (let i = 0; i <= 6; i++) {
        const x = gauche + (droite - gauche) * i / 6;
        const hauteur = e.h * pousse;
        bois(ctx, x, e.h - hauteur / 2, hauteur, epaisseur, Math.PI / 2); // des piliers verticaux
      }
      bois(ctx, e.l / 2, e.h * (1 - 0.9 * pousse), droite - gauche + epaisseur * 2, epaisseur * 1.4); // la poutre du haut
      if (e.t < 0.8) emettre(e.dt, 40, () => poussiere(P, hasard(gauche, droite), e.h - 5, 1));
    }
  },

  // Mokuton : une maison de bois pousse derrière toi
  maison: {
    duree: 5.5, son: "terre", silhouette: true,
    derriere(ctx, e) {
      const pousse = lisse(e.t / 1.2) * (1 - lisse((e.t - 4.8) / 0.7));
      if (pousse <= 0) return;
      const base = e.h;
      const haut = e.h * (1 - 0.75 * pousse);
      const epaisseur = Math.max(22, e.l * 0.03);
      for (const x of [0.08, 0.32, 0.68, 0.92]) bois(ctx, x * e.l, (base + haut) / 2, base - haut, epaisseur, Math.PI / 2);
      // le toit : deux pans qui se rejoignent au-dessus du milieu
      ctx.fillStyle = "#5a3418";
      ctx.beginPath();
      ctx.moveTo(e.l * 0.02, haut);
      ctx.lineTo(e.l / 2, haut - e.h * 0.2 * pousse);
      ctx.lineTo(e.l * 0.98, haut);
      ctx.closePath();
      ctx.fill();
      bois(ctx, e.l / 2, haut, e.l * 0.96, epaisseur);
    }
  },

  // Hashirama : une forêt pousse d'un coup, des lianes montent des coins
  foret: {
    duree: 6, son: "terre",
    depart(s, e) {
      s.arbres = Array.from({ length: 9 }, (_, i) => ({ x: e.l * (i + 0.5) / 9 + hasard(-20, 20), retard: hasard(0, 0.8), taille: hasard(0.25, 0.4) * Math.min(e.l, e.h) }));
      s.lianes = Array.from({ length: 8 }, (_, i) => eclair(i % 2 ? e.l : 0, e.h, i % 2 ? hasard(-2.6, -2) : hasard(-1.1, -0.5), hasard(0.5, 0.9) * e.h, 0.5));
    },
    devant(ctx, e, s, P) {
      const fin = 1 - lisse((e.t - 5.3) / 0.7);
      ctx.strokeStyle = "rgba(40, 90, 30, " + 0.9 * fin + ")";
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      s.lianes.forEach(points => tracer(ctx, points, lisse(e.t / 2)));
      for (const a of s.arbres) {
        const t = e.t - a.retard;
        if (t < 0) continue;
        const pousse = lisse(t / 0.6) * fin;
        emoji(ctx, "🌳", a.x, e.h - a.taille * 0.45 * pousse, a.taille * pousse);
      }
      emettre(e.dt, 20 * fin, () => P.ajouter({ texte: "🍃", mode: "source-over", x: hasard(0, e.l), y: -10, vx: hasard(-60, 60), vy: hasard(80, 200), taille: hasard(8, 14), duree: 3, vrot: hasard(-4, 4) }));
      e.secouer(e.t < 1.2 ? 5 : 0);
    }
  }
};
