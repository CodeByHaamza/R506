// Ninjutsu, invocations et sceaux
// Hamza Karrouchi - BUT INFO 3
//
// Plusieurs effets utilisent la personne détourée (e.personne) : les clones, la bûche
// de la permutation, la métamorphose... Sans détourage, ils font une version simplifiée.

import { hasard, TOUR, lisse, enveloppe, VIOLET, CENDRE, TERRE, emettre, fumee, feuilles, emoji, kanji, eclair, tracer, vignette, buche, bois } from "./outils.js";

// le centre de la personne : à peu près le milieu de l'écran, un peu en dessous
const centre = e => ({ x: e.l / 2, y: e.h * 0.55 });

// cache la personne sous le décor étalé (si le détourage est prêt)
function cacherPersonne(ctx, e) {
  if (e.couverture) e.dessinerCadre(ctx, e.couverture());
}

// le cercle d'invocation, vu en perspective sur le sol
function cercleInvocation(ctx, x, y, rayon, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(1, 0.3);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(0, 0, rayon * 0.22, 0, TOUR);
  ctx.stroke();
  const signes = "口寄せの術封印";
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * TOUR;
    const fin = i % 2 ? rayon : rayon * 0.72;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * rayon * 0.22, Math.sin(a) * rayon * 0.22);
    ctx.lineTo(Math.cos(a) * fin, Math.sin(a) * fin);
    ctx.stroke();
    kanji(ctx, signes[i % signes.length], Math.cos(a) * fin * 1.08, Math.sin(a) * fin * 1.08, rayon * 0.12, "#111");
  }
  ctx.restore();
}

// un shuriken à quatre branches
function shuriken(ctx, x, y, r, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#3b4048";
  ctx.strokeStyle = "#c9d1d9";
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a + Math.PI / 4) * r * 0.25, Math.sin(a + Math.PI / 4) * r * 0.25);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#0b0d10";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.12, 0, TOUR);
  ctx.fill();
  ctx.restore();
}

