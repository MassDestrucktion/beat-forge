// src/audio/soundLibrary/soundEngine.js

import * as Tone from "tone";
import { createSynthForSound } from "./createSynth";

/**
 * ---------------------------------------------------------
 * RESOLVE DESTINATION
 * ---------------------------------------------------------
 */

function resolveDestination(destination) {
  return destination || Tone.getDestination();
}

/**
 * ---------------------------------------------------------
 * GRID DURATION HELPERS
 * ---------------------------------------------------------
 *
 * The sequencer is based on a 16th-note grid.
 *
 * 1 step  = 16n
 * 2 steps = 8n
 * 4 steps = 4n
 * 8 steps = 2n
 * 16 steps = 1m
 *
 * Keeping this conversion here means the rest of the
 * application can work with the much simpler concept of
 * "number of grid steps".
 */

export function durationStepsToTone(durationSteps) {
  const steps = Number(durationSteps);

  switch (steps) {
    case 1:
      return "16n";

    case 2:
      return "8n";

    case 4:
      return "4n";

    case 8:
      return "2n";

    case 16:
      return "1m";

    default:
      return "16n";
  }
}

/**
 * ---------------------------------------------------------
 * LEGACY DURATION SUPPORT
 * ---------------------------------------------------------
 *
 * Older saved projects may still contain:
 *
 * duration: "16n"
 * duration: "8n"
 * duration: "4n"
 * etc.
 *
 * Convert those into the new grid-based representation.
 */

export function toneDurationToSteps(duration) {
  switch (duration) {
    case "16n":
      return 1;

    case "8n":
      return 2;

    case "4n":
      return 4;

    case "2n":
      return 8;

    case "1m":
      return 16;

    default:
      return 1;
  }
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
 * sound
 *   ↓
 * Tone.Player
 *   ↓
 * destination
 *
 * Synth:
 *
 * sound
 *   ↓
 * Tone synth
 *   ↓
 * destination
 *
 * Every returned engine exposes:
 *
 * engine.type
 * engine.node
 * engine.play()
 * engine.dispose()
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

      get loaded() {
        return player.loaded;
      },

      async load() {
        if (player.loaded) {
          return player;
        }

        await Tone.loaded();

        return player;
      },

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

    return {
      type: "synth",

      node: synth,

      loaded: true,

      async load() {
        return synth;
      },

      /**
       * ---------------------------------------------------
       * PLAY SYNTH
       * ---------------------------------------------------
       *
       * The sequencer supplies durationSteps.
       *
       * Example:
       *
       * durationSteps: 1
       * -> 16n
       *
       * durationSteps: 2
       * -> 8n
       *
       * durationSteps: 4
       * -> 4n
       *
       * durationSteps: 8
       * -> 2n
       *
       * durationSteps: 16
       * -> 1m
       */

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

        /**
         * Prefer the new grid-based
         * duration system.
         */

        let duration;

        if (
          overrides.durationSteps !==
          undefined
        ) {
          duration =
            durationStepsToTone(
              overrides.durationSteps
            );
        }

        /**
         * Backwards compatibility for
         * any existing code still sending
         * a Tone duration string.
         */

        else if (
          overrides.duration !==
          undefined
        ) {
          duration =
            overrides.duration;
        }

        /**
         * Finally use the sound
         * definition's duration.
         */

        else if (
          config.durationSteps !==
          undefined
        ) {
          duration =
            durationStepsToTone(
              config.durationSteps
            );
        }

        else if (
          config.duration !==
          undefined
        ) {
          duration =
            config.duration;
        }

        else {
          duration = "16n";
        }

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