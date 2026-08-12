// src/audio/soundLibrary/createSynth.js

import * as Tone from "tone";

/**
 * Create the actual Tone.js synth node
 * for a sound-library synth definition.
 *
 * This function ONLY creates the instrument.
 *
 * Routing is handled here so every synth
 * always has somewhere to send its audio.
 */
export function createSynthForSound(
  sound,
  destination
) {
  if (!sound || sound.type !== "synth") {
    return null;
  }

  const config =
    sound.synth || {};

  const output =
    destination || Tone.getDestination();

  let synth = null;

  /**
   * -------------------------------------------------------
   * MEMBRANE
   * -------------------------------------------------------
   */
  if (config.engine === "membrane") {
    synth =
      new Tone.MembraneSynth();
  }

  /**
   * -------------------------------------------------------
   * POLY
   * -------------------------------------------------------
   */
  else if (config.engine === "poly") {
    synth =
      new Tone.PolySynth(
        Tone.Synth
      );

    /**
     * Apply oscillator settings when
     * supplied by the sound definition.
     */
    if (config.oscillator) {
      synth.set({
        oscillator:
          config.oscillator,
      });
    }
  }

  /**
   * -------------------------------------------------------
   * MONO
   * -------------------------------------------------------
   */
  else if (config.engine === "mono") {
    synth =
      new Tone.MonoSynth({
        oscillator:
          config.oscillator || {
            type: "sawtooth",
          },

        envelope:
          config.envelope || {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.7,
            release: 0.2,
          },

        filter:
          config.filter || {
            type: "lowpass",
            frequency: 1200,
            rolloff: -12,
          },
      });
  }

  /**
   * -------------------------------------------------------
   * PLUCK
   * -------------------------------------------------------
   */
  else if (config.engine === "pluck") {
    synth =
      new Tone.PluckSynth({
        resonance:
          config.resonance ?? 0.5,

        dampening:
          config.dampening ?? 4000,
      });
  }

  /**
   * -------------------------------------------------------
   * FM
   * -------------------------------------------------------
   */
  else if (config.engine === "fm") {
    synth =
      new Tone.FMSynth({
        harmonicity:
          config.harmonicity ?? 2,

        modulationIndex:
          config.modulationIndex ?? 8,
      });
  }

  /**
   * Unknown engine.
   */
  else {
    console.warn(
      `Unknown synth engine: ${config.engine}`
    );

    return null;
  }

  /**
   * CRITICAL:
   *
   * Every synth must actually be connected
   * to the audio graph.
   */
  synth.connect(output);

  return synth;
}