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

export const DEFAULT_TRACK_SOUNDS = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];

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
  return Array.from({ length: numTracks }, () => Array(NUM_STEPS).fill(false));
}

export function createDefaultTrackSettings(numTracks = MIN_TRACKS) {
  return Array.from({ length: numTracks }, (_, i) =>
    createDefaultTrack(DEFAULT_TRACK_SOUNDS[i] || DEFAULT_TRACK_SOUNDS[0]),
  );
}

export function createDefaultTrack(soundId) {
  const sound = soundId ? getSoundById(soundId) : null;

  const track = {
    sound: sound ? sound.id : null,
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

  if (sound?.type === "synth") {
    track.note = sound.synth?.note;
    track.duration = sound.synth?.duration || "8n";
  }

  return track;
}

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
 * Returns an array of booleans.
 *
 * Example: euclidean(5, 16) → classic "money beat" pattern
 */
function euclidean(pulses, steps) {
  if (pulses <= 0) return Array(steps).fill(false);
  if (pulses >= steps) return Array(steps).fill(true);

  // Build the Euclidean pattern using Bjorklund's algorithm
  const pattern = [];
  const divisor = steps - pulses;
  let remainder = pulses;

  for (let i = 0; i < steps; i++) {
    pattern.push(false);
  }

  let index = 0;
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
 * Rotate an array by `offset` positions (wrapping).
 */
function rotate(arr, offset) {
  const n = arr.length;
  const shift = ((offset % n) + n) % n;
  return [...arr.slice(shift), ...arr.slice(0, shift)];
}

/**
 * Generate a smart random pattern for 16 steps.
 *
 * Randomly picks one of these strategies:
 *   - Euclidean: 2-13 pulses, randomly rotated
 *   - Sparse random: 2-5 random steps
 *   - Medium random: 6-10 random steps
 *   - Dense random: 11-14 random steps
 *
 * Every call produces a different pattern.
 */
export function generateSmartPattern() {
  const STEPS = 16;
  const strategy = Math.random();

  if (strategy < 0.5) {
    // Euclidean (50% chance) — most musical
    const pulses = 2 + Math.floor(Math.random() * 12); // 2-13
    const pattern = euclidean(pulses, STEPS);
    const rotation = Math.floor(Math.random() * STEPS);
    return rotate(pattern, rotation);
  } else if (strategy < 0.7) {
    // Sparse random (20% chance) — 2-5 hits
    const count = 2 + Math.floor(Math.random() * 4);
    return randomDensity(count, STEPS);
  } else if (strategy < 0.9) {
    // Medium random (20% chance) — 6-10 hits
    const count = 6 + Math.floor(Math.random() * 5);
    return randomDensity(count, STEPS);
  } else {
    // Dense random (10% chance) — 11-14 hits
    const count = 11 + Math.floor(Math.random() * 4);
    return randomDensity(count, STEPS);
  }
}

/**
 * Place exactly `count` random true values in an array of `steps` falses.
 */
function randomDensity(count, steps) {
  const pattern = Array(steps).fill(false);
  const indices = Array.from({ length: steps }, (_, i) => i);

  // Fisher-Yates shuffle, take first `count`
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
 * Normalize project data coming from the backend.
 *
 * The database project is the source of truth:
 *
 * projects.grid
 * projects.track_settings
 * projects.arrangement
 */
export function normalizeProject(project) {
  const rawGrid = Array.isArray(project?.grid)
    ? project.grid
    : createEmptyGrid(MIN_TRACKS);

  const rawSettings = Array.isArray(project?.track_settings)
    ? project.track_settings
    : createDefaultTrackSettings(MIN_TRACKS);

  const trackCount = Math.min(
    Math.max(Math.max(rawGrid.length, rawSettings.length), MIN_TRACKS),
    MAX_TRACKS,
  );

  const grid = Array.from({ length: trackCount }, (_, trackIndex) => {
    const row = rawGrid[trackIndex];

    if (!Array.isArray(row)) {
      return Array(NUM_STEPS).fill(false);
    }

    return Array.from({ length: NUM_STEPS }, (_, stepIndex) =>
      Boolean(row[stepIndex]),
    );
  });

  const defaults = createDefaultTrackSettings(trackCount);

  const trackSettings = Array.from({ length: trackCount }, (_, trackIndex) => {
    const existing = rawSettings[trackIndex];

    if (!existing) {
      return defaults[trackIndex];
    }

    return {
      ...defaults[trackIndex],
      ...existing,

      reverb: {
        ...defaults[trackIndex].reverb,
        ...(existing.reverb || {}),
      },

      delay: {
        ...defaults[trackIndex].delay,
        ...(existing.delay || {}),
      },

      filter: {
        ...defaults[trackIndex].filter,
        ...(existing.filter || {}),
      },

      muted: existing.muted ?? false,
      soloed: existing.soloed ?? false,
    };
  });

  /**
   * track_order is the display order of arrangement lanes. It must be a
   * permutation of [0..trackCount-1]; anything else falls back to the
   * default order.
   */
  const defaultOrder = Array.from({ length: trackCount }, (_, i) => i);

  const rawOrder = project?.track_order;

  const track_order =
    Array.isArray(rawOrder) &&
    rawOrder.length === trackCount &&
    new Set(rawOrder).size === trackCount &&
    rawOrder.every((i) => Number.isInteger(i) && i >= 0 && i < trackCount)
      ? rawOrder
      : defaultOrder;

  return {
    ...project,
    name: project?.name || "",
    description: project?.description || "",
    tempo: Number(project?.tempo) || 120,
    grid,
    track_settings: trackSettings,
    arrangement: Array.isArray(project?.arrangement) ? project.arrangement : [],
    track_order,
    shared_id: project?.shared_id || null,
  };
}
