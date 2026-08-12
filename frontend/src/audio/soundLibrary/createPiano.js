// frontend/src/audio/soundLibrary/createPiano.js

import * as Tone from "tone";

/**
 * =========================================================
 * VCSL PIANO
 * =========================================================
 */

const SUSTAIN_PATH = "/audio/piano/sustains/";
const RELEASE_PATH = "/audio/piano/releases/";

/**
 * These are the actual sampled notes represented in the
 * VCSL files you showed us.
 *
 * Tone.Sampler will pitch-shift between these samples.
 */

const PIANO_SAMPLE_NOTES = [
  "C0",
  "D#0",
  "F#0",
  "A#-1",

  "C1",
  "D#1",

  "C2",
  "D2",
  "D#2",
  "E2",
  "F#2",
  "G#2",

  "C3",
  "D3",
  "D#3",
  "E3",
  "F#3",
  "G#3",

  "C4",
  "D4",
  "E4",
  "F#4",
  "G#4",

  "C5",
  "D#5",
  "F#5",

  "C6",
  "D6",
  "F#6",
  "G6",

  "C7",
];

/**
 * Exported because index.js expects it.
 *
 * This is the complete playable piano range rather than
 * the list of physical samples.
 */

export const PIANO_NOTES = [];

for (let midi = 21; midi <= 108; midi += 1) {
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  const octave =
    Math.floor(midi / 12) - 1;

  PIANO_NOTES.push(
    `${noteNames[midi % 12]}${octave}`
  );
}

/**
 * =========================================================
 * VELOCITY LAYERS
 * =========================================================
 */

export const PIANO_VELOCITY_LAYERS = [
  {
    id: "v1",
    min: 1,
    max: 31,
  },
  {
    id: "v2",
    min: 32,
    max: 63,
  },
  {
    id: "v3",
    min: 64,
    max: 95,
  },
  {
    id: "v4",
    min: 96,
    max: 127,
  },
];

export function getPianoVelocityLayer(
  velocity = 100
) {
  const value = Math.max(
    1,
    Math.min(
      127,
      Number(velocity) || 100
    )
  );

  const layer =
    PIANO_VELOCITY_LAYERS.find(
      (item) =>
        value >= item.min &&
        value <= item.max
    );

  return (
    layer ||
    PIANO_VELOCITY_LAYERS[3]
  ).id;
}

/**
 * =========================================================
 * SAMPLE FILENAMES
 * =========================================================
 */

function sustainFile(
  note,
  layer
) {
  return (
    `GPiano_sus_${note}_${layer}_rr1_Player.flac`
  );
}

function releaseFile(
  note,
  layer
) {
  return (
    `GPiano_rel_${note}_${layer}_rr1_Player.flac`
  );
}

/**
 * =========================================================
 * CREATE SAMPLE MAP
 * =========================================================
 */

function createSustainMap(
  layer
) {
  const urls = {};

  PIANO_SAMPLE_NOTES.forEach(
    (note) => {
      urls[note] =
        sustainFile(
          note,
          layer
        );
    }
  );

  return urls;
}

/**
 * =========================================================
 * CREATE PIANO
 * =========================================================
 */

export function createPiano(
  destination = Tone.getDestination()
) {
  const samplers = {};

  /**
   * Create one Tone sampler per velocity layer.
   */
  PIANO_VELOCITY_LAYERS.forEach(
    (layer) => {
      const sampler =
        new Tone.Sampler({
          urls:
            createSustainMap(
              layer.id
            ),

          baseUrl:
            SUSTAIN_PATH,

          release: 0.5,

          onload: () => {
            console.log(
              `VCSL piano ${layer.id} loaded`
            );
          },

          onerror: (error) => {
            console.error(
              `Failed loading VCSL piano ${layer.id}:`,
              error
            );
          },
        });

      sampler.connect(
        destination
      );

      samplers[layer.id] =
        sampler;
    }
  );

  /**
   * Track notes so triggerRelease knows which
   * velocity sampler owns the note.
   */
  const activeNotes =
    new Map();

  return {
    samplers,

    /**
     * =======================================================
     * NOTE DOWN
     * =======================================================
     */

    triggerAttack(
      note,
      velocity = 100,
      time
    ) {
      const layer =
        getPianoVelocityLayer(
          velocity
        );

      const sampler =
        samplers[layer];

      if (!sampler) {
        return;
      }

      const normalizedVelocity =
        Math.max(
          0,
          Math.min(
            1,
            Number(velocity) / 127
          )
        );

      try {
        sampler.triggerAttack(
          note,
          time,
          normalizedVelocity
        );

        activeNotes.set(
          note,
          sampler
        );
      } catch (error) {
        console.error(
          `Failed to trigger piano note ${note}:`,
          error
        );
      }
    },

    /**
     * =======================================================
     * NOTE UP
     * =======================================================
     */

    triggerRelease(
      note,
      time
    ) {
      const sampler =
        activeNotes.get(note);

      try {
        if (sampler) {
          sampler.triggerRelease(
            note,
            time
          );
        }
      } catch (error) {
        console.error(
          `Failed to release piano note ${note}:`,
          error
        );
      }

      activeNotes.delete(note);
    },

    /**
     * =======================================================
     * ATTACK + RELEASE
     * =======================================================
     */

    triggerAttackRelease(
      note,
      duration,
      velocity = 100,
      time
    ) {
      const layer =
        getPianoVelocityLayer(
          velocity
        );

      const sampler =
        samplers[layer];

      if (!sampler) {
        return;
      }

      const normalizedVelocity =
        Math.max(
          0,
          Math.min(
            1,
            Number(velocity) / 127
          )
        );

      try {
        sampler.triggerAttackRelease(
          note,
          duration,
          time,
          normalizedVelocity
        );
      } catch (error) {
        console.error(
          `Failed to play piano note ${note}:`,
          error
        );
      }
    },

    /**
     * =======================================================
     * RELEASE ALL
     * =======================================================
     */

    releaseAll() {
      Object.values(
        samplers
      ).forEach(
        (sampler) => {
          try {
            sampler.releaseAll();
          } catch (error) {
            console.error(
              "Failed to release piano:",
              error
            );
          }
        }
      );

      activeNotes.clear();
    },

    /**
     * =======================================================
     * DISPOSE
     * =======================================================
     */

    dispose() {
      Object.values(
        samplers
      ).forEach(
        (sampler) => {
          try {
            sampler.dispose();
          } catch (error) {
            console.error(
              "Failed to dispose piano sampler:",
              error
            );
          }
        }
      );

      activeNotes.clear();
    },
  };
}

/**
 * =========================================================
 * URL HELPERS
 * =========================================================
 */

export function getPianoSustainUrl(
  note,
  velocity = 100
) {
  const layer =
    getPianoVelocityLayer(
      velocity
    );

  return (
    `${SUSTAIN_PATH}` +
    sustainFile(
      note,
      layer
    )
  );
}

export function getPianoReleaseUrl(
  note,
  velocity = 100
) {
  const layer =
    getPianoVelocityLayer(
      velocity
    );

  return (
    `${RELEASE_PATH}` +
    releaseFile(
      note,
      layer
    )
  );
}

/**
 * =========================================================
 * VALIDATION
 * =========================================================
 */

export function isValidPianoNote(
  note
) {
  return PIANO_NOTES.includes(
    note
  );
}

export function getPianoNoteFromMidi(
  midi
) {
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  const value = Math.max(
    0,
    Math.min(
      127,
      Math.round(midi)
    )
  );

  return (
    `${noteNames[value % 12]}` +
    `${Math.floor(value / 12) - 1}`
  );
}