// TD1 Exo 2 - Leaflet
// Hamza Karrouchi - BUT INFO 3
// tuto de départ : https://leafletjs.com/examples/quick-start/

const NICE = [43.6975, 7.2708];       // place Masséna
const MARSEILLE = [43.2965, 5.3698];  // Vieux-Port
const STADIA_KEY = "eed6a6b4-d171-43e4-8215-e5f8490b4245"; // clé donnée dans le sujet

const el = id => document.getElementById(id);

const map = L.map("map").setView(NICE, 12);

const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// les cartes Stamen sont maintenant hébergées par Stadia Maps
function stamen(style, ext) {
  return L.tileLayer("https://tiles.stadiamaps.com/tiles/" + style + "/{z}/{x}/{y}{r}." + ext + "?api_key=" + STADIA_KEY, {
    maxZoom: 20,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; OpenStreetMap'
  });
}

// featureGroup et pas layerGroup : il faut getBounds() pour zoomer sur les itinéraires
const itineraires = L.featureGroup().addTo(map);

L.control.layers({
  "OpenStreetMap": osm,
  "Stamen Toner": stamen("stamen_toner", "png"),
  "Stamen Terrain": stamen("stamen_terrain", "png"),
  "Stamen Watercolor": stamen("stamen_watercolor", "jpg")
}, {
  "Itinéraires": itineraires
}).addTo(map);

L.control.scale({ imperial: false }).addTo(map);


// ---- distances ----

// distance du grand cercle, formule de haversine
// https://fr.wikipedia.org/wiki/Distance_du_grand_cercle
function distance(a, b) {
  const R = 6371000; // rayon de la Terre en m
  const rad = deg => deg * Math.PI / 180;
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2
          + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function enKm(m) {
  return (m / 1000).toFixed(1) + " km";
}

function enMin(s) {
  const h = Math.floor(s / 3600);
  const min = Math.round((s % 3600) / 60);
  return h > 0 ? h + " h " + min + " min" : min + " min";
}

function tableau(id, lignes) {
  el(id).innerHTML = lignes.map(l => "<tr><th>" + l[0] + "</th><td>" + l[1] + "</td></tr>").join("");
}


// ---- marqueurs fixes, segment, triangle ----

L.marker(NICE).addTo(map).bindPopup("<b>Nice</b><br>place Masséna");
L.marker(MARSEILLE).addTo(map).bindPopup("<b>Marseille</b><br>Vieux-Port");

const distNiceMarseille = distance(NICE, MARSEILLE);

const segment = L.polyline([MARSEILLE, NICE], { color: "purple", weight: 3, dashArray: "6 6" })
  .addTo(map)
  .bindPopup("Marseille - Nice : " + enKm(distNiceMarseille) + " à vol d'oiseau");

// Miami, Bermudes, Porto Rico
const bermudes = L.polygon([[25.7617, -80.1918], [32.2949, -64.7810], [18.4655, -66.1057]], { color: "red" })
  .addTo(map)
  .bindPopup("Triangle des Bermudes");

tableau("tableDist", [["Nice - Marseille", enKm(distNiceMarseille)]]);


// ---- ma position (voir exo 1) ----

let maPos = null;
let marqueurMoi = null;
let cercleMoi = null;
let watchId = null;

function afficherPosition(pos) {
  const c = pos.coords;
  maPos = [c.latitude, c.longitude];

  const dMarseille = distance(maPos, MARSEILLE);
  const dNice = distance(maPos, NICE);
  // pour comparer ma formule avec celle de Leaflet (loi des cosinus)
  const dLeaflet = L.latLng(maPos).distanceTo(MARSEILLE);

  if (marqueurMoi === null) {
    marqueurMoi = L.marker(maPos).addTo(map);
    // le rayon du cercle = précision renvoyée par le GPS (en mètres)
    cercleMoi = L.circle(maPos, { radius: c.accuracy, color: "#2563eb", fillOpacity: 0.15 }).addTo(map);
  } else {
    marqueurMoi.setLatLng(maPos);
    cercleMoi.setLatLng(maPos).setRadius(c.accuracy);
  }

  marqueurMoi.bindPopup(
    "<b>Ma position</b><br>" + c.latitude.toFixed(5) + ", " + c.longitude.toFixed(5)
    + "<br>précision ± " + Math.round(c.accuracy) + " m"
    + "<br>Marseille : " + enKm(dMarseille)
  ).openPopup();

  if (watchId === null) map.setView(maPos, 14);

  tableau("tablePos", [
    ["Latitude", c.latitude.toFixed(6)],
    ["Longitude", c.longitude.toFixed(6)],
    ["Altitude", c.altitude === null ? "-" : c.altitude.toFixed(1) + " m"],
    ["Précision", "± " + c.accuracy.toFixed(0) + " m"],
    ["Date", new Date(pos.timestamp).toLocaleString("fr-FR")]
  ]);

  tableau("tableDist", [
    ["Ma position - Marseille", enKm(dMarseille)],
    ["Ma position - Nice", enKm(dNice)],
    ["Nice - Marseille", enKm(distNiceMarseille)],
    ["Marseille avec distanceTo() de Leaflet", enKm(dLeaflet) + " (écart " + Math.abs(dLeaflet - dMarseille).toFixed(1) + " m)"]
  ]);

  el("msgPos").textContent = "";
  if (!communeChargee) chargerCommune(c.latitude, c.longitude);
}

function erreurPosition(err) {
  el("msgPos").textContent = "Géolocalisation impossible : " + err.message;
  // sans position on affiche quand même la commune de Nice
  if (!communeChargee) chargerCommune(NICE[0], NICE[1]);
}

const optionsGeo = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

el("btnMe").onclick = () => {
  el("msgPos").textContent = "Recherche de la position...";
  navigator.geolocation.getCurrentPosition(afficherPosition, erreurPosition, optionsGeo);
};

el("btnFollow").onclick = () => {
  if (watchId === null) {
    watchId = navigator.geolocation.watchPosition(afficherPosition, erreurPosition, optionsGeo);
    el("btnFollow").textContent = "Arrêter le suivi";
  } else {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    el("btnFollow").textContent = "Suivre mes déplacements";
  }
};

el("btnNiceMarseille").onclick = () => {
  map.fitBounds(segment.getBounds(), { padding: [40, 40] });
  segment.openPopup();
};

el("btnBermudes").onclick = () => {
  map.fitBounds(bermudes.getBounds(), { padding: [40, 40] });
  bermudes.openPopup();
};


// ---- GeoJSON ----
// https://leafletjs.com/examples/geojson/

// 1) fichier local : quelques lieux autour de Nice
fetch("lieux.geojson")
  .then(r => r.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
        radius: 7, color: "#ea580c", fillColor: "#fb923c", fillOpacity: 0.9
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup("<b>" + feature.properties.nom + "</b><br>" + feature.properties.type);
      }
    }).addTo(map);
  })
  .catch(e => el("msgGeo").textContent = "lieux.geojson non chargé : " + e.message);

