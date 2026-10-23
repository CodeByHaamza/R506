# Modèles

| Fichier | Rôle | Origine | Licence |
|---|---|---|---|
| `yolox_nano_with_post.onnx` | reconnaître les 14 signes (YOLOX-Nano, post-traitement inclus) | [Kazuhito00/NARUTO-HandSignDetection](https://github.com/Kazuhito00/NARUTO-HandSignDetection) | MIT, voir `LICENSE.txt` |
| `selfie_segmenter.tflite` | détourer la personne (clones, permutation, genjutsus) | [MediaPipe Image Segmenter](https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter) | Apache 2.0 |

Le modèle de détection attend une image de 416 x 416 pixels en BGR (valeurs de 0 à
255, plans séparés) et renvoie une ligne par détection : `[lot, classe, score, x1, y1, x2, y2]`.
L'ordre des classes est dans `js/donnees.js` (`CLASSES`).
