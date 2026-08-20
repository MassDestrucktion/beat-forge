// src/sequencer/projectModel.js

import { SOUND_LIBRARY, getSoundById } from "../audio/soundLibrary";

/**
 * ---------------------------------------------------------
 * CONSTANTS
 * ---------------------------------------------------------
 */

export const MIN_TRACKS = 4;
export const MAX_TRACKS = 8;
export const NUM_STEPS = 16;

export const TRACK_LABELS = [
  "Track 1",
  "Track 2",
  "Track 3",
  "Track 4",
  "Track 5",
  "Track 6",
  "Track 7",
  "Track 8",
];

/**
 * Default sounds for new tracks.
 *
 * IMPORTANT:
 * These must contain IDs that actually exist in SOUND_LIBRARY.
 *
 * We resolve the IDs below from the library so that if the library
 * changes, the sequencer still gets valid defaults.
 */
const SOUND_IDS = Array.isArray(SOUND_LIBRARY)
  ? SOUND_LIBRARY.map((sound) => sound?.id).filter(Boolean)
  : [];

/**
 * Use the first available sounds in the library.
 *
 * If there are fewer than MAX_TRACKS sounds, the sounds repeat.
 */
export const DEFAULT_TRACK_SOUNDS = Array.from(
  { length: MAX_TRACKS },
  (_, index) => {
    if (SOUND_IDS.length === 0) {
      return null;
    }

    return SOUND_IDS[index % SOUND_IDS.length];
  },
);

/**
 * If your sound library has specific sounds you want for each track,
 * you can instead replace DEFAULT_TRACK_SOUNDS above with something like:
 *
 * export const DEFAULT_TRACK_SOUNDS = [
 *   "kick",
 *   "snare",
 *   "hihat",
 *   "bass",
 *   "piano",
 *   "lead",
 *   "pad",
 *   "pluck",
 * ];
 *
 * Those IDs must exactly match SOUND_LIBRARY.
 */

export const NOTE_OPTIONS = [
  "C2",
  "C#2",
  "D2",
  "D#2",
  "E2",
  "F2",
  "F#2",
  "G2",
  "G#2",
  "A2",
  "A#2",
  "B2",
  "C3",
  "C#3",
  "D3",
  "D#3",
  "E3",
  "F3",
  "F#3",
  "G3",
  "G#3",
  "A3",
  "A#3",
  "B3",
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",
  "C5",
  "C#5",
  "D5",
  "D#5",
  "E5",
  "F5",
  "F#5",
  "G5",
  "G#5",
  "A5",
  "A#5",
  "B5",
];

export const DURATION_OPTIONS = ["16n", "8n", "4n", "2n"];

/**
 * ---------------------------------------------------------
 * PROJECT / TRACK HELPERS
 * ---------------------------------------------------------
 */

export function createEmptyGrid(numTracks = MIN_TRACKS) {
  return Array.from(
    { length: numTracks },
    () => Array(NUM_STEPS).fill(false),
  );
}

/**
 * Parallel structure to `grid`:
 *
 * stepNotes[track][step] = note string | null
 *
 * null means "inherit the track's default note".
 */
export function createEmptyStepNotes(numTracks = MIN_TRACKS) {
  return Array.from(
    { length: numTracks },
    () => Array(NUM_STEPS).fill(null),
  );
}

/**
 * Create default settings for all tracks.
 */
export function createDefaultTrackSettings(numTracks = MIN_TRACKS) {
  return Array.from({ length: numTracks }, (_, index) => {
    const soundId =
      DEFAULT_TRACK_SOUNDS[index] ||
      DEFAULT_TRACK_SOUNDS[0] ||
      SOUND_IDS[0] ||
      null;

    return createDefaultTrack(soundId);
  });
}

/**
 * Create settings for a single track.
 */
export function createDefaultTrack(soundId) {
  const sound = soundId ? getSoundById(soundId) : null;

  /**
   * If an invalid sound ID somehow gets passed in, fall back to
   * the first valid sound in the library.
   */
  const fallbackSound =
    sound ||
    (SOUND_IDS.length > 0 ? getSoundById(SOUND_IDS[0]) : null);

  const track = {
    sound: fallbackSound ? fallbackSound.id : null,

    muted: false,
    soloed: false,

    volume: 1,

    reverb: {
      enabled: false,
      wet: 0.35,
      decay: 1.5,
    },

    delay: {
      enabled: false,
      time: 0.25,
      feedback: 0.3,
      wet: 0.3,
    },

    filter: {
      lowpass: 20000,
      highpass: 20,
      enabled: false,
    },
  };

  /**
   * Synth tracks need a default note and duration.
   */
  if (fallbackSound?.type === "synth") {
    track.note = fallbackSound.synth?.note || "C4";

    track.duration =
      fallbackSound.synth?.duration ||
      "8n";
  }

  return track;
}

