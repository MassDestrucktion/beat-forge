// src/audio/soundLibrary/soundEngine.js

import * as Tone from "tone";
import { createSynthForSound } from "./createSynth";

/**
 * ---------------------------------------------------------
 * RESOLVE DESTINATION
 * ---------------------------------------------------------
 *
 * If the sequencer provides a track gain/effect chain,
 * use that.
 *
 * Otherwise, safely send audio directly to Tone's
 * destination.
 */
function resolveDestination(destination) {
  return (
    destination ||
    Tone.getDestination()
  );
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
 *   engine.loaded
 *   engine.load()
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

    /**
     * Connect the player to the track's
     * gain/effect chain.
     */
    player.connect(output);

    return {
      type: "sample",

      node: player,

      /**
       * Whether the sample has finished loading.
       */
      get loaded() {
        return player.loaded;
      },

      /**
       * Wait for the sample to load.
       */
      async load() {
        if (player.loaded) {
          return player;
        }

        await Tone.loaded();

        return player;
      },

      /**
       * ---------------------------------------------------
       * PLAY SAMPLE
       * ---------------------------------------------------
       *
       * Tone.Player does not use note/duration.
       *
       * It simply starts the audio sample.
       */
      async play(time) {
        await this.load();

        if (!player.loaded) {
          console.warn(
            `Sample "${sound.id}" is still not loaded.`
          );

          return;
        }

        try {
          player.start(time);
        } catch (error) {
          console.error(
            `Failed to play sample "${sound.id}":`,
            error
          );
        }
      },

      /**
       * Dispose the Tone.Player.
       */
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

    return {
      type: "synth",

      node: synth,

      loaded: true,

      /**
       * Synths don't need sample loading,
       * so this resolves immediately.
       */
      async load() {
        return synth;
      },

      /**
       * ---------------------------------------------------
       * PLAY SYNTH
       * ---------------------------------------------------
       *
       * The important part here is that overrides
       * take priority over the sound-library defaults.
       *
       * Example:
       *
       * engine.play(time, {
       *   note: "G3",
       *   duration: "8n",
       * });
       *
       * The selected sequencer note therefore
       * actually controls the pitch.
       */
      play(
        time,
        overrides = {}
      ) {
        const config =
          sound.synth || {};

        /**
         * Sequencer override first.
         *
         * Fall back to the sound-library default
         * if the sequencer hasn't specified one.
         */
        const note =
          overrides.note ??
          config.note ??
          "C4";

        /**
         * Sequencer duration first.
         */
        const duration =
          overrides.duration ??
          config.duration ??
          "8n";

        /**
         * Safety check.
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

        try {
          synth.triggerAttackRelease(
            note,
            duration,
            time
          );
        } catch (error) {
          console.error(
            `Failed to play synth "${sound.id}" with note "${note}":`,
            error
          );
        }
      },

      /**
       * Dispose the synth.
       */
      dispose() {
        synth.dispose();
      },
    };
  }

  /**
   * -------------------------------------------------------
   * UNKNOWN SOUND TYPE
   * -------------------------------------------------------
   */

  console.warn(
    `Unknown sound type: ${sound.type}`
  );

  return null;
}