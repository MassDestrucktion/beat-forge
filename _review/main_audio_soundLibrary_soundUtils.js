import {
  SOUND_LIBRARY,
} from "./soundLibrary";

export function getSoundById(id) {
  return SOUND_LIBRARY.find(
    (sound) =>
      sound.id === id
  );
}

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

export function getSoundsByType(
  type
) {
  return SOUND_LIBRARY.filter(
    (sound) =>
      sound.type === type
  );
}

export function getSampleSounds() {
  return getSoundsByType(
    "sample"
  );
}

export function getSynthSounds() {
  return getSoundsByType(
    "synth"
  );
}

export function searchSounds(
  query
) {
  const normalized =
    query.trim().toLowerCase();

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
