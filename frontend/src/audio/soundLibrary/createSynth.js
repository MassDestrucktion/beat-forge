// src/audio/soundLibrary/createSynth.js

import * as Tone from "tone";

/**
 * ---------------------------------------------------------
 * CREATE SYNTH FOR SOUND
 * ---------------------------------------------------------
 *
 * Creates the actual Tone.js instrument for a
 * sound-library synth definition.
 *
 * Routing is handled here so every synth is connected
 * to the destination supplied by the sound engine.
 */
export function createSynthForSound(sound, destination) {
  if (!sound || sound.type !== "synth") {
    return null;
  }

  const config = sound.synth || {};

  const output = destination || Tone.getDestination();

  let synth;

  /**
   * -------------------------------------------------------
   * MEMBRANE
   * -------------------------------------------------------
   */

  if (config.engine === "synth") {
    /**
     * -------------------------------------------------------
     * PLAIN SYNTH (monophonic oscillator)
     * -------------------------------------------------------
     */
    synth = new Tone.Synth({
      oscillator: config.oscillator || {
        type: "triangle",
      },

      envelope: config.envelope || {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.2,
      },
    });
  } else if (config.engine === "duosynth") {
    /**
     * -------------------------------------------------------
     * DUOSYNTH (dual-oscillator lead)
     * -------------------------------------------------------
     */
    synth = new Tone.DuoSynth({
      harmonicity: config.harmonicity ?? 1.5,

      vibratoAmount: config.vibratoAmount ?? 0.5,

      vibratoRate: config.vibratoRate ?? 5,

      oscillator: config.oscillator || {
        type: "sawtooth",
      },

      envelope: config.envelope || {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.3,
      },
    });
  } else if (config.engine === "membrane") {
    synth = new Tone.MembraneSynth({
      pitchDecay: config.pitchDecay ?? 0.05,

      octaves: config.octaves ?? 10,

      oscillator: config.oscillator || {
        type: "sine",
      },

      envelope: config.envelope || {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4,
      },
    });
  } else if (config.engine === "poly") {
    /**
     * -------------------------------------------------------
     * POLY
     * -------------------------------------------------------
     */
    synth = new Tone.PolySynth(Tone.Synth);

    if (config.oscillator) {
      synth.set({
        oscillator: config.oscillator,
      });
    }

    if (config.envelope) {
      synth.set({
        envelope: config.envelope,
      });
    }
  } else if (config.engine === "mono") {
    /**
     * -------------------------------------------------------
     * MONO
     * -------------------------------------------------------
     */
    synth = new Tone.MonoSynth({
      oscillator: config.oscillator || {
        type: "sawtooth",
      },

      envelope: config.envelope || {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.2,
      },

      filter: config.filter || {
        type: "lowpass",
        frequency: 1200,
        rolloff: -12,
      },
    });
  } else if (config.engine === "pluck") {
    /**
     * -------------------------------------------------------
     * PLUCK
     * -------------------------------------------------------
     */
    synth = new Tone.PluckSynth({
      resonance: config.resonance ?? 0.5,

      dampening: config.dampening ?? 4000,
    });
  } else if (config.engine === "fm") {
    /**
     * -------------------------------------------------------
     * FM
     * -------------------------------------------------------
     */
    synth = new Tone.FMSynth({
      harmonicity: config.harmonicity ?? 2,

      modulationIndex: config.modulationIndex ?? 8,

      oscillator: config.oscillator || {
        type: "sine",
      },

      envelope: config.envelope || {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.2,
      },

      modulation: config.modulation || {
        type: "square",
      },

      modulationEnvelope: config.modulationEnvelope || {
        attack: 0.5,
        decay: 0.2,
        sustain: 0.2,
        release: 0.1,
      },
    });
  } else if (config.engine === "metal") {
    /**
     * -------------------------------------------------------
     * METAL
     * -------------------------------------------------------
     */
    const metalSynth = new Tone.MetalSynth({
      harmonicity: config.harmonicity ?? 5.1,
      modulationIndex: config.modulationIndex ?? 32,
      resonance: config.resonance ?? 4000,
      envelope: config.envelope || {
        attack: 0.001,
        decay: 1.4,
        sustain: 0,
        release: 0.4,
      },
    });

    metalSynth.connect(output);

    return {
      connect() {},
      triggerAttackRelease(note, duration, time) {
        metalSynth.triggerAttackRelease(duration, time);
      },
      dispose() {
        metalSynth.dispose();
      },
    };
  } else if (config.engine === "am") {
    /**
     * -------------------------------------------------------
     * AM
     * -------------------------------------------------------
     */
    synth = new Tone.AMSynth({
      harmonicity: config.harmonicity ?? 3,
      oscillator: config.oscillator || {
        type: "sine",
      },
      modulation: config.modulation || {
        type: "square",
      },
      envelope: config.envelope || {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.2,
      },
      modulationEnvelope: config.modulationEnvelope || {
        attack: 0.5,
        decay: 0.2,
        sustain: 0.2,
        release: 0.1,
      },
    });
  } else if (config.engine === "noise") {
    /**
     * -------------------------------------------------------
     * NOISE
     * -------------------------------------------------------
     */
    const noiseSynth = new Tone.NoiseSynth({
      noise: config.noise || { type: "white" },
      envelope: config.envelope || {
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.1,
      },
    });

    let filter = null;
    if (config.filter) {
      filter = new Tone.Filter(
        config.filter.frequency || 1800,
        config.filter.type || "bandpass",
      );
      noiseSynth.connect(filter);
      filter.connect(output);
    } else {
      noiseSynth.connect(output);
    }

    return {
      connect() {},
      triggerAttackRelease(note, duration, time) {
        noiseSynth.triggerAttackRelease(duration, time);
      },
      dispose() {
        noiseSynth.dispose();
        if (filter) filter.dispose();
      },
    };
  } else {
    /**
     * -------------------------------------------------------
     * UNKNOWN ENGINE
     * -------------------------------------------------------
     */
    console.warn(`Unknown synth engine: ${config.engine}`);

    return null;
  }

  /**
   * -------------------------------------------------------
   * CONNECT
   * -------------------------------------------------------
   */

  synth.connect(output);

  return synth;
}