/**
 * Return the available sound library.
 */
export function getAvailableSounds() {
  return SOUND_LIBRARY;
}

/**
 * ---------------------------------------------------------
 * SMART RANDOM PATTERN GENERATOR
 * ---------------------------------------------------------
 */

/**
 * Euclidean rhythm: distributes `pulses` evenly across `steps`.
 *
 * Returns an array of booleans.
 *
 * Example:
 *
 * euclidean(5, 16)
 */
function euclidean(pulses, steps) {
  if (pulses <= 0) {
    return Array(steps).fill(false);
  }

  if (pulses >= steps) {
    return Array(steps).fill(true);
  }

  const pattern = Array(steps).fill(false);

  let remainder = pulses;

  for (let i = 0; i < steps; i++) {
    remainder += pulses;

    if (remainder >= steps) {
      remainder -= steps;
      pattern[i] = true;
    }
  }

  return pattern;
}

/**
 * Rotate an array by `offset` positions.
 */
function rotate(arr, offset) {
  const n = arr.length;

  if (n === 0) {
    return [];
  }

  const shift = ((offset % n) + n) % n;

  return [
    ...arr.slice(shift),
    ...arr.slice(0, shift),
  ];
}

/**
 * Generate a smart random pattern for 16 steps.
 *
 * Strategies:
 *
 * - Euclidean: 2-13 pulses
 * - Sparse random: 2-5 hits
 * - Medium random: 6-10 hits
 * - Dense random: 11-14 hits
 */
export function generateSmartPattern() {
  const STEPS = 16;
  const strategy = Math.random();

  if (strategy < 0.5) {
    // Euclidean
    const pulses = 2 + Math.floor(Math.random() * 12);

    const pattern = euclidean(pulses, STEPS);

    const rotation = Math.floor(Math.random() * STEPS);

    return rotate(pattern, rotation);
  }

  if (strategy < 0.7) {
    // Sparse random
    const count = 2 + Math.floor(Math.random() * 4);

    return randomDensity(count, STEPS);
  }

  if (strategy < 0.9) {
    // Medium random
    const count = 6 + Math.floor(Math.random() * 5);

    return randomDensity(count, STEPS);
  }

  // Dense random
  const count = 11 + Math.floor(Math.random() * 4);

  return randomDensity(count, STEPS);
}

/**
 * Place exactly `count` random true values in an array.
 */
function randomDensity(count, steps) {
  const pattern = Array(steps).fill(false);

  const indices = Array.from(
    { length: steps },
    (_, index) => index,
  );

  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [indices[i], indices[j]] = [
      indices[j],
      indices[i],
    ];
  }

  for (let i = 0; i < Math.min(count, steps); i++) {
    pattern[indices[i]] = true;
  }

  return pattern;
}

/**
 * ---------------------------------------------------------
 * SCALES & ARPEGGIATOR
 * ---------------------------------------------------------
 */

/**
 * Scale definitions as semitone offsets from C.
 */
export const SCALES = {
  "major-pentatonic": [0, 2, 4, 7, 9],

  "minor-pentatonic": [0, 3, 5, 7, 10],

  major: [0, 2, 4, 5, 7, 9, 11],

  "natural-minor": [0, 2, 3, 5, 7, 8, 10],
};

