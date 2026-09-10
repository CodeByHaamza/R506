// Exo 2 — Leaflet et géolocalisation
// R506 · Hamza Karrouchi
//
// Doc : https://developer.mozilla.org/fr/docs/Web/API/Geolocation_API
//       https://developer.mozilla.org/fr/docs/Web/API/Fetch_API/Using_Fetch
//       https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
//       https://leafletjs.com/reference.html
//
// Services : geo.api.gouv.fr (GeoJSON), project-osrm.org et Valhalla
//            (itinéraires), OpenStreetMap et Stadia Maps (tuiles)

"use strict";

const $ = id => document.getElementById(id);

const NICE      = { lat: 43.69755, lon: 7.27080, nom: "Nice — place Masséna" };
const MARSEILLE = { lat: 43.29650, lon: 5.36980, nom: "Marseille — Vieux-Port" };

const BERMUDES = [
  { lat: 25.7617, lon: -80.1918, nom: "Miami (Floride)" },
  { lat: 32.2949, lon: -64.7810, nom: "Bermudes (Hamilton)" },
  { lat: 18.4655, lon: -66.1057, nom: "San Juan (Porto Rico)" }
];

// Clé fournie dans le sujet du TD.
const CLE_STADIA = "eed6a6b4-d171-43e4-8215-e5f8490b4245";

let maPosition = null;
let watchId = null;
let geoJsonCharge = false;


// Carte et fonds

const map = L.map("map", { center: [NICE.lat, NICE.lon], zoom: 12 });

const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Les styles Stamen sont maintenant hébergés par Stadia Maps, d'où la clé.
function stadia(style, ext) {
  return L.tileLayer(
    `https://tiles.stadiamaps.com/tiles/${style}/{z}/{x}/{y}{r}.${ext}?api_key=${CLE_STADIA}`,
    {
      maxZoom: 20,
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, '
                 + '<a href="https://stamen.com/">Stamen Design</a>, '
                 + '&copy; OpenStreetMap'
    }
  );
}

const fonds = {
  "OpenStreetMap":      osm,
  "Stamen Toner":       stadia("stamen_toner", "png"),
  "Stamen Watercolor":  stadia("stamen_watercolor", "jpg"),
  "Stamen Terrain":     stadia("stamen_terrain", "png"),
  "Alidade sombre":     stadia("alidade_smooth_dark", "png")
};

const coucheMoi     = L.layerGroup().addTo(map);
const coucheVilles  = L.layerGroup().addTo(map);
const coucheBermude = L.layerGroup().addTo(map);
const coucheGeoJson = L.layerGroup().addTo(map);
const coucheRoute   = L.layerGroup().addTo(map);

L.control.layers(fonds, {
  "Ma position": coucheMoi,
  "Nice & Marseille": coucheVilles,
  "Triangle des Bermudes": coucheBermude,
  "Contour de commune": coucheGeoJson,
  "Itinéraires": coucheRoute
}).addTo(map);

L.control.scale({ imperial: false }).addTo(map);


// Outils

// Formule de haversine : distance orthodromique en mètres, sur une sphère de
// rayon R (même valeur que celle utilisée par Leaflet).
//   a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)
//   d = 2R · asin(√a)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const rad = deg => deg * Math.PI / 180;

  const phi1 = rad(lat1);
  const phi2 = rad(lat2);
  const dPhi = rad(lat2 - lat1);
  const dLambda = rad(lon2 - lon1);

  const a = Math.sin(dPhi / 2) ** 2
          + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

function km(m) {
  if (m < 1000) return m.toFixed(0) + " m";
  return (m / 1000).toFixed(m >= 10000 ? 1 : 2) + " km";
}

function duree(secondes) {
  const h = Math.floor(secondes / 3600);
  const m = Math.round((secondes % 3600) / 60);
  return h > 0 ? h + " h " + String(m).padStart(2, "0") : m + " min";
}

