// src/audio/soundLibrary/soundLibrary.js

const TONE_AUDIO = "https://tonejs.github.io/audio";

const TONE_DRUMS = `${TONE_AUDIO}/drum-samples`;

const TONE_BERKLEE = `${TONE_AUDIO}/berklee`;

/**
 * Drum kits mirrored from the cwilso/web-audio-samples repo (master branch).
 * raw.githubusercontent.com serves these with
 * Access-Control-Allow-Origin: *,
 * so Tone.Player can load them directly in the browser.
 */
const WEB_AUDIO_DRUMS =
  "https://raw.githubusercontent.com/cwilso/web-audio-samples/master/samples/audio/sounds/drum-samples";

/**
 * Drum kits available in cwilso/web-audio-samples.
 * Each kit has kick / snare / hihat / tom1 / tom2 / tom3 .wav files.
 */
const DRUM_KITS = [
  {
    id: "linndrum",
    name: "LINN",
    folder: "LINN",
    desc: "Classic 1980s LINN drum machine",
  },
  {
    id: "r8",
    name: "R8",
    folder: "R8",
    desc: "Korg R8 percussion",
  },
  {
    id: "techno",
    name: "Techno",
    folder: "Techno",
    desc: "Punchy techno drum kit",
  },
  {
    id: "kit3",
    name: "Kit3",
    folder: "Kit3",
    desc: "Versatile sample kit",
  },
  {
    id: "stark",
    name: "Stark",
    folder: "Stark",
    desc: "Bold electronic drum kit",
  },
  {
    id: "acoustic",
    name: "Acoustic",
    folder: "acoustic-kit",
    desc: "Acoustic drum kit",
  },
  {
    id: "breakbeat",
    name: "Breakbeat",
    folder: "breakbeat8",
    desc: "Breaks-style drum kit",
  },
  {
    id: "bongos",
    name: "Bongos",
    folder: "Bongos",
    desc: "Hand bongo percussion",
  },
  {
    id: "fourOpFm",
    name: "4OP-FM",
    folder: "4OP-FM",
    desc: "FM synthesized drum kit",
  },
  {
    id: "kpr77",
    name: "KPR77",
    folder: "KPR77",
    desc: "KPR-77 drum machine",
  },
];

const DRUM_PARTS = [
  {
    part: "kick",
    sub: "kicks",
    tag: "kick",
  },
  {
    part: "snare",
    sub: "snares",
    tag: "snare",
  },
  {
    part: "hihat",
    sub: "hihats",
    tag: "hihat",
  },
  {
    part: "tom1",
    sub: "toms",
    tag: "tom",
  },
  {
    part: "tom2",
    sub: "toms",
    tag: "tom",
  },
  {
    part: "tom3",
    sub: "toms",
    tag: "tom",
  },
];

function makeDrumKitSounds() {
  const sounds = [];

  for (const kit of DRUM_KITS) {
    for (const partDef of DRUM_PARTS) {
      const partName = partDef.part;

      const label =
        partName === "hihat"
          ? "Hi-Hat"
          : partName[0].toUpperCase() + partName.slice(1);

      sounds.push({
        id: `drums.${kit.id}.${
          partDef.sub === "toms" ? partName : partDef.sub
        }`,

        name: `${kit.name} ${label}`,

        category:
          kit.id === "bongos" || kit.id === "fourOpFm"
            ? "percussion"
            : "drums",

        subcategory:
          kit.id === "bongos" || kit.id === "fourOpFm"
            ? "percussion"
            : partDef.sub,

        type: "sample",

        url: `${WEB_AUDIO_DRUMS}/${kit.folder}/${partDef.part}.wav`,

        tags: [
          partDef.tag,
          "drum",
          kit.id,
          "sample",
        ],

        description: `${kit.desc} — ${label.toLowerCase()} sample.`,

        source: {
          name: "cwilso/web-audio-samples",
          url: "https://github.com/cwilso/web-audio-samples",
          license: "Verify source license before redistribution.",
        },
      });
    }
  }

  return sounds;
}

