// src/sequencer/useAudioGraph.js

import { useEffect, useRef } from "react";

import * as Tone from "tone";

import { getSoundById, createSoundEngine } from "../audio/soundLibrary";

/**
 * Owns the realtime Tone.js audio graph:
 *
 *   engine → gain → delay → lowpass → highpass → reverb → destination
 *
 * Rebuilds the chain when the track count changes, syncs effect
 * parameters when track settings change, and exposes playTrackSound()
 * for the transport loop and UI previews.
 */
export function useAudioGraph({ numTracks, trackSettings }) {
  const trackGainsRef = useRef([]);

  const trackReverbsRef = useRef([]);

  const trackDelaysRef = useRef([]);

  const trackLPFsRef = useRef([]);

  const trackHPFsRef = useRef([]);

  const soundEnginesRef = useRef([]);

  /**
   * Kept in a ref so playTrackSound (called from the transport
   * loop's stale closure) always reads the latest settings.
   */
  const settingsRef = useRef(trackSettings);

  useEffect(() => {
    settingsRef.current = trackSettings;
  }, [trackSettings]);

  /**
   * -------------------------------------------------------
   * SETUP AUDIO GRAPH
   * -------------------------------------------------------
   */

  useEffect(() => {
    soundEnginesRef.current.forEach((engine) => {
      engine?.dispose?.();
    });

    soundEnginesRef.current = [];

    trackGainsRef.current.forEach((gain) => {
      gain?.dispose?.();
    });

    trackGainsRef.current = [];

    trackReverbsRef.current.forEach((reverb) => {
      reverb?.dispose?.();
    });

    trackReverbsRef.current = [];

    trackDelaysRef.current.forEach((delay) => {
      delay?.dispose?.();
    });

    trackDelaysRef.current = [];

    trackLPFsRef.current.forEach((lpf) => {
      lpf?.dispose?.();
    });

    trackLPFsRef.current = [];

    trackHPFsRef.current.forEach((hpf) => {
      hpf?.dispose?.();
    });

    trackHPFsRef.current = [];

    const gains = [];
    const delays = [];
    const lpfilters = [];
    const hpffilters = [];
    const reverbs = [];

    for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
      const gain = new Tone.Gain(1);

      const delay = new Tone.FeedbackDelay({
        delayTime: "8n",
        feedback: 0.3,
        wet: 0,
      });

      const lpf = new Tone.Filter(20000, "lowpass");

      const hpf = new Tone.Filter(20, "highpass");

      const reverb = new Tone.Reverb({
        decay: 1.5,
        wet: 0,
      });

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
    }

    trackGainsRef.current = gains;
    trackDelaysRef.current = delays;
    trackLPFsRef.current = lpfilters;
    trackHPFsRef.current = hpffilters;
    trackReverbsRef.current = reverbs;

    for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
      const settings = trackSettings[trackIndex];

      const sound = getSoundById(settings?.sound);

      if (!sound) {
        console.warn(`Sound not found: ${settings?.sound}`);
        soundEnginesRef.current[trackIndex] = null;
        continue;
      }

      const engine = createSoundEngine(sound, gains[trackIndex]);

      soundEnginesRef.current[trackIndex] = engine;
    }

    return () => {
      soundEnginesRef.current.forEach((engine) => {
        engine?.dispose?.();
      });

      soundEnginesRef.current = [];

      gains.forEach((gain) => gain.dispose());
      delays.forEach((delay) => delay.dispose());
      lpfilters.forEach((lpf) => lpf.dispose());
      hpffilters.forEach((hpf) => hpf.dispose());
      reverbs.forEach((reverb) => reverb.dispose());

      trackGainsRef.current = [];
      trackDelaysRef.current = [];
      trackLPFsRef.current = [];
      trackHPFsRef.current = [];
      trackReverbsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numTracks]);

  /**
   * -------------------------------------------------------
   * UPDATE TRACK EFFECTS
   * -------------------------------------------------------
   */

  useEffect(() => {
    trackSettings.forEach((settings, trackIndex) => {
      const gain = trackGainsRef.current[trackIndex];
      const delay = trackDelaysRef.current[trackIndex];
      const lpf = trackLPFsRef.current[trackIndex];
      const hpf = trackHPFsRef.current[trackIndex];
      const reverb = trackReverbsRef.current[trackIndex];

      if (!gain || !reverb) {
        return;
      }

      gain.gain.value = settings?.muted ? 0 : settings.volume;

      if (delay) {
        const delayEnabled = settings?.delay?.enabled ?? false;
        const delayTime = settings?.delay?.time ?? 0.25;
        const feedback = settings?.delay?.feedback ?? 0.3;
        const delayWet = settings?.delay?.wet ?? 0.3;

        delay.delayTime.value = delayTime;
        delay.feedback.value = feedback;
        delay.wet.value = delayEnabled ? delayWet : 0;
      }

      if (lpf) {
        lpf.frequency.value = settings?.filter?.lowpass ?? 20000;
      }

      if (hpf) {
        hpf.frequency.value = settings?.filter?.highpass ?? 20;
      }

      const reverbEnabled = settings?.reverb?.enabled ?? false;

      const wet = settings?.reverb?.wet ?? 0.35;

      const decay = settings?.reverb?.decay ?? 1.5;

      reverb.decay = decay;
      reverb.wet.value = reverbEnabled ? wet : 0;
    });
  }, [trackSettings]);

  /**
   * -------------------------------------------------------
   * RECREATE SOUND ENGINES
   * -------------------------------------------------------
   */

  useEffect(() => {
    for (let trackIndex = 0; trackIndex < trackSettings.length; trackIndex++) {
      const settings = trackSettings[trackIndex];

      const sound = getSoundById(settings?.sound);

      const oldEngine = soundEnginesRef.current[trackIndex];

      if (oldEngine) {
        oldEngine.dispose();
      }

      if (!sound) {
        soundEnginesRef.current[trackIndex] = null;
        continue;
      }

      const gain = trackGainsRef.current[trackIndex];

      if (!gain) {
        soundEnginesRef.current[trackIndex] = null;
        continue;
      }

      const engine = createSoundEngine(sound, gain);

      soundEnginesRef.current[trackIndex] = engine;
    }
  }, [trackSettings]);

  /**
   * -------------------------------------------------------
   * PLAY TRACK SOUND
   * -------------------------------------------------------
   */

  const playTrackSound = (trackIndex, time, settingsOverrides = {}) => {
    const baseSettings = settingsRef.current[trackIndex];

    const settings = { ...baseSettings, ...settingsOverrides };

    if (!settings) {
      return;
    }

    if (settings.muted) {
      return;
    }

    const anySolo = settingsRef.current.some((s) => s?.soloed);

    if (anySolo && !settings?.soloed) {
      return;
    }

    const engine = soundEnginesRef.current[trackIndex];

    if (!engine) {
      console.warn(`No sound engine for track ${trackIndex + 1}`);

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
  };

  const previewEngineRef = useRef(null);

  const previewSound = async (soundId) => {
    if (previewEngineRef.current) {
      previewEngineRef.current.dispose();
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

    const engine = createSoundEngine(sound);
    // createSoundEngine already connects to destination via resolveDestination
    previewEngineRef.current = engine;

    engine.play(Tone.now());

    // Dispose after a short time
    setTimeout(() => {
      if (previewEngineRef.current === engine) {
        engine.dispose();
        previewEngineRef.current = null;
      }
    }, 2000); // 2 seconds
  };

  return { playTrackSound, previewSound };
}