// Construit le contenu d'un popup sans concaténer de HTML : les noms de
// communes viennent d'une API, autant les insérer en texte.
function popup(titre, ...lignes) {
  const div = document.createElement("div");
  const b = document.createElement("b");
  b.textContent = titre;
  div.append(b);

  if (lignes.length) {
    const span = document.createElement("span");
    span.className = "small";
    lignes.filter(Boolean).forEach((ligne, i) => {
      if (i) span.append(document.createElement("br"));
      span.append(document.createTextNode(ligne));
    });
    div.append(span);
  }
  return div;
}

// Chaque ligne est un tableau : le premier élément devient l'intitulé.
function remplir(table, lignes) {
  table.innerHTML = "";
  for (const [label, ...valeurs] of lignes) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = label;
    tr.append(th);

    for (const v of valeurs) {
      const td = document.createElement("td");
      if (v === null || v === undefined) {
        td.textContent = "—";
        td.className = "na";
      } else {
        td.textContent = v;
      }
      tr.append(td);
    }
    table.append(tr);
  }
}

function badge(id, texte, genre) {
  $(id).textContent = texte;
  $(id).className = "badge " + (genre || "");
}

function message(id, texte, genre) {
  $(id).textContent = texte || "";
  $(id).className = "msg " + (genre || "");
}

