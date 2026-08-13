// src/audio/soundLibrary/soundEngine.js

import * as Tone from "tone";
import { createSynthForSound } from "./createSynth";

/**
 * Create an audio engine for a sound-library entry.
 *
 * Sound-library entries are either:
 *
 *   type: "sample"
 *
 * or:
 *
 *   type: "synth"
 *
 * The returned engine gives the sequencer
 * a consistent interface regardless of sound type.
 */
export function createSoundEngine(
  sound,
  destination
) {
  if (!sound) {
    return null;
  }

  /**
   * ---------------------------------------------------------
   * SAMPLE
   * ---------------------------------------------------------
   */

  if (sound.type === "sample") {
    if (!sound.url) {
      console.warn(
        `Sample sound "${sound.id}" has no URL.`
      );

      return null;
    }

    const player = new Tone.Player({
      url: sound.url,
    });

    if (destination) {
      player.connect(destination);
    }

    return {
      type: "sample",

      node: player,

      play(time) {
        if (!player.loaded) {
          return;
        }

        player.start(time);
      },

      stop(time) {
        try {
          player.stop(time);
        } catch {
          // Player may already be stopped.
        }
      },

      get loaded() {
        return player.loaded;
      },

      dispose() {
        player.dispose();
      },
    };
  }

  /**
   * ---------------------------------------------------------
   * SYNTH
   * ---------------------------------------------------------
   */

  if (sound.type === "synth") {
    const synth = createSynthForSound(
      sound,
      destination
    );

    if (!synth) {
      return null;
    }

    return {
      type: "synth",

      node: synth,

      play(
        time,
        overrides = {}
      ) {
        const synthConfig =
          sound.synth || {};

        const note =
          overrides.note ??
          synthConfig.note ??
          "C4";

        const duration =
          overrides.duration ??
          synthConfig.duration ??
          "8n";

        if (
          typeof synth.triggerAttackRelease !==
          "function"
        ) {
          console.warn(
            `Synth "${sound.id}" does not support triggerAttackRelease.`
          );

          return;
        }

        synth.triggerAttackRelease(
          note,
          duration,
          time
        );
      },

      dispose() {
        synth.dispose();
      },
    };
  }

  /**
   * ---------------------------------------------------------
   * UNKNOWN SOUND TYPE
   * ---------------------------------------------------------
   */

  console.warn(
    `Unknown sound type "${sound.type}" for sound "${sound.id}".`
  );

  return null;
}
