// Les signes et les jutsus
// Hamza Karrouchi - BUT INFO 3
//
// Les noms (kanji, romaji) et les enchaînements de signes viennent de Narutopedia
// (naruto.fandom.com), sauf quelques variantes tirées du fichier jutsu.csv du projet
// NARUTO-HandSignDetection. Le Rasengan, le Rasenshuriken, Kirin et les techniques
// du Sharingan n'ont pas de signes dans l'anime : leurs enchaînements sont inventés
// pour l'appli (source: "appli").

// les 12 signes du zodiaque chinois, plus deux signes spéciaux
export const SIGNES = {
  rat:      { kanji: "子", romaji: "Ne", nom: "Rat", position: "Index et majeur d'une main tendus vers le haut, l'autre main les entoure, les deux mains croisées." },
  boeuf:    { kanji: "丑", romaji: "Ushi", nom: "Bœuf", position: "Les mains croisées à l'horizontale, l'une sur l'autre, index et majeur tendus sur le côté." },
  tigre:    { kanji: "寅", romaji: "Tora", nom: "Tigre", position: "Doigts entrecroisés, les index et les majeurs des deux mains tendus ensemble vers le haut." },
  lievre:   { kanji: "卯", romaji: "U", nom: "Lièvre", position: "Une main à plat, paume vers le bas ; l'autre posée en travers par-dessus, doigts vers le haut." },
  dragon:   { kanji: "辰", romaji: "Tatsu", nom: "Dragon", position: "Doigts entrecroisés, les index qui se rejoignent en pointe vers le haut." },
  serpent:  { kanji: "巳", romaji: "Mi", nom: "Serpent", position: "Mains jointes, doigts entrecroisés et refermés sur le dos des mains." },
  cheval:   { kanji: "午", romaji: "Uma", nom: "Cheval", position: "Les index se touchent en triangle vers le haut, les autres doigts écartés vers l'extérieur." },
  belier:   { kanji: "未", romaji: "Hitsuji", nom: "Bélier", position: "Index et majeur d'une main tendus vers le haut, l'autre main les tient à la base, ses deux doigts tendus contre eux." },
  singe:    { kanji: "申", romaji: "Saru", nom: "Singe", position: "Les deux mains à plat, l'une sur l'autre en décalé, les doigts pointés dans des directions opposées." },
  oiseau:   { kanji: "酉", romaji: "Tori", nom: "Oiseau", position: "Doigts écartés, les deux mains se touchent du bout des doigts en formant une pointe." },
  chien:    { kanji: "戌", romaji: "Inu", nom: "Chien", position: "Une main à plat paume vers le bas, le poing de l'autre main posé dessus." },
  sanglier: { kanji: "亥", romaji: "I", nom: "Sanglier", position: "Les deux mains l'une contre l'autre, doigts repliés vers le bas comme une mâchoire." },
  mains:    { kanji: "祈", romaji: "Gasshō", nom: "Mains jointes", position: "Les paumes l'une contre l'autre, doigts vers le haut, comme pour une prière." },
  mizunoe:  { kanji: "壬", romaji: "Mizunoe", nom: "Mizunoe (eau)", position: "Les mains à plat, croisées l'une sur l'autre à l'horizontale." }
};

// ordre des classes du modèle YOLOX (labels.csv sans la première ligne "None") ;
// la classe 13, "Unknown", n'est pas un signe
export const CLASSES = ["rat", "boeuf", "tigre", "lievre", "dragon", "serpent", "cheval", "belier",
  "singe", "oiseau", "chien", "sanglier", "mains", null, "mizunoe"];

// le signe qui rompt un genjutsu (« Kai ! »), comme dans l'anime
export const SIGNE_KAI = "belier";

// la famille d'un jutsu, pour trier l'encyclopédie
export const FAMILLES = {
  Katon: "Feu", Suiton: "Eau", Raiton: "Foudre", "Fūton": "Vent", Doton: "Terre", Mokuton: "Bois",
  Ninjutsu: "Ninjutsu", Kuchiyose: "Ninjutsu", "Iryō ninjutsu": "Ninjutsu", "Fūinjutsu": "Ninjutsu", Kinjutsu: "Ninjutsu",
  Genjutsu: "Genjutsu", "Dōjutsu": "Sharingan"
};