function pastille(couleur) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${couleur};`
        + 'border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}


// Marqueurs fixes, segment et triangle

L.marker([NICE.lat, NICE.lon], { icon: pastille("#15803d") })
  .bindPopup(popup(NICE.nom, `${NICE.lat.toFixed(5)}, ${NICE.lon.toFixed(5)}`))
  .addTo(coucheVilles);

L.marker([MARSEILLE.lat, MARSEILLE.lon], { icon: pastille("#a855f7") })
  .bindPopup(popup(MARSEILLE.nom, `${MARSEILLE.lat.toFixed(5)}, ${MARSEILLE.lon.toFixed(5)}`))
  .addTo(coucheVilles);

const distNiceMarseille = haversine(NICE.lat, NICE.lon, MARSEILLE.lat, MARSEILLE.lon);

const segment = L.polyline(
  [[MARSEILLE.lat, MARSEILLE.lon], [NICE.lat, NICE.lon]],
  { color: "#a855f7", weight: 3, dashArray: "6 6" }
).bindPopup(popup("Marseille ↔ Nice", km(distNiceMarseille) + " à vol d'oiseau"))
 .addTo(coucheVilles);

const triangle = L.polygon(
  BERMUDES.map(p => [p.lat, p.lon]),
  { color: "#dc2626", weight: 2, fillColor: "#dc2626", fillOpacity: 0.15 }
).bindPopup(popup("Triangle des Bermudes", ...BERMUDES.map(p => p.nom)))
 .addTo(coucheBermude);

for (const p of BERMUDES) {
  L.circleMarker([p.lat, p.lon], {
    radius: 5, color: "#dc2626", fillColor: "#dc2626", fillOpacity: 1
  }).bindPopup(popup(p.nom)).addTo(coucheBermude);
}


// Ma position

let marqueurMoi = null;
let cercleMoi = null;

function afficherPosition(position, recentrer) {
  maPosition = position;
  const c = position.coords;
  const latlng = [c.latitude, c.longitude];

  const dMarseille = haversine(c.latitude, c.longitude, MARSEILLE.lat, MARSEILLE.lon);
  const dNice = haversine(c.latitude, c.longitude, NICE.lat, NICE.lon);

  if (marqueurMoi === null) {
    marqueurMoi = L.marker(latlng, { icon: pastille("#2563eb") }).addTo(coucheMoi);
    // Le rayon du cercle vaut la précision estimée renvoyée par l'API (exo 1).
    cercleMoi = L.circle(latlng, {
      radius: c.accuracy,
      color: "#2563eb", weight: 1,
      fillColor: "#2563eb", fillOpacity: 0.12
    }).addTo(coucheMoi);
  } else {
    marqueurMoi.setLatLng(latlng);
    cercleMoi.setLatLng(latlng).setRadius(c.accuracy);
  }

  marqueurMoi.bindPopup(popup("Ma position",
    `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`,
    `précision ± ${c.accuracy.toFixed(0)} m`,
    `Marseille : ${km(dMarseille)}`,
    `Nice : ${km(dNice)}`
  ));
  cercleMoi.bindPopup(popup("Précision estimée", `rayon de ${c.accuracy.toFixed(0)} m`));

  if (recentrer) map.setView(latlng, Math.max(map.getZoom(), 14));

  remplir($("tablePos"), [
    ["Latitude",   c.latitude.toFixed(6) + " °"],
    ["Longitude",  c.longitude.toFixed(6) + " °"],
    ["Altitude",   c.altitude === null ? null : c.altitude.toFixed(1) + " m"],
    ["Précision",  "± " + c.accuracy.toFixed(1) + " m"],
    ["Vitesse",    c.speed === null ? null
                    : `${c.speed.toFixed(2)} m/s (${(c.speed * 3.6).toFixed(1)} km/h)`],
    ["Horodatage", new Date(position.timestamp).toLocaleString("fr-FR")]
  ]);
  badge("badgePos", "Position obtenue", "ok");

  // Contrôle : Leaflet calcule la même distance de son côté.
  const controle = L.latLng(latlng).distanceTo(L.latLng(MARSEILLE.lat, MARSEILLE.lon));

  remplir($("tableDist"), [
    ["Ma position → Marseille", km(dMarseille)],
    ["Ma position → Nice", km(dNice)],
    ["Nice ↔ Marseille", km(distNiceMarseille)],
    ["Contrôle Leaflet (Marseille)", km(controle)],
    ["Écart entre les deux calculs", Math.abs(controle - dMarseille).toFixed(2) + " m"]
  ]);
  badge("badgeDist", "Calculé", "ok");

  if (!geoJsonCharge) chargerGeoJson(c.latitude, c.longitude);
}

function erreurPosition(err) {
  const textes = {
    1: "Accès refusé. Autorisez la localisation pour ce site, puis réessayez.",
    2: "Position indisponible : le GPS ne capte pas, ou le réseau ne permet pas de vous localiser.",
    3: "Délai dépassé. Le GPS met parfois du temps à s'accrocher, relancez."
  };
  badge("badgePos", "Erreur", "err");
  message("msgPos", textes[err.code] || err.message, "err");
  message("globalMsg", "Sans position, la carte reste centrée sur Nice et les distances "
    + "depuis ma position ne peuvent pas être calculées.", "warn");

  if (!geoJsonCharge) chargerGeoJson(NICE.lat, NICE.lon);
}

const optionsGeo = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

function localiser(recentrer) {
  if (!("geolocation" in navigator)) {
    message("globalMsg", "Ce navigateur ne supporte pas l'API Geolocation.", "err");
    return;
  }
  badge("badgePos", "Mesure…");
  message("msgPos", "");
  navigator.geolocation.getCurrentPosition(
    p => { message("globalMsg", ""); afficherPosition(p, recentrer); },
    erreurPosition,
    optionsGeo
  );
}


// GeoJSON : contour de la commune où l'on se trouve

function chargerGeoJson(lat, lon) {
  geoJsonCharge = true;
  badge("badgeGeo", "Chargement…");

  const url = "https://geo.api.gouv.fr/communes"
            + `?lat=${lat}&lon=${lon}`
            + "&fields=nom,code,codesPostaux,population,surface"
            + "&format=geojson&geometry=contour";

  fetch(url)
    .then(r => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)))
    .then(data => {
      if (!data.features || !data.features.length) {
        throw new Error("aucune commune à ces coordonnées");
      }

      L.geoJSON(data, {
        style: { color: "#f59e0b", weight: 2, fillColor: "#f59e0b", fillOpacity: 0.08 },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          layer.bindPopup(popup(p.nom,
            "code INSEE " + p.code,
            p.codesPostaux && p.codesPostaux.join(", "),
            p.population && p.population.toLocaleString("fr-FR") + " habitants"
          ));
        }
      }).addTo(coucheGeoJson).bringToBack();

      const p = data.features[0].properties;
      remplir($("tableGeo"), [
        ["Commune", p.nom],
        ["Code INSEE", p.code],
        ["Codes postaux", p.codesPostaux ? p.codesPostaux.join(", ") : null],
        ["Population", p.population ? p.population.toLocaleString("fr-FR") + " hab." : null],
        // l'API donne la surface en hectares
        ["Surface", p.surface ? (p.surface / 100).toFixed(1) + " km²" : null],
        ["Source", "geo.api.gouv.fr"]
      ]);
      badge("badgeGeo", "Chargé", "ok");
      message("msgGeo", "");
    })
    .catch(e => {
      badge("badgeGeo", "Erreur", "err");
      message("msgGeo", "GeoJSON indisponible : " + e.message, "err");
      geoJsonCharge = false;
    });
}


// Itinéraires : deux calculateurs interrogés puis comparés
//
// Doc : https://project-osrm.org/docs/v5.24.0/api/
//       https://valhalla.github.io/valhalla/api/turn-by-turn/api-reference/
//
// Le sujet proposait Mapbox comme second fournisseur, mais son jeton est
// détecté par la protection anti-secrets de GitHub et bloque le push.
// Valhalla rend le même service sans aucune clé (voir le README).

// Valhalla renvoie sa trace en polyligne encodée, précision 1e6.
// Doc : https://valhalla.github.io/valhalla/decoding/
function decoderPolyligne(encode, precision = 6) {
  const facteur = Math.pow(10, precision);
  const points = [];
  let index = 0, lat = 0, lon = 0;

  while (index < encode.length) {
    let resultat = 0, decalage = 0, octet;

    do {
      octet = encode.charCodeAt(index++) - 63;
      resultat |= (octet & 0x1f) << decalage;
      decalage += 5;
    } while (octet >= 0x20);
    lat += (resultat & 1) ? ~(resultat >> 1) : (resultat >> 1);

    resultat = 0; decalage = 0;
    do {
      octet = encode.charCodeAt(index++) - 63;
      resultat |= (octet & 0x1f) << decalage;
      decalage += 5;
    } while (octet >= 0x20);
    lon += (resultat & 1) ? ~(resultat >> 1) : (resultat >> 1);

    points.push([lat / facteur, lon / facteur]);
  }
  return points;
}

// Chaque fournisseur ramène sa réponse au même format : distance en mètres,
// durée en secondes, et une liste de points [lat, lon] prête pour Leaflet.
const FOURNISSEURS = [
  {
    nom: "OSRM",
    couleur: "#0891b2",
    style: null,
    url: (a, b) => "https://router.project-osrm.org/route/v1/driving/"
                 + `${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`,
    lire: d => {
      if (d.code !== "Ok" || !d.routes || !d.routes.length) {
        throw new Error(d.message || d.code || "réponse vide");
      }
      const route = d.routes[0];
      return {
        distance: route.distance,
        duree: route.duration,
        // le GeoJSON donne lon,lat ; Leaflet attend lat,lon
        points: route.geometry.coordinates.map(([lon, lat]) => [lat, lon])
      };
    }
  },
  {
    nom: "Valhalla",
    couleur: "#db2777",
    style: "5 7",
    url: (a, b) => "https://valhalla1.openstreetmap.de/route?json="
                 + encodeURIComponent(JSON.stringify({
                     locations: [{ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon }],
                     costing: "auto",
                     directions_options: { units: "kilometers" }
                   })),
    lire: d => {
      if (!d.trip) throw new Error(d.error || "réponse inattendue");
      return {
        distance: d.trip.summary.length * 1000,   // Valhalla répond en kilomètres
        duree: d.trip.summary.time,
        points: decoderPolyligne(d.trip.legs[0].shape)
      };
    }
  }
];

function interroger(fournisseur, depart, arrivee) {
  return fetch(fournisseur.url(depart, arrivee))
    .then(r => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)))
    .then(fournisseur.lire);
}

function calculerItineraires() {
  if (maPosition === null) {
    message("msgRoute", "Obtenez d'abord votre position.", "warn");
    return;
  }

  badge("badgeRoute", "Calcul…");
  message("msgRoute", "");
  coucheRoute.clearLayers();

  const c = maPosition.coords;
  const depart = { lat: c.latitude, lon: c.longitude };

  // allSettled plutôt que all : si un service est en panne, on affiche
  // quand même le résultat de l'autre.
  Promise.allSettled(FOURNISSEURS.map(f => interroger(f, depart, NICE)))
    .then(resultats => {
      const volOiseau = haversine(c.latitude, c.longitude, NICE.lat, NICE.lon);
      const echecs = [];

      resultats.forEach((res, i) => {
        const f = FOURNISSEURS[i];
        if (res.status !== "fulfilled") {
          echecs.push(f.nom + " (" + res.reason.message + ")");
          return;
        }
        L.polyline(res.value.points, {
          color: f.couleur, weight: 5, opacity: 0.75, dashArray: f.style
        }).bindPopup(popup("Itinéraire " + f.nom,
            km(res.value.distance) + " · " + duree(res.value.duree)))
          .addTo(coucheRoute);
      });

      const valeur = (i, lire) =>
        resultats[i].status === "fulfilled" ? lire(resultats[i].value) : null;
      const detour = r => "+" + (((r.distance / volOiseau) - 1) * 100).toFixed(0) + " %";

      remplir($("tableRoute"), [
        ["", FOURNISSEURS[0].nom, FOURNISSEURS[1].nom],
        ["Distance", valeur(0, r => km(r.distance)), valeur(1, r => km(r.distance))],
        ["Durée", valeur(0, r => duree(r.duree)), valeur(1, r => duree(r.duree))],
        ["Points du tracé",
          valeur(0, r => r.points.length.toLocaleString("fr-FR")),
          valeur(1, r => r.points.length.toLocaleString("fr-FR"))],
        ["Détour vs vol d'oiseau", valeur(0, detour), valeur(1, detour)],
        ["Vol d'oiseau", km(volOiseau), ""],
        ["Destination", NICE.nom, ""]
      ]);

      if (echecs.length === FOURNISSEURS.length) {
        badge("badgeRoute", "Erreur", "err");
        message("msgRoute", "Aucun itinéraire : " + echecs.join(", ") + ".", "err");
        return;
      }

      badge("badgeRoute", "Calculé", "ok");
      message("msgRoute", echecs.length ? "Échec de " + echecs.join(", ") + "." : "",
              echecs.length ? "warn" : "");

      const cadre = coucheRoute.getBounds();
      if (cadre.isValid()) map.fitBounds(cadre, { padding: [30, 30] });
    });
}


// Interactions

$("btnMe").addEventListener("click", () => localiser(true));

$("btnFollow").addEventListener("click", () => {
  const bouton = $("btnFollow");

  if (watchId === null) {
    watchId = navigator.geolocation.watchPosition(
      p => afficherPosition(p, false), erreurPosition, optionsGeo
    );
    bouton.textContent = "Arrêter le suivi";
    bouton.classList.add("primary");
    badge("badgePos", "Suivi actif", "ok");
  } else {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    bouton.textContent = "Suivre mes déplacements";
    bouton.classList.remove("primary");
    badge("badgePos", "Suivi arrêté", "idle");
  }
});

$("btnNiceMarseille").addEventListener("click", () => {
  map.fitBounds(segment.getBounds(), { padding: [40, 40] });
  segment.openPopup();
});

$("btnBermudes").addEventListener("click", () => {
  map.fitBounds(triangle.getBounds(), { padding: [40, 40] });
  triangle.openPopup();
});

$("btnRoute").addEventListener("click", calculerItineraires);

remplir($("tableDist"), [
  ["Ma position → Marseille", null],
  ["Ma position → Nice", null],
  ["Nice ↔ Marseille", km(distNiceMarseille)]
]);

if (!window.isSecureContext) {
  message("globalMsg", "Page hors contexte sécurisé : la géolocalisation sera refusée. "
    + "Ouvrez la page en HTTPS ou via http://localhost.", "warn");
}

localiser(true);