// 2) API geo.api.gouv.fr : contour de la commune où je suis
// https://geo.api.gouv.fr/decoupage-administratif/communes
let communeChargee = false;

function chargerCommune(lat, lon) {
  communeChargee = true;
  const url = "https://geo.api.gouv.fr/communes?lat=" + lat + "&lon=" + lon
            + "&fields=nom,code,codesPostaux,population&format=geojson&geometry=contour";

  fetch(url)
    .then(r => r.json())
    .then(data => {
      const p = data.features[0].properties;

      L.geoJSON(data, {
        style: { color: "orange", weight: 2, fillOpacity: 0.05 },
        onEachFeature: (feature, layer) => layer.bindPopup("<b>" + p.nom + "</b><br>" + p.population + " habitants")
      }).addTo(map);

      tableau("tableGeo", [
        ["Commune", p.nom],
        ["Code INSEE", p.code],
        ["Codes postaux", p.codesPostaux.join(", ")],
        ["Population", p.population.toLocaleString("fr-FR") + " hab."]
      ]);
    })
    .catch(e => {
      el("msgGeo").textContent = "Commune non chargée : " + e.message;
      communeChargee = false;
    });
}


// ---- itinéraires : OSRM et Valhalla ----
// (Mapbox est proposé dans le sujet mais GitHub refuse le push avec son token, voir README)

// https://project-osrm.org/docs/v5.24.0/api/#route-service
function routeOSRM(dep, arr) {
  const url = "https://router.project-osrm.org/route/v1/driving/"
            + dep[1] + "," + dep[0] + ";" + arr[1] + "," + arr[0]
            + "?overview=full&geometries=geojson";
  return fetch(url).then(r => r.json()).then(d => {
    const route = d.routes[0];
    return {
      distance: route.distance,
      duree: route.duration,
      // GeoJSON = [lon, lat], Leaflet veut [lat, lon]
      points: route.geometry.coordinates.map(c => [c[1], c[0]])
    };
  });
}

// https://valhalla.github.io/valhalla/api/turn-by-turn/api-reference/
function routeValhalla(dep, arr) {
  const req = {
    locations: [{ lat: dep[0], lon: dep[1] }, { lat: arr[0], lon: arr[1] }],
    costing: "auto"
  };
  return fetch("https://valhalla1.openstreetmap.de/route?json=" + JSON.stringify(req))
    .then(r => r.json())
    .then(d => ({
      distance: d.trip.summary.length * 1000, // en km par défaut
      duree: d.trip.summary.time,
      points: decodePolyline(d.trip.legs[0].shape)
    }));
}

// Valhalla renvoie le tracé en polyline encodée (précision 1e6)
// fonction reprise de https://valhalla.github.io/valhalla/decoding/
function decodePolyline(str) {
  let index = 0, lat = 0, lng = 0;
  const coordinates = [];
  const factor = 1e6;

  while (index < str.length) {
    let byte, shift = 0, result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    shift = 0; result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);

    coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
}

function tracer(nom, couleur, promesse) {
  el("route" + nom).textContent = "calcul...";
  promesse
    .then(r => {
      L.polyline(r.points, { color: couleur, weight: 5, opacity: 0.7 })
        .addTo(itineraires)
        .bindPopup("<b>" + nom + "</b><br>" + enKm(r.distance) + " - " + enMin(r.duree));
      el("route" + nom).textContent = enKm(r.distance) + " - " + enMin(r.duree);
      map.fitBounds(itineraires.getBounds(), { padding: [30, 30] });
    })
    .catch(e => el("route" + nom).textContent = "erreur (" + e.message + ")");
}

el("btnRoute").onclick = () => {
  if (maPos === null) {
    el("msgRoute").textContent = "Il faut d'abord récupérer ma position.";
    return;
  }
  el("msgRoute").textContent = "";
  itineraires.clearLayers();
  tracer("OSRM", "#0891b2", routeOSRM(maPos, NICE));
  tracer("Valhalla", "#db2777", routeValhalla(maPos, NICE));
};


// au chargement
if (!navigator.geolocation) {
  el("msgPos").textContent = "Pas de géolocalisation dans ce navigateur.";
} else {
  el("btnMe").click();
}
