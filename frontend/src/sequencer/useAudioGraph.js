import { useCallback, useEffect, useRef } from "react";
import * as Tone from "tone";

import { getSoundById } from "../audio/soundLibrary/soundLibrary";

function getTrackSoundId(track) {
  if (!track) {
    return null;
  }

  // Your project model stores the sound as `sound`.
  if (typeof track.sound === "string") {
    return track.sound;
  }

  // Defensive fallbacks in case older saved projects used another field.
  if (typeof track.soundId === "string") {
    return track.soundId;
  }

  if (typeof track.sound?.id === "string") {
    return track.sound.id;
  }

  return null;
}

function getSynthOptions(sound) {
  const synth = sound?.synth ?? {};

  const options = {};

  if (synth.oscillator) {
    options.oscillator = {
      ...synth.oscillator,
    };
  }

  if (synth.envelope) {
    options.envelope = {
      ...synth.envelope,
    };
  }

  if (synth.filter) {
    options.filter = {
      ...synth.filter,
    };
  }

  if (synth.harmonicity !== undefined) {
    options.harmonicity = synth.harmonicity;
  }

  if (synth.modulationIndex !== undefined) {
    options.modulationIndex = synth.modulationIndex;
  }

  if (synth.modulation) {
    options.modulation = {
      ...synth.modulation,
    };
  }

  if (synth.pitchDecay !== undefined) {
    options.pitchDecay = synth.pitchDecay;
  }

  if (synth.octaves !== undefined) {
    options.octaves = synth.octaves;
  }

  if (synth.resonance !== undefined) {
    options.resonance = synth.resonance;
  }

  if (synth.dampening !== undefined) {
    options.dampening = synth.dampening;
  }

  if (synth.vibratoAmount !== undefined) {
    options.vibratoAmount = synth.vibratoAmount;
  }

  if (synth.vibratoRate !== undefined) {
    options.vibratoRate = synth.vibratoRate;
  }

  return options;
}

function createSynthForSound(sound) {
  const synth = sound?.synth;

  if (!synth) {
    return null;
  }

  const options = getSynthOptions(sound);

  switch (synth.engine) {
    case "mono":
      return new Tone.MonoSynth(options);

    case "poly":
      return new Tone.PolySynth(Tone.Synth, options);

    case "fm":
      return new Tone.FMSynth(options);

    case "am":
      return new Tone.AMSynth(options);

    case "duosynth":
      return new Tone.DuoSynth(options);

    case "pluck":
      return new Tone.PluckSynth(options);

    case "membrane":
      return new Tone.MembraneSynth(options);

    case "metal":
      return new Tone.MetalSynth(options);

    case "noise":
      return new Tone.NoiseSynth({
        noise: synth.noise ?? { type: "white" },
        envelope: synth.envelope ?? {
          attack: 0.001,
          decay: 0.1,
          sustain: 0,
          release: 0.05,
        },
      });

    default:
      console.warn(
        `[useAudioGraph] Unknown synth engine "${synth.engine}" for sound "${sound.id}". Falling back to Synth.`,
      );

      return new Tone.Synth(options);
  }
}

