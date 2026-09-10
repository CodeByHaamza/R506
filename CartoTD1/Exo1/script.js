// Exo 1 — Géolocalisation, orientation et mouvement
// R506 · Hamza Karrouchi
//
// Position avec les deux méthodes de l'API Geolocation (getCurrentPosition pour
// une mesure, watchPosition pour un suivi), puis les capteurs de l'appareil.
//
// Doc : https://developer.mozilla.org/fr/docs/Web/API/Geolocation_API
//       https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Detecting_device_orientation
//       https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent

"use strict";

const $ = id => document.getElementById(id);

let watchId = null;    
let nbMesures = 0;

function options() {
  return {
    enableHighAccuracy: $("highAccuracy").checked,
    timeout: 15000,
    maximumAge: 0        
  };
}

function unite(v, u, decimales) {
  return v === null ? null : v.toFixed(decimales) + " " + u;
}

function vitesse(v) {
  return v === null ? null : v.toFixed(2) + " m/s (" + (v * 3.6).toFixed(1) + " km/h)";
}

function cap(deg) {
  if (deg === null) return null;
  const rose = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return deg.toFixed(0) + "° (" + rose[Math.round(deg / 45) % 8] + ")";
}

// coords.altitude n'est renseignée que par le GPS. Sans puce GPS (Wi-Fi, 4G),
// on complète avec l'altitude du terrain, déduite des coordonnées.
let cacheAltitude = { cle: null, valeur: null };

