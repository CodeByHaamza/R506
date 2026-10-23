// La détection des signes : le modèle YOLOX-Nano du projet NARUTO-HandSignDetection
// (Kazuhito Takahashi, licence MIT), exécuté dans le navigateur avec onnxruntime-web.
// Hamza Karrouchi - BUT INFO 3
// doc : https://onnxruntime.ai/docs/tutorials/web/
//       https://github.com/Kazuhito00/NARUTO-HandSignDetection
//
// "ort" est une variable globale, chargée dans index.html.

import { CLASSES } from "./donnees.js";

const TAILLE = 416; // le modèle attend une image carrée de 416 x 416 pixels

export class DetecteurDeSignes {
  async charger(url) {
    this.session = await ort.InferenceSession.create(url, { executionProviders: ["wasm"] });
    this.entree = this.session.inputNames[0];   // "images"
    this.sortie = this.session.outputNames[0];  // "batchno_classid_score_x1y1x2y2"

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvas.height = TAILLE;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.donnees = new Float32Array(3 * TAILLE * TAILLE);
  }

  // image : la vidéo ; renvoie la meilleure détection { signe, score, boite } ou null
  // la boîte est en pixels de la vidéo
  async detecter(image, largeur, hauteur) {
    // Préparation comme dans le projet d'origine : l'image réduite en haut à gauche
    // d'un carré gris (114), sans la déformer.
    const ratio = Math.min(TAILLE / largeur, TAILLE / hauteur);
    this.ctx.fillStyle = "rgb(114, 114, 114)";
    this.ctx.fillRect(0, 0, TAILLE, TAILLE);
    this.ctx.drawImage(image, 0, 0, largeur * ratio, hauteur * ratio);
    const pixels = this.ctx.getImageData(0, 0, TAILLE, TAILLE).data;

    // Les pixels arrivent en RVBA mélangés ; le modèle veut trois plans séparés, dans
    // l'ordre bleu, vert, rouge (il a été entraîné avec des images OpenCV), de 0 à 255.
    const n = TAILLE * TAILLE;
    for (let i = 0; i < n; i++) {
      this.donnees[i] = pixels[i * 4 + 2];
      this.donnees[n + i] = pixels[i * 4 + 1];
      this.donnees[2 * n + i] = pixels[i * 4];
    }

    const tenseur = new ort.Tensor("float32", this.donnees, [1, 3, TAILLE, TAILLE]);
    const resultat = (await this.session.run({ [this.entree]: tenseur }))[this.sortie];

    // une ligne par détection : [lot, classe, score, x1, y1, x2, y2] ; on garde la meilleure
    let meilleure = null;
    for (let i = 0; i < resultat.dims[0]; i++) {
      const [, classe, score, x1, y1, x2, y2] = resultat.data.slice(i * 7, i * 7 + 7);
      const signe = CLASSES[classe];
      if (signe && (!meilleure || score > meilleure.score)) {
        meilleure = { signe, score, boite: { x1: x1 / ratio, y1: y1 / ratio, x2: x2 / ratio, y2: y2 / ratio } };
      }
    }
    return meilleure;
  }
}
