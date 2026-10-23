// Les sons et la voix
// Hamza Karrouchi - BUT INFO 3
// doc : https://developer.mozilla.org/fr/docs/Web/API/Web_Audio_API
//       https://developer.mozilla.org/fr/docs/Web/API/SpeechSynthesis
//
// Si un fichier existe dans le dossier sons/ (voir FICHIERS), il est joué ;
// sinon le son est fabriqué avec Web Audio (oscillateurs et bruit blanc).

const FICHIERS = {
  jutsu: "sons/jutsu.mp3",         // à chaque jutsu réussi
  rasengan: "sons/rasengan.mp3",
  chidori: "sons/chidori.mp3",
  sharingan: "sons/sharingan.mp3"  // au début du Tsukuyomi
};

let audio = null;
let muet = false;
const enregistrements = {}; // les fichiers trouvés, décodés

// le navigateur n'autorise le son qu'après un geste de l'utilisateur : à appeler dans un clic
export function activerSon() {
  if (!audio) {
    audio = new AudioContext();
    chargerFichiers();
  }
  if ("speechSynthesis" in window) speechSynthesis.getVoices(); // la liste des voix arrive en différé
  return audio.resume();
}

function chargerFichiers() {
  for (const [nom, url] of Object.entries(FICHIERS)) {
    fetch(url)
      .then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status)))
      .then(donnees => audio.decodeAudioData(donnees))
      .then(tampon => enregistrements[nom] = tampon)
      .catch(() => { /* pas de fichier : on garde le son synthétisé */ });
  }
}

export function couperSon(oui) {
  muet = oui;
  if (oui && "speechSynthesis" in window) speechSynthesis.cancel();
}

function lireFichier(nom, volume = 1) {
  const source = audio.createBufferSource();
  source.buffer = enregistrements[nom];
  const gain = audio.createGain();
  gain.gain.value = volume;
  source.connect(gain).connect(audio.destination);
  source.start();
}


// ---- les briques des sons synthétisés ----

// une enveloppe de volume : montée rapide, puis extinction jusqu'à "fin"
function volume(t, attaque, fin, max) {
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(max, t + attaque);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + fin);
  gain.connect(audio.destination);
  return gain;
}

// du bruit blanc : la base du feu, de l'eau et de la fumée
function bruit(duree) {
  const tampon = audio.createBuffer(1, Math.ceil(audio.sampleRate * duree), audio.sampleRate);
  const d = tampon.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const source = audio.createBufferSource();
  source.buffer = tampon;
  return source;
}

function filtre(type, frequence, q = 1) {
  const f = audio.createBiquadFilter();
  f.type = type;
  f.frequency.value = frequence;
  f.Q.value = q;
  return f;
}

function oscillateur(forme, frequence) {
  const o = audio.createOscillator();
  o.type = forme;
  o.frequency.value = frequence;
  return o;
}

