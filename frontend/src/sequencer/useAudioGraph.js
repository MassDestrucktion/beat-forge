// src/sequencer/useAudioGraph.js

import { useEffect, useRef, useCallback } from "react";

import * as Tone from "tone";

import { getSoundById, createSoundEngine } from "../audio/soundLibrary";

/**
 * Owns the realtime Tone.js audio graph:
 *
 *   engine → gain → delay → lowpass → highpass → reverb → destination
 *
 * The audio graph itself is created when the number of tracks changes.
 *
 * IMPORTANT:
 * Track settings changes do NOT rebuild the entire graph.
 * Instead, effect parameters are updated in-place.
 *
 * This prevents audible glitches caused by disposing/recreating
 * Tone.js instruments every time an FX knob changes.
 */
export function useAudioGraph({ numTracks, trackSettings }) {
  const trackGainsRef = useRef([]);

  const trackReverbsRef = useRef([]);

  const trackDelaysRef = useRef([]);

  const trackLPFsRef = useRef([]);

  const trackHPFsRef = useRef([]);

  const soundEnginesRef = useRef([]);

  /**
   * Kept in a ref so playTrackSound() always sees the newest
   * track settings without needing to be recreated whenever
   * React state changes.
   */
  const settingsRef = useRef(trackSettings);

  useEffect(() => {
    settingsRef.current = trackSettings;
  }, [trackSettings]);

  /**
   * -------------------------------------------------------
   * HELPERS
   * -------------------------------------------------------
   */

  const disposeAudioGraph = useCallback(() => {
    soundEnginesRef.current.forEach((engine) => {
      try {
        engine?.dispose?.();
      } catch (error) {
        console.warn("Failed to dispose sound engine:", error);
      }
    });

    soundEnginesRef.current = [];

    trackGainsRef.current.forEach((gain) => {
      try {
        gain?.dispose?.();
      } catch (error) {
        console.warn("Failed to dispose track gain:", error);
      }
    });

    trackGainsRef.current = [];

    trackReverbsRef.current.forEach((reverb) => {
      try {
        reverb?.dispose?.();
      } catch (error) {
        console.warn("Failed to dispose reverb:", error);
      }
    });

    trackReverbsRef.current = [];

    trackDelaysRef.current.forEach((delay) => {
      try {
        delay?.dispose?.();
      } catch (error) {
        console.warn("Failed to dispose delay:", error);
      }
    });

    trackDelaysRef.current = [];

    trackLPFsRef.current.forEach((lpf) => {
      try {
        lpf?.dispose?.();
      } catch (error) {
        console.warn("Failed to dispose low-pass filter:", error);
      }
    });

    trackLPFsRef.current = [];

    trackHPFsRef.current.forEach((hpf) => {
      try {
        hpf?.dispose?.();
      } catch (error) {
        console.warn("Failed to dispose high-pass filter:", error);
      }
    });

    trackHPFsRef.current = [];
  }, []);

  /**
   * -------------------------------------------------------
   * SETUP AUDIO GRAPH
   * -------------------------------------------------------
   *
   * Only rebuild when numTracks changes.
   *
   * Do NOT put trackSettings in this dependency list.
   */
  useEffect(() => {
    disposeAudioGraph();

    const gains = [];
    const delays = [];
    const lpfilters = [];
    const hpffilters = [];
    const reverbs = [];
    const engines = [];

    for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
      /**
       * Track gain
       */
      const gain = new Tone.Gain(1);

      /**
       * Delay
       */
      const delay = new Tone.FeedbackDelay({
        delayTime: "8n",
        feedback: 0.3,
        wet: 0,
      });

      /**
       * Low-pass filter
       *
       * Default = completely open.
       */
      const lpf = new Tone.Filter({
        frequency: 20000,
        type: "lowpass",
      });

      /**
       * High-pass filter
       *
       * Default = effectively bypassed.
       */
      const hpf = new Tone.Filter({
        frequency: 20,
        type: "highpass",
      });

      /**
       * Reverb
       */
      const reverb = new Tone.Reverb({
        decay: 1.5,
        wet: 0,
      });

      /**
       * Audio routing:
       *
       * engine
       *   ↓
       * gain
       *   ↓
       * delay
       *   ↓
       * lowpass
       *   ↓
       * highpass
       *   ↓
       * reverb
       *   ↓
       * destination
       */
      gain.connect(delay);
      delay.connect(lpf);
      lpf.connect(hpf);
      hpf.connect(reverb);
      reverb.toDestination();

      gains.push(gain);
      delays.push(delay);
      lpfilters.push(lpf);
      hpffilters.push(hpf);
      reverbs.push(reverb);

      /**
       * Create the sound engine once for this track.
       */
      const settings = settingsRef.current[trackIndex];
      const sound = getSoundById(settings?.sound);

      if (!sound) {
        engines[trackIndex] = null;
        continue;
      }

      try {
        engines[trackIndex] = createSoundEngine(sound, gain);
      } catch (error) {
        console.error(
          `Failed to create sound engine for track ${trackIndex}:`,
          error,
        );

        engines[trackIndex] = null;
      }
    }

    trackGainsRef.current = gains;
    trackDelaysRef.current = delays;
    trackLPFsRef.current = lpfilters;
    trackHPFsRef.current = hpffilters;
    trackReverbsRef.current = reverbs;
    soundEnginesRef.current = engines;

    /**
     * Apply current settings immediately after creating the graph.
     *
     * This is important when numTracks changes while the user already
     * has populated track settings.
     */
    trackSettings.forEach((settings, trackIndex) => {
      const gain = gains[trackIndex];
      const delay = delays[trackIndex];
      const lpf = lpfilters[trackIndex];
      const hpf = hpffilters[trackIndex];
      const reverb = reverbs[trackIndex];

      if (!gain) {
        return;
      }

      /**
       * -------------------------
       * VOLUME / MUTE
       * -------------------------
       */
      const volume = Number.isFinite(settings?.volume)
        ? settings.volume
        : 1;

      gain.gain.value = settings?.muted ? 0 : volume;

      /**
       * -------------------------
       * DELAY
       * -------------------------
       *
       * Disabled delay is explicitly made 100% dry by setting wet = 0.
       *
       * We still preserve the user's time/feedback/wet settings while
       * disabled so turning it back on restores the previous values.
       */
      if (delay) {
        const delayEnabled = settings?.delay?.enabled ?? false;

        const delayTime = settings?.delay?.time ?? 0.25;

        const feedback = settings?.delay?.feedback ?? 0.3;

        const delayWet = settings?.delay?.wet ?? 0.3;

        delay.delayTime.value = delayTime;

        delay.feedback.value = feedback;

        delay.wet.value = delayEnabled ? delayWet : 0;
      }

      /**
       * -------------------------
       * FILTER
       * -------------------------
       *
       * THIS IS THE IMPORTANT FIX.
       *
       * The model contains filter.enabled, so the audio graph must
       * actually respect it.
       *
       * When disabled:
       *
       *   LPF = 20000 Hz
       *   HPF = 20 Hz
       *
       * This effectively bypasses the filters while preserving the
       * user's stored frequencies for when they enable the filter again.
       */
      if (lpf && hpf) {
        const filterEnabled = settings?.filter?.enabled ?? false;

        const lowpass = settings?.filter?.lowpass ?? 20000;

        const highpass = settings?.filter?.highpass ?? 20;

        lpf.frequency.value = filterEnabled ? lowpass : 20000;

        hpf.frequency.value = filterEnabled ? highpass : 20;
      }

      /**
       * -------------------------
       * REVERB
       * -------------------------
       *
       * Disabled reverb is explicitly made completely dry.
       */
      if (reverb) {
        const reverbEnabled = settings?.reverb?.enabled ?? false;

        const wet = settings?.reverb?.wet ?? 0.35;

        const decay = settings?.reverb?.decay ?? 1.5;

        reverb.decay = decay;

        reverb.wet.value = reverbEnabled ? wet : 0;
      }
    });

    /**
     * Cleanup when numTracks changes or the component unmounts.
     */
    return () => {
      /**
       * Dispose the exact objects created by this effect.
       *
       * We don't call disposeAudioGraph() here because React cleanup
       * can happen while refs already point at the next graph.
       */
      engines.forEach((engine) => {
        try {
          engine?.dispose?.();
        } catch (error) {
          console.warn("Failed to dispose sound engine:", error);
        }
      });

      gains.forEach((gain) => {
        try {
          gain?.dispose?.();
        } catch (error) {
          console.warn("Failed to dispose gain:", error);
        }
      });

      delays.forEach((delay) => {
        try {
          delay?.dispose?.();
        } catch (error) {
          console.warn("Failed to dispose delay:", error);
        }
      });

      lpfilters.forEach((lpf) => {
        try {
          lpf?.dispose?.();
        } catch (error) {
          console.warn("Failed to dispose low-pass filter:", error);
        }
      });

      hpffilters.forEach((hpf) => {
        try {
          hpf?.dispose?.();
        } catch (error) {
          console.warn("Failed to dispose high-pass filter:", error);
        }
      });

      reverbs.forEach((reverb) => {
        try {
          reverb?.dispose?.();
        } catch (error) {
          console.warn("Failed to dispose reverb:", error);
        }
      });
    };
  }, [numTracks, disposeAudioGraph]);

  /**
   * -------------------------------------------------------
   * UPDATE TRACK EFFECTS
   * -------------------------------------------------------
   *
   * IMPORTANT:
   * This updates existing Tone.js nodes.
   *
   * It does NOT recreate the sound engine.
   */
  useEffect(() => {
    trackSettings.forEach((settings, trackIndex) => {
      const gain = trackGainsRef.current[trackIndex];
      const delay = trackDelaysRef.current[trackIndex];
      const lpf = trackLPFsRef.current[trackIndex];
      const hpf = trackHPFsRef.current[trackIndex];
      const reverb = trackReverbsRef.current[trackIndex];

      if (!gain) {
        return;
      }

      /**
       * -------------------------
       * VOLUME / MUTE
       * -------------------------
       */
      const volume = Number.isFinite(settings?.volume)
        ? settings.volume
        : 1;

      gain.gain.value = settings?.muted ? 0 : volume;

      /**
       * -------------------------
       * DELAY
       * -------------------------
       */
      if (delay) {
        const delayEnabled = settings?.delay?.enabled ?? false;

        const delayTime = settings?.delay?.time ?? 0.25;

        const feedback = settings?.delay?.feedback ?? 0.3;

        const delayWet = settings?.delay?.wet ?? 0.3;

        delay.delayTime.value = delayTime;

        delay.feedback.value = feedback;

        /**
         * The crucial bypass behavior:
         *
         * OFF → wet = 0
         * ON  → wet = user's selected amount
         */
        delay.wet.value = delayEnabled ? delayWet : 0;
      }

      /**
       * -------------------------
       * FILTER
       * -------------------------
       *
       * The filter values remain stored in React state.
       *
       * The actual Tone filters are bypassed by restoring their
       * neutral frequencies when disabled.
       */
      if (lpf && hpf) {
        const filterEnabled = settings?.filter?.enabled ?? false;

        const lowpass = settings?.filter?.lowpass ?? 20000;

        const highpass = settings?.filter?.highpass ?? 20;

        if (filterEnabled) {
          lpf.frequency.value = lowpass;

          hpf.frequency.value = highpass;
        } else {
          /**
           * Neutral/bypass values.
           *
           * Do NOT delete/reset the saved React values.
           * This means:
           *
           * 1. User sets LPF to 1000 Hz.
           * 2. User turns filter off.
           * 3. Audio becomes normal again.
           * 4. User turns filter on.
           * 5. LPF goes back to 1000 Hz.
           */
          lpf.frequency.value = 20000;

          hpf.frequency.value = 20;
        }
      }

      /**
       * -------------------------
       * REVERB
       * -------------------------
       */
      if (reverb) {
        const reverbEnabled = settings?.reverb?.enabled ?? false;

        const wet = settings?.reverb?.wet ?? 0.35;

        const decay = settings?.reverb?.decay ?? 1.5;

        reverb.decay = decay;

        /**
         * OFF → completely dry
         * ON  → user's wet amount
         */
        reverb.wet.value = reverbEnabled ? wet : 0;
      }
    });
  }, [trackSettings]);

  /**
   * -------------------------------------------------------
   * RECREATE SOUND ENGINES WHEN SOUND CHANGES
   * -------------------------------------------------------
   *
   * Previously this ran whenever ANY track setting changed.
   *
   * That meant:
   *
   *   change delay knob
   *      ↓
   *   React state changes
   *      ↓
   *   dispose synth
   *      ↓
   *   create synth
   *
   * This can cause clicks, glitches, lost voices, and other
   * undesirable audio behavior.
   *
   * We now compare the current sound IDs against the previous
   * sound IDs and only recreate engines when the selected sound
   * actually changes.
   */
  const previousSoundIdsRef = useRef([]);

  useEffect(() => {
    const currentSoundIds = trackSettings.map(
      (settings) => settings?.sound ?? null,
    );

    const previousSoundIds = previousSoundIdsRef.current;

    /**
     * On the first run, the main graph setup effect already created
     * the engines. Don't recreate them here.
     */
    if (previousSoundIds.length === 0) {
      previousSoundIdsRef.current = currentSoundIds;
      return;
    }

    currentSoundIds.forEach((soundId, trackIndex) => {
      const previousSoundId = previousSoundIds[trackIndex];

      if (soundId === previousSoundId) {
        return;
      }

      const oldEngine = soundEnginesRef.current[trackIndex];

      if (oldEngine) {
        try {
          oldEngine.dispose();
        } catch (error) {
          console.warn(
            `Failed to dispose old engine for track ${trackIndex}:`,
            error,
          );
        }
      }

      soundEnginesRef.current[trackIndex] = null;

      const sound = getSoundById(soundId);

      if (!sound) {
        return;
      }

      const gain = trackGainsRef.current[trackIndex];

      if (!gain) {
        return;
      }

      try {
        const engine = createSoundEngine(sound, gain);

        soundEnginesRef.current[trackIndex] = engine;
      } catch (error) {
        console.error(
          `Failed to create sound engine for track ${trackIndex}:`,
          error,
        );
      }
    });

    previousSoundIdsRef.current = currentSoundIds;
  }, [trackSettings]);

  /**
   * -------------------------------------------------------
   * CLEANUP SOUND GRAPH ON UNMOUNT
   * -------------------------------------------------------
   */
  useEffect(() => {
    return () => {
      if (previewEngineRef.current) {
        try {
          previewEngineRef.current.dispose();
        } catch (error) {
          console.warn("Failed to dispose preview engine:", error);
        }

        previewEngineRef.current = null;
      }

      disposeAudioGraph();
    };
  }, [disposeAudioGraph]);

  /**
   * -------------------------------------------------------
   * PLAY TRACK SOUND
   * -------------------------------------------------------
   */
  const playTrackSound = useCallback(
    (trackIndex, time, settingsOverrides = {}) => {
      const baseSettings = settingsRef.current[trackIndex];

      if (!baseSettings) {
        return;
      }

      const settings = {
        ...baseSettings,
        ...settingsOverrides,
      };

      if (settings.muted) {
        return;
      }

      const anySolo = settingsRef.current.some((s) => s?.soloed);

      if (anySolo && !settings?.soloed) {
        return;
      }

      const engine = soundEnginesRef.current[trackIndex];

      if (!engine) {
        /**
         * Blank track (no instrument selected).
         */
        return;
      }

      const playOverrides = {
        note: settingsOverrides.note ?? settings.note,
        duration: settingsOverrides.duration ?? settings.duration,
      };

      try {
        engine.play(time, playOverrides);
      } catch (error) {
        console.error("Failed to play track sound:", error);
      }
    },
    [],
  );

  /**
   * -------------------------------------------------------
   * PREVIEW SOUND
   * -------------------------------------------------------
   */
  const previewEngineRef = useRef(null);

  const previewSound = useCallback(async (soundId) => {
    /**
     * Stop/dispose any previous preview.
     */
    if (previewEngineRef.current) {
      try {
        previewEngineRef.current.dispose();
      } catch (error) {
        console.warn("Failed to dispose previous preview:", error);
      }

      previewEngineRef.current = null;
    }

    const sound = getSoundById(soundId);

    if (!sound) {
      console.warn(`Sound not found for preview: ${soundId}`);
      return;
    }

    await Tone.start();

    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    let engine;

    try {
      /**
       * Preview engines are intentionally separate from the track graph.
       */
      engine = createSoundEngine(sound);

      previewEngineRef.current = engine;

      engine.play(Tone.now());
    } catch (error) {
      console.error("Failed to preview sound:", error);

      try {
        engine?.dispose?.();
      } catch {
        // Ignore cleanup errors.
      }

      previewEngineRef.current = null;

      return;
    }

    /**
     * Dispose after a short time.
     */
    setTimeout(() => {
      if (previewEngineRef.current === engine) {
        try {
          engine.dispose();
        } catch (error) {
          console.warn("Failed to dispose preview engine:", error);
        }

        previewEngineRef.current = null;
      }
    }, 2000);
  }, []);

  return {
    playTrackSound,
    previewSound,
  };
}