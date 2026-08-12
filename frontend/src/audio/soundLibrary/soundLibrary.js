// src/audio/soundLibrary/soundLibrary.js

const TONE_AUDIO =
  "https://tonejs.github.io/audio";

const TONE_DRUMS =
  `${TONE_AUDIO}/drum-samples`;

const TONE_BERKLEE =
  `${TONE_AUDIO}/berklee`;

/*
 * ---------------------------------------------------------
 * SOUND LIBRARY
 * ---------------------------------------------------------
 */

export const SOUND_LIBRARY = [
  /*
   * =========================================================
   * DRUMS
   * =========================================================
   */

  {
    id: "drums.kicks.cr78",
    name: "CR-78 Kick",

    category: "drums",
    subcategory: "kicks",

    type: "sample",

    url:
      `${TONE_DRUMS}/CR78/kick.mp3`,

    tags: [
      "kick",
      "drum",
      "vintage",
      "analog",
      "cr78",
      "short",
    ],

    description:
      "Short vintage drum-machine kick.",

    source: {
      name: "Tone.js",
      url:
        "https://tonejs.github.io/",
      license:
        "Verify source license before redistribution.",
    },
  },

  {
    id: "drums.snares.cr78",
    name: "CR-78 Snare",

    category: "drums",
    subcategory: "snares",

    type: "sample",

    url:
      `${TONE_DRUMS}/CR78/snare.mp3`,

    tags: [
      "snare",
      "drum",
      "vintage",
      "analog",
      "cr78",
    ],

    description:
      "Vintage CR-78 style snare.",

    source: {
      name: "Tone.js",
      url:
        "https://tonejs.github.io/",
      license:
        "Verify source license before redistribution.",
    },
  },

  {
    id: "drums.hihats.cr78",
    name: "CR-78 Hi-Hat",

    category: "drums",
    subcategory: "hihats",

    type: "sample",

    url:
      `${TONE_DRUMS}/CR78/hihat.mp3`,

    tags: [
      "hat",
      "hihat",
      "hi-hat",
      "drum",
      "vintage",
      "analog",
      "cr78",
    ],

    description:
      "Short vintage hi-hat.",

    source: {
      name: "Tone.js",
      url:
        "https://tonejs.github.io/",
      license:
        "Verify source license before redistribution.",
    },
  },

  {
    id: "drums.percussion.handdrum",
    name: "Hand Drum",

    category: "drums",
    subcategory: "percussion",

    type: "sample",

    url:
      `${TONE_DRUMS}/handdrum-loop.mp3`,

    tags: [
      "hand",
      "drum",
      "percussion",
    ],

    description:
      "Hand-drum percussion texture.",

    source: {
      name: "Tone.js",
      url:
        "https://tonejs.github.io/",
      license:
        "Verify source license before redistribution.",
    },
  },

  {
    id: "drums.percussion.conga",
    name: "Conga Rhythm",

    category: "drums",
    subcategory: "percussion",

    type: "sample",

    url:
      `${TONE_DRUMS}/conga-rhythm.mp3`,

    tags: [
      "conga",
      "drum",
      "percussion",
      "rhythm",
    ],

    description:
      "Conga percussion rhythm.",

    source: {
      name: "Tone.js",
      url:
        "https://tonejs.github.io/",
      license:
        "Verify source license before redistribution.",
    },
  },

  /*
   * =========================================================
   * FX
   * =========================================================
   */

  {
    id: "fx.textures.gong",
    name: "Gong",

    category: "fx",
    subcategory: "textures",

    type: "sample",

    url:
      `${TONE_BERKLEE}/gong_1.mp3`,

    tags: [
      "gong",
      "metal",
      "impact",
      "texture",
      "cinematic",
    ],

    description:
      "Long resonant gong texture.",

    source: {
      name:
        "Tone.js Berklee samples",
      url:
        "https://tonejs.github.io/",
      license:
        "Verify source license before redistribution.",
    },
  },

  /*
   * =========================================================
   * SYNTHS
   * =========================================================
   */

  {
    id: "synths.stabs.classic",
    name: "Classic Stab",

    category: "synths",
    subcategory: "stabs",

    type: "synth",

    synth: {
      engine: "membrane",

      note: "G2",

      duration: "8n",
    },

    tags: [
      "stab",
      "synth",
      "short",
      "rhythmic",
      "house",
    ],

    description:
      "Short percussive synth stab.",
  },

  {
    id: "synths.pads.classic",
    name: "Classic Poly Pad",

    category: "synths",
    subcategory: "pads",

    type: "synth",

    synth: {
      engine: "poly",

      oscillator: {
        type: "sine",
      },

      note: "C4",

      duration: "4n",
    },

    tags: [
      "pad",
      "synth",
      "polyphonic",
      "chord",
      "ambient",
    ],

    description:
      "Soft polyphonic synth pad.",
  },

  {
    id: "bass.sub.sine",
    name: "Deep Sub",

    category: "bass",
    subcategory: "sub",

    type: "synth",

    synth: {
      engine: "mono",

      oscillator: {
        type: "sine",
      },

      envelope: {
        attack: 0.005,
        decay: 0.15,
        sustain: 0.7,
        release: 0.25,
      },

      note: "C2",

      duration: "8n",
    },

    tags: [
      "bass",
      "sub",
      "sine",
      "low",
      "deep",
    ],

    description:
      "Clean low-frequency sub bass.",
  },

  {
    id: "bass.synth.acid",
    name: "Acid Bass",

    category: "bass",
    subcategory: "synth-bass",

    type: "synth",

    synth: {
      engine: "mono",

      oscillator: {
        type: "sawtooth",
      },

      filter: {
        type: "lowpass",
        frequency: 900,
        rolloff: -24,
      },

      envelope: {
        attack: 0.005,
        decay: 0.15,
        sustain: 0.35,
        release: 0.15,
      },

      note: "C2",

      duration: "8n",
    },

    tags: [
      "bass",
      "acid",
      "303",
      "saw",
      "resonant",
    ],

    description:
      "Resonant acid-style bass.",
  },

  {
    id: "synths.leads.basic",
    name: "Basic Lead",

    category: "synths",
    subcategory: "leads",

    type: "synth",

    synth: {
      engine: "mono",

      oscillator: {
        type: "square",
      },

      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.2,
      },

      note: "C4",

      duration: "8n",
    },

    tags: [
      "lead",
      "synth",
      "square",
      "melody",
    ],

    description:
      "Simple bright square-wave lead.",
  },

  {
    id: "synths.plucks.basic",
    name: "Basic Pluck",

    category: "synths",
    subcategory: "plucks",

    type: "synth",

    synth: {
      engine: "pluck",

      note: "C4",

      duration: "8n",

      resonance: 0.5,
      dampening: 4000,
    },

    tags: [
      "pluck",
      "synth",
      "short",
      "arp",
    ],

    description:
      "Short resonant plucked synth.",
  },

  {
    id: "synths.keys.electric",
    name: "Electric Keys",

    category: "synths",
    subcategory: "keys",

    type: "synth",

    synth: {
      engine: "fm",

      harmonicity: 2,

      modulationIndex: 8,

      note: "C4",

      duration: "8n",
    },

    tags: [
      "keys",
      "electric",
      "fm",
      "chord",
    ],

    description:
      "Bright FM electric-key style sound.",
  },

  {
    id: "synths.bells.digital",
    name: "Digital Bell",

    category: "synths",
    subcategory: "bells",

    type: "synth",

    synth: {
      engine: "fm",

      harmonicity: 3.5,

      modulationIndex: 10,

      note: "C5",

      duration: "4n",
    },

    tags: [
      "bell",
      "fm",
      "digital",
      "melodic",
    ],

    description:
      "Bright metallic digital bell.",
  },
];