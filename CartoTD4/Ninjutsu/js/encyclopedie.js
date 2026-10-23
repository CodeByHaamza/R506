// L'encyclopédie : les signes (avec ta photo dès que tu en réussis un) et les jutsus
// Hamza Karrouchi - BUT INFO 3

import { SIGNES, JUTSUS, FAMILLES } from "./donnees.js";

// un signe en petit : le kanji et le nom
export function pastille(id, classe = "") {
  const s = SIGNES[id];
  return '<span class="pastille ' + classe + '"><b>' + s.kanji + "</b>" + s.nom + "</span>";
}

// photos : { signe: { image, score } } ; compteurs : { signe: nombre de réussites }
export function afficherSignes(conteneur, photos, compteurs) {
  conteneur.innerHTML = Object.entries(SIGNES).map(([id, s]) => {
    const photo = photos[id];
    const n = compteurs[id] || 0;
    const bilan = n === 0
      ? "Pas encore réussi : ta photo apparaîtra ici."
      : "Réussi " + n + " fois" + (photo ? ", photo prise à " + Math.round(photo.score * 100) + " %" : "") + ".";
    return '<article class="fiche-signe">'
      + '<div class="vignette">' + (photo ? '<img src="' + photo.image + '" alt="Ta photo du signe ' + s.nom + '">' : "<span>" + s.kanji + "</span>") + "</div>"
      + '<div><h3><span class="kanji">' + s.kanji + "</span> " + s.nom + " <small>" + s.romaji + "</small></h3>"
      + "<p>" + s.position + "</p>"
      + '<p class="discret">' + bilan + "</p></div>"
      + "</article>";
  }).join("");
}

// les familles, dans l'ordre des boutons de filtre
export const LISTE_FAMILLES = ["Tous", ...new Set(Object.values(FAMILLES))];

// decouverts : les jutsus déjà réussis ; famille : le filtre ; surEntrainer(jutsu) : bouton "S'entraîner"
export function afficherJutsus(conteneur, decouverts, famille, surEntrainer) {
  const liste = JUTSUS.filter(j => famille === "Tous" || FAMILLES[j.type] === famille);
  conteneur.innerHTML = liste.map(j => {
    const decouvert = decouverts.includes(j.id);
    const signes = j.tenir
      ? '<p class="discret">Un seul signe, à tenir 2,5 secondes :</p><div class="suite">' + pastille(j.signes[0]) + "</div>"
      : '<div class="suite">' + j.signes.map(s => pastille(s)).join("") + "</div>";
    return '<article class="fiche-jutsu' + (decouvert ? " decouvert" : "") + '">'
      + '<p class="type">' + j.type + (decouvert ? " · <b>découvert</b>" : "") + "</p>"
      + '<h3 class="kanji">' + j.kanji + "</h3>"
      + '<p class="nom">' + j.romaji + " · " + j.nom + "</p>"
      + "<p>" + j.texte + "</p>"
      + signes
      + (j.variante ? '<p class="discret">Variante : ' + j.variante.map(s => SIGNES[s].kanji).join(" ") + "</p>" : "")
      + (j.source === "appli" ? '<p class="discret">Pas de signes dans l\'anime : enchaînement inventé pour l\'appli.</p>' : "")
      + '<button type="button" data-jutsu="' + j.id + '">S\'entraîner' + (j.tenir ? "" : " (" + j.signes.length + " signes)") + "</button>"
      + "</article>";
  }).join("");

  for (const bouton of conteneur.querySelectorAll("button[data-jutsu]")) {
    bouton.addEventListener("click", () => surEntrainer(JUTSUS.find(j => j.id === bouton.dataset.jutsu)));
  }
}
