// src/audio/soundLibrary/soundUtils.js

import {
  SOUND_LIBRARY,
} from "./soundLibrary";

/**
 * Get a sound by ID.
 */
export function getSoundById(
  id
) {
  return SOUND_LIBRARY.find(
    (sound) =>
      sound.id === id
  );
}

/**
 * Get sounds by category/subcategory.
 */
export function getSoundsByCategory(
  category,
  subcategory
) {
  return SOUND_LIBRARY.filter(
    (sound) =>
      sound.category === category &&
      (
        !subcategory ||
        sound.subcategory ===
          subcategory
      )
  );
}

/**
 * Get sounds by type.
 */
export function getSoundsByType(
  type
) {
  return SOUND_LIBRARY.filter(
    (sound) =>
      sound.type === type
  );
}

/**
 * Get regular one-shot samples.
 */
export function getSampleSounds() {
  return getSoundsByType(
    "sample"
  );
}

/**
 * Get synth sounds.
 */
export function getSynthSounds() {
  return getSoundsByType(
    "synth"
  );
}

/**
 * Get sampled instruments.
 */
export function getPianoSounds() {
  return getSoundsByType(
    "piano"
  );
}

/**
 * Get all playable sounds.
 */
export function getPlayableSounds() {
  return SOUND_LIBRARY.filter(
    (sound) =>
      sound.type === "sample" ||
      sound.type === "synth" ||
      sound.type === "piano"
  );
}

/**
 * Search sound library.
 */
export function searchSounds(
  query
) {
  const normalized =
    String(query || "")
      .trim()
      .toLowerCase();

  if (!normalized) {
    return SOUND_LIBRARY;
  }

  return SOUND_LIBRARY.filter(
    (sound) => {
      const searchable = [
        sound.id,
        sound.name,
        sound.category,
        sound.subcategory,
        sound.description,
        ...(sound.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(
        normalized
      );
    }
  );
}

/**
 * Get human-readable sound label.
 */
export function getSoundLabel(
  soundId
) {
  const sound =
    getSoundById(soundId);

  return (
    sound?.name ||
    soundId ||
    "Unknown Sound"
  );
}