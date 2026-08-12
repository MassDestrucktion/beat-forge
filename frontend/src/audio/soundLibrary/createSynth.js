import * as Tone from "tone";

export function createSynthForSound(
  sound,
  destination
) {
  if (!sound || sound.type !== "synth") {
    return null;
  }

  const config = sound.synth || {};

  let synth = null;

  switch (config.engine) {
    case "membrane":
      synth = new Tone.MembraneSynth({
        ...(config.envelope
          ? {
              envelope: config.envelope,
            }
          : {}),
      });
      break;

    case "poly":
      synth = new Tone.PolySynth(Tone.Synth, {
        ...(config.oscillator
          ? {
              oscillator: config.oscillator,
            }
          : {}),
        ...(config.envelope
          ? {
              envelope: config.envelope,
            }
          : {}),
      });
      break;

    case "mono":
      synth = new Tone.MonoSynth({
        oscillator: {
          type:
            config.oscillator?.type ||
            config.oscillator ||
            "sawtooth",
        },

        ...(config.envelope
          ? {
              envelope: config.envelope,
            }
          : {}),

        ...(config.filter
          ? {
              filter: config.filter,
            }
          : {}),
      });
      break;

    case "pluck":
      synth = new Tone.PluckSynth({
        resonance:
          config.resonance ?? 0.5,

        dampening:
          config.dampening ?? 4000,
      });
      break;

    case "fm":
      synth = new Tone.FMSynth({
        harmonicity:
          config.harmonicity ?? 2,

        modulationIndex:
          config.modulationIndex ?? 8,

        ...(config.oscillator
          ? {
              oscillator: config.oscillator,
            }
          : {}),

        ...(config.envelope
          ? {
              envelope: config.envelope,
            }
          : {}),
      });
      break;

    default:
      console.warn(
        `Unknown synth engine: ${config.engine}`
      );

      return null;
  }

  if (destination) {
    synth.connect(destination);
  }

  return synth;
}