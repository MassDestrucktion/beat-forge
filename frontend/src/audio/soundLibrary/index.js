// src/audio/soundLibrary/index.js

export {
  SOUND_LIBRARY,
} from "./soundLibrary.js";

export {
  getSoundById,
  getSoundsByCategory,
  getSoundsByType,
  getSampleSounds,
  getSynthSounds,
  getPianoSounds,
  getPlayableSounds,
  searchSounds,
  getSoundLabel,
} from "./soundUtils";

export {
  SOUND_CATEGORIES,
} from "./soundCategories";

export {
  soundManager,
} from "./soundManager";

export {
  createSoundEngine,
  playSound,
  normalizeNotes,
  toneDurationToSteps,
  stepsToToneDuration,
} from "./soundEngine";

export {
  createSynthForSound,
} from "./createSynth";

export {
  createPiano,
  PIANO_NOTES,
  getPianoVelocityLayer,
} from "./createPiano";

export {
  DEFAULT_AUDIO_EFFECTS,
  normalizeAudioEffects,
  createAudioEffectChain,
} from "./audioEffects";