// src/audio/soundLibrary/soundEngine.js

import * as Tone from "tone";
import { createSynthForSound } from "./createSynth";

/**
 * Resolve the destination.
 *
 * If the sequencer gives us a track gain/effect chain,
 * use it.
 *
 * Otherwise, safely send audio directly to Tone's
 * master destination.
 */
function resolveDestination(destination) {
  return destination || Tone.getDestination();
}

/**
 * ---------------------------------------------------------
 * CREATE SOUND ENGINE
 * ---------------------------------------------------------
 *
 * This is the single factory used by the sequencer.
 *
 * Sample:
 *
 *   sound
 *      ↓
 *   Tone.Player
 *      ↓
 *   destination
 *
 * Synth:
 *
 *   sound
 *      ↓
 *   Tone synth
 *      ↓
 *   destination
 *
 * Every returned engine exposes:
 *
 *   engine.type
 *   engine.node
 *   engine.play()
 *   engine.dispose()
 */
export function createSoundEngine(
  sound,
  destination
) {
  if (!sound) {
    console.warn(
      "createSoundEngine: no sound supplied"
    );

    return null;
  }

  const output =
    resolveDestination(destination);

  /**
   * -------------------------------------------------------
   * SAMPLE
   * -------------------------------------------------------
   */
  if (sound.type === "sample") {
    if (!sound.url) {
      console.warn(
        `Sample "${sound.id}" has no URL.`
      );

      return null;
    }

    const player =
      new Tone.Player({
        url: sound.url,
        autostart: false,
      });

    player.connect(output);

    return {
      type: "sample",

      node: player,

      /**
       * Whether the sample is ready.
       */
      get loaded() {
        return player.loaded;
      },

      /**
       * Wait for the sample to finish loading.
       */
      async load() {
        if (player.loaded) {
          return player;
        }

        await Tone.loaded();

        return player;
      },

      /**
       * Play the sample.
       *
       * If a scheduled Tone time is supplied,
       * Tone handles the scheduling.
       */
      async play(time) {
        await this.load();

        if (!player.loaded) {
          console.warn(
            `Sample "${sound.id}" is still not loaded.`
          );

          return;
        }

        player.start(time);
      },

      dispose() {
        player.dispose();
      },
    };
  }

  /**
   * -------------------------------------------------------
   * SYNTH
   * -------------------------------------------------------
   */
  if (sound.type === "synth") {
    const synth =
      createSynthForSound(
        sound,
        output
      );

    if (!synth) {
      console.warn(
        `Unable to create synth for "${sound.id}".`
      );

      return null;
    }

    /**
     * createSynthForSound returns the
     * actual Tone synth node.
     */
    return {
      type: "synth",

      node: synth,

      loaded: true,

      async load() {
        return synth;
      },

      play(
        time,
        overrides = {}
      ) {
        const config =
          sound.synth || {};

        const note =
          overrides.note ??
          config.note ??
          "C4";

        const duration =
          overrides.duration ??
          config.duration ??
          "8n";

        /**
         * Most Tone synths expose
         * triggerAttackRelease.
         */
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

  console.warn(
    `Unknown sound type: ${sound.type}`
  );

  return null;
}