function altitudeTerrain(lat, lon) {
  // Arrondi à 3 décimales (~100 m) pour ne pas refaire un appel à chaque
  // rafraîchissement de watchPosition().
  const cle = lat.toFixed(3) + "," + lon.toFixed(3);
  if (cle === cacheAltitude.cle) return Promise.resolve(cacheAltitude.valeur);

  return fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`)
    .then(r => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)))
    .then(data => {
      const valeur = data.elevation[0];
      cacheAltitude = { cle, valeur };
      return valeur;
    });
}

function completerAltitude(table, lat, lon) {
  const ligne = [...table.rows].find(tr => tr.cells[0].textContent === "Altitude du terrain");
  if (!ligne) return;
  const cellule = ligne.cells[1];

  altitudeTerrain(lat, lon)
    .then(v => {
      cellule.textContent = v.toFixed(0) + " m";
      cellule.className = "";
    })
    .catch(() => {
      cellule.textContent = "non disponible";
      cellule.className = "na";
    });
}

// timestamp = millisecondes écoulées depuis le 1er janvier 1970
function dateLisible(ms) {
  const d = new Date(ms);
  const jour = d.toLocaleDateString("fr-FR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  });
  const heure = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
  return jour + " à " + heure;
}

function remplir(table, lignes) {
  table.innerHTML = "";
  for (const [label, valeur] of lignes) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    const td = document.createElement("td");

    th.textContent = label;
    if (valeur === null) {
      td.textContent = "non disponible";
      td.className = "na";
    } else {
      td.textContent = valeur;
    }

    tr.append(th, td);
    table.append(tr);
  }
}

function afficher(table, position, extra) {
  const c = position.coords;

  remplir(table, [
    ["Latitude",            unite(c.latitude, "°", 6)],
    ["Longitude",           unite(c.longitude, "°", 6)],
    ["Altitude (GPS)",      unite(c.altitude, "m", 1)],
    ["Altitude du terrain", "…"],
    ["Précision (rayon)",   unite(c.accuracy, "m", 1)],
    ["Précision altitude",  unite(c.altitudeAccuracy, "m", 1)],
    ["Vitesse",             vitesse(c.speed)],
    ["Cap",                 cap(c.heading)],
    ["Horodatage",          dateLisible(position.timestamp)],
    ["Timestamp brut",      position.timestamp + " ms"],
    ...extra
  ]);

  completerAltitude(table, c.latitude, c.longitude);
}

function badge(id, texte, genre) {
  $(id).textContent = texte;
  $(id).className = "badge " + (genre || "");
}

function message(id, texte, genre) {
  $(id).textContent = texte || "";
  $(id).className = "msg " + (genre || "");
}

function expliquerErreur(err) {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Accès refusé. Autorisez la localisation pour ce site, puis réessayez.";
    case err.POSITION_UNAVAILABLE:
      return "Position indisponible : le GPS ne capte pas, ou le réseau ne permet "
           + "pas de vous localiser. Essayez près d'une fenêtre.";
    case err.TIMEOUT:
      return "Délai dépassé (15 s). Le GPS met parfois du temps à s'accrocher, relancez.";
    default:
      return "Erreur : " + err.message;
  }
}

$("btnCurrent").addEventListener("click", () => {
  badge("badgeCurrent", "Mesure…");
  message("msgCurrent", "");
  $("btnCurrent").disabled = true;

  navigator.geolocation.getCurrentPosition(
    position => {
      const mode = $("highAccuracy").checked ? "haute précision (GPS)" : "réseau";
      afficher($("tableCurrent"), position, [["Mode demandé", mode]]);
      badge("badgeCurrent", "Position obtenue", "ok");
      $("btnCurrent").disabled = false;
    },
    err => {
      badge("badgeCurrent", "Erreur", "err");
      message("msgCurrent", expliquerErreur(err), "err");
      $("btnCurrent").disabled = false;
    },
    options()
  );
});

$("btnWatch").addEventListener("click", () => {
  if (watchId !== null) return;

  nbMesures = 0;
  badge("badgeWatch", "Suivi actif");
  message("msgWatch", "En attente de la première mesure…", "info");
  $("btnWatch").disabled = true;
  $("btnStop").disabled = false;

  watchId = navigator.geolocation.watchPosition(
    position => {
      nbMesures++;
      afficher($("tableWatch"), position, [
        ["Mises à jour reçues", String(nbMesures)],
        ["Identifiant du suivi", String(watchId)]
      ]);
      badge("badgeWatch", "Suivi actif (" + nbMesures + ")", "ok");
      message("msgWatch", "Déplacez-vous pour voir la position et la vitesse évoluer.", "info");
    },
    err => {
      badge("badgeWatch", "Erreur", "err");
      message("msgWatch", expliquerErreur(err), "err");
    },
    options()
  );
});

$("btnStop").addEventListener("click", () => {
  if (watchId === null) return;

  navigator.geolocation.clearWatch(watchId);
  watchId = null;

  badge("badgeWatch", "Arrêté", "idle");
  message("msgWatch", "Suivi arrêté après " + nbMesures + " mise(s) à jour.");
  $("btnWatch").disabled = false;
  $("btnStop").disabled = true;
});

$("highAccuracy").addEventListener("change", () => {
  if (watchId === null) return;
  $("btnStop").click();
  $("btnWatch").click();
});

if (!("geolocation" in navigator)) {
  message("globalMsg", "Ce navigateur ne supporte pas l'API Geolocation.", "err");
  $("btnCurrent").disabled = true;
  $("btnWatch").disabled = true;
} else if (!window.isSecureContext) {
  message("globalMsg", "Page hors contexte sécurisé : la géolocalisation sera refusée. "
    + "Ouvrez la page en HTTPS ou via http://localhost, pas en file://.", "warn");
}


// Orientation et mouvement de l'appareil
//
// Doc : https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Detecting_device_orientation
//       https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent
//       https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent
//
// Ces deux événements ne se déclenchent que sur un appareil équipé de capteurs
// (accéléromètre, gyroscope, magnétomètre) : sur un ordinateur fixe, rien n'arrive.

let capteursActifs = false;
let dernierRendu = 0;
let recuOrientation = false;
let recuMouvement = false;

// devicemotion se déclenche jusqu'à 60 fois par seconde : inutile de redessiner
// le tableau à chaque fois, on se limite à 10 rafraîchissements par seconde.
function tropTot() {
  const maintenant = performance.now();
  if (maintenant - dernierRendu < 100) return true;
  dernierRendu = maintenant;
  return false;
}

function axe(v, unite, decimales) {
  return (v === null || v === undefined) ? null : v.toFixed(decimales) + " " + unite;
}

// alpha est l'angle autour de l'axe vertical : 0 = nord si l'orientation est absolue
function pointCardinal(alpha) {
  const rose = ["nord", "nord-est", "est", "sud-est", "sud", "sud-ouest", "ouest", "nord-ouest"];
  return rose[Math.round(alpha / 45) % 8];
}

function surOrientation(e) {
  recuOrientation = true;
  if (tropTot()) return;

  // Sur iOS, webkitCompassHeading donne le cap magnétique réel ; ailleurs on
  // reconstitue le cap à partir d'alpha (360 - alpha, le sens étant inversé).
  const cap = typeof e.webkitCompassHeading === "number"
    ? e.webkitCompassHeading
    : (e.alpha === null ? null : (360 - e.alpha) % 360);

  remplir($("tableOrientation"), [
    ["alpha — rotation Z (boussole)", axe(e.alpha, "°", 1)],
    ["beta — bascule avant/arrière", axe(e.beta, "°", 1)],
    ["gamma — bascule gauche/droite", axe(e.gamma, "°", 1)],
    ["Cap déduit", cap === null ? null : cap.toFixed(0) + "° (" + pointCardinal(cap) + ")"],
    ["Référentiel", e.absolute ? "absolu (repère terrestre)" : "relatif à l'appareil"]
  ]);

  if (cap !== null) $("aiguille").style.transform = "rotate(" + (-cap) + "deg)";
  badge("badgeOrientation", "Capteur actif", "ok");
}

function surMouvement(e) {
  recuMouvement = true;
  if (tropTot()) return;

  const a = e.acceleration || {};
  const g = e.accelerationIncludingGravity || {};
  const r = e.rotationRate || {};

  remplir($("tableMouvement"), [
    ["Accélération X / Y / Z", [a.x, a.y, a.z].every(v => v === null || v === undefined)
      ? null
      : `${(a.x || 0).toFixed(2)} / ${(a.y || 0).toFixed(2)} / ${(a.z || 0).toFixed(2)} m/s²`],
    ["Avec gravité X / Y / Z", [g.x, g.y, g.z].every(v => v === null || v === undefined)
      ? null
      : `${(g.x || 0).toFixed(2)} / ${(g.y || 0).toFixed(2)} / ${(g.z || 0).toFixed(2)} m/s²`],
    ["Rotation α / β / γ", [r.alpha, r.beta, r.gamma].every(v => v === null || v === undefined)
      ? null
      : `${(r.alpha || 0).toFixed(1)} / ${(r.beta || 0).toFixed(1)} / ${(r.gamma || 0).toFixed(1)} °/s`],
    ["Intervalle entre mesures", axe(e.interval, "ms", 0)]
  ]);

  badge("badgeMouvement", "Capteur actif", "ok");
}

// iOS 13+ refuse ces événements tant que l'utilisateur n'a pas donné son accord,
// et l'accord ne peut être demandé que depuis un geste utilisateur (le clic).
function demanderAccord(Evenement) {
  if (typeof Evenement.requestPermission !== "function") return Promise.resolve("granted");
  return Evenement.requestPermission();
}

$("btnCapteurs").addEventListener("click", () => {
  if (capteursActifs) {
    window.removeEventListener("deviceorientation", surOrientation);
    window.removeEventListener("devicemotion", surMouvement);
    capteursActifs = false;
    $("btnCapteurs").textContent = "Activer les capteurs";
    $("btnCapteurs").classList.remove("primary");
    badge("badgeOrientation", "Arrêté", "idle");
    badge("badgeMouvement", "Arrêté", "idle");
    return;
  }

  Promise.all([
    demanderAccord(window.DeviceOrientationEvent || {}),
    demanderAccord(window.DeviceMotionEvent || {})
  ])
    .then(reponses => {
      if (reponses.includes("denied")) {
        message("msgCapteurs", "Accès aux capteurs refusé. Rechargez la page pour "
          + "que le navigateur repose la question.", "err");
        return;
      }

      window.addEventListener("deviceorientation", surOrientation);
      window.addEventListener("devicemotion", surMouvement);
      capteursActifs = true;
      recuOrientation = false;
      recuMouvement = false;

      $("btnCapteurs").textContent = "Arrêter les capteurs";
      $("btnCapteurs").classList.add("primary");
      badge("badgeOrientation", "En écoute…");
      badge("badgeMouvement", "En écoute…");
      message("msgCapteurs", "Bougez et inclinez l'appareil.", "info");

      // Les événements existent partout, mais restent muets sans capteurs :
      // on ne peut le savoir qu'en attendant un peu.
      setTimeout(() => {
        if (!capteursActifs) return;
        const absents = [];
        if (!recuOrientation) absents.push("orientation");
        if (!recuMouvement) absents.push("mouvement");
        if (!absents.length) return;

        message("msgCapteurs", "Aucune donnée de " + absents.join(" ni de ")
          + " reçue : cet appareil n'a probablement pas les capteurs. "
          + "À tester depuis un smartphone.", "warn");
        absents.forEach(nom => badge(
          nom === "orientation" ? "badgeOrientation" : "badgeMouvement",
          "Indisponible", "err"
        ));
      }, 2000);
    })
    .catch(e => message("msgCapteurs", "Activation impossible : " + e.message, "err"));
});

if (!window.DeviceOrientationEvent && !window.DeviceMotionEvent) {
  message("msgCapteurs", "Ce navigateur ne connaît ni DeviceOrientationEvent ni DeviceMotionEvent.", "err");
  $("btnCapteurs").disabled = true;
}
