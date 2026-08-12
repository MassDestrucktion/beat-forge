// src/audio/soundLibrary/soundEngine.js

import * as Tone from "tone";

import {
  createSynthForSound,
} from "./createSynth";

import {
  createPiano,
} from "./createPiano.js";

import {
  createAudioEffectChain,
} from "./audioEffects";

/**
 * =========================================================
 * TONE DURATION -> GRID STEPS
 * =========================================================
 */

export function toneDurationToSteps(
  duration
) {
  if (!duration) {
    return 1;
  }

  if (typeof duration === "number") {
    return Math.max(
      1,
      Math.round(duration)
    );
  }

  const value = String(duration)
    .trim()
    .toLowerCase();

  const durationMap = {
    "16n": 1,
    "8n": 2,
    "4n": 4,
    "2n": 8,
    "1n": 16,
    "1m": 16,

    "16n.": 1,
    "8n.": 3,
    "4n.": 6,
    "2n.": 12,
  };

  if (
    durationMap[value] !== undefined
  ) {
    return durationMap[value];
  }

  try {
    const seconds =
      Tone.Time(value).toSeconds();

    const sixteenthSeconds =
      Tone.Time(
        "16n"
      ).toSeconds();

    if (
      Number.isFinite(seconds) &&
      Number.isFinite(
        sixteenthSeconds
      ) &&
      sixteenthSeconds > 0
    ) {
      return Math.max(
        1,
        Math.round(
          seconds /
            sixteenthSeconds
        )
      );
    }
  } catch (error) {
    console.warn(
      `Could not convert Tone duration "${duration}" to grid steps.`,
      error
    );
  }

  return 1;
}

/**
 * =========================================================
 * GRID STEPS -> TONE DURATION
 * =========================================================
 */

export function stepsToToneDuration(
  steps
) {
  const normalizedSteps =
    Math.max(
      1,
      Number(steps) || 1
    );

  const durationMap = {
    1: "16n",
    2: "8n",
    4: "4n",
    8: "2n",
    16: "1m",
  };

  if (
    durationMap[normalizedSteps]
  ) {
    return durationMap[
      normalizedSteps
    ];
  }

  return `${normalizedSteps}*16n`;
}

/**
 * =========================================================
 * NORMALIZE NOTES
 * =========================================================
 */

