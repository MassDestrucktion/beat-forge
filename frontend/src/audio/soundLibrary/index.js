// src/audio/soundLibrary/index.js

export {
  SOUND_LIBRARY,
} from "./soundLibrary";


export {
  getSoundById,
  getSoundsByCategory,
  getSoundsByType,
  getSampleSounds,
  getSynthSounds,
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
} from "./soundEngine";


export {
  createSynthForSound,
} from "./createSynth";


export {
  DEFAULT_AUDIO_EFFECTS,
  normalizeAudioEffects,
  createAudioEffectChain,
} from "./audioEffects";