/*
 * ---------------------------------------------------------
 * SOUND LIBRARY
 * ---------------------------------------------------------
 */

export const SOUND_LIBRARY = [
  ...makeDrumKitSounds(),

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
    url: `${TONE_DRUMS}/CR78/kick.mp3`,
    tags: [
      "kick",
      "drum",
      "vintage",
      "analog",
      "cr78",
      "short",
    ],
    description: "Short vintage drum-machine kick.",
    source: {
      name: "Tone.js",
      url: "https://tonejs.github.io/",
      license: "Verify source license before redistribution.",
    },
  },

  {
    id: "drums.snares.cr78",
    name: "CR-78 Snare",
    category: "drums",
    subcategory: "snares",
    type: "sample",
    url: `${TONE_DRUMS}/CR78/snare.mp3`,
    tags: [
      "snare",
      "drum",
      "vintage",
      "analog",
      "cr78",
    ],
    description: "Vintage CR-78 style snare.",
    source: {
      name: "Tone.js",
      url: "https://tonejs.github.io/",
      license: "Verify source license before redistribution.",
    },
  },

  {
    id: "drums.hihats.cr78",
    name: "CR-78 Hi-Hat",
    category: "drums",
    subcategory: "hihats",
    type: "sample",
    url: `${TONE_DRUMS}/CR78/hihat.mp3`,
    tags: [
      "hat",
      "hihat",
      "hi-hat",
      "drum",
      "vintage",
      "analog",
    ],
    description: "Short vintage hi-hat.",
    source: {
      name: "Tone.js",
      url: "https://tonejs.github.io/",
      license: "Verify source license before redistribution.",
    },
  },

  {
    id: "drums.claps.synth",
    name: "Synth Clap",
    category: "drums",
    subcategory: "claps",
    type: "synth",
    synth: {
      engine: "noise",

      noise: {
        type: "white",
      },

      filter: {
        type: "bandpass",
        frequency: 1800,
      },

      envelope: {
        attack: 0.001,
        decay: 0.15,
        sustain: 0,
        release: 0.1,
      },

      duration: "16n",
    },
    tags: [
      "clap",
      "drum",
      "noise",
      "synthesized",
      "short",
    ],
    description: "Synthesized band-passed noise clap.",
  },

  {
    id: "drums.openhats.synth",
    name: "Synth Open Hat",
    category: "drums",
    subcategory: "openhats",
    type: "synth",
    synth: {
      engine: "noise",

      noise: {
        type: "white",
      },

      filter: {
        type: "highpass",
        frequency: 6000,
      },

      envelope: {
        attack: 0.001,
        decay: 0.25,
        sustain: 0,
        release: 0.1,
      },

      duration: "8n",
    },
    tags: [
      "hat",
      "open",
      "drum",
      "noise",
      "synthesized",
    ],
    description: "Synthesized high-passed open hi-hat.",
  },

  {
    id: "drums.percussion.handdrum",
    name: "Hand Drum",
    category: "drums",
    subcategory: "percussion",
    type: "sample",
    url: `${TONE_DRUMS}/handdrum-loop.mp3`,
    tags: [
      "hand",
      "drum",
      "percussion",
    ],
    description: "Hand-drum percussion texture.",
    source: {
      name: "Tone.js",
      url: "https://tonejs.github.io/",
      license: "Verify source license before redistribution.",
    },
  },

  {
    id: "drums.percussion.conga",
    name: "Conga Rhythm",
    category: "drums",
    subcategory: "percussion",
    type: "sample",
    url: `${TONE_DRUMS}/conga-rhythm.mp3`,
    tags: [
      "conga",
      "drum",
      "percussion",
      "rhythm",
    ],
    description: "Conga percussion rhythm.",
    source: {
      name: "Tone.js",
      url: "https://tonejs.github.io/",
      license: "Verify source license before redistribution.",
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
    url: `${TONE_BERKLEE}/gong_1.mp3`,
    tags: [
      "gong",
      "metal",
      "impact",
      "texture",
      "cinematic",
    ],
    description: "Long resonant gong texture.",
    source: {
      name: "Tone.js Berklee samples",
      url: "https://tonejs.github.io/",
      license: "Verify source license before redistribution.",
    },
  },

  {
    id: "fx.riser.noise",
    name: "Noise Riser",
    category: "fx",
    subcategory: "risers",
    type: "synth",
    synth: {
      engine: "noise",
      noise: {
        type: "white",
      },
      envelope: {
        attack: 0.1,
        decay: 1,
        sustain: 1,
        release: 0.1,
      },
      duration: "1m",
    },
    tags: [
      "riser",
      "noise",
      "fx",
      "transition",
    ],
    description: "A white noise riser for transitions.",
  },

  {
    id: "fx.faller.noise",
    name: "Noise Faller",
    category: "fx",
    subcategory: "fallers",
    type: "synth",
    synth: {
      engine: "noise",
      noise: {
        type: "white",
      },
      envelope: {
        attack: 0.1,
        decay: 1,
        sustain: 1,
        release: 0.1,
      },
      duration: "1m",
    },
    tags: [
      "faller",
      "noise",
      "fx",
      "transition",
    ],
    description: "A white noise faller.",
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
    description: "Short percussive synth stab.",
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
    description: "Soft polyphonic synth pad.",
  },

  {
    id: "synths.pads.juno",
    name: "Juno Pad",
    category: "synths",
    subcategory: "pads",
    type: "synth",
    synth: {
      engine: "poly",
      oscillator: {
        type: "sawtooth",
      },
      envelope: {
        attack: 0.4,
        decay: 0.1,
        sustain: 0.8,
        release: 0.5,
      },
      note: "C4",
      duration: "2n",
    },
    tags: [
      "pad",
      "synth",
      "juno",
      "polyphonic",
      "chord",
      "ambient",
    ],
    description: "Lush, warm, Juno-style synth pad.",
  },

  {
    id: "synths.leads.trance",
    name: "Trance Lead",
    category: "synths",
    subcategory: "leads",
    type: "synth",
    synth: {
      engine: "poly",
      oscillator: {
        type: "fatsawtooth",
        detune: 0.1,
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.8,
        release: 0.5,
      },
      note: "C5",
      duration: "4n",
    },
    tags: [
      "lead",
      "synth",
      "trance",
      "supersaw",
      "anthem",
    ],
    description: "Soaring, anthemic trance lead.",
  },

  {
    id: "synths.keys.wurlitzer",
    name: "Wurlitzer E-Piano",
    category: "synths",
    subcategory: "keys",
    type: "synth",
    synth: {
      engine: "fm",
      harmonicity: 3,
      modulationIndex: 10,
      envelope: {
        attack: 0.01,
        decay: 0.4,
        sustain: 0,
        release: 0.2,
      },
      note: "C4",
      duration: "4n",
    },
    tags: [
      "keys",
      "electric-piano",
      "wurlitzer",
      "fm",
      "soulful",
    ],
    description: "Classic, soulful Wurlitzer-style electric piano.",
  },

  {
    id: "bass.808.kick",
    name: "808 Kick",
    category: "bass",
    subcategory: "808",
    type: "synth",
    synth: {
      engine: "membrane",
      pitchDecay: 0.02,
      octaves: 6,
      note: "C1",
      duration: "8n",
    },
    tags: [
      "808",
      "kick",
      "bass",
      "sub",
      "trap",
      "hip-hop",
    ],
    description: "Synthesized 808-style sub kick.",
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
    description: "Clean low-frequency sub bass.",
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
    description: "Resonant acid-style bass.",
  },

  {
    id: "bass.synth.deep-house",
    name: "Deep House Bass",
    category: "bass",
    subcategory: "synth-bass",
    type: "synth",
    synth: {
      engine: "mono",
      oscillator: {
        type: "sine",
      },
      filter: {
        type: "lowpass",
        frequency: 600,
        rolloff: -12,
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0,
        release: 0.2,
      },
      note: "C2",
      duration: "8n",
    },
    tags: [
      "bass",
      "deep-house",
      "sine",
      "smooth",
    ],
    description: "Smooth, round, and deep house bass.",
  },

  {
    id: "bass.synth.wobble",
    name: "Wobble Bass",
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
        frequency: 400,
        rolloff: -24,
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.2,
        release: 0.1,
      },
      note: "C2",
      duration: "8n",
    },
    tags: [
      "bass",
      "wobble",
      "dubstep",
      "saw",
      "lfo",
    ],
    description: "A wobbling bass sound, perfect for dubstep.",
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
    description: "Simple bright square-wave lead.",
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
    description: "Short resonant plucked synth.",
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
    description: "Bright FM electric-key style sound.",
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
    description: "Bright metallic digital bell.",
  },

  {
    id: "synths.bells.metal",
    name: "Metal Bell",
    category: "synths",
    subcategory: "bells",
    type: "synth",
    synth: {
      engine: "metal",
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      note: "C5",
      duration: "4n",
    },
    tags: [
      "bell",
      "metal",
      "metallic",
      "inharmonic",
      "cinematic",
    ],
    description: "Bright inharmonic metallic bell.",
  },

  {
    id: "synths.keys.am",
    name: "AM Keys",
    category: "synths",
    subcategory: "keys",
    type: "synth",
    synth: {
      engine: "am",
      harmonicity: 3,
      oscillator: {
        type: "sine",
      },
      modulation: {
        type: "square",
      },
      note: "C4",
      duration: "8n",
    },
    tags: [
      "keys",
      "am",
      "electric",
      "bell",
      "tine",
    ],
    description: "Amplitude-modulated electric piano style keys.",
  },

  {
    id: "synths.plucks.am",
    name: "AM Pluck",
    category: "synths",
    subcategory: "plucks",
    type: "synth",
    synth: {
      engine: "am",
      harmonicity: 1.5,
      oscillator: {
        type: "triangle",
      },
      modulation: {
        type: "sine",
      },
      envelope: {
        attack: 0.005,
        decay: 0.2,
        sustain: 0,
        release: 0.3,
      },
      note: "C4",
      duration: "8n",
    },
    tags: [
      "pluck",
      "am",
      "short",
      "arp",
      "soft",
    ],
    description: "Soft amplitude-modulated pluck.",
  },

  {
    id: "fx.cymbals.metal",
    name: "Metal Cymbal",
    category: "fx",
    subcategory: "cymbals",
    type: "synth",
    synth: {
      engine: "metal",
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 8000,
      note: "C5",
      duration: "2n",
    },
    tags: [
      "cymbal",
      "metal",
      "crash",
      "fx",
      "metallic",
    ],
    description: "Bright metallic crash cymbal.",
  },

  /*
   * =========================================================
   * EXPANDED SOUNDS — BASS
   * =========================================================
   */

  {
    id: "bass.synth.reese",
    name: "Reese Bass",
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
        frequency: 500,
        rolloff: -12,
      },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.6,
        release: 0.3,
      },
      note: "C2",
      duration: "4n",
    },
    tags: [
      "bass",
      "reese",
      "saw",
      "detuned",
      "dnb",
    ],
    description: "Deep, detuned Reese-style bass for DnB and techno.",
  },

  {
    id: "bass.synth.sub-drop",
    name: "Sub Drop",
    category: "bass",
    subcategory: "sub",
    type: "synth",
    synth: {
      engine: "membrane",
      pitchDecay: 0.08,
      octaves: 8,
      note: "C1",
      duration: "4n",
    },
    tags: [
      "bass",
      "sub",
      "drop",
      "808",
      "impact",
    ],
    description: "Deep 808-style sub drop with pitch decay.",
  },

  {
    id: "bass.synth.pluck-bass",
    name: "Pluck Bass",
    category: "bass",
    subcategory: "synth-bass",
    type: "synth",
    synth: {
      engine: "mono",
      oscillator: {
        type: "triangle",
      },
      filter: {
        type: "lowpass",
        frequency: 800,
        rolloff: -12,
      },
      envelope: {
        attack: 0.001,
        decay: 0.25,
        sustain: 0,
        release: 0.1,
      },
      note: "C2",
      duration: "8n",
    },
    tags: [
      "bass",
      "pluck",
      "triangle",
      "short",
      "melodic",
    ],
    description: "Short, plucky bass with a clean triangle tone.",
  },

  {
    id: "bass.synth.fm-bass",
    name: "FM Bass",
    category: "bass",
    subcategory: "synth-bass",
    type: "synth",
    synth: {
      engine: "fm",
      harmonicity: 2,
      modulationIndex: 14,
      envelope: {
        attack: 0.005,
        decay: 0.2,
        sustain: 0.3,
        release: 0.15,
      },
      note: "C2",
      duration: "8n",
    },
    tags: [
      "bass",
      "fm",
      "growl",
      "aggressive",
      "edm",
    ],
    description: "Aggressive FM growl bass for EDM and dubstep.",
  },

  /*
   * =========================================================
   * EXPANDED SOUNDS — SYNTHS
   * =========================================================
   */

  {
    id: "synths.pads.warm",
    name: "Warm Pad",
    category: "synths",
    subcategory: "pads",
    type: "synth",
    synth: {
      engine: "poly",
      oscillator: {
        type: "sawtooth",
      },
      envelope: {
        attack: 0.6,
        decay: 0.2,
        sustain: 0.7,
        release: 0.8,
      },
      note: "C4",
      duration: "2n",
    },
    tags: [
      "pad",
      "synth",
      "warm",
      "saw",
      "ambient",
    ],
    description: "Warm, filtered saw pad for lush backgrounds.",
  },

  {
    id: "synths.leads.bright",
    name: "Bright Lead",
    category: "synths",
    subcategory: "leads",
    type: "synth",
    synth: {
      engine: "mono",
      oscillator: {
        type: "pulse",
        width: 0.3,
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.3,
      },
      note: "C5",
      duration: "8n",
    },
    tags: [
      "lead",
      "synth",
      "pulse",
      "bright",
      "melody",
    ],
    description: "Bright pulse-width lead for melodies and arps.",
  },

  {
    id: "synths.plucks.soft",
    name: "Soft Pluck",
    category: "synths",
    subcategory: "plucks",
    type: "synth",
    synth: {
      engine: "pluck",
      note: "C4",
      duration: "8n",
      resonance: 0.7,
      dampening: 3000,
    },
    tags: [
      "pluck",
      "synth",
      "soft",
      "arp",
      "gentle",
    ],
    description: "Soft, gentle plucked sound for arpeggios.",
  },

  {
    id: "synths.keys.organ-fm",
    name: "Organ FM",
    category: "synths",
    subcategory: "keys",
    type: "synth",
    synth: {
      engine: "fm",
      harmonicity: 1,
      modulationIndex: 5,
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.9,
        release: 0.1,
      },
      note: "C4",
      duration: "4n",
    },
    tags: [
      "keys",
      "organ",
      "fm",
      "sustained",
      "vintage",
    ],
    description: "FM organ-style sustained keys.",
  },

  {
    id: "synths.stabs.brass",
    name: "Brass Stab",
    category: "synths",
    subcategory: "stabs",
    type: "synth",
    synth: {
      engine: "poly",
      oscillator: {
        type: "sawtooth",
      },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.4,
        release: 0.2,
      },
      note: "C4",
      duration: "8n",
    },
    tags: [
      "stab",
      "synth",
      "brass",
      "saw",
      "house",
    ],
    description: "Punchy brass-style synth stab for house and funk.",
  },

  {
    id: "synths.leads.chiptune",
    name: "Chiptune Square",
    category: "synths",
    subcategory: "leads",
    type: "synth",
    synth: {
      engine: "mono",
      oscillator: {
        type: "square",
      },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0.5,
        release: 0.05,
      },
      note: "C5",
      duration: "16n",
    },
    tags: [
      "lead",
      "synth",
      "chiptune",
      "square",
      "8bit",
      "retro",
    ],
    description: "Classic 8-bit chiptune square wave lead.",
  },

  {
    id: "synths.pads.dream",
    name: "Dream Pad",
    category: "synths",
    subcategory: "pads",
    type: "synth",
    synth: {
      engine: "poly",
      oscillator: {
        type: "sine",
      },
      envelope: {
        attack: 0.8,
        decay: 0.3,
        sustain: 0.8,
        release: 1.2,
      },
      note: "C4",
      duration: "1m",
    },
    tags: [
      "pad",
      "synth",
      "dream",
      "sine",
      "ethereal",
      "ambient",
    ],
    description: "Slow-attack ethereal dream pad for ambient textures.",
  },

  {
    id: "synths.leads.fifth",
    name: "Fifth Lead",
    category: "synths",
    subcategory: "leads",
    type: "synth",
    synth: {
      engine: "poly",
      oscillator: {
        type: "sawtooth",
      },
      envelope: {
        attack: 0.05,
        decay: 0.15,
        sustain: 0.7,
        release: 0.4,
      },
      note: "C4",
      duration: "4n",
    },
    tags: [
      "lead",
      "synth",
      "power-chord",
      "saw",
      "anthem",
    ],
    description: "Thick polyphonic lead for power chords and anthems.",
  },

  /*
   * =========================================================
   * EXPANDED SOUNDS — FX
   * =========================================================
   */

  {
    id: "fx.zaps.laser",
    name: "Laser Zap",
    category: "fx",
    subcategory: "zaps",
    type: "synth",
    synth: {
      engine: "membrane",
      pitchDecay: 0.01,
      octaves: 10,
      envelope: {
        attack: 0.001,
        decay: 0.08,
        sustain: 0,
        release: 0.05,
      },
      note: "C4",
      duration: "32n",
    },
    tags: [
      "zap",
      "laser",
      "fx",
      "sci-fi",
      "short",
    ],
    description: "Quick sci-fi laser zap with fast pitch drop.",
  },

  {
    id: "fx.textures.reverse-cymbal",
    name: "Reverse Cymbal",
    category: "fx",
    subcategory: "textures",
    type: "synth",
    synth: {
      engine: "noise",
      noise: {
        type: "white",
      },
      filter: {
        type: "lowpass",
        frequency: 4000,
      },
      envelope: {
        attack: 0.8,
        decay: 0.1,
        sustain: 0,
        release: 0.1,
      },
      duration: "2n",
    },
    tags: [
      "reverse",
      "cymbal",
      "noise",
      "fx",
      "transition",
      "swell",
    ],
    description: "Reverse cymbal-style noise swell for transitions.",
  },

  {
    id: "fx.textures.wind",
    name: "Wind",
    category: "fx",
    subcategory: "textures",
    type: "synth",
    synth: {
      engine: "noise",
      noise: {
        type: "pink",
      },
      filter: {
        type: "bandpass",
        frequency: 1200,
      },
      envelope: {
        attack: 0.3,
        decay: 0.5,
        sustain: 0.6,
        release: 0.5,
      },
      duration: "1m",
    },
    tags: [
      "wind",
      "noise",
      "fx",
      "atmosphere",
      "texture",
    ],
    description: "Filtered pink noise wind texture for atmosphere.",
  },

  {
    id: "fx.textures.sci-fi",
    name: "Sci-Fi Texture",
    category: "fx",
    subcategory: "textures",
    type: "synth",
    synth: {
      engine: "metal",
      harmonicity: 8.5,
      modulationIndex: 40,
      resonance: 6000,
      envelope: {
        attack: 0.1,
        decay: 0.8,
        sustain: 0.3,
        release: 0.6,
      },
      note: "C4",
      duration: "2n",
    },
    tags: [
      "sci-fi",
      "metal",
      "texture",
      "fx",
      "cinematic",
      "inharmonic",
    ],
    description: "Inharmonic metallic sci-fi texture for cinematic moments.",
  },

  {
    id: "fx.impacts.hit",
    name: "Impact Hit",
    category: "fx",
    subcategory: "impacts",
    type: "synth",
    synth: {
      engine: "noise",
      noise: {
        type: "white",
      },
      filter: {
        type: "lowpass",
        frequency: 2000,
      },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0,
        release: 0.1,
      },
      duration: "4n",
    },
    tags: [
      "impact",
      "hit",
      "noise",
      "fx",
      "cinematic",
      "short",
    ],
    description: "Short, punchy impact hit for cinematic accents.",
  },

  /*
   * =========================================================
   * MORE TONE.JS INSTRUMENTS
   * =========================================================
   */

  {
    id: "synths.leads.duo",
    name: "Duo Lead",
    category: "synths",
    subcategory: "leads",
    type: "synth",
    synth: {
      engine: "duosynth",
      harmonicity: 2,
      vibratoAmount: 0.3,
      vibratoRate: 6,
      oscillator: {
        type: "sawtooth",
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.6,
        release: 0.3,
      },
      note: "C4",
      duration: "4n",
    },
    tags: [
      "lead",
      "duo",
      "dual-oscillator",
      "saw",
      "melody",
    ],
    description: "Fat dual-oscillator lead with vibrato.",
  },

  {
    id: "synths.leads.supersaw",
    name: "Super Saw",
    category: "synths",
    subcategory: "leads",
    type: "synth",
    synth: {
      engine: "poly",
      oscillator: {
        type: "fatsawtooth",
        count: 3,
        spread: 30,
      },
      envelope: {
        attack: 0.02,
        decay: 0.2,
        sustain: 0.7,
        release: 0.4,
      },
      note: "C4",
      duration: "4n",
    },
    tags: [
      "lead",
      "supersaw",
      "fatsawtooth",
      "trance",
      "edm",
      "anthem",
    ],
    description: "Wide, lush supersaw lead for EDM and trance.",
  },

  {
    id: "synths.leads.pulse",
    name: "Pulse Lead",
    category: "synths",
    subcategory: "leads",
    type: "synth",
    synth: {
      engine: "mono",
      oscillator: {
        type: "pulse",
        width: 0.2,
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.8,
        release: 0.2,
      },
      note: "C5",
      duration: "8n",
    },
    tags: [
      "lead",
      "pulse",
      "synth",
      "bright",
      "melody",
    ],
    description: "Bright, narrow pulse-width lead.",
  },

  {
    id: "synths.plucks.harp",
    name: "Harp Pluck",
    category: "synths",
    subcategory: "plucks",
    type: "synth",
    synth: {
      engine: "pluck",
      resonance: 0.9,
      dampening: 2500,
      note: "C5",
      duration: "8n",
    },
    tags: [
      "pluck",
      "harp",
      "resonant",
      "bright",
      "arp",
    ],
    description: "Bright, resonant harp-like pluck.",
  },

  {
    id: "synths.plucks.guitar",
    name: "Guitar Pluck",
    category: "synths",
    subcategory: "plucks",
    type: "synth",
    synth: {
      engine: "pluck",
      resonance: 0.6,
      dampening: 5000,
      note: "C4",
      duration: "8n",
    },
    tags: [
      "pluck",
      "guitar",
      "short",
      "nylon",
      "arp",
    ],
    description: "Warm, short nylon-guitar-style pluck.",
  },

  {
    id: "synths.keys.dx",
    name: "DX E-Piano",
    category: "synths",
    subcategory: "keys",
    type: "synth",
    synth: {
      engine: "fm",
      harmonicity: 3,
      modulationIndex: 12,
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.2,
        release: 0.4,
      },
      note: "C4",
      duration: "4n",
    },
    tags: [
      "keys",
      "dx",
      "fm",
      "electric-piano",
      "retro",
    ],
    description: "Classic DX-style FM electric piano.",
  },

  {
    id: "synths.bells.fm",
    name: "FM Bell",
    category: "synths",
    subcategory: "bells",
    type: "synth",
    synth: {
      engine: "fm",
      harmonicity: 4,
      modulationIndex: 16,
      envelope: {
        attack: 0.001,
        decay: 0.8,
        sustain: 0,
        release: 0.5,
      },
      note: "C5",
      duration: "4n",
    },
    tags: [
      "bell",
      "fm",
      "bright",
      "metallic",
      "melodic",
    ],
    description: "Bright FM bell with a shimmering decay.",
  },

  {
    id: "synths.keys.am-tine",
    name: "AM Tine Keys",
    category: "synths",
    subcategory: "keys",
    type: "synth",
    synth: {
      engine: "am",
      harmonicity: 4,
      oscillator: {
        type: "sine",
      },
      modulation: {
        type: "square",
      },
      envelope: {
        attack: 0.001,
        decay: 0.6,
        sustain: 0,
        release: 0.4,
      },
      note: "C4",
      duration: "8n",
    },
    tags: [
      "keys",
      "am",
      "tine",
      "electric-piano",
      "bells",
    ],
    description: "Amplitude-modulated tine-style electric piano.",
  },

  {
    id: "synths.pads.glass",
    name: "Glass Pad",
    category: "synths",
    subcategory: "pads",
    type: "synth",
    synth: {
      engine: "fm",
      harmonicity: 2,
      modulationIndex: 8,
      envelope: {
        attack: 0.4,
        decay: 0.5,
        sustain: 0.6,
        release: 1,
      },
      note: "C4",
      duration: "2n",
    },
    tags: [
      "pad",
      "glass",
      "fm",
      "shimmer",
      "ambient",
    ],
    description: "Shimmering glass-like FM pad for ambient layers.",
  },

  {
    id: "bass.synth.square",
    name: "Square Bass",
    category: "bass",
    subcategory: "synth-bass",
    type: "synth",
    synth: {
      engine: "mono",
      oscillator: {
        type: "square",
      },
      filter: {
        type: "lowpass",
        frequency: 500,
        rolloff: -12,
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.4,
        release: 0.1,
      },
      note: "C2",
      duration: "8n",
    },
    tags: [
      "bass",
      "square",
      "mono",
      "edm",
      "hollow",
    ],
    description: "Hollow, punchy square-wave bass.",
  },

  {
    id: "drums.toms.synth",
    name: "Synth Tom",
    category: "drums",
    subcategory: "toms",
    type: "synth",
    synth: {
      engine: "membrane",
      pitchDecay: 0.03,
      octaves: 4,
      note: "C3",
      duration: "8n",
    },
    tags: [
      "tom",
      "drum",
      "membrane",
      "synthesized",
    ],
    description: "Synthesized membrane tom.",
  },

  {
    id: "drums.kicks.synth-deep",
    name: "Deep Synth Kick",
    category: "drums",
    subcategory: "kicks",
    type: "synth",
    synth: {
      engine: "membrane",
      pitchDecay: 0.02,
      octaves: 8,
      note: "C1",
      duration: "8n",
    },
    tags: [
      "kick",
      "drum",
      "membrane",
      "deep",
      "synth",
    ],
    description: "Deep synthesized membrane kick.",
  },

  {
    id: "drums.claps.noise",
    name: "Noise Clap",
    category: "drums",
    subcategory: "claps",
    type: "synth",
    synth: {
      engine: "noise",
      noise: {
        type: "white",
      },
      filter: {
        type: "bandpass",
        frequency: 1500,
      },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1,
      },
      duration: "16n",
    },
    tags: [
      "clap",
      "noise",
      "drum",
      "short",
      "synthesized",
    ],
    description: "Crisp band-passed noise clap.",
  },
];

/**
 * Get a sound definition by its ID.
 *
 * Returns null instead of throwing when the ID is missing
 * or doesn't exist in the library.
 */
export function getSoundById(id) {
  if (!id) {
    return null;
  }

  return SOUND_LIBRARY.find((sound) => sound.id === id) ?? null;
}