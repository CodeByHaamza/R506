// Katon : les effets de feu
// Hamza Karrouchi - BUT INFO 3

import { hasard, TOUR, lisse, FEU, NOIR, CENDRE, sprite, emettre, emoji, teinte, vignette, sharingan } from "./outils.js";

// la bouche est un peu au-dessus des mains (pendant les signes, elles sont devant la poitrine)
const bouche = e => ({ x: e.main.x, y: e.main.y - e.main.r });

export const FEUX = {

  // une énorme boule de feu au centre de l'écran
  bouleDeFeu: {
    duree: 3.6, son: "feu",
    devant(ctx, e, s, P) {
      const rMax = Math.min(e.l, e.h) * 0.36;
      const centre = { x: e.l / 2, y: e.h * 0.42 };
      const b = bouche(e);
      if (e.t < 2.8) {
        emettre(e.dt, 160, () => {
          const a = Math.atan2(centre.y - b.y, centre.x - b.x) + hasard(-0.35, 0.35);
          const v = hasard(250, 600);
          P.ajouter({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, taille: hasard(12, 26), croissance: 70, duree: hasard(0.5, 0.9), couleurs: FEU });
        });
      }
      // la boule grossit en 0,9 s, brûle, puis s'éteint
      const r = rMax * lisse(e.t / 0.9) * (1 - lisse((e.t - 3) / 0.6)) * (1 + 0.05 * Math.sin(e.t * 37));
      if (r < 2) return;
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(centre.x, centre.y, 0, centre.x, centre.y, r);
      g.addColorStop(0, "rgba(255, 250, 225, 0.95)");
      g.addColorStop(0.35, "rgba(255, 196, 70, 0.85)");
      g.addColorStop(0.7, "rgba(240, 95, 20, 0.55)");
      g.addColorStop(1, "rgba(150, 30, 0, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(centre.x, centre.y, r, 0, TOUR);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      teinte(ctx, e, "#ff6a14", 0.25 * r / rMax); // l'écran rougeoie
      emettre(e.dt, 140 * r / rMax, () => {
        const a = hasard(0, TOUR);
        P.ajouter({
          x: centre.x + Math.cos(a) * r * 0.85, y: centre.y + Math.sin(a) * r * 0.85,
          vx: Math.cos(a) * hasard(60, 200), vy: Math.sin(a) * hasard(60, 200) - 80,
          taille: hasard(20, 45), croissance: 30, duree: hasard(0.4, 0.8), couleurs: FEU
        });
      });
      e.secouer(10 * r / rMax);
    }
  },

  // une volée de petites boules de feu
  pluieDeFeu: {
    duree: 3.2, son: "feu",
    depart(s, e) {
      const b = bouche(e);
      s.boules = Array.from({ length: 10 }, (_, i) => ({ x: b.x, y: b.y, vx: hasard(-520, 520), vy: hasard(-850, -480), retard: i * 0.12 }));
    },
    devant(ctx, e, s, P) {
      for (const b of s.boules) {
        if (e.t < b.retard || b.y > e.h + 80) continue;
        b.vy += 650 * e.dt;
        b.x += b.vx * e.dt;
        b.y += b.vy * e.dt;
        P.ajouter({ x: b.x, y: b.y, vx: hasard(-30, 30), vy: hasard(-30, 30), taille: hasard(14, 26), croissance: -10, duree: 0.45, couleurs: FEU });
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(sprite("#ffd36b"), b.x - 36, b.y - 36, 72, 72);
        ctx.globalCompositeOperation = "source-over";
      }
    }
  },

  // un souffle de flammes qui fonce vers toi (les flammes grossissent vite)
  souffleDeFeu: {
    duree: 3, son: "feu",
    devant(ctx, e, s, P) {
      if (e.t > 2.4) return;
      const b = bouche(e);
      emettre(e.dt, 170, () => {
        const a = hasard(0, TOUR);
        const v = hasard(80, 380);
        P.ajouter({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, taille: hasard(8, 16), croissance: hasard(80, 170), duree: hasard(0.5, 0.9), couleurs: FEU, alpha: 0.7 });
      });
      teinte(ctx, e, "#ff6a14", 0.1);
      e.secouer(4);
    }
  },

  // un dragon de flammes qui serpente d'un bord à l'autre
  dragonDeFeu: {
    duree: 4.4, son: "feu",
    devant(ctx, e, s, P) {
      const p = e.t / 3.8;
      if (p > 1) return;
      const x = -0.15 * e.l + p * 1.3 * e.l;
      const y = e.h * (0.45 + 0.16 * Math.sin(p * Math.PI * 3));
      const taille = Math.min(e.l, e.h) * 0.22;
      emettre(e.dt, 260, () => P.ajouter({
        x: x + hasard(-20, 20), y: y + hasard(-20, 20), vx: hasard(-60, 60), vy: hasard(-80, 20),
        taille: hasard(taille * 0.25, taille * 0.5), croissance: 20, duree: hasard(0.6, 1.1), couleurs: FEU
      }));
      // le dragon vert devient orange en tournant ses couleurs
      emoji(ctx, "🐉", x, y, taille, { rotation: Math.cos(p * Math.PI * 3) * 0.5, filtre: "hue-rotate(-90deg) saturate(1.6)", halo: "#ff7a1a" });
      teinte(ctx, e, "#ff6a14", 0.12);
      e.secouer(3);
    }
  },

  // Asuma : un nuage de cendres s'étale... puis il s'embrase d'un coup
  cendres: {
    duree: 5, son: "fumee",
    depart(s) {
      s.points = []; // où sont les cendres, pour savoir où les enflammer
    },
    devant(ctx, e, s, P) {
      const b = bouche(e);
      if (e.t < 2.2) {
        emettre(e.dt, 70, () => {
          const a = hasard(-Math.PI, 0) + hasard(-0.4, 0.4);
          const v = hasard(150, 420);
          const p = { x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, frein: 1.2, taille: hasard(18, 34), croissance: 40, duree: hasard(2.8, 3.4), couleurs: CENDRE, mode: "source-over", alpha: 0.75 };
          P.ajouter(p);
          s.points.push(p);
        });
      }
      // l'étincelle : Asuma claque son briquet, tout le nuage s'enflamme
      if (e.t > 2.4 && !s.allume) {
        s.allume = true;
        e.jouer("feu");
        for (const p of s.points) {
          for (let i = 0; i < 2; i++) {
            P.ajouter({ x: p.x + hasard(-20, 20), y: p.y + hasard(-20, 20), vx: hasard(-80, 80), vy: hasard(-160, -40), taille: hasard(20, 45), croissance: 40, duree: hasard(0.6, 1.2), couleurs: FEU });
          }
        }
      }
      if (s.allume) {
        teinte(ctx, e, "#ff6a14", 0.35 * (1 - lisse((e.t - 2.4) / 1.5)));
        e.secouer(12 * (1 - lisse((e.t - 2.4) / 1)));
      }
    }
  },

  // Madara : un mur de feu monte du bas et couvre tout l'écran
  murDeFeu: {
    duree: 5, son: "feu",
    devant(ctx, e, s, P) {
      const force = lisse(e.t / 1.2) * (1 - lisse((e.t - 4.2) / 0.8));
      // la hauteur des flammes suit la taille de l'écran
      emettre(e.dt, 260 * force, () => P.ajouter({
        x: hasard(-40, e.l + 40), y: e.h + 20, vx: hasard(-40, 40), vy: -e.h * hasard(0.6, 1.1) * force,
        taille: hasard(0.04, 0.08) * e.h, croissance: 20, duree: hasard(0.6, 1), couleurs: FEU, alpha: 0.6
      }));
      teinte(ctx, e, "#ff4a10", 0.18 * force);
      vignette(ctx, e, "#3a0800", 0.6 * force);
      e.secouer(8 * force);
    }
  },

  // les flammes noires d'Amaterasu, qui s'allument là où le regard se pose
  amaterasu: {
    duree: 6, son: "feu", sonDepart: "sharingan",
    devant(ctx, e, s, P) {
      // le Mangekyō s'ouvre un instant
      if (e.t < 1) sharingan(ctx, e.l / 2, e.h * 0.4, Math.min(e.l, e.h) * 0.22 * lisse(e.t / 0.3), e.t * 8, 1 - lisse((e.t - 0.6) / 0.4));
      const force = lisse((e.t - 0.6) / 0.8) * (1 - lisse((e.t - 5.2) / 0.8));
      // des flammes noires en anneau, qui montent et se tordent
      emettre(e.dt, 300 * force, () => {
        const a = hasard(0, TOUR);
        const d = Math.min(e.l, e.h) * hasard(0.1, 0.35);
        P.ajouter({
          x: e.l / 2 + Math.cos(a) * d, y: e.h * 0.5 + Math.sin(a) * d * 0.6,
          vx: hasard(-40, 40), vy: hasard(-260, -120), taille: hasard(0.04, 0.09) * Math.min(e.l, e.h), croissance: 20,
          duree: hasard(0.6, 1.1), couleurs: NOIR, mode: "source-over", alpha: 0.95
        });
      });
      // quelques braises rouge sombre au bord des flammes
      emettre(e.dt, 20 * force, () => P.ajouter({
        x: e.l / 2 + hasard(-e.l * 0.25, e.l * 0.25), y: e.h * 0.5 + hasard(-e.h * 0.2, e.h * 0.2),
        vy: hasard(-200, -80), taille: hasard(4, 9), duree: 0.6, couleurs: ["#ff3355", "#7a0018"]
      }));
      vignette(ctx, e, "#000000", 0.7 * force);
    }
  }
};