export function useAudioGraph({
  numTracks,
  trackSettings,
}) {
  const synthsRef = useRef(new Map());
  const playersRef = useRef(new Map());
  const loadingPlayersRef = useRef(new Map());

  /**
   * Create/recreate an instrument for a track.
   */
  const ensureInstrument = useCallback(
    async (trackIndex) => {
      const track = trackSettings?.[trackIndex];

      if (!track) {
        console.warn(
          `[useAudioGraph] No track settings for track ${trackIndex}`,
        );
        return null;
      }

      const soundId = getTrackSoundId(track);

      if (!soundId) {
        console.warn(
          `[useAudioGraph] Track ${trackIndex} has no sound id`,
          track,
        );
        return null;
      }

      const sound = getSoundById(soundId);

      if (!sound) {
        console.error(
          `[useAudioGraph] Sound not found: "${soundId}"`,
          {
            trackIndex,
            track,
            availableExample: "drums.kicks.cr78",
          },
        );
        return null;
      }

      /*
       * SAMPLE
       */
      if (sound.type === "sample") {
        const existing = playersRef.current.get(trackIndex);

        if (existing && existing.url === sound.url) {
          return existing.player;
        }

        if (existing) {
          try {
            existing.player.dispose();
          } catch {
            // Ignore disposal errors.
          }

          playersRef.current.delete(trackIndex);
        }

        const existingLoading = loadingPlayersRef.current.get(trackIndex);

        if (
          existingLoading &&
          existingLoading.soundId === sound.id
        ) {
          return existingLoading.promise;
        }

        console.log(
          `[useAudioGraph] Loading sample "${sound.id}" from ${sound.url}`,
        );

        const promise = new Promise((resolve, reject) => {
          let player;

          try {
            player = new Tone.Player({
              url: sound.url,
              autostart: false,
            }).toDestination();

            /*
             * Tone.Player exposes `loaded` through its buffer.
             * Wait for the buffer before considering this player usable.
             */
            const checkLoaded = () => {
              if (player.disposed) {
                reject(
                  new Error(
                    `Player for "${sound.id}" was disposed while loading.`,
                  ),
                );
                return;
              }

              if (player.loaded) {
                const entry = {
                  player,
                  url: sound.url,
                  soundId: sound.id,
                };

                playersRef.current.set(trackIndex, entry);
                loadingPlayersRef.current.delete(trackIndex);

                console.log(
                  `[useAudioGraph] Sample loaded: ${sound.id}`,
                );

                resolve(player);
                return;
              }

              window.setTimeout(checkLoaded, 50);
            };

            checkLoaded();
          } catch (error) {
            loadingPlayersRef.current.delete(trackIndex);
            reject(error);
          }
        });

        loadingPlayersRef.current.set(trackIndex, {
          soundId: sound.id,
          promise,
        });

        try {
          return await promise;
        } catch (error) {
          loadingPlayersRef.current.delete(trackIndex);

          console.error(
            `[useAudioGraph] Failed loading sample "${sound.id}"`,
            error,
          );

          return null;
        }
      }

      /*
       * SYNTH
       */
      const existing = synthsRef.current.get(trackIndex);

      if (
        existing &&
        existing.soundId === sound.id &&
        existing.engine === sound.synth?.engine
      ) {
        return existing.synth;
      }

      if (existing?.synth) {
        try {
          existing.synth.dispose();
        } catch {
          // Ignore disposal errors.
        }
      }

      const instrument = createSynthForSound(sound);

      if (!instrument) {
        console.error(
          `[useAudioGraph] Could not create synth for "${sound.id}"`,
        );
        return null;
      }

      instrument.toDestination();

      const entry = {
        synth: instrument,
        soundId: sound.id,
        engine: sound.synth?.engine,
      };

      synthsRef.current.set(trackIndex, entry);

      console.log(
        `[useAudioGraph] Created synth "${sound.id}" for track ${trackIndex}`,
      );

      return instrument;
    },
    [trackSettings],
  );

  /*
   * Rebuild instruments when the selected sounds change.
   */
  useEffect(() => {
    let cancelled = false;

    async function rebuild() {
      for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
        if (cancelled) {
          return;
        }

        await ensureInstrument(trackIndex);
      }
    }

    rebuild();

    return () => {
      cancelled = true;
    };
  }, [numTracks, trackSettings, ensureInstrument]);

  /*
   * Play one track immediately.
   */
  const playTrackSound = useCallback(
    async (trackIndex, noteOverride = null) => {
      try {
        await Tone.start();

        const context = Tone.getContext();

        if (context.state !== "running") {
          await context.resume();
        }

        const track = trackSettings?.[trackIndex];

        if (!track) {
          console.warn(
            `[useAudioGraph] Cannot play track ${trackIndex}: track does not exist.`,
          );
          return;
        }

        if (track.muted) {
          return;
        }

        const soundId = getTrackSoundId(track);

        if (!soundId) {
          console.error(
            `[useAudioGraph] Cannot play track ${trackIndex}: sound is null.`,
            track,
          );
          return;
        }

        const sound = getSoundById(soundId);

        if (!sound) {
          console.error(
            `[useAudioGraph] Cannot play track ${trackIndex}: sound "${soundId}" does not exist.`,
          );
          return;
        }

        const instrument = await ensureInstrument(trackIndex);

        if (!instrument) {
          console.error(
            `[useAudioGraph] No instrument available for "${sound.id}".`,
          );
          return;
        }

        /*
         * SAMPLE PLAYBACK
         */
        if (sound.type === "sample") {
          if (!instrument.loaded) {
            console.warn(
              `[useAudioGraph] Sample "${sound.id}" is not loaded yet.`,
            );
            return;
          }

          instrument.start();

          return;
        }

        /*
         * SYNTH PLAYBACK
         */
        const note =
          noteOverride ??
          track.note ??
          sound.synth?.note ??
          "C4";

        const duration =
          track.duration ??
          sound.synth?.duration ??
          "8n";

        if (typeof instrument.triggerAttackRelease !== "function") {
          console.error(
            `[useAudioGraph] Instrument for "${sound.id}" does not support triggerAttackRelease.`,
          );
          return;
        }

        instrument.triggerAttackRelease(note, duration);
      } catch (error) {
        console.error(
          `[useAudioGraph] playTrackSound(${trackIndex}) failed:`,
          error,
        );
      }
    },
    [ensureInstrument, trackSettings],
  );

  /*
   * Preview a specific sound without changing the track.
   *
   * This is useful from the sound picker / clip editor.
   */
  const previewSound = useCallback(
    async (soundId, options = {}) => {
      try {
        await Tone.start();

        const context = Tone.getContext();

        if (context.state !== "running") {
          await context.resume();
        }

        const sound = getSoundById(soundId);

        if (!sound) {
          console.error(
            `[useAudioGraph] previewSound: sound "${soundId}" not found.`,
          );
          return;
        }

        if (sound.type === "sample") {
          const player = new Tone.Player({
            url: sound.url,
            autostart: false,
          }).toDestination();

          /*
           * Tone.Player needs its AudioBuffer loaded before start().
           */
          const waitForLoad = () =>
            new Promise((resolve, reject) => {
              const startedAt = performance.now();

              const check = () => {
                if (player.disposed) {
                  reject(
                    new Error(
                      `Preview player for "${sound.id}" was disposed.`,
                    ),
                  );
                  return;
                }

                if (player.loaded) {
                  resolve();
                  return;
                }

                /*
                 * Don't hang forever if a URL is bad.
                 */
                if (performance.now() - startedAt > 15000) {
                  reject(
                    new Error(
                      `Timed out loading preview sample "${sound.id}".`,
                    ),
                  );
                  return;
                }

                window.setTimeout(check, 50);
              };

              check();
            });

          await waitForLoad;

          player.start();

          /*
           * Give the sample time to play, then dispose the temporary player.
           */
          window.setTimeout(() => {
            try {
              player.dispose();
            } catch {
              // Ignore cleanup errors.
            }
          }, 5000);

          return;
        }

        const instrument = createSynthForSound(sound);

        if (!instrument) {
          return;
        }

        instrument.toDestination();

        const note =
          options.note ??
          sound.synth?.note ??
          "C4";

        const duration =
          options.duration ??
          sound.synth?.duration ??
          "8n";

        instrument.triggerAttackRelease(note, duration);

        /*
         * Dispose after the note's expected lifetime.
         */
        window.setTimeout(() => {
          try {
            instrument.dispose();
          } catch {
            // Ignore cleanup errors.
          }
        }, 3000);
      } catch (error) {
        console.error(
          `[useAudioGraph] previewSound("${soundId}") failed:`,
          error,
        );
      }
    },
    [],
  );

  /*
   * Cleanup everything when the sequencer leaves the page.
   */
  useEffect(() => {
    return () => {
      for (const { synth } of synthsRef.current.values()) {
        try {
          synth.dispose();
        } catch {
          // Ignore cleanup errors.
        }
      }

      for (const { player } of playersRef.current.values()) {
        try {
          player.dispose();
        } catch {
          // Ignore cleanup errors.
        }
      }

      synthsRef.current.clear();
      playersRef.current.clear();
      loadingPlayersRef.current.clear();
    };
  }, []);

  return {
    playTrackSound,
    previewSound,
  };
}

export default useAudioGraph;