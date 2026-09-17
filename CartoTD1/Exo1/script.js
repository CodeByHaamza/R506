// TD1 Exo 1 - Géolocalisation
// Hamza Karrouchi - BUT INFO 3
// doc : https://developer.mozilla.org/fr/docs/Web/API/Geolocation_API/Using_the_Geolocation_API

const el = id => document.getElementById(id);

let watchId = null;
let nbMesures = 0;

function options() {
  return {
    enableHighAccuracy: el("highAccuracy").checked, // GPS ou réseau (wifi / 4G)
    timeout: 15000,
    maximumAge: 0
  };
}

function ligne(label, valeur) {
  if (valeur === null || valeur === undefined) valeur = "<i>non disponible</i>";
  return "<tr><th>" + label + "</th><td>" + valeur + "</td></tr>";
}

function afficher(table, pos) {
  const c = pos.coords;
  const date = new Date(pos.timestamp); // timestamp = ms depuis le 1/1/1970

  el(table).innerHTML =
    ligne("Latitude", c.latitude.toFixed(6) + " °") +
    ligne("Longitude", c.longitude.toFixed(6) + " °") +
    ligne("Altitude", c.altitude === null ? null : c.altitude.toFixed(1) + " m") +
    ligne("Précision", c.accuracy.toFixed(1) + " m") +
    ligne("Précision altitude", c.altitudeAccuracy === null ? null : c.altitudeAccuracy.toFixed(1) + " m") +
    ligne("Vitesse", c.speed === null ? null : c.speed.toFixed(2) + " m/s (" + (c.speed * 3.6).toFixed(1) + " km/h)") +
    ligne("Cap", c.heading === null ? null : c.heading.toFixed(0) + " °") +
    ligne("Date", date.toLocaleDateString("fr-FR") + " " + date.toLocaleTimeString("fr-FR")) +
    ligne("Timestamp", pos.timestamp) +
    ligne("Mode", el("highAccuracy").checked ? "GPS" : "réseau");

  // sans GPS l'altitude est null : on demande celle du terrain à Open-Meteo
  if (c.altitude === null) {
    fetch("https://api.open-meteo.com/v1/elevation?latitude=" + c.latitude + "&longitude=" + c.longitude)
      .then(r => r.json())
      .then(d => el(table).innerHTML += ligne("Altitude du terrain (Open-Meteo)", d.elevation[0] + " m"))
      .catch(() => {});
  }
}

function erreur(msgId, err) {
  const textes = {
    1: "accès refusé, il faut autoriser la localisation",
    2: "position indisponible",
    3: "délai dépassé"
  };
  el(msgId).textContent = "Erreur : " + (textes[err.code] || err.message);
}

// getCurrentPosition : une seule mesure
el("btnCurrent").onclick = () => {
  el("msgCurrent").textContent = "Recherche...";
  navigator.geolocation.getCurrentPosition(
    pos => {
      afficher("tableCurrent", pos);
      el("msgCurrent").textContent = "";
    },
    err => erreur("msgCurrent", err),
    options()
  );
};

// watchPosition : rappelé à chaque changement de position
el("btnWatch").onclick = () => {
  nbMesures = 0;
  el("msgWatch").textContent = "En attente de la première mesure...";
  el("btnWatch").disabled = true;
  el("btnStop").disabled = false;

  watchId = navigator.geolocation.watchPosition(
    pos => {
      nbMesures++;
      afficher("tableWatch", pos);
      el("msgWatch").textContent = nbMesures + " mesure(s) reçue(s)";
    },
    err => erreur("msgWatch", err),
    options()
  );
};

el("btnStop").onclick = () => {
  navigator.geolocation.clearWatch(watchId);
  watchId = null;
  el("msgWatch").textContent = "Suivi arrêté après " + nbMesures + " mesure(s)";
  el("btnWatch").disabled = false;
  el("btnStop").disabled = true;
};

// si on change de mode pendant un suivi, on le relance
el("highAccuracy").onchange = () => {
  if (watchId !== null) {
    el("btnStop").click();
    el("btnWatch").click();
  }
};

if (!navigator.geolocation) {
  el("globalMsg").textContent = "Ce navigateur ne supporte pas la géolocalisation.";
  el("btnCurrent").disabled = true;
  el("btnWatch").disabled = true;
}


// ---- capteurs du smartphone : orientation et mouvement ----
// https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Detecting_device_orientation

let capteursActifs = false;
let dernierAffichage = 0;

// les événements arrivent ~60 fois par seconde, on n'affiche que 10 fois par seconde
function tropRapide() {
  if (performance.now() - dernierAffichage < 100) return true;
  dernierAffichage = performance.now();
  return false;
}

function fmt(v, unite) {
  return (v === null || v === undefined) ? null : v.toFixed(1) + " " + unite;
}

function surOrientation(e) {
  if (tropRapide()) return;

  // alpha tourne dans le sens inverse du cap ; iOS donne directement webkitCompassHeading
  let cap = null;
  if (e.webkitCompassHeading !== undefined) cap = e.webkitCompassHeading;
  else if (e.alpha !== null) cap = (360 - e.alpha) % 360;

  el("tableOrientation").innerHTML =
    ligne("alpha (rotation autour de Z)", fmt(e.alpha, "°")) +
    ligne("beta (avant / arrière)", fmt(e.beta, "°")) +
    ligne("gamma (gauche / droite)", fmt(e.gamma, "°")) +
    ligne("Cap", cap === null ? null : cap.toFixed(0) + " °") +
    ligne("Absolu", e.absolute ? "oui" : "non");

  if (cap !== null) el("aiguille").style.transform = "rotate(" + (-cap) + "deg)";
}

function surMouvement(e) {
  if (tropRapide()) return;
  const a = e.acceleration;
  const g = e.accelerationIncludingGravity;
  const r = e.rotationRate;

  el("tableMouvement").innerHTML =
    ligne("Accélération x / y / z", a && a.x !== null ? a.x.toFixed(2) + " / " + a.y.toFixed(2) + " / " + a.z.toFixed(2) + " m/s²" : null) +
    ligne("Avec gravité x / y / z", g && g.x !== null ? g.x.toFixed(2) + " / " + g.y.toFixed(2) + " / " + g.z.toFixed(2) + " m/s²" : null) +
    ligne("Rotation alpha / beta / gamma", r && r.alpha !== null ? r.alpha.toFixed(1) + " / " + r.beta.toFixed(1) + " / " + r.gamma.toFixed(1) + " °/s" : null) +
    ligne("Intervalle", fmt(e.interval, "ms"));
}

// sur iOS il faut demander la permission, et seulement depuis un clic
function demanderPermission() {
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
    return DeviceOrientationEvent.requestPermission();
  }
  return Promise.resolve("granted");
}

el("btnCapteurs").onclick = () => {
  if (capteursActifs) {
    window.removeEventListener("deviceorientation", surOrientation);
    window.removeEventListener("devicemotion", surMouvement);
    capteursActifs = false;
    el("btnCapteurs").textContent = "Activer les capteurs";
    el("btnCapteurs").classList.remove("primary");
    return;
  }

  demanderPermission().then(reponse => {
    if (reponse !== "granted") {
      el("msgCapteurs").textContent = "Accès aux capteurs refusé.";
      return;
    }
    window.addEventListener("deviceorientation", surOrientation);
    window.addEventListener("devicemotion", surMouvement);
    capteursActifs = true;
    el("btnCapteurs").textContent = "Arrêter les capteurs";
    el("btnCapteurs").classList.add("primary");
    el("msgCapteurs").textContent = "Bougez le téléphone (sur un PC il ne se passera rien).";
  });
};
