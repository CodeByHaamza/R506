// Exo 1 — Géolocalisation
// R506 · Hamza Karrouchi
//
// Affiche les données de position avec les deux méthodes de l'API Geolocation :
// getCurrentPosition() pour une mesure ponctuelle, watchPosition() pour un suivi.

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