export function normalizeNotes(
  notes,
  fallbackNote = "C4"
) {
  if (Array.isArray(notes)) {
    const cleaned = notes
      .map((note) =>
        String(note).trim()
      )
      .filter(Boolean);

    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  if (typeof notes === "string") {
    const cleaned = notes
      .split(/[\s,]+/)
      .map((note) =>
        note.trim()
      )
      .filter(Boolean);

    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  if (fallbackNote) {
    return [fallbackNote];
  }

  return ["C4"];
}

/**
 * =========================================================
 * CREATE EFFECT ROUTING
 * =========================================================
 */

function createDestination(
  destination,
  effects
) {
  if (!effects) {
    return {
      input:
        destination ||
        Tone.getDestination(),

      dispose() {},
    };
  }

  return createAudioEffectChain(
    destination ||
      Tone.getDestination(),
    effects
  );
}

/**
 * =========================================================
 * CREATE SOUND ENGINE
 * =========================================================
 */

export function createSoundEngine(
  sound,
  destination,
  effects
) {
  if (!sound) {
    return null;
  }

  /**
   * -------------------------------------------------------
   * AUDIO ROUTING
   * -------------------------------------------------------
   *
   * Instrument/player
   *      ↓
   * effect chain
   *      ↓
   * destination
   */

  const routing =
    createDestination(
      destination,
      effects
    );

  const output =
    routing.input;

  /**
   * =======================================================
   * SYNTH
   * =======================================================
   */

  if (sound.type === "synth") {
    const instrument =
      createSynthForSound(
        sound,
        output
      );

    if (!instrument) {
      routing.dispose?.();
      return null;
    }

    return {
      instrument,

      play(time, options = {}) {
        const notes =
          normalizeNotes(
            options.notes,
            options.note ||
              sound?.synth?.note ||
              "C4"
          );

        const durationSteps =
          Number(
            options.durationSteps
          ) || 1;

        const duration =
          options.duration ||
          stepsToToneDuration(
            durationSteps
          );

        try {
          /**
           * PolySynth can accept an array of notes.
           */
          if (
            Array.isArray(notes) &&
            notes.length > 1 &&
            typeof instrument
              .triggerAttackRelease ===
              "function"
          ) {
            try {
              instrument.triggerAttackRelease(
                notes,
                duration,
                time
              );

              return;
            } catch (
              polyError
            ) {
              console.warn(
                "Instrument could not play chord; falling back to first note.",
                polyError
              );
            }
          }

          const note =
            notes[0] ||
            options.note ||
            sound?.synth?.note ||
            "C4";

          if (
            typeof instrument
              .triggerAttackRelease ===
            "function"
          ) {
            instrument.triggerAttackRelease(
              note,
              duration,
              time
            );
          }
        } catch (error) {
          console.error(
            `Failed to play synth "${sound.id}":`,
            error
          );
        }
      },

      dispose() {
        instrument.dispose?.();
        routing.dispose?.();
      },
    };
  }

  /**
   * =======================================================
   * PIANO
   * =======================================================
   */

  if (sound.type === "piano") {
    const piano =
      createPiano(output);

    return {
      instrument: piano,

      /**
       * Play piano note/chord.
       *
       * options:
       *
       * notes
       * note
       * velocity
       * durationSteps
       * duration
       */

      play(time, options = {}) {
        const notes =
          normalizeNotes(
            options.notes,
            options.note ||
              "C4"
          );

        const velocity =
          Number(
            options.velocity
          ) || 100;

        const durationSteps =
          Number(
            options.durationSteps
          ) || 1;

        const duration =
          options.duration ||
          stepsToToneDuration(
            durationSteps
          );

        try {
          /**
           * Piano chords.
           */
          notes.forEach(
            (note) => {
              piano.triggerAttackRelease(
                note,
                duration,
                velocity,
                time
              );
            }
          );
        } catch (error) {
          console.error(
            `Failed to play piano "${sound.id}":`,
            error
          );
        }
      },

      /**
       * Manual piano key down.
       */
      triggerAttack(
        note,
        velocity = 100,
        time
      ) {
        piano.triggerAttack(
          note,
          velocity,
          time
        );
      },

      /**
       * Manual piano key up.
       */
      triggerRelease(
        note,
        time
      ) {
        piano.triggerRelease(
          note,
          time
        );
      },

      releaseAll() {
        piano.releaseAll();
      },

      dispose() {
        piano.dispose();
        routing.dispose?.();
      },
    };
  }

  /**
   * =======================================================
   * SAMPLE
   * =======================================================
   */

  if (sound.type === "sample") {
    const url =
      sound.sample?.url ||
      sound.url;

    if (!url) {
      console.warn(
        `Sample sound "${sound.id}" has no URL.`
      );

      routing.dispose?.();

      return null;
    }

    const player =
      new Tone.Player({
        url,
        autostart: false,
      });

    player.connect(output);

    return {
      instrument: player,

      play(time) {
        try {
          player.start(time);
        } catch (error) {
          console.error(
            `Failed to play sample "${sound.id}":`,
            error
          );
        }
      },

      dispose() {
        player.dispose();
        routing.dispose?.();
      },
    };
  }

  /**
   * =======================================================
   * UNKNOWN
   * =======================================================
   */

  routing.dispose?.();

  console.warn(
    `Unknown sound type: ${sound.type}`
  );

  return null;
}

/**
 * =========================================================
 * PLAY SOUND
 * =========================================================
 */

export function playSound(
  engine,
  time,
  options = {}
) {
  if (!engine?.play) {
    return;
  }

  try {
    engine.play(
      time,
      options
    );
  } catch (error) {
    console.error(
      "Failed to play sound:",
      error
    );
  }
}