const SONS = {
  // un "toc" de bois, un peu plus aigu à chaque signe de l'enchaînement
  signe(t, rang = 1) {
    const o = oscillateur("triangle", 520 + Math.min(rang, 12) * 45);
    o.connect(volume(t, 0.005, 0.12, 0.35));
    o.start(t);
    o.stop(t + 0.15);
  },

  // le jutsu est prêt : un coup sourd et un souffle
  jutsu(t) {
    const o = oscillateur("sine", 160);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.5);
    o.connect(volume(t, 0.01, 0.6, 0.6));
    o.start(t);
    o.stop(t + 0.7);
    const b = bruit(0.6);
    const f = filtre("bandpass", 600, 0.8);
    f.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
    b.connect(f).connect(volume(t, 0.05, 0.6, 0.25));
    b.start(t);
  },

  // le feu : un grondement qui s'ouvre puis se referme
  feu(t, duree = 3) {
    const b = bruit(duree);
    const f = filtre("lowpass", 300);
    f.frequency.linearRampToValueAtTime(1600, t + 0.6);
    f.frequency.linearRampToValueAtTime(400, t + duree);
    b.connect(f).connect(volume(t, 0.15, duree, 0.8));
    b.start(t);
    const o = oscillateur("sawtooth", 55);
    o.connect(filtre("lowpass", 200)).connect(volume(t, 0.2, duree, 0.3));
    o.start(t);
    o.stop(t + duree);
  },

  // l'eau : un bruit filtré dont la fréquence ondule
  eau(t, duree = 2.5) {
    const b = bruit(duree);
    const f = filtre("bandpass", 900, 1.2);
    const lfo = oscillateur("sine", 5);
    const ampleur = audio.createGain();
    ampleur.gain.value = 500;
    lfo.connect(ampleur).connect(f.frequency);
    b.connect(f).connect(volume(t, 0.1, duree, 0.9));
    b.start(t);
    lfo.start(t);
    lfo.stop(t + duree);
  },

  // le Chidori : des gazouillis aigus très rapides et un crépitement
  chidori(t, duree = 4) {
    for (let i = 0; i < duree / 0.035; i++) {
      const debut = t + i * 0.035;
      const o = oscillateur("square", 2200 + Math.random() * 2800);
      o.connect(volume(debut, 0.003, 0.03, 0.06));
      o.start(debut);
      o.stop(debut + 0.035);
    }
    const b = bruit(duree);
    b.connect(filtre("highpass", 4000)).connect(volume(t, 0.05, duree, 0.35));
    b.start(t);
  },

  // le Rasengan : un vrombissement qui monte
  rasengan(t, duree = 4.5) {
    const o = oscillateur("sawtooth", 80);
    o.frequency.linearRampToValueAtTime(190, t + duree);
    const f = filtre("lowpass", 600, 6);
    const lfo = oscillateur("sine", 9);
    const ampleur = audio.createGain();
    ampleur.gain.value = 300;
    lfo.connect(ampleur).connect(f.frequency);
    o.connect(f).connect(volume(t, 0.3, duree, 0.5));
    o.start(t);
    lfo.start(t);
    o.stop(t + duree);
    lfo.stop(t + duree);
  },

  // le vent : un souffle dont le filtre balaie les aigus
  vent(t, duree = 3) {
    const b = bruit(duree);
    const f = filtre("bandpass", 400, 2);
    f.frequency.exponentialRampToValueAtTime(2200, t + duree * 0.4);
    f.frequency.exponentialRampToValueAtTime(500, t + duree);
    b.connect(f).connect(volume(t, 0.2, duree, 0.9));
    b.start(t);
  },

  // la terre : un grondement très grave et des craquements
  terre(t, duree = 2.5) {
    const o = oscillateur("sawtooth", 38);
    o.connect(filtre("lowpass", 120)).connect(volume(t, 0.05, duree, 0.7));
    o.start(t);
    o.stop(t + duree);
    const b = bruit(duree);
    b.connect(filtre("lowpass", 500)).connect(volume(t, 0.02, duree * 0.6, 0.6));
    b.start(t);
  },

  // un soin : trois notes douces qui montent
  soin(t) {
    [660, 880, 1320].forEach((f, i) => {
      const o = oscillateur("sine", f);
      o.connect(volume(t + i * 0.12, 0.05, 1.2, 0.18));
      o.start(t + i * 0.12);
      o.stop(t + i * 0.12 + 1.3);
    });
  },

  // un nuage de fumée : "pouf"
  fumee(t) {
    const b = bruit(0.6);
    b.connect(filtre("lowpass", 900)).connect(volume(t, 0.01, 0.55, 0.9));
    b.start(t);
  },

  // une invocation : un grand coup sourd
  boum(t) {
    const o = oscillateur("sine", 110);
    o.frequency.exponentialRampToValueAtTime(35, t + 1);
    o.connect(volume(t, 0.01, 1.2, 0.9));
    o.start(t);
    o.stop(t + 1.3);
    SONS.fumee(t);
  },

  // un genjutsu : deux notes graves presque pareilles, qui battent entre elles
  genjutsu(t, duree = 4) {
    for (const f of [110, 116.5]) {
      const o = oscillateur("sine", f);
      o.connect(volume(t, 0.6, duree, 0.25));
      o.start(t);
      o.stop(t + duree);
    }
  },

  sharingan(t) {
    const o = oscillateur("triangle", 1400);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.4);
    o.connect(volume(t, 0.005, 0.5, 0.4));
    o.start(t);
    o.stop(t + 0.5);
  },

  // "Kai !" : l'illusion se brise
  kai(t) {
    const b = bruit(0.4);
    b.connect(filtre("highpass", 2000)).connect(volume(t, 0.005, 0.35, 0.7));
    b.start(t);
    SONS.signe(t, 12);
  }
};

// joue le fichier s'il existe, sinon le son synthétisé
export function jouer(nom, ...options) {
  if (!audio || muet || !nom) return;
  if (enregistrements[nom]) lireFichier(nom);
  else if (SONS[nom]) SONS[nom](audio.currentTime, ...options);
}

// le nom du jutsu à voix haute, en japonais si le navigateur a une voix japonaise
export function crier(jutsu) {
  if (muet || !("speechSynthesis" in window)) return;
  const japonaise = speechSynthesis.getVoices().find(v => v.lang.startsWith("ja"));
  const phrase = new SpeechSynthesisUtterance(japonaise ? jutsu.kanji : jutsu.romaji);
  if (japonaise) {
    phrase.voice = japonaise;
    phrase.lang = japonaise.lang;
  }
  phrase.rate = 1.1;
  speechSynthesis.cancel();
  speechSynthesis.speak(phrase);
}
