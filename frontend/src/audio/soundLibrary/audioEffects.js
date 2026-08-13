// src/audio/soundLibrary/audioEffects.js

import * as Tone from "tone";

/**
 * =========================================================
 * DEFAULT EFFECT SETTINGS
 * =========================================================
 */

export const DEFAULT_AUDIO_EFFECTS = {
  volume: 1,

  pan: 0,

  filter: {
    enabled: false,
    type: "lowpass",
    frequency: 2000,
    resonance: 1,
  },

  delay: {
    enabled: false,
    time: "8n",
    feedback: 0.3,
    wet: 0.25,
  },

  distortion: {
    enabled: false,
    amount: 0.2,
    wet: 0.25,
  },

  reverb: {
    enabled: false,
    wet: 0.35,
    decay: 1.5,
  },
};

/**
 * =========================================================
 * NORMALIZE EFFECT SETTINGS
 * =========================================================
 */

export function normalizeAudioEffects(
  settings = {}
) {
  return {
    volume:
      Number.isFinite(
        settings.volume
      )
        ? settings.volume
        : DEFAULT_AUDIO_EFFECTS.volume,

    pan:
      Number.isFinite(
        settings.pan
      )
        ? settings.pan
        : DEFAULT_AUDIO_EFFECTS.pan,

    filter: {
      ...DEFAULT_AUDIO_EFFECTS.filter,
      ...(settings.filter || {}),
    },

    delay: {
      ...DEFAULT_AUDIO_EFFECTS.delay,
      ...(settings.delay || {}),
    },

    distortion: {
      ...DEFAULT_AUDIO_EFFECTS.distortion,
      ...(settings.distortion || {}),
    },

    reverb: {
      ...DEFAULT_AUDIO_EFFECTS.reverb,
      ...(settings.reverb || {}),
    },
  };
}

/**
 * =========================================================
 * CREATE EFFECT CHAIN
 * =========================================================
 *
 * sound
 *   ↓
 * volume
 *   ↓
 * pan
 *   ↓
 * filter
 *   ↓
 * distortion
 *   ↓
 * delay
 *   ↓
 * reverb
 *   ↓
 * destination
 */

export function createAudioEffectChain(
  destination,
  settings = {}
) {
  const effects =
    normalizeAudioEffects(
      settings
    );

  const output =
    destination ||
    Tone.getDestination();

  /**
   * Volume
   */
  const volume =
    new Tone.Gain(
      effects.volume
    );

  /**
   * Pan
   */
  const pan =
    new Tone.Panner(
      effects.pan
    );

  /**
   * Filter
   */
  const filter =
    new Tone.Filter({
      frequency:
        effects.filter.enabled
          ? effects.filter.frequency
          : effects.filter.type ===
            "highpass"
          ? 1
          : 20000,

      type:
        effects.filter.type ||
        "lowpass",

      Q:
        effects.filter.resonance ??
        1,
    });

  /**
   * Distortion
   */
  const distortion =
    new Tone.Distortion({
      distortion:
        effects.distortion.amount,

      wet:
        effects.distortion.enabled
          ? effects.distortion.wet
          : 0,
    });

  /**
   * Delay
   */
  const delay =
    new Tone.FeedbackDelay({
      delayTime:
        effects.delay.time,

      feedback:
        effects.delay.feedback,

      wet:
        effects.delay.enabled
          ? effects.delay.wet
          : 0,
    });

  /**
   * Reverb
   */
  const reverb =
    new Tone.Reverb({
      decay:
        effects.reverb.decay,

      wet:
        effects.reverb.enabled
          ? effects.reverb.wet
          : 0,
    });

  /**
   * Chain.
   */
  volume.chain(
    pan,
    filter,
    distortion,
    delay,
    reverb,
    output
  );

  /**
   * =======================================================
   * UPDATE
   * =======================================================
   */

  const update = (
    nextSettings = {}
  ) => {
    const next =
      normalizeAudioEffects(
        nextSettings
      );

    volume.gain.value =
      next.volume;

    pan.pan.value =
      next.pan;

    /**
     * Filter.
     */
    filter.type =
      next.filter.type ||
      "lowpass";

    filter.Q.value =
      next.filter.resonance ??
      1;

    if (
      next.filter.enabled
    ) {
      filter.frequency.value =
        next.filter.frequency;
    } else if (
      next.filter.type ===
      "highpass"
    ) {
      filter.frequency.value = 1;
    } else {
      filter.frequency.value =
        20000;
    }

    /**
     * Distortion.
     */
    distortion.distortion =
      next.distortion.amount;

    distortion.wet.value =
      next.distortion.enabled
        ? next.distortion.wet
        : 0;

    /**
     * Delay.
     */
    delay.delayTime.value =
      next.delay.time;

    delay.feedback.value =
      next.delay.feedback;

    delay.wet.value =
      next.delay.enabled
        ? next.delay.wet
        : 0;

    /**
     * Reverb.
     */
    reverb.decay =
      next.reverb.decay;

    reverb.wet.value =
      next.reverb.enabled
        ? next.reverb.wet
        : 0;
  };

  /**
   * Apply initial settings.
   */
  update(effects);

  /**
   * =======================================================
   * DISPOSE
   * =======================================================
   */

  const dispose = () => {
    volume.dispose();
    pan.dispose();
    filter.dispose();
    distortion.dispose();
    delay.dispose();
    reverb.dispose();
  };

  return {
    input: volume,

    volume,
    pan,
    filter,
    distortion,
    delay,
    reverb,

    update,
    dispose,
  };
}