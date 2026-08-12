import * as Tone from "tone";
import { createSynthForSound } from "./createSynth";

/**
 * ---------------------------------------------------------
 * TONE DURATION -> GRID STEPS
 * ---------------------------------------------------------
 *
 * The sequencer is based on a 16-step grid.
 *
 * 1 step  = 16n
 * 2 steps = 8n
 * 4 steps = 4n
 * 8 steps = 2n
 * 16 steps = 1m
 *
 * This helper exists primarily for backwards compatibility
 * with projects that were saved using the old `duration`
 * property.
 */

export function toneDurationToSteps(duration) {
  if (!duration) {
    return 1;
  }

  if (typeof duration === "number") {
    return Math.max(1, Math.round(duration));
  }

  const value = String(duration).trim().toLowerCase();

  const durationMap = {
    "16n": 1,
    "8n": 2,
    "4n": 4,
    "2n": 8,
    "1n": 16,

    // Tone.js measure notation.
    "1m": 16,

    // Useful dotted values. We clamp them to the
    // available 16-step grid.
    "16n.": 1,
    "8n.": 3,
    "4n.": 6,
    "2n.": 12,
  };

  if (durationMap[value] !== undefined) {
    return durationMap[value];
  }

  /**
   * Try Tone.js as a fallback.
   *
   * This allows older/less common duration strings
   * to still be converted when possible.
   */
  try {
    const seconds =
      Tone.Time(value).toSeconds();

    const sixteenthSeconds =
      Tone.Time("16n").toSeconds();

    if (
      Number.isFinite(seconds) &&
      Number.isFinite(sixteenthSeconds) &&
      sixteenthSeconds > 0
    ) {
      return Math.max(
        1,
        Math.round(
          seconds / sixteenthSeconds
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
 * ---------------------------------------------------------
 * GRID STEPS -> TONE DURATION
 * ---------------------------------------------------------
 *
 * This is useful when a sound engine needs an actual
 * Tone.js duration.
 */

export function stepsToToneDuration(
  steps
) {
  const normalizedSteps = Math.max(
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
    return durationMap[normalizedSteps];
  }

  /**
   * For arbitrary step lengths, Tone.js
   * can express the duration as seconds.
   *
   * We return a musical-time expression
   * based on 16th notes.
   */
  return `${normalizedSteps}*16n`;
}

/**
 * ---------------------------------------------------------
 * CREATE SOUND ENGINE
 * ---------------------------------------------------------
 *
 * Creates the appropriate instrument for a sound-library
 * definition and connects it to the supplied destination.
 */

export function createSoundEngine(
  sound,
  destination
) {
  if (!sound) {
    return null;
  }

  /**
   * -------------------------------------------------------
   * SYNTH
   * -------------------------------------------------------
   */

  if (sound.type === "synth") {
    return createSynthForSound(
      sound,
      destination
    );
  }

  /**
   * -------------------------------------------------------
   * SAMPLE
   * -------------------------------------------------------
   *
   * Sample-based sounds are handled by Tone.Player.
   */

  if (sound.type === "sample") {
    const url =
      sound.sample?.url ||
      sound.url;

    if (!url) {
      console.warn(
        `Sample sound "${sound.id}" has no URL.`
      );

      return null;
    }

    const player =
      new Tone.Player({
        url,
        autostart: false,
      });

    if (destination) {
      player.connect(destination);
    } else {
      player.toDestination();
    }

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
      },
    };
  }

  console.warn(
    `Unknown sound type: ${sound.type}`
  );

  return null;
}

/**
 * ---------------------------------------------------------
 * PLAY SOUND
 * ---------------------------------------------------------
 *
 * Generic helper if other parts of the app need to play
 * a sound definition directly.
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