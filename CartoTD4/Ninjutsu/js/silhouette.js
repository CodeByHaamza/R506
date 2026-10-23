// Le détourage de la personne, pour les clones, la permutation et les genjutsus
// Hamza Karrouchi - BUT INFO 3
// doc : https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter/web_js
//
// Le modèle "selfie segmenter" (MediaPipe, licence Apache 2.0) donne pour chaque
// pixel la probabilité qu'il appartienne à une personne.

const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35";

export class Silhouette {
  constructor() {
    this.pret = false;
    this.masque = document.createElement("canvas");   // le masque, en image
    this.personne = document.createElement("canvas"); // la personne seule, sur fond transparent
    this.trou = document.createElement("canvas");     // le décor sans la personne
    this.bouche = document.createElement("canvas");   // de quoi boucher le trou
  }

  async charger() {
    // chargé seulement quand on en a besoin : la bibliothèque pèse 11 Mo
    const { FilesetResolver, ImageSegmenter } = await import(CDN + "/vision_bundle.mjs");
    const fichiers = await FilesetResolver.forVisionTasks(CDN + "/wasm");
    const options = delegate => ({
      baseOptions: { modelAssetPath: "modele/selfie_segmenter.tflite", delegate },
      runningMode: "VIDEO",
      outputCategoryMask: false,
      outputConfidenceMasks: true
    });
    try {
      this.segmenteur = await ImageSegmenter.createFromOptions(fichiers, options("GPU"));
    } catch {
      this.segmenteur = await ImageSegmenter.createFromOptions(fichiers, options("CPU"));
    }
    this.pret = true;
  }

  // découpe la personne dans l'image actuelle de la vidéo
  decouper(video, temps) {
    const resultat = this.segmenteur.segmentForVideo(video, temps);
    const masque = resultat.confidenceMasks[0];
    const l = masque.width;
    const h = masque.height;
    const confiance = masque.getAsFloat32Array();

    // le masque devient une image dont la transparence est la confiance
    if (this.masque.width !== l || this.masque.height !== h) {
      this.masque.width = l;
      this.masque.height = h;
      this.pixels = new ImageData(l, h);
    }
    for (let i = 0; i < confiance.length; i++) this.pixels.data[i * 4 + 3] = confiance[i] * 255;
    this.masque.getContext("2d").putImageData(this.pixels, 0, 0);
    resultat.close(); // libère la mémoire du masque

    // la personne seule : la vidéo, gardée seulement là où le masque est opaque
    // (en demi-résolution, c'est bien assez pour les effets)
    const L = Math.round(video.videoWidth / 2);
    const H = Math.round(video.videoHeight / 2);
    this.ajuster(this.personne, L, H);
    const ctx = this.personne.getContext("2d");
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(video, 0, 0, L, H);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(this.masque, 0, 0, L, H);
    ctx.globalCompositeOperation = "source-over";
    return this.personne;
  }

  // Pour faire disparaître la personne : le décor autour d'elle, étalé par un flou
  // pour boucher le trou qu'elle laisse. À dessiner par-dessus la personne.
  couverture(video) {
    const L = 160;
    const H = Math.round(160 * video.videoHeight / video.videoWidth);
    this.ajuster(this.trou, L, H);
    this.ajuster(this.bouche, L, H);

    const trou = this.trou.getContext("2d");
    trou.globalCompositeOperation = "copy";
    trou.drawImage(video, 0, 0, L, H);
    trou.globalCompositeOperation = "destination-out"; // on retire la personne
    trou.drawImage(this.masque, 0, 0, L, H);

    const bouche = this.bouche.getContext("2d");
    bouche.globalCompositeOperation = "source-over";
    bouche.clearRect(0, 0, L, H);
    bouche.filter = "blur(8px)";
    for (let i = 0; i < 4; i++) bouche.drawImage(this.trou, 0, 0); // chaque passage bouche un peu plus le trou
    bouche.filter = "none";
    bouche.globalCompositeOperation = "destination-in"; // on ne garde que la forme de la personne
    bouche.drawImage(this.masque, 0, 0, L, H);
    bouche.globalCompositeOperation = "source-over";
    return this.bouche;
  }

  ajuster(canvas, l, h) {
    if (canvas.width !== l || canvas.height !== h) {
      canvas.width = l;
      canvas.height = h;
    }
  }
}