export const NINJUTSUS = {

  // des clones de la personne apparaissent dans la fumée, de chaque côté
  clones: {
    duree: 6.5, son: "fumee", silhouette: true,
    depart(s) {
      s.places = [[-0.3, 1], [0.3, 1], [-0.56, 0.82], [0.56, 0.82]]; // [décalage en part de la largeur, taille]
    },
    derriere(ctx, e, s, P) {
      s.places.forEach(([decalage, zoom], i) => {
        const apparition = 0.15 + i * 0.12;
        const x = e.l / 2 + decalage * e.l;
        if (!s["arrivee" + i] && e.t > apparition - 0.1) {
          s["arrivee" + i] = true;
          fumee(P, x, e.h * 0.55, 30, 110);
        }
        if (!s["depart" + i] && e.t > 5.8) {
          s["depart" + i] = true;
          fumee(P, x, e.h * 0.55, 25, 100);
        }
        const alpha = lisse((e.t - apparition) / 0.25) * (1 - lisse((e.t - 5.8) / 0.3));
        if (alpha <= 0) return;
        // sans détourage, on dessine des fantômes de toute l'image
        ctx.globalAlpha = e.personne ? alpha : alpha * 0.45;
        e.dessinerCadre(ctx, e.personne || e.video, decalage * e.l, zoom);
        ctx.globalAlpha = 1;
      });
    }
  },

  // la personne disparaît dans la fumée, remplacée par une bûche
  permutation: {
    duree: 4.2, son: "fumee", silhouette: true,
    depart(s, e, P) {
      fumee(P, e.l / 2, e.h * 0.55, 80, 170);
    },
    personne(ctx, e, s, P) {
      if (e.t < 0.25 || e.t > 3.8) return false;
      if (!s.retour && e.t > 3.55) {
        s.retour = true;
        fumee(P, e.l / 2, e.h * 0.55, 70, 160);
      }
      cacherPersonne(ctx, e);
      // la bûche tombe et rebondit
      const chute = Math.min((e.t - 0.25) / 0.35, 1);
      const rebond = Math.abs(Math.sin(Math.min(e.t - 0.6, 0.6) * 9)) * Math.max(0, 0.6 - (e.t - 0.6)) * 40;
      buche(ctx, e.l / 2, e.h * (0.35 + 0.3 * chute) - rebond, Math.min(e.l, e.h) * 0.45, 0.15);
      return true;
    }
  },

  // Henge : pouf, tu deviens le renard à neuf queues
  metamorphose: {
    duree: 5, son: "fumee", silhouette: true,
    depart(s, e, P) {
      fumee(P, centre(e).x, centre(e).y, 80, 170);
    },
    personne(ctx, e, s, P) {
      if (e.t < 0.25 || e.t > 4.6) return false;
      if (!s.retour && e.t > 4.35) {
        s.retour = true;
        fumee(P, centre(e).x, centre(e).y, 70, 160);
      }
      cacherPersonne(ctx, e);
      const taille = Math.min(e.l, e.h) * 0.75 * (1 + 0.03 * Math.sin(e.t * 4));
      emoji(ctx, "🦊", centre(e).x, centre(e).y, taille, { halo: "#ff7a1a" });
      return true;
    }
  },

  // Shunshin : un tourbillon de feuilles, et tu disparais un instant
  shunshin: {
    duree: 3.2, son: "vent", silhouette: true,
    depart(s, e, P) {
      feuilles(P, centre(e).x, centre(e).y, 60, Math.min(e.l, e.h) * 0.4);
    },
    devant(ctx, e, s, P) {
      if (e.t < 2.4) emettre(e.dt, 25, () => feuilles(P, centre(e).x, centre(e).y, 1, Math.min(e.l, e.h) * 0.45));
    },
    personne(ctx, e, s, P) {
      if (e.t < 0.3 || e.t > 2.4) return false;
      if (!s.retour && e.t > 2.2) {
        s.retour = true;
        feuilles(P, centre(e).x, centre(e).y, 50, Math.min(e.l, e.h) * 0.4);
      }
      cacherPersonne(ctx, e);
      return true;
    }
  },

  // Kagemane : des ombres noires rampent du bas de l'écran jusqu'aux mains
  ombre: {
    duree: 5, son: "genjutsu",
    depart(s, e) {
      s.ombres = Array.from({ length: 7 }, (_, i) => eclair(e.l * (0.1 + i * 0.13), e.h + 10, -Math.PI / 2 + hasard(-0.5, 0.5), e.h * hasard(0.45, 0.75), 0.5));
    },
    devant(ctx, e, s) {
      const force = enveloppe(e.t, 5, 0.4, 0.8);
      const g = ctx.createLinearGradient(0, e.h * 0.4, 0, e.h);
      g.addColorStop(0, "rgba(0, 0, 0, 0)");
      g.addColorStop(1, "rgba(0, 0, 0, " + 0.65 * force + ")");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, e.l, e.h);
      ctx.strokeStyle = "rgba(5, 5, 8, " + 0.92 * force + ")";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(10, e.l * 0.018);
      s.ombres.forEach(points => tracer(ctx, points, lisse(e.t / 1.6)));
    }
  },

  // Hari Jizō : les cheveux de Jiraiya deviennent des aiguilles tout autour de toi
  herisson: {
    duree: 4, son: "fumee",
    depart(s) {
      s.aiguilles = Array.from({ length: 60 }, (_, i) => ({ angle: i / 60 * TOUR + hasard(-0.05, 0.05), longueur: hasard(0.8, 1.2) }));
    },
    devant(ctx, e, s) {
      const sortie = lisse(e.t / 0.3) * (1 - lisse((e.t - 3.4) / 0.6));
      const c = centre(e);
      const rayon = Math.min(e.l, e.h) * 0.22;
      ctx.fillStyle = "#f2f2f2";
      ctx.strokeStyle = "rgba(60, 60, 60, 0.6)";
      for (const a of s.aiguilles) {
        const fin = rayon + Math.min(e.l, e.h) * 0.3 * a.longueur * sortie;
        ctx.beginPath();
        ctx.moveTo(c.x + Math.cos(a.angle - 0.04) * rayon, c.y + Math.sin(a.angle - 0.04) * rayon);
        ctx.lineTo(c.x + Math.cos(a.angle) * fin, c.y + Math.sin(a.angle) * fin);
        ctx.lineTo(c.x + Math.cos(a.angle + 0.04) * rayon, c.y + Math.sin(a.angle + 0.04) * rayon);
        ctx.fill();
        ctx.stroke();
      }
      if (e.t < 0.4) e.secouer(6);
    }
  },

  // un shuriken se multiplie en dizaines de shuriken qui foncent vers toi
  shuriken: {
    duree: 3.5, son: "vent",
    depart(s) {
      s.lames = Array.from({ length: 24 }, (_, i) => ({ angle: hasard(0, TOUR), vitesse: hasard(0.25, 0.5), retard: i < 1 ? 0 : 0.5 + i * 0.03 }));
    },
    devant(ctx, e, s, P) {
      for (const lame of s.lames) {
        const t = e.t - lame.retard;
        if (t < 0 || t > 2.6) continue;
        if (!lame.vu && lame.retard > 0) {
          lame.vu = true;
          fumee(P, e.main.x, e.main.y, 3, 40);
        }
        // chaque shuriken s'écarte du centre et grossit : il vient vers toi
        const d = t * lame.vitesse * Math.max(e.l, e.h);
        shuriken(ctx, e.main.x + Math.cos(lame.angle) * d, e.main.y + Math.sin(lame.angle) * d, 14 + t * 60, t * 20);
      }
    }
  },

  // Kuchiyose : un crapaud géant sort d'un nuage de fumée
  invocation: {
    duree: 6.5, son: "boum",
    depart(s, e, P) {
      fumee(P, e.l / 2, e.h * 0.8, 120, 220);
    },
    devant(ctx, e, s, P) {
      const taille = Math.min(e.l, e.h) * 0.62;
      if (e.t < 1.4) cercleInvocation(ctx, e.l / 2, e.h * 0.88, taille * 0.9, 1 - lisse((e.t - 0.9) / 0.5));
      const sortie = e.t - 0.35;
      if (sortie > 0 && e.t < 5.8) {
        // il grossit trop, puis rebondit jusqu'à sa taille
        const rebond = sortie < 0.5 ? 1.15 * lisse(sortie / 0.5) : 1 + 0.15 * Math.exp(-(sortie - 0.5) * 6) * Math.cos((sortie - 0.5) * 18);
        emoji(ctx, "🐸", e.l / 2, e.h * 0.62, taille * rebond * (1 + 0.02 * Math.sin(e.t * 3)), { halo: "rgba(0, 0, 0, 0.6)" });
      }
      if (!s.fin && e.t > 5.6) {
        s.fin = true;
        fumee(P, e.l / 2, e.h * 0.62, 100, 200);
      }
    }
  },

  // Gamaguchi Shibari : les parois roses de l'estomac du crapaud se referment
  estomac: {
    duree: 6, son: "boum",
    devant(ctx, e) {
      const ferme = lisse(e.t / 1.5) * (1 - lisse((e.t - 5.2) / 0.8));
      const pouls = 1 + 0.04 * Math.sin(e.t * 5);
      const g = ctx.createRadialGradient(e.l / 2, e.h / 2, Math.min(e.l, e.h) * (0.55 - 0.3 * ferme) * pouls, e.l / 2, e.h / 2, Math.max(e.l, e.h) * 0.75);
      g.addColorStop(0, "rgba(160, 40, 70, 0)");
      g.addColorStop(0.3, "rgba(190, 60, 90, " + 0.85 * ferme + ")");
      g.addColorStop(1, "rgba(90, 10, 30, " + 0.98 * ferme + ")");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, e.l, e.h);
      // des plis de chair qui ondulent
      ctx.strokeStyle = "rgba(120, 20, 45, " + 0.6 * ferme + ")";
      ctx.lineWidth = 6;
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * TOUR + Math.sin(e.t * 2 + i) * 0.1;
        const r1 = Math.max(e.l, e.h) * (0.75 - 0.25 * ferme);
        ctx.beginPath();
        ctx.moveTo(e.l / 2 + Math.cos(a) * r1 * 1.2, e.h / 2 + Math.sin(a) * r1 * 1.2);
        ctx.quadraticCurveTo(e.l / 2 + Math.cos(a + 0.2) * r1 * 0.9, e.h / 2 + Math.sin(a + 0.2) * r1 * 0.9, e.l / 2 + Math.cos(a) * r1 * 0.7, e.h / 2 + Math.sin(a) * r1 * 0.7);
        ctx.stroke();
      }
    }
  },

  // Rashōmon : un portail géant surgit du sol devant toi
  porte: {
    duree: 5, son: "boum",
    devant(ctx, e, s, P) {
      const sortie = lisse(e.t / 0.6) * (1 - lisse((e.t - 4.3) / 0.7));
      if (sortie <= 0) return;
      const largeur = e.l * 0.7;
      const hauteur = e.h * 0.8;
      const x = (e.l - largeur) / 2;
      const y = e.h - hauteur * sortie;
      ctx.fillStyle = "#4a2a14";
      ctx.fillRect(x, y + hauteur * 0.12, largeur, hauteur);
      bois(ctx, e.l / 2, y + hauteur * 0.08, largeur * 1.15, hauteur * 0.1); // le toit
      for (const px of [x + largeur * 0.06, x + largeur * 0.94]) bois(ctx, px, y + hauteur * 0.55, hauteur * 0.9, largeur * 0.08, Math.PI / 2);
      ctx.strokeStyle = "#2a160a";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(e.l / 2, y + hauteur * 0.14);
      ctx.lineTo(e.l / 2, e.h);
      ctx.stroke();
      emoji(ctx, "👹", e.l / 2, y + hauteur * 0.42, hauteur * 0.32); // le visage du démon sur la porte
      if (e.t < 0.6) {
        emettre(e.dt, 60, () => P.ajouter({ x: hasard(x, x + largeur), y: e.h - 5, vx: hasard(-200, 200), vy: hasard(-400, -100), ay: 900, taille: hasard(6, 14), duree: 0.8, couleurs: TERRE, mode: "source-over" }));
        e.secouer(8);
      }
    }
  },

  // Edo Tensei : la personne devient grise et fissurée, comme les morts réanimés
  edoTensei: {
    duree: 7, son: "genjutsu", silhouette: true,
    depart(s, e) {
      s.fissures = Array.from({ length: 16 }, () => eclair(hasard(0.3, 0.7) * e.l, hasard(0.2, 0.85) * e.h, hasard(0, TOUR), hasard(50, 180), 0.7));
      s.calque = document.createElement("canvas");
    },
    personne(ctx, e, s) {
      // sans détourage, c'est toute l'image qui devient grise et fissurée
      const image = e.personne || e.video;
      ctx.filter = "grayscale(1) contrast(1.3) brightness(0.85)";
      e.dessinerCadre(ctx, image);
      ctx.filter = "none";
      // les fissures, seulement sur la personne : on les dessine à part puis on les découpe
      const calque = s.calque;
      calque.width = e.l;
      calque.height = e.h;
      const k = calque.getContext("2d");
      k.strokeStyle = "rgba(25, 12, 12, 0.85)";
      k.lineWidth = 2.5;
      s.fissures.forEach(points => tracer(k, points));
      k.globalCompositeOperation = "destination-in";
      e.dessinerCadre(k, image);
      ctx.globalAlpha = lisse(e.t / 1.5);
      ctx.drawImage(calque, 0, 0, e.l, e.h);
      ctx.globalAlpha = 1;
      return Boolean(e.personne);
    },
    devant(ctx, e, s, P) {
      vignette(ctx, e, "#1a0b26", 0.75 * enveloppe(e.t, 7, 1, 0.7));
      emettre(e.dt, 40, () => P.ajouter({
        x: hasard(0, e.l), y: e.h + 10, vx: hasard(-20, 20), vy: hasard(-120, -50),
        taille: hasard(2, 5), duree: hasard(2, 4), couleurs: CENDRE, mode: "source-over"
      }));
    }
  },

  // Shiki Fūjin : le dieu de la mort apparaît derrière la personne
  shinigami: {
    duree: 7, son: "genjutsu", silhouette: true,
    derriere(ctx, e) {
      const a = enveloppe(e.t, 7, 1.2, 0.8);
      ctx.fillStyle = "rgba(15, 0, 25, " + 0.55 * a + ")";
      ctx.fillRect(0, 0, e.l, e.h);
      emoji(ctx, "👹", e.l / 2, e.h * (0.62 - 0.14 * a), e.h * 0.95, { alpha: 0.85 * a, filtre: "grayscale(0.5) brightness(0.8) hue-rotate(240deg)", halo: "#a855f7" });
    },
    devant(ctx, e, s, P) {
      emettre(e.dt, 50, () => P.ajouter({
        x: hasard(0, e.l), y: hasard(e.h * 0.3, e.h), vx: hasard(-30, 30), vy: hasard(-80, -30),
        taille: hasard(10, 30), croissance: 10, duree: hasard(1, 2), couleurs: VIOLET
      }));
      if (e.t > 5) { // à la fin, le sceau "封" (sceller)
        const p = lisse((e.t - 5) / 0.3);
        kanji(ctx, "封", e.l / 2, e.h / 2, Math.min(e.l, e.h) * (0.7 - 0.25 * p), "#d4142a", p * (1 - lisse((e.t - 6.5) / 0.5)));
      }
    }
  },

  // Fūja Hōin : un cercle d'écritures noires tourne autour de toi et se resserre
  sceau: {
    duree: 5.5, son: "genjutsu",
    devant(ctx, e) {
      const c = centre(e);
      const p = lisse(e.t / 3);
      const force = enveloppe(e.t, 5.5, 0.5, 0.8);
      vignette(ctx, e, "#2a0a40", 0.6 * force);
      const texte = "封邪法印封邪法印封邪法印封邪法印";
      for (const [rayon, sens] of [[0.42, 1], [0.32, -1]]) {
        const r = Math.min(e.l, e.h) * rayon * (1.4 - 0.4 * p);
        for (let i = 0; i < texte.length; i++) {
          const a = i / texte.length * TOUR + sens * e.t * 0.8;
          ctx.save();
          ctx.translate(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r);
          ctx.rotate(a + Math.PI / 2);
          kanji(ctx, texte[i], 0, 0, Math.min(e.l, e.h) * 0.045, "#0b0b0b", force);
          ctx.restore();
        }
      }
      if (e.t > 3.2) kanji(ctx, "封", c.x, c.y, Math.min(e.l, e.h) * 0.4, "#111", lisse((e.t - 3.2) / 0.3) * force);
    }
  }
};
