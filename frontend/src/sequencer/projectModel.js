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
 * These are retained for backwards compatibility with older
 * saved projects. New tracks are intentionally blank.
 */
const SOUND_IDS = Array.isArray(SOUND_LIBRARY)
  ? SOUND_LIBRARY.map((sound) => sound?.id).filter(Boolean)
  : [];

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
 * ---------------------------------------------------------
 * NOTE / SYNTH OPTIONS
 * ---------------------------------------------------------
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

export function createEmptyStepNotes(numTracks = MIN_TRACKS) {
  return Array.from(
    { length: numTracks },
    () => Array(NUM_STEPS).fill(null),
  );
}

/**
 * Create default settings for all tracks.
 *
 * New tracks intentionally have no sound selected.
 */
export function createDefaultTrackSettings(numTracks = MIN_TRACKS) {
  return Array.from(
    { length: numTracks },
    () => createDefaultTrack(null),
  );
}

/**
 * Create settings for a single track.
 */
export function createDefaultTrack(soundId = null) {
  /**
   * Only resolve a sound when an id was explicitly supplied.
   *
   * null means intentionally blank.
   */
  const sound = soundId ? getSoundById(soundId) : null;

  const track = {
    sound: sound ? sound.id : null,

    muted: false,
    soloed: false,

    volume: 1,

    /**
     * Reverb defaults to OFF.
     */
    reverb: {
      enabled: false,
      wet: 0.35,
      decay: 1.5,
    },

    /**
     * Delay defaults to OFF.
     */
    delay: {
      enabled: false,
      time: 0.25,
      feedback: 0.3,
      wet: 0.3,
    },

    /**
     * Filter defaults to OFF.
     *
     * These frequency values are the neutral/bypass values:
     *
     * LPF = 20000 Hz
     * HPF = 20 Hz
     */
    filter: {
      enabled: false,
      lowpass: 20000,
      highpass: 20,
    },

    /**
     * Per-track scale.
     */
    scale: {
      root: "C",
      type: "major-pentatonic",
    },
  };

  /**
   * Synth tracks get a default note and duration.
   */
  if (sound?.type === "synth") {
    track.note = sound.synth?.note || "C4";

    track.duration = sound.synth?.duration || "8n";
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

function rotate(arr, offset) {
  const n = arr.length;

  if (n === 0) {
    return [];
  }

  const shift = ((offset % n) + n) % n;

  return [...arr.slice(shift), ...arr.slice(0, shift)];
}

export function generateSmartPattern() {
  const STEPS = 16;
  const strategy = Math.random();

  if (strategy < 0.5) {
    const pulses = 2 + Math.floor(Math.random() * 12);

    const pattern = euclidean(pulses, STEPS);

    const rotation = Math.floor(Math.random() * STEPS);

    return rotate(pattern, rotation);
  }

  if (strategy < 0.7) {
    const count = 2 + Math.floor(Math.random() * 4);

    return randomDensity(count, STEPS);
  }

  if (strategy < 0.9) {
    const count = 6 + Math.floor(Math.random() * 5);

    return randomDensity(count, STEPS);
  }

  const count = 11 + Math.floor(Math.random() * 4);

  return randomDensity(count, STEPS);
}

function randomDensity(count, steps) {
  const pattern = Array(steps).fill(false);

  const indices = Array.from(
    { length: steps },
    (_, index) => index,
  );

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [indices[i], indices[j]] = [indices[j], indices[i]];
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

function midiToNoteName(midi) {
  const normalizedMidi = ((midi % 128) + 128) % 128;

  const name = NOTE_NAMES[normalizedMidi % 12];

  const octave = Math.floor(normalizedMidi / 12) - 1;

  return `${name}${octave}`;
}

function noteNameToMidi(name) {
  const match = /^([A-G]#?)(-?\d+)$/.exec(name);

  if (!match) {
    return null;
  }

  const index = NOTE_NAMES.indexOf(match[1]);

  if (index === -1) {
    return null;
  }

  const octave = parseInt(match[2], 10);

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

export function buildChord(rootNote, type = "major") {
  const root = noteNameToMidi(rootNote);

  if (root == null) {
    return [rootNote];
  }

  const intervals = CHORD_TYPES[type] || CHORD_TYPES.major;

  return intervals.map((offset) =>
    midiToNoteName(root + offset),
  );
}

/**
 * ---------------------------------------------------------
 * SCALE HELPERS
 * ---------------------------------------------------------
 */

export function buildScaleNotes(
  scaleId = "major-pentatonic",
  baseOctave = 3,
  numOctaves = 2,
) {
  const offsets =
    SCALES[scaleId] || SCALES["major-pentatonic"];

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

export const SCALE_ROOT_OPTIONS = NOTE_NAMES;

export const SCALE_TYPE_OPTIONS = Object.keys(SCALES);

export function getScalePitchClasses(
  root = "C",
  scaleId = "major-pentatonic",
) {
  const rootIndex = NOTE_NAMES.indexOf(root);

  const offsets =
    SCALES[scaleId] || SCALES["major-pentatonic"];

  if (rootIndex === -1) {
    return new Set(
      offsets.map((offset) => offset % 12),
    );
  }

  return new Set(
    offsets.map(
      (offset) => (rootIndex + offset) % 12,
    ),
  );
}

export function isNoteInScale(
  noteName,
  root,
  scaleId,
) {
  if (!root) {
    return true;
  }

  const midi = noteNameToMidi(noteName);

  if (midi == null) {
    return true;
  }

  return getScalePitchClasses(
    root,
    scaleId,
  ).has(midi % 12);
}

export function buildScaleNotesFromRoot(
  root = "C",
  scaleId = "major-pentatonic",
  baseOctave = 3,
  numOctaves = 2,
) {
  const rootIndex = NOTE_NAMES.indexOf(root);

  if (rootIndex === -1) {
    return buildScaleNotes(
      scaleId,
      baseOctave,
      numOctaves,
    );
  }

  const offsets =
    SCALES[scaleId] || SCALES["major-pentatonic"];

  const rootMidi =
    (baseOctave + 1) * 12 + rootIndex;

  const notes = [];

  const total = offsets.length * numOctaves;

  for (let i = 0; i < total; i++) {
    const octaveOffset = Math.floor(
      i / offsets.length,
    );

    const interval =
      offsets[i % offsets.length];

    notes.push(
      midiToNoteName(
        rootMidi +
          octaveOffset * 12 +
          interval,
      ),
    );
  }

  return notes;
}

export function generateArpNotes(
  pattern,
  {
    root = "C",
    scaleId = "major-pentatonic",
    direction = "up-down",
    baseOctave = 3,
  } = {},
) {
  const scale = buildScaleNotesFromRoot(
    root,
    scaleId,
    baseOctave,
    2,
  );

  const len = scale.length;

  const output = Array(pattern.length).fill(null);

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

    for (let i = len - 2; i > 0; i--) {
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

export function normalizeProject(project) {
  const rawGrid = Array.isArray(project?.grid)
    ? project.grid
    : createEmptyGrid(MIN_TRACKS);

  const rawSettings = Array.isArray(
    project?.track_settings,
  )
    ? project.track_settings
    : createDefaultTrackSettings(
        MIN_TRACKS,
      );

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
      const row = rawGrid[trackIndex];

      if (!Array.isArray(row)) {
        return Array(NUM_STEPS).fill(false);
      }

      return Array.from(
        { length: NUM_STEPS },
        (_, stepIndex) =>
          Boolean(row[stepIndex]),
      );
    },
  );

  /**
   * -------------------------------------------------------
   * STEP NOTES
   * -------------------------------------------------------
   */

  const rawStepNotes = Array.isArray(
    project?.step_notes,
  )
    ? project.step_notes
    : createEmptyStepNotes(
        trackCount,
      );

  const step_notes = Array.from(
    { length: trackCount },
    (_, trackIndex) => {
      const row =
        rawStepNotes[trackIndex];

      if (!Array.isArray(row)) {
        return Array(NUM_STEPS).fill(null);
      }

      return Array.from(
        { length: NUM_STEPS },
        (_, stepIndex) => {
          const cell =
            row[stepIndex];

          if (typeof cell === "string") {
            return cell;
          }

          if (Array.isArray(cell)) {
            return cell.filter(
              (note) =>
                typeof note === "string",
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

  const trackSettings = Array.from(
    {
      length: trackCount,
    },
    (_, trackIndex) => {
      const existing =
        rawSettings[trackIndex];

      if (!existing) {
        return defaults[trackIndex];
      }

      /**
       * Preserve intentionally blank tracks.
       */
      const isExplicitBlank =
        existing.sound === null;

      const requestedSound =
        existing.sound
          ? getSoundById(existing.sound)
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
        isExplicitBlank
          ? null
          : requestedSound ||
            defaultSound ||
            null;

      const defaultTrack =
        defaults[trackIndex];

      const normalizedTrack = {
        ...defaultTrack,

        ...existing,

        sound: isExplicitBlank
          ? null
          : resolvedSound?.id ||
            defaultTrack.sound ||
            null,

        /**
         * Reverb defaults.
         */
        reverb: {
          ...defaultTrack.reverb,
          ...(existing.reverb || {}),
          enabled:
            existing.reverb
              ?.enabled ??
            false,
        },

        /**
         * Delay defaults.
         */
        delay: {
          ...defaultTrack.delay,
          ...(existing.delay || {}),
          enabled:
            existing.delay
              ?.enabled ??
            false,
        },

        /**
         * Filter defaults.
         *
         * Older projects may not have `enabled`.
         * Those projects should start with the filter bypassed.
         */
        filter: {
          ...defaultTrack.filter,
          ...(existing.filter || {}),
          enabled:
            existing.filter
              ?.enabled ??
            false,

          lowpass:
            Number.isFinite(
              existing.filter?.lowpass,
            )
              ? existing.filter.lowpass
              : 20000,

          highpass:
            Number.isFinite(
              existing.filter?.highpass,
            )
              ? existing.filter.highpass
              : 20,
        },

        scale: {
          ...defaultTrack.scale,
          ...(existing.scale || {}),
        },

        muted:
          existing.muted ?? false,

        soloed:
          existing.soloed ?? false,

        volume:
          Number.isFinite(existing.volume)
            ? existing.volume
            : 1,
      };

      /**
       * Synth tracks need valid note/duration.
       */
      if (resolvedSound?.type === "synth") {
        normalizedTrack.note =
          existing.note ??
          resolvedSound.synth?.note ??
          defaultTrack.note ??
          "C4";

        normalizedTrack.duration =
          existing.duration ??
          resolvedSound.synth?.duration ??
          defaultTrack.duration ??
          "8n";
      } else {
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
   */

  const defaultOrder = Array.from(
    {
      length: trackCount,
    },
    (_, index) => index,
  );

  const rawOrder =
    project?.track_order;

  const track_order =
    Array.isArray(rawOrder) &&
    rawOrder.length === trackCount &&
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

    name: project?.name || "",

    description:
      project?.description || "",

    tempo:
      Number(project?.tempo) || 120,

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