const NOTE_NAMES = [
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

/**
 * Convert MIDI number to note name.
 */
function midiToNoteName(midi) {
  const normalizedMidi =
    ((midi % 128) + 128) % 128;

  const name =
    NOTE_NAMES[normalizedMidi % 12];

  const octave =
    Math.floor(normalizedMidi / 12) - 1;

  return `${name}${octave}`;
}

/**
 * Convert note name to MIDI number.
 */
function noteNameToMidi(name) {
  const match =
    /^([A-G]#?)(-?\d+)$/.exec(name);

  if (!match) {
    return null;
  }

  const index =
    NOTE_NAMES.indexOf(match[1]);

  if (index === -1) {
    return null;
  }

  const octave =
    parseInt(match[2], 10);

  return (octave + 1) * 12 + index;
}

/**
 * ---------------------------------------------------------
 * CHORDS
 * ---------------------------------------------------------
 */

export const CHORD_TYPES = {
  major: [0, 4, 7],

  minor: [0, 3, 7],

  maj7: [0, 4, 7, 11],

  min7: [0, 3, 7, 10],

  dim: [0, 3, 6],

  sus4: [0, 5, 7],
};

/**
 * Build a chord from a root note and chord type.
 */
export function buildChord(
  rootNote,
  type = "major",
) {
  const root =
    noteNameToMidi(rootNote);

  if (root == null) {
    return [rootNote];
  }

  const intervals =
    CHORD_TYPES[type] ||
    CHORD_TYPES.major;

  return intervals.map(
    (offset) =>
      midiToNoteName(root + offset),
  );
}

/**
 * ---------------------------------------------------------
 * SCALE HELPERS
 * ---------------------------------------------------------
 */

/**
 * Build a flat list of note names for a scale
 * across multiple octaves.
 */
export function buildScaleNotes(
  scaleId = "major-pentatonic",
  baseOctave = 3,
  numOctaves = 2,
) {
  const offsets =
    SCALES[scaleId] ||
    SCALES["major-pentatonic"];

  const notes = [];

  for (
    let octave = baseOctave;
    octave < baseOctave + numOctaves;
    octave++
  ) {
    for (const offset of offsets) {
      notes.push(
        midiToNoteName(
          (octave + 1) * 12 + offset,
        ),
      );
    }
  }

  return notes;
}

/**
 * Assign scale notes to active steps in a rhythm pattern.
 *
 * Returns a length-16 array aligned with the pattern.
 */
export function generateArpNotes(
  pattern,
  {
    scaleId = "major-pentatonic",
    direction = "up-down",
    baseOctave = 3,
  } = {},
) {
  const scale = buildScaleNotes(
    scaleId,
    baseOctave,
    2,
  );

  const len = scale.length;

  const output = Array(
    pattern.length,
  ).fill(null);

  if (len === 0) {
    return output;
  }

  let sequence;

  if (direction === "down") {
    sequence = Array.from(
      { length: len },
      (_, i) => len - 1 - i,
    );
  } else if (direction === "up-down") {
    sequence = [];

    for (let i = 0; i < len; i++) {
      sequence.push(i);
    }

    for (
      let i = len - 2;
      i > 0;
      i--
    ) {
      sequence.push(i);
    }
  } else {
    sequence = Array.from(
      { length: len },
      (_, i) => i,
    );
  }

  let cursor = 0;

  for (
    let step = 0;
    step < pattern.length;
    step++
  ) {
    if (!pattern[step]) {
      continue;
    }

    if (direction === "random") {
      output[step] =
        scale[
          Math.floor(
            Math.random() * len,
          )
        ];
    } else {
      output[step] =
        scale[
          sequence[
            cursor % sequence.length
          ]
        ];

      cursor++;
    }
  }

  return output;
}

/**
 * ---------------------------------------------------------
 * PROJECT NORMALIZATION
 * ---------------------------------------------------------
 */

/**
 * Normalize project data coming from the backend.
 *
 * Database project fields:
 *
 * projects.grid
 * projects.track_settings
 * projects.step_notes
 * projects.arrangement
 * projects.track_order
 */
export function normalizeProject(project) {
  const rawGrid =
    Array.isArray(project?.grid)
      ? project.grid
      : createEmptyGrid(MIN_TRACKS);

  const rawSettings =
    Array.isArray(
      project?.track_settings,
    )
      ? project.track_settings
      : createDefaultTrackSettings(
          MIN_TRACKS,
        );

  /**
   * Make sure we always have between MIN_TRACKS
   * and MAX_TRACKS.
   */
  const trackCount = Math.min(
    Math.max(
      Math.max(
        rawGrid.length,
        rawSettings.length,
      ),
      MIN_TRACKS,
    ),
    MAX_TRACKS,
  );

  /**
   * -------------------------------------------------------
   * GRID
   * -------------------------------------------------------
   */

  const grid = Array.from(
    { length: trackCount },
    (_, trackIndex) => {
      const row =
        rawGrid[trackIndex];

      if (!Array.isArray(row)) {
        return Array(
          NUM_STEPS,
        ).fill(false);
      }

      return Array.from(
        { length: NUM_STEPS },
        (_, stepIndex) =>
          Boolean(
            row[stepIndex],
          ),
      );
    },
  );

  /**
   * -------------------------------------------------------
   * STEP NOTES
   * -------------------------------------------------------
   */

  const rawStepNotes =
    Array.isArray(
      project?.step_notes,
    )
      ? project.step_notes
      : createEmptyStepNotes(
          trackCount,
        );

  const step_notes =
    Array.from(
      { length: trackCount },
      (_, trackIndex) => {
        const row =
          rawStepNotes[
            trackIndex
          ];

        if (!Array.isArray(row)) {
          return Array(
            NUM_STEPS,
          ).fill(null);
        }

        return Array.from(
          { length: NUM_STEPS },
          (_, stepIndex) => {
            const cell =
              row[stepIndex];

            /**
             * Normal single-note cell.
             */
            if (
              typeof cell ===
              "string"
            ) {
              return cell;
            }

            /**
             * Backwards compatibility for
             * cells that may contain multiple notes.
             */
            if (
              Array.isArray(cell)
            ) {
              return cell.filter(
                (note) =>
                  typeof note ===
                  "string",
              );
            }

            return null;
          },
        );
      },
    );

  /**
   * -------------------------------------------------------
   * TRACK SETTINGS
   * -------------------------------------------------------
   */

  const defaults =
    createDefaultTrackSettings(
      trackCount,
    );

  const trackSettings =
    Array.from(
      {
        length: trackCount,
      },
      (_, trackIndex) => {
        const existing =
          rawSettings[
            trackIndex
          ];

        /**
         * Missing track settings:
         * use a completely valid default track.
         */
        if (!existing) {
          return defaults[
            trackIndex
          ];
        }

        /**
         * Validate the sound.
         *
         * Old projects may contain:
         *
         * sound: null
         *
         * or an invalid sound ID.
         *
         * In either case, use the default sound.
         */
        const requestedSound =
          existing.sound
            ? getSoundById(
                existing.sound,
              )
            : null;

        const defaultSound =
          getSoundById(
            DEFAULT_TRACK_SOUNDS[
              trackIndex
            ] ||
              DEFAULT_TRACK_SOUNDS[0] ||
              SOUND_IDS[0],
          );

        const resolvedSound =
          requestedSound ||
          defaultSound ||
          null;

        const defaultTrack =
          defaults[
            trackIndex
          ];

        const normalizedTrack = {
          ...defaultTrack,

          ...existing,

          /**
           * This is the important part:
           *
           * Never allow a missing/invalid sound to
           * silently overwrite the valid default.
           */
          sound:
            resolvedSound?.id ||
            defaultTrack.sound ||
            null,

          reverb: {
            ...defaultTrack.reverb,

            ...(existing.reverb ||
              {}),
          },

          delay: {
            ...defaultTrack.delay,

            ...(existing.delay ||
              {}),
          },

          filter: {
            ...defaultTrack.filter,

            ...(existing.filter ||
              {}),
          },

          muted:
            existing.muted ??
            false,

          soloed:
            existing.soloed ??
            false,
        };

        /**
         * Synth tracks need valid note/duration
         * defaults even when loading old projects.
         */
        if (
          resolvedSound?.type ===
          "synth"
        ) {
          normalizedTrack.note =
            existing.note ??
            resolvedSound.synth
              ?.note ??
            defaultTrack.note ??
            "C4";

          normalizedTrack.duration =
            existing.duration ??
            resolvedSound.synth
              ?.duration ??
            defaultTrack.duration ??
            "8n";
        } else {
          /**
           * Don't leave stale synth settings
           * on sample/non-synth sounds.
           */
          delete normalizedTrack.note;
          delete normalizedTrack.duration;
        }

        return normalizedTrack;
      },
    );

  /**
   * -------------------------------------------------------
   * TRACK ORDER
   * -------------------------------------------------------
   *
   * track_order is the display order of arrangement lanes.
   *
   * It must be a valid permutation of:
   *
   * [0, 1, 2, ... trackCount - 1]
   */

  const defaultOrder =
    Array.from(
      {
        length: trackCount,
      },
      (_, index) => index,
    );

  const rawOrder =
    project?.track_order;

  const track_order =
    Array.isArray(rawOrder) &&
    rawOrder.length ===
      trackCount &&
    new Set(rawOrder).size ===
      trackCount &&
    rawOrder.every(
      (index) =>
        Number.isInteger(index) &&
        index >= 0 &&
        index < trackCount,
    )
      ? rawOrder
      : defaultOrder;

  /**
   * -------------------------------------------------------
   * FINAL PROJECT
   * -------------------------------------------------------
   */

  return {
    ...project,

    name:
      project?.name || "",

    description:
      project?.description || "",

    tempo:
      Number(project?.tempo) ||
      120,

    grid,

    step_notes,

    track_settings:
      trackSettings,

    arrangement:
      Array.isArray(
        project?.arrangement,
      )
        ? project.arrangement
        : [],

    track_order,

    shared_id:
      project?.shared_id || null,
  };
}