// Un jutsu : signes (l'enchaînement), variante (un autre enchaînement possible),
// tenir (true : un seul signe, à tenir 2,5 s), effet (voir js/effets/), source.
const j = (id, type, kanji, romaji, nom, signes, effet, texte, options = {}) =>
  ({ id, type, kanji, romaji, nom, signes, effet, texte, source: "anime", ...options });

export const JUTSUS = [
  // ---- Katon : le feu ----
  j("goukakyu", "Katon", "火遁・豪火球の術", "Katon : Gōkakyū no jutsu", "Boule de feu suprême",
    ["serpent", "belier", "singe", "sanglier", "cheval", "tigre"], "bouleDeFeu",
    "La technique des Uchiha : une énorme boule de feu.", { variante: ["serpent", "tigre", "singe", "sanglier", "cheval", "tigre"] }),
  j("housenka", "Katon", "火遁・鳳仙火の術", "Katon : Hōsenka no jutsu", "Feu du phénix",
    ["rat", "tigre", "chien", "boeuf", "lievre", "tigre"], "pluieDeFeu", "Une volée de petites boules de feu."),
  j("ryuuka", "Katon", "火遁・龍火の術", "Katon : Ryūka no jutsu", "Feu du dragon",
    ["serpent", "dragon", "lievre", "tigre"], "souffleDeFeu", "Un souffle de flammes qui fonce vers toi."),
  j("karyuuendan", "Katon", "火遁・火龍炎弾", "Katon : Karyū Endan", "Dragon de flammes",
    ["belier", "cheval", "serpent", "dragon", "rat", "boeuf", "tigre"], "dragonDeFeu", "Un dragon de feu qui serpente à travers l'écran."),
  j("haisekishou", "Katon", "火遁・灰積焼", "Katon : Haisekishō", "Nuée de cendres ardentes",
    ["serpent", "rat", "serpent", "tigre"], "cendres", "La technique d'Asuma : un nuage de cendres, puis tout s'embrase."),
  j("goukamekkyaku", "Katon", "火遁・豪火滅却", "Katon : Gōka Mekkyaku", "Extinction suprême par le feu",
    ["cheval"], "murDeFeu", "La technique de Madara : un mur de feu qui couvre tout.", { tenir: true }),

  // ---- Suiton : l'eau ----
  j("mizurappa", "Suiton", "水遁・水喇叭", "Suiton : Mizurappa", "Trompe d'eau",
    ["dragon", "tigre", "lievre"], "jetDEau", "Un puissant jet d'eau."),
  j("suikoudan", "Suiton", "水遁・水鮫弾の術", "Suiton : Suikōdan no jutsu", "Requin aqueux",
    ["tigre", "boeuf", "dragon", "lievre", "oiseau", "dragon", "belier"], "requin",
    "Un requin d'eau fonce sur l'adversaire. (Version du modèle de détection : l'anime ajoute le signe du clonage.)"),
  j("suiryuudan", "Suiton", "水遁・水龍弾の術", "Suiton : Suiryūdan no jutsu", "Dragon aqueux",
    ["boeuf", "singe", "lievre", "rat", "sanglier", "oiseau", "boeuf", "cheval", "oiseau", "rat", "tigre",
      "chien", "tigre", "serpent", "boeuf", "belier", "serpent", "sanglier", "belier", "rat", "mizunoe", "singe",
      "oiseau", "dragon", "oiseau", "boeuf", "cheval", "belier", "tigre", "serpent", "rat", "singe", "lievre",
      "sanglier", "dragon", "belier", "rat", "boeuf", "singe", "oiseau", "mizunoe", "rat", "sanglier", "oiseau"],
    "dragonDEau", "Le dragon d'eau de Zabuza, 44 signes : le défi ultime."),
  j("suijinheki", "Suiton", "水遁・水陣壁", "Suiton : Suijinheki", "Muraille d'eau",
    ["tigre", "serpent", "rat", "serpent", "tigre"], "murDEau", "Une muraille d'eau jaillit autour de toi."),
  j("daibakufu", "Suiton", "水遁・大瀑布の術", "Suiton : Daibakufu no jutsu", "Grande cascade",
    ["tigre", "boeuf", "singe", "lievre", "belier", "sanglier", "boeuf", "cheval", "singe", "tigre", "chien",
      "tigre", "serpent", "tigre", "boeuf", "singe", "lievre", "oiseau"], "cascade", "Une cascade s'abat sur l'écran (18 signes)."),
  j("kirigakure", "Suiton", "霧隠れの術", "Kirigakure no jutsu", "Brume dissimulatrice",
    ["boeuf", "serpent", "belier"], "brume", "La technique de Zabuza : un brouillard épais envahit tout."),
  j("suidanha", "Suiton", "水遁・水断波", "Suiton : Suidanha", "Vague tranchante",
    ["tigre", "rat", "cheval", "serpent", "dragon", "mains"], "jetTranchant", "Un fil d'eau sous pression qui tranche l'écran."),

  // ---- Raiton : la foudre ----
  j("chidori", "Raiton", "千鳥", "Chidori", "Mille oiseaux",
    ["boeuf", "lievre", "singe"], "chidori", "La foudre crépite dans la main, avec le chant de mille oiseaux."),
  j("jinraisen", "Raiton", "雷遁・迅雷箭", "Raiton : Jinraisen", "Flèche de foudre",
    ["belier", "dragon", "lievre"], "flecheDeFoudre", "Une flèche d'éclair traverse l'écran."),
  j("kirin", "Raiton", "麒麟", "Kirin", "Kirin, la bête de foudre",
    ["dragon", "singe", "oiseau"], "kirin", "Le ciel s'assombrit et la foudre tombe en forme de dragon.", { source: "appli" }),

  // ---- Fūton : le vent ----
  j("daitoppa", "Fūton", "風遁・大突破", "Fūton : Daitoppa", "Grande percée",
    ["tigre", "boeuf", "chien", "lievre", "serpent"], "bourrasque", "Une bourrasque balaie l'écran."),
  j("shinkuugyoku", "Fūton", "風遁・真空玉", "Fūton : Shinkūgyoku", "Sphères de vide",
    ["rat", "lievre", "chien"], "spheresDAir", "Des balles d'air comprimé foncent vers toi."),
  j("shinkuuha", "Fūton", "風遁・真空波", "Fūton : Shinkūha", "Vague de vide",
    ["rat", "serpent", "cheval", "chien"], "lameDeVent", "Une lame de vent coupe l'image en deux."),
  j("kamaitachi", "Fūton", "カマイタチの術", "Kamaitachi no jutsu", "Faux du vent",
    ["serpent", "dragon", "oiseau"], "faux", "La technique de Temari : des lames de vent en croissant."),
  j("reppuushou", "Fūton", "風遁・烈風掌", "Fūton : Reppūshō", "Paume de bourrasque",
    ["serpent", "belier", "sanglier", "cheval", "oiseau", "mains"], "rafale", "Une rafale qui part des mains jointes."),
  j("rasengan", "Fūton", "螺旋丸", "Rasengan", "Orbe tourbillonnant",
    ["mains", "tigre"], "rasengan", "Une sphère de chakra qui tourbillonne dans la main (en 3D).", { type: "Ninjutsu", source: "appli" }),
  j("rasenshuriken", "Fūton", "風遁・螺旋手裏剣", "Fūton : Rasenshuriken", "Shuriken tourbillonnant",
    ["mains", "tigre", "oiseau"], "rasenshuriken", "Le Rasengan entouré de lames de vent.", { source: "appli" }),

  // ---- Doton : la terre ----
  j("tsuiga", "Doton", "口寄せ・土遁追牙の術", "Kuchiyose : Doton Tsuiga no jutsu", "Crocs de la terre",
    ["tigre", "serpent", "dragon", "chien"], "chiens", "La meute de chiens ninja de Kakashi surgit du sol."),
  j("doryuudan", "Doton", "土遁・土龍弾", "Doton : Doryūdan", "Dragon de boue",
    ["belier", "cheval", "dragon"], "dragonDeTerre", "Un dragon de boue crache des boulets de terre."),
  j("doryuuheki", "Doton", "土遁・土流壁", "Doton : Doryūheki", "Muraille de terre",
    ["tigre", "lievre", "sanglier", "chien"], "murDeTerre", "Un mur de pierre sort du sol.", { variante: ["belier", "chien", "boeuf", "serpent"] }),
  j("doryuusou", "Doton", "土遁・土流槍", "Doton : Doryūsō", "Lances de terre",
    ["serpent", "rat", "oiseau"], "pieux", "Des pointes de roche jaillissent du sol."),

  // ---- Mokuton : le bois ----
  j("shichuurou", "Mokuton", "木遁・四柱牢の術", "Mokuton : Shichūrō no jutsu", "Prison des quatre piliers",
    ["belier", "boeuf", "sanglier", "serpent"], "prisonDeBois", "La technique de Yamato : une cage de bois t'enferme."),
  j("shichuuka", "Mokuton", "木遁・四柱家の術", "Mokuton : Shichūka no jutsu", "Maison des quatre piliers",
    ["serpent", "rat", "boeuf", "belier", "serpent"], "maison", "Une maison de bois pousse derrière toi."),
  j("jukaikoutan", "Mokuton", "木遁秘術・樹界降誕", "Mokuton Hijutsu : Jukai Kōtan", "Naissance d'une forêt",
    ["tigre", "serpent"], "foret", "La technique d'Hashirama : une forêt pousse d'un coup.", { variante: ["belier", "serpent"] }),

  // ---- Ninjutsu ----
  j("bunshin", "Ninjutsu", "分身の術", "Bunshin no jutsu", "Multiclonage",
    ["belier", "serpent", "tigre"], "clones", "Des clones de toi apparaissent dans un nuage de fumée."),
  j("kawarimi", "Ninjutsu", "変わり身の術", "Kawarimi no jutsu", "Permutation",
    ["tigre", "sanglier", "boeuf", "chien", "serpent"], "permutation", "Pouf : tu es remplacé par une bûche.",
    { variante: ["belier", "sanglier", "boeuf", "chien", "serpent"] }),
  j("henge", "Ninjutsu", "変化の術", "Henge no jutsu", "Métamorphose",
    ["chien", "sanglier", "belier"], "metamorphose", "Tu te transformes… en renard à neuf queues ?"),
  j("shunshin", "Ninjutsu", "瞬身の術", "Shunshin no jutsu", "Déplacement instantané",
    ["tigre"], "shunshin", "Tu disparais dans un tourbillon de feuilles.", { tenir: true }),
  j("kagemane", "Ninjutsu", "影真似の術", "Kagemane no jutsu", "Manipulation des ombres",
    ["rat"], "ombre", "La technique de Shikamaru : les ombres rampent vers l'adversaire.", { tenir: true }),
  j("harijizou", "Ninjutsu", "針地蔵", "Hari Jizō", "Hérisson de cheveux",
    ["tigre", "cheval", "sanglier", "belier", "rat", "serpent"], "herisson", "La défense de Jiraiya : des aiguilles partout autour de toi."),
  j("shurikenkagebunshin", "Ninjutsu", "手裏剣影分身の術", "Shuriken Kage Bunshin no jutsu", "Multiclonage de shuriken",
    ["boeuf", "chien", "dragon", "rat", "chien", "sanglier", "serpent", "tigre"], "shuriken", "Un shuriken se multiplie en dizaines de shuriken."),

  // ---- Kuchiyose : les invocations ----
  j("kuchiyose", "Kuchiyose", "口寄せの術", "Kuchiyose no jutsu", "Invocation",
    ["sanglier", "chien", "oiseau", "singe", "belier"], "invocation", "Un crapaud géant apparaît dans un nuage de fumée.",
    { variante: ["chien", "sanglier", "oiseau", "singe", "belier"] }),
  j("gamaguchi", "Kuchiyose", "口寄せ・蝦蟇口縛り", "Kuchiyose : Gamaguchi Shibari", "Estomac du crapaud",
    ["serpent", "sanglier", "rat", "dragon", "sanglier", "dragon", "tigre"], "estomac", "Jiraiya t'enferme dans l'estomac d'un crapaud géant."),
  j("rashoumon", "Kuchiyose", "口寄せ・羅生門", "Kuchiyose : Rashōmon", "Portail de Rashō",
    ["serpent"], "porte", "La défense d'Orochimaru : un portail géant surgit du sol.", { tenir: true }),
  j("edotensei", "Kinjutsu", "口寄せ・穢土転生", "Kuchiyose : Edo Tensei", "Réincarnation des âmes",
    ["tigre", "serpent", "chien", "dragon", "mains"], "edoTensei", "Technique interdite : tu deviens un mort réanimé, gris et fissuré."),

  // ---- Fūinjutsu : les sceaux ----
  j("shikifuujin", "Fūinjutsu", "屍鬼封尽", "Shiki Fūjin", "Sceau du dieu de la mort",
    ["serpent", "sanglier", "belier", "lievre", "chien", "rat", "oiseau", "cheval", "serpent", "mains"], "shinigami", "Le dieu de la mort apparaît derrière toi."),
  j("fuujahouin", "Fūinjutsu", "封邪法印", "Fūja Hōin", "Sceau du mal",
    ["lievre", "serpent", "cheval", "belier", "oiseau", "tigre", "lievre", "serpent", "cheval", "belier", "oiseau", "tigre",
      "lievre", "serpent", "cheval", "belier", "oiseau", "chien", "rat"], "sceau", "Le sceau que Kakashi pose sur Sasuke (19 signes)."),

  // ---- Iryō ninjutsu : la médecine ----
  j("chakuranomesu", "Iryō ninjutsu", "チャクラのメス", "Chakura no Mesu", "Scalpel de chakra",
    ["tigre", "cheval", "lievre", "rat", "chien"], "scalpel", "Une lame de chakra bleu sort de la main."),
  j("shousen", "Iryō ninjutsu", "掌仙術", "Shōsen jutsu", "Paume mystique",
    ["boeuf", "tigre"], "soin", "La technique de soin de Sakura et Tsunade : une lueur verte."),

  // ---- Genjutsu : les illusions (le signe du Bélier les rompt) ----
  j("narakumi", "Genjutsu", "魔幻・奈落見の術", "Magen : Narakumi no jutsu", "Vision de l'enfer",
    ["serpent", "rat"], "visionEnfer", "Des feuilles tourbillonnent et le monde se tord. Bélier pour rompre."),
  j("jubakusatsu", "Genjutsu", "魔幻・樹縛殺", "Magen : Jubaku Satsu", "Étreinte de l'arbre",
    ["chien", "serpent", "singe", "boeuf", "tigre"], "arbre", "La technique de Kurenai : un arbre pousse et t'enserre. Bélier pour rompre."),
  j("tsukuyomi", "Dōjutsu", "月読", "Tsukuyomi", "Lune illusoire",
    ["chien", "serpent", "oiseau"], "tsukuyomi", "Le monde devient rouge et noir. Bélier pour rompre l'illusion (« Kai ! »).", { source: "appli" }),
  j("izanagi", "Dōjutsu", "イザナギ", "Izanagi", "Réécrire la réalité",
    ["lievre", "sanglier", "belier"], "izanagi", "La réalité se brouille, puis revient comme si rien ne s'était passé."),
  j("amaterasu", "Dōjutsu", "天照", "Amaterasu", "Flammes noires",
    ["oiseau", "serpent", "chien"], "amaterasu", "Les flammes noires qui ne s'éteignent jamais.", { source: "appli" }),
  j("kamui", "Dōjutsu", "神威", "Kamui", "Vortex de Kamui",
    ["singe", "rat", "oiseau"], "kamui", "L'image est aspirée dans un tourbillon.", { source: "appli" }),
  j("susanoo", "Dōjutsu", "須佐能乎", "Susanoo", "Susanoo",
    ["tigre", "dragon", "oiseau", "mains"], "susanoo", "Un géant de chakra violet se dresse autour de toi.", { source: "appli" })
];
