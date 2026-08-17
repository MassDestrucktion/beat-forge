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
  "drums.kicks.cr78",
  "drums.snares.cr78",
  "drums.hihats.cr78",
  "synths.stabs.classic",
  "drums.claps.synth",
  "bass.sub.sine",
  "synths.leads.basic",
  "synths.bells.digital",
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
  const sound = getSoundById(soundId);

  const track = {
    sound: sound ? sound.id : soundId,
    muted: false,
    soloed: false,

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

  return {
    ...project,
    name: project?.name || "",
    description: project?.description || "",
    tempo: Number(project?.tempo) || 120,
    grid,
    track_settings: trackSettings,
    arrangement: Array.isArray(project?.arrangement) ? project.arrangement : [],
    shared_id: project?.shared_id || null,
  };
}
