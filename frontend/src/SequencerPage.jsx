// src/SequencerPage.jsx

import * as Tone from "tone";

import { useState, useEffect, useRef } from "react";

import { useSearchParams, useNavigate, useLocation } from "react-router";

import { useAuth } from "./AuthContext/AuthContext.jsx";

import {
  SOUND_LIBRARY,
  getSoundById,
  createSoundEngine,
} from "./audio/soundLibrary";

import Dial from "./components/Dial.jsx";

import ArrangementView from "./components/ArrangementView.jsx";

import "./App.css";

/**
 * ---------------------------------------------------------
 * CONSTANTS
 * ---------------------------------------------------------
 */

const MIN_TRACKS = 4;
const MAX_TRACKS = 8;
const NUM_STEPS = 16;

const TRACK_LABELS = [
  "Track 1",
  "Track 2",
  "Track 3",
  "Track 4",
  "Track 5",
  "Track 6",
  "Track 7",
  "Track 8",
];

/**
 * Default sound-library IDs for each track slot (up to 8).
 */
const DEFAULT_TRACK_SOUNDS = [
  "drums.kicks.cr78",
  "drums.snares.cr78",
  "drums.hihats.cr78",
  "synths.stabs.classic",
  "drums.claps.synth",
  "bass.sub.sine",
  "synths.leads.basic",
  "synths.bells.digital",
];

/**
 * Notes available from the sequencer.
 */
const NOTE_OPTIONS = [
  "C2",
  "C#2",
  "D2",
  "D#2",
  "E2",
  "F2",
  "F#2",
  "G2",
  "G#2",
  "A2",
  "A#2",
  "B2",
  "C3",
  "C#3",
  "D3",
  "D#3",
  "E3",
  "F3",
  "F#3",
  "G3",
  "G#3",
  "A3",
  "A#3",
  "B3",
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",
  "C5",
  "C#5",
  "D5",
  "D#5",
  "E5",
  "F5",
  "F#5",
  "G5",
  "G#5",
  "A5",
  "A#5",
  "B5",
];

/**
 * ---------------------------------------------------------
 * GRID & TRACK SETTINGS HELPERS
 * ---------------------------------------------------------
 */

function createEmptyGrid(numTracks = MIN_TRACKS) {
  return Array(numTracks)
    .fill(null)
    .map(() => Array(NUM_STEPS).fill(false));
}

function createDefaultTrackSettings(numTracks = MIN_TRACKS) {
  return Array.from({ length: numTracks }, (_, i) => {
    const soundId = DEFAULT_TRACK_SOUNDS[i] || DEFAULT_TRACK_SOUNDS[0];

    const sound = getSoundById(soundId);

    const track = {
      sound: sound ? sound.id : soundId,
      muted: false,
      reverb: { enabled: false, wet: 0.35, decay: 1.5 },
      delay: { enabled: false, time: 0.25, feedback: 0.3, wet: 0.3 },
      filter: { lowpass: 20000, highpass: 20, enabled: false },
    };

    if (sound?.type === "synth") {
      track.note = sound.synth?.note;
      track.duration = sound.synth?.duration || "8n";
    }

    return track;
  });
}

/**
 * ---------------------------------------------------------
 * SOUND LIBRARY HELPERS
 * ---------------------------------------------------------
 */

function getAvailableSounds() {
  return SOUND_LIBRARY;
}

/**
 * ---------------------------------------------------------
 * SEQUENCER
 * ---------------------------------------------------------
 */

export default function SequencerPage() {
  const { isAuthenticated, token, user } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();
  const location = useLocation();

  /**
   * -------------------------------------------------------
   * REACT STATE
   * -------------------------------------------------------
   */

  const [numTracks, setNumTracks] = useState(MIN_TRACKS);

  const [grid, setGrid] = useState(createEmptyGrid);

  const [isPlaying, setIsPlaying] = useState(false);

  const [currentStep, setCurrentStep] = useState(null);

  const [bpm, setBpm] = useState(120);

  const [trackSettings, setTrackSettings] = useState(
    createDefaultTrackSettings,
  );

  const [projectName, setProjectName] = useState("");

  const [projectId, setProjectId] = useState(null);

  const [saveStatus, setSaveStatus] = useState("");

  const [loadId, setLoadId] = useState("");

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const [expandedTrack, setExpandedTrack] = useState(null);

  /**
   * Arrangement state
   */

  const [arrangement, setArrangement] = useState([]);

  const [isArrangementPlaying, setIsArrangementPlaying] = useState(false);

  const [activeSectionIndex, setActiveSectionIndex] = useState(null);

  /**
   * Share state
   */

  const [sharedId, setSharedId] = useState(null);

  const [isSharedView, setIsSharedView] = useState(false);

  const [sharedBy, setSharedBy] = useState("");

  const [shareLink, setShareLink] = useState("");

  /**
   * -------------------------------------------------------
   * REFS
   * -------------------------------------------------------
   */

  const gridRef = useRef(grid);

  const settingsRef = useRef(trackSettings);

  const stepCountRef = useRef(0);

  const arrangementRef = useRef(arrangement);

  const isArrangementPlayingRef = useRef(false);

  const arrangementStepRef = useRef(0);

  /**
   * One audio routing chain per track:
   *
   *   sound engine → gain → reverb → destination
   *
   * The arrays grow / shrink automatically when the
   * track count changes.
   */

  const trackGainsRef = useRef([]);

  const trackReverbsRef = useRef([]);

  const trackDelaysRef = useRef([]);

  const trackLPFsRef = useRef([]);

  const trackHPFsRef = useRef([]);

  const soundEnginesRef = useRef([]);

  /**
   * -------------------------------------------------------
   * SYNC REFS
   * -------------------------------------------------------
   */

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    settingsRef.current = trackSettings;
  }, [trackSettings]);

  useEffect(() => {
    arrangementRef.current = arrangement;
  }, [arrangement]);

  /**
   * -------------------------------------------------------
   * SETUP AUDIO GRAPH (runs when numTracks changes)
   * -------------------------------------------------------
   */

  useEffect(() => {
    /**
     * Dispose existing nodes.
     */

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

    /**
     * Create per-track chain:
     *
     *   engine → gain → delay → LPF → HPF → reverb → destination
     *
     * Each effect's output feeds the next, so
     * the full chain processes every sample.
     */

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

      /**
       * Chain: gain → delay → LPF → HPF → reverb → destination
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
    }

    trackGainsRef.current = gains;
    trackDelaysRef.current = delays;
    trackLPFsRef.current = lpfilters;
    trackHPFsRef.current = hpffilters;
    trackReverbsRef.current = reverbs;

    /**
     * Create sound engines for each track.
     */

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

    /**
     * Cleanup on unmount or track-count change.
     */

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

      /**
       * MUTE
       */

      gain.gain.value = settings?.muted ? 0 : 1;

      /**
       * DELAY
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
       * FILTER — Low Pass
       */

      if (lpf) {
        const lpFreq = settings?.filter?.lowpass ?? 20000;

        lpf.frequency.value = lpFreq;
      }

      /**
       * FILTER — High Pass
       */

      if (hpf) {
        const hpFreq = settings?.filter?.highpass ?? 20;

        hpf.frequency.value = hpFreq;
      }

      /**
       * REVERB
       */

      const reverbEnabled = settings?.reverb?.enabled ?? false;

      const wet = settings?.reverb?.wet ?? 0.35;

      const decay = settings?.reverb?.decay ?? 1.5;

      reverb.decay = decay;

      reverb.wet.value = reverbEnabled ? wet : 0;
    });
  }, [trackSettings]);

  /**
   * -------------------------------------------------------
   * RECREATE SOUND ENGINES (when sound selection changes)
   * -------------------------------------------------------
   */

  useEffect(() => {
    for (let trackIndex = 0; trackIndex < trackSettings.length; trackIndex++) {
      const settings = trackSettings[trackIndex];

      const sound = getSoundById(settings?.sound);

      /**
       * Dispose old engine.
       */

      const oldEngine = soundEnginesRef.current[trackIndex];

      if (oldEngine) {
        oldEngine.dispose();
      }

      /**
       * No sound selected.
       */

      if (!sound) {
        soundEnginesRef.current[trackIndex] = null;
        continue;
      }

      /**
       * Create new engine.
       */

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
   * RETURN FROM CUSTOMIZE TRACK
   * -------------------------------------------------------
   */

  useEffect(() => {
    const returnedState = location.state;

    if (!returnedState?.fromCustomize) {
      return;
    }

    if (Array.isArray(returnedState.grid)) {
      setGrid(returnedState.grid);
      setNumTracks(returnedState.grid.length);
    }

    if (Array.isArray(returnedState.trackSettings)) {
      setTrackSettings(
        returnedState.trackSettings.map((track) => ({
          ...track,
          muted: track?.muted ?? false,
        })),
      );
    }

    if (returnedState.bpm !== undefined) {
      setBpm(returnedState.bpm);
      Tone.Transport.bpm.value = returnedState.bpm;
    }

    if (returnedState.projectName !== undefined) {
      setProjectName(returnedState.projectName);
    }

    if (returnedState.projectId !== undefined) {
      setProjectId(returnedState.projectId);
    }

    setInitialLoadDone(true);

    navigate("/sequencer", {
      replace: true,
      state: null,
    });
  }, [location.state, navigate]);

  /**
   * -------------------------------------------------------
   * EXPAND / COLLAPSE INLINE TRACK CONTROLS
   * -------------------------------------------------------
   */

  const toggleTrackExpand = (trackIndex) => {
    setExpandedTrack(expandedTrack === trackIndex ? null : trackIndex);
  };

  /**
   * -------------------------------------------------------
   * PREVIEW TRACK SOUND (inline)
   * -------------------------------------------------------
   */

  const previewTrackInline = async (trackIndex) => {
    await Tone.start();

    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    playTrackSound(trackIndex);
  };

  /**
   * -------------------------------------------------------
   * LOAD PROJECT FROM URL
   * -------------------------------------------------------
   *
   * Supports two URL modes:
   *
   *   ?projectId=xxx   → load for editing (owner auth required)
   *   ?sharedId=xxx    → load read-only shared view (no auth required)
   */

  useEffect(() => {
    const projectIdFromUrl = searchParams.get("projectId");

    const sharedIdFromUrl = searchParams.get("sharedId");

    if (!projectIdFromUrl && !sharedIdFromUrl) {
      return;
    }

    if (location.state?.fromCustomize) {
      return;
    }

    if (initialLoadDone) {
      return;
    }

    const loadProjectFromUrl = async () => {
      /**
       * Shared view — no auth required.
       */

      if (sharedIdFromUrl && !projectIdFromUrl) {
        setSaveStatus("Loading shared project...");

        try {
          const response = await fetch(
            `/api/projects/shared/${sharedIdFromUrl}`,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            },
          );

          if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Failed to load shared project");
          }

          const project = await response.json();

          applyProject(project);

          setIsSharedView(true);
          setSharedId(sharedIdFromUrl);
          setSharedBy(project.username || "");
          setProjectId(null);

          setSaveStatus(`Loaded shared project "${project.name}"`);
        } catch (error) {
          setSaveStatus(`Load failed: ${error.message}`);
        } finally {
          setInitialLoadDone(true);
        }

        return;
      }

      /**
       * Owned project — auth required.
       */

      setSaveStatus("Loading project...");

      try {
        const response = await fetch(`/api/projects/${projectIdFromUrl}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to load project");
        }

        const project = await response.json();

        applyProject(project);

        setSharedId(project.shared_id || null);

        setSaveStatus(`Loaded "${project.name}"`);
      } catch (error) {
        setSaveStatus(`Load failed: ${error.message}`);
      } finally {
        setInitialLoadDone(true);
      }
    };

    loadProjectFromUrl();
  }, [searchParams, token, initialLoadDone, location.state]);

  /**
   * -------------------------------------------------------
   * APPLY PROJECT
   * -------------------------------------------------------
   */

  const applyProject = (project) => {
    setProjectName(project.name || "");

    setProjectId(project.id || null);

    const projectBpm = project.tempo || 120;

    setBpm(projectBpm);

    Tone.Transport.bpm.value = projectBpm;

    /**
     * Restore grid — set track count from grid length.
     */

    if (Array.isArray(project.grid)) {
      const trackCount = Math.min(
        Math.max(project.grid.length, MIN_TRACKS),
        MAX_TRACKS,
      );

      setNumTracks(trackCount);

      setGrid(project.grid);
    }

    /**
     * Restore track settings.
     */

    if (Array.isArray(project.track_settings)) {
      const trackCount = Math.min(
        Math.max(project.track_settings.length, MIN_TRACKS),
        MAX_TRACKS,
      );

      setNumTracks(trackCount);

      setTrackSettings(project.track_settings);
    }

    /**
     * Restore arrangement.
     */

    if (Array.isArray(project.arrangement)) {
      setArrangement(project.arrangement);
    }
  };

  /**
   * -------------------------------------------------------
   * ADD / REMOVE TRACK
   * -------------------------------------------------------
   */

  const addTrack = () => {
    if (numTracks >= MAX_TRACKS) {
      return;
    }

    const newNumTracks = numTracks + 1;

    const soundId = DEFAULT_TRACK_SOUNDS[numTracks] || DEFAULT_TRACK_SOUNDS[0];

    const newTrack = {
      sound: soundId,
      muted: false,
      reverb: { enabled: false, wet: 0.35, decay: 1.5 },
      delay: { enabled: false, time: 0.25, feedback: 0.3, wet: 0.3 },
      filter: { lowpass: 20000, highpass: 20, enabled: false },
    };

    const sound = getSoundById(soundId);

    if (sound?.type === "synth") {
      newTrack.note = sound.synth?.note;
      newTrack.duration = sound.synth?.duration || "8n";
    }

    setNumTracks(newNumTracks);

    setGrid((prev) => [...prev, Array(NUM_STEPS).fill(false)]);

    setTrackSettings((prev) => [...prev, newTrack]);
  };

  const removeTrack = () => {
    if (numTracks <= MIN_TRACKS) {
      return;
    }

    const newNumTracks = numTracks - 1;

    setNumTracks(newNumTracks);

    setGrid((prev) => prev.slice(0, newNumTracks));

    setTrackSettings((prev) => prev.slice(0, newNumTracks));
  };

  /**
   * -------------------------------------------------------
   * PLAY TRACK SOUND
   * -------------------------------------------------------
   */

  const playTrackSound = (trackIndex, time, overrides = {}) => {
    const settings = settingsRef.current[trackIndex];

    if (!settings) {
      return;
    }

    if (settings.muted) {
      return;
    }

    /**
     * SOLO
     *
     * If any track is soloed, only
     * play soloed tracks.
     */

    const anySolo = settingsRef.current.some((s) => s?.soloed);

    if (anySolo && !settings?.soloed) {
      return;
    }

    const engine = soundEnginesRef.current[trackIndex];

    if (!engine) {
      console.warn(`No sound engine for track ${trackIndex + 1}`);
      return;
    }

    /**
     * Pass the current track note and duration
     * into the sound engine.
     *
     * Explicit overrides win over track settings.
     */

    const playOverrides = {
      note: overrides.note ?? settings.note,
      duration: overrides.duration ?? settings.duration,
    };

    try {
      engine.play(time, playOverrides);
    } catch (error) {
      console.error("Failed to play track sound:", error);
    }
  };

  /**
   * -------------------------------------------------------
   * 16-STEP TRANSPORT LOOP
   * -------------------------------------------------------
   */

  useEffect(() => {
    const repeat = (time) => {
      /**
       * ARRANGEMENT MODE
       *
       * Walk the cumulative step count to find which
       * section is currently active, then play that
       * section's grid. Auto-stop when all sections
       * have finished.
       */

      if (isArrangementPlayingRef.current) {
        const sections = arrangementRef.current;

        if (!sections || sections.length === 0) {
          isArrangementPlayingRef.current = false;
          setIsArrangementPlaying(false);
          setActiveSectionIndex(null);
          setCurrentStep(null);
          return;
        }

        const totalSteps = sections.reduce(
          (sum, s) => sum + (s.bars || 1) * NUM_STEPS,
          0,
        );

        const globalStep = arrangementStepRef.current;

        if (globalStep >= totalSteps) {
          Tone.Transport.stop();
          Tone.Transport.position = 0;
          arrangementStepRef.current = 0;
          stepCountRef.current = 0;
          isArrangementPlayingRef.current = false;
          setIsArrangementPlaying(false);
          setActiveSectionIndex(null);
          setCurrentStep(null);
          return;
        }

        /**
         * Find the active section by walking cumulative steps.
         */

        let remaining = globalStep;
        let sectionIndex = 0;

        for (let i = 0; i < sections.length; i++) {
          const sectionSteps = (sections[i].bars || 1) * NUM_STEPS;

          if (remaining < sectionSteps) {
            sectionIndex = i;
            break;
          }

          remaining -= sectionSteps;
        }

        const step = remaining % NUM_STEPS;

        setCurrentStep(step);
        setActiveSectionIndex(sectionIndex);

        const sectionGrid = sections[sectionIndex]?.grid;

        const trackCount = sectionGrid?.length || 0;

        for (let trackIndex = 0; trackIndex < trackCount; trackIndex++) {
          if (sectionGrid?.[trackIndex]?.[step]) {
            playTrackSound(trackIndex, time);
          }
        }

        arrangementStepRef.current++;
        stepCountRef.current++;
        return;
      }

      /**
       * NORMAL MODE — play the current grid.
       */

      const step = stepCountRef.current % NUM_STEPS;

      setCurrentStep(step);

      const currentGrid = gridRef.current;

      const trackCount = currentGrid?.length || 0;

      for (let trackIndex = 0; trackIndex < trackCount; trackIndex++) {
        if (currentGrid?.[trackIndex]?.[step]) {
          playTrackSound(trackIndex, time);
        }
      }

      stepCountRef.current++;
    };

    const eventId = Tone.Transport.scheduleRepeat(repeat, "16n");

    return () => {
      Tone.Transport.clear(eventId);
    };
  }, []);

  /**
   * -------------------------------------------------------
   * BPM
   * -------------------------------------------------------
   */

  const handleBpmChange = (newBpm) => {
    setBpm(newBpm);
    Tone.Transport.bpm.value = newBpm;
  };

  /**
   * -------------------------------------------------------
   * TOGGLE STEP
   * -------------------------------------------------------
   */

  const toggleStep = async (trackIndex, stepIndex) => {
    await Tone.start();

    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    const updatedGrid = grid.map((track) => [...track]);

    const isTurningOn = !updatedGrid[trackIndex][stepIndex];

    updatedGrid[trackIndex][stepIndex] = isTurningOn;

    setGrid(updatedGrid);

    /**
     * Preview immediately.
     */

    if (isTurningOn) {
      playTrackSound(trackIndex);
    }
  };

  /**
   * -------------------------------------------------------
   * MUTE
   * -------------------------------------------------------
   */

  const toggleTrackMute = (trackIndex) => {
    setTrackSettings((previous) =>
      previous.map((track, index) => {
        if (index !== trackIndex) {
          return track;
        }

        return {
          ...track,
          muted: !track?.muted,
        };
      }),
    );
  };

  /**
   * -------------------------------------------------------
   * SOLO
   * -------------------------------------------------------
   */

  const toggleTrackSolo = (trackIndex) => {
    setTrackSettings((previous) =>
      previous.map((track, index) => {
        if (index !== trackIndex) {
          return track;
        }

        return {
          ...track,
          soloed: !track?.soloed,
        };
      }),
    );
  };

  /**
   * -------------------------------------------------------
   * CHANGE SOUND
   * -------------------------------------------------------
   */

  const updateTrackSound = (trackIndex, soundId) => {
    const sound = getSoundById(soundId);

    if (!sound) {
      console.warn(`Sound not found: ${soundId}`);
      return;
    }

    setTrackSettings((previous) =>
      previous.map((track, index) => {
        if (index !== trackIndex) {
          return track;
        }

        return {
          ...track,
          sound: sound.id,

          /**
           * Synth sounds get a note.
           *
           * Keep the user's current note when
           * switching between synths.
           */
          note:
            sound.type === "synth"
              ? (track.note ?? sound.synth?.note ?? "C4")
              : undefined,

          /**
           * Synth duration.
           */
          duration:
            sound.type === "synth"
              ? (track.duration ?? sound.synth?.duration ?? "8n")
              : undefined,
        };
      }),
    );
  };

  /**
   * -------------------------------------------------------
   * PLAY / STOP
   * -------------------------------------------------------
   */

  const togglePlay = async () => {
    await Tone.start();

    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    /**
     * Cancel arrangement mode if it's running.
     */

    if (isArrangementPlayingRef.current) {
      isArrangementPlayingRef.current = false;
      setIsArrangementPlaying(false);
      setActiveSectionIndex(null);
      arrangementStepRef.current = 0;
    }

    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      stepCountRef.current = 0;
      setIsPlaying(false);
      setCurrentStep(null);
      return;
    }

    Tone.Transport.stop();
    Tone.Transport.position = 0;
    stepCountRef.current = 0;
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.start();
    setIsPlaying(true);
  };

  /**
   * -------------------------------------------------------
   * ARRANGEMENT
   * -------------------------------------------------------
   */

  const addSection = () => {
    setArrangement((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        bars: 1,
        grid: grid.map((track) => [...track]),
        tempo: bpm,
      },
    ]);
  };

  const removeSection = (id) => {
    setArrangement((prev) => prev.filter((s) => s.id !== id));
  };

  const renameSection = (id, newName) => {
    setArrangement((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s)),
    );
  };

  const changeSectionBars = (id, newBars) => {
    const clamped = Math.min(16, Math.max(1, Number(newBars) || 1));

    setArrangement((prev) =>
      prev.map((s) => (s.id === id ? { ...s, bars: clamped } : s)),
    );
  };

  const toggleArrangementPlay = async () => {
    await Tone.start();

    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    if (isArrangementPlayingRef.current) {
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      arrangementStepRef.current = 0;
      stepCountRef.current = 0;
      isArrangementPlayingRef.current = false;
      setIsArrangementPlaying(false);
      setActiveSectionIndex(null);
      setCurrentStep(null);
      return;
    }

    /**
     * Cancel normal play mode.
     */

    if (isPlaying) {
      setIsPlaying(false);
    }

    Tone.Transport.stop();
    Tone.Transport.position = 0;
    arrangementStepRef.current = 0;
    stepCountRef.current = 0;
    Tone.Transport.bpm.value = bpm;
    isArrangementPlayingRef.current = true;
    setIsArrangementPlaying(true);
    setActiveSectionIndex(0);
    Tone.Transport.start();
  };

  /**
   * -------------------------------------------------------
   * CLEAR GRID
   * -------------------------------------------------------
   */

  const clearGrid = () => {
    setGrid(createEmptyGrid(numTracks));
  };

  /**
   * -------------------------------------------------------
   * NEW PROJECT
   * -------------------------------------------------------
   */

  const handleNewProject = () => {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    stepCountRef.current = 0;
    arrangementStepRef.current = 0;
    isArrangementPlayingRef.current = false;
    setIsArrangementPlaying(false);
    setActiveSectionIndex(null);
    setIsPlaying(false);
    setCurrentStep(null);
    setProjectName("");
    setProjectId(null);
    setSharedId(null);
    setIsSharedView(false);
    setSharedBy("");
    setArrangement([]);
    setGrid(createEmptyGrid(MIN_TRACKS));
    setTrackSettings(createDefaultTrackSettings(MIN_TRACKS));
    setNumTracks(MIN_TRACKS);
    setBpm(120);
    Tone.Transport.bpm.value = 120;
    setSaveStatus("");
    setLoadId("");
    setInitialLoadDone(false);
    setSearchParams({});
  };

  /**
   * -------------------------------------------------------
   * UPDATE TRACK SETTING
   * -------------------------------------------------------
   */

  const updateTrackSetting = (trackIndex, key, value) => {
    setTrackSettings((previous) =>
      previous.map((track, index) =>
        index === trackIndex
          ? {
              ...track,
              [key]: value,
            }
          : track,
      ),
    );
  };

  /**
   * -------------------------------------------------------
   * AUDIO BUFFER → WAV
   * -------------------------------------------------------
   */

  const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const channelData = [];
    for (let channel = 0; channel < numChannels; channel++) {
      channelData.push(buffer.getChannelData(channel));
    }

    const interleaved = new Float32Array(buffer.length * numChannels);

    let offset = 0;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        interleaved[offset++] = channelData[channel][i];
      }
    }

    const dataLength = interleaved.length * 2;
    const arrayBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(arrayBuffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(36, "data");
    view.setUint32(40, dataLength, true);

    let writeOffset = 44;
    for (let i = 0; i < interleaved.length; i++) {
      const sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(
        writeOffset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      writeOffset += 2;
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  };

  /**
   * -------------------------------------------------------
   * DOWNLOAD WAV
   * -------------------------------------------------------
   */

  const downloadTrackAsWav = async (
    durationInSeconds = 4,
    filename = "track.wav",
  ) => {
    try {
      setSaveStatus("Rendering track...");

      const renderGrid = gridRef.current;
      const renderSettings = settingsRef.current;
      const renderTrackCount = renderGrid?.length || 0;

      const buffer = await Tone.Offline((context) => {
        context.transport.bpm.value = bpm;

        const offlineGains = [];
        const offlineDelays = [];
        const offlineLPFs = [];
        const offlineHPFs = [];
        const offlineReverbs = [];
        const offlineEngines = [];

        /**
         * Create routing per track:
         *   engine → gain → delay → LPF → HPF → reverb → destination
         */

        for (let trackIndex = 0; trackIndex < renderTrackCount; trackIndex++) {
          const settings = renderSettings[trackIndex];

          const gain = new Tone.Gain(settings?.muted ? 0 : 1);

          /**
           * Delay
           */

          const delay = new Tone.FeedbackDelay({
            delayTime: settings?.delay?.time ?? 0.25,
            feedback: settings?.delay?.feedback ?? 0.3,
            wet: settings?.delay?.enabled ? (settings?.delay?.wet ?? 0.3) : 0,
          });

          /**
           * Filters
           */

          const lpf = new Tone.Filter(
            settings?.filter?.lowpass ?? 20000,
            "lowpass",
          );

          const hpf = new Tone.Filter(
            settings?.filter?.highpass ?? 20,
            "highpass",
          );

          /**
           * Reverb
           */

          const reverb = new Tone.Reverb({
            decay: settings?.reverb?.decay ?? 1.5,
            wet: settings?.reverb?.enabled
              ? (settings?.reverb?.wet ?? 0.35)
              : 0,
          });

          /**
           * Chain: gain → delay → LPF → HPF → reverb → destination
           */

          gain.connect(delay);
          delay.connect(lpf);
          lpf.connect(hpf);
          hpf.connect(reverb);
          reverb.toDestination();

          offlineGains.push(gain);
          offlineDelays.push(delay);
          offlineLPFs.push(lpf);
          offlineHPFs.push(hpf);
          offlineReverbs.push(reverb);

          const sound = getSoundById(settings?.sound);

          if (sound) {
            const engine = createSoundEngine(sound, gain);
            offlineEngines.push(engine);
          } else {
            offlineEngines.push(null);
          }
        }

        /**
         * Dispose offline effect nodes after rendering.
         */

        setTimeout(() => {
          offlineDelays.forEach((d) => d?.dispose?.());
          offlineLPFs.forEach((f) => f?.dispose?.());
          offlineHPFs.forEach((f) => f?.dispose?.());
          offlineReverbs.forEach((r) => r?.dispose?.());
        }, durationInSeconds * 1000);

        /**
         * Schedule pattern.
         */

        for (let step = 0; step < NUM_STEPS; step++) {
          const stepTime = step * (60 / bpm / 4);

          for (
            let trackIndex = 0;
            trackIndex < renderTrackCount;
            trackIndex++
          ) {
            const settings = renderSettings[trackIndex];

            if (settings?.muted) {
              continue;
            }

            if (!renderGrid?.[trackIndex]?.[step]) {
              continue;
            }

            const engine = offlineEngines[trackIndex];

            if (!engine) {
              continue;
            }

            engine.play(stepTime, {
              note: settings?.note,
              duration: settings?.duration,
            });
          }
        }

        context.transport.start();
      }, durationInSeconds);

      const wavBlob = audioBufferToWav(buffer);
      const url = URL.createObjectURL(wavBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      setSaveStatus("Track downloaded successfully.");
    } catch (error) {
      console.error(error);
      setSaveStatus(`Download failed: ${error.message}`);
    }
  };

  /**
   * -------------------------------------------------------
   * SAVE PROJECT
   * -------------------------------------------------------
   */

  const saveProject = async () => {
    if (!projectName.trim()) {
      setSaveStatus("Please enter a project name.");
      return;
    }

    if (!isAuthenticated) {
      setSaveStatus("Please log in to save your project.");
      return;
    }

    const payload = {
      name: projectName,
      tempo: bpm,
      grid,
      track_settings: trackSettings,
      arrangement,
      shared_id: sharedId || undefined,
    };

    const isUpdate = Boolean(projectId);

    try {
      const url = isUpdate ? `/api/projects/${projectId}` : "/api/projects";

      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Failed to save project");
      }

      const project = await response.json();

      setProjectId(project.id);
      setSharedId(project.shared_id || null);

      setSearchParams({
        projectId: String(project.id),
      });

      setInitialLoadDone(true);

      setSaveStatus(
        isUpdate
          ? `Updated "${project.name}"`
          : `Saved "${project.name}" (ID: ${project.id})`,
      );
    } catch (error) {
      setSaveStatus(`Save failed: ${error.message}`);
    }
  };

  /**
   * -------------------------------------------------------
   * SHARE PROJECT
   * -------------------------------------------------------
   */

  const shareProject = async () => {
    if (!projectId) {
      setSaveStatus("Please save your project first.");
      return;
    }

    if (!isAuthenticated) {
      setSaveStatus("Please log in to share your project.");
      return;
    }

    setSaveStatus("Generating share link...");

    try {
      const response = await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Failed to share project");
      }

      const project = await response.json();

      setSharedId(project.shared_id);

      const link = `${window.location.origin}/sequencer?sharedId=${project.shared_id}`;

      setShareLink(link);

      setSaveStatus(`Project shared! Link copied to clipboard.`);
      navigator.clipboard.writeText(link);
    } catch (error) {
      setSaveStatus(`Share failed: ${error.message}`);
    }
  };

  /**
   * -------------------------------------------------------
   * ADD TO MY LIBRARY (fork shared project)
   * -------------------------------------------------------
   */

  const addToMyLibrary = () => {
    /**
     * The project is already loaded into the sequencer state.
     * We just need to exit shared-view mode, clear the project ID
     * (so Save creates a new project), and pre-fill the name.
     */

    setIsSharedView(false);
    setSharedId(null);
    setSharedBy("");
    setProjectId(null);

    setProjectName(`Copy of ${projectName}`);

    setSaveStatus(
      "✏️ Edit your copy, then click 'Save Project' to add it to your library.",
    );

    /**
     * Clear URL params.
     */

    setSearchParams({ projectId: "" });
    setSearchParams({});
  };

  /**
   * -------------------------------------------------------
   * MANUAL LOAD
   * -------------------------------------------------------
   */

  const loadProject = async () => {
    if (!loadId.trim()) {
      setSaveStatus("Please enter a project ID to load.");
      return;
    }

    if (!isAuthenticated) {
      setSaveStatus("Please log in to load your project.");
      return;
    }

    try {
      const response = await fetch(`/api/projects/${loadId.trim()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Failed to load project");
      }

      const project = await response.json();

      applyProject(project);

      setSharedId(project.shared_id || null);
      setIsSharedView(false);
      setSharedBy("");

      setInitialLoadDone(true);

      setSearchParams({
        projectId: String(project.id),
      });

      setSaveStatus(`Loaded "${project.name}"`);
    } catch (error) {
      setSaveStatus(`Load failed: ${error.message}`);
    }
  };

  /**
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (
    <main className="sequencer-page">
      <section className="hero-card">
        <div>
          <p className="eyebrow">
            {isSharedView ? "Shared beat" : "MVP sketchpad"}
          </p>

          <h1>
            {isSharedView
              ? `BeatForge: ${projectName || "Shared Project"}`
              : "BeatForge Sketchbook"}
          </h1>

          <p>
            {isSharedView
              ? `A beat shared with you by ${
                  sharedBy ? `@${sharedBy}` : "another creator"
                }. Edit it and add it to your library.`
              : "A simple rhythm prototype for building, saving, and sharing beat ideas."}
          </p>
        </div>

        <div className="status-badge">
          <span className={`status-dot ${isPlaying ? "live" : "stopped"}`} />
          {isPlaying ? "Playing" : "Stopped"}
        </div>
      </section>

      {isSharedView && (
        <section className="shared-view-banner">
          <div className="shared-banner-content">
            <span className="shared-banner-icon">🔗</span>
            <span>
              Viewing shared project:
              <strong> {projectName}</strong>
              {sharedBy && ` by @${sharedBy}`}
            </span>
            <button className="add-to-library-btn" onClick={addToMyLibrary}>
              📥 Add to My Library
            </button>
          </div>
        </section>
      )}

      <section className="controls-card">
        <div className="controls">
          <button onClick={togglePlay}>
            {isPlaying ? "⏹ Stop" : "▶ Play"}
          </button>

          <button onClick={clearGrid}>Clear Pattern</button>

          <button onClick={() => downloadTrackAsWav()}>Download Track</button>

          <button onClick={handleNewProject}>New Project</button>

          {!isSharedView && (
            <>
              <button
                className="track-count-btn"
                onClick={removeTrack}
                disabled={numTracks <= MIN_TRACKS}
                title="Remove track"
              >
                − Track
              </button>

              <button
                className="track-count-btn"
                onClick={addTrack}
                disabled={numTracks >= MAX_TRACKS}
                title="Add track (up to 8)"
              >
                + Track
              </button>
            </>
          )}

          <label className="bpm-control">
            <span>BPM</span>
            <input
              type="range"
              min="60"
              max="180"
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
            />
            <strong>{bpm}</strong>
          </label>
        </div>
      </section>

      <section className="save-load-card">
        <div className="save-section">
          <input
            type="text"
            placeholder={
              isSharedView ? "Enter name for your copy..." : "Project name"
            }
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />

          {!isSharedView ? (
            <button onClick={saveProject}>
              {projectId ? "💾 Update Project" : "💾 Save Project"}
            </button>
          ) : (
            <button
              onClick={saveProject}
              disabled={!isAuthenticated}
              title={
                isAuthenticated
                  ? "Save this as a new project in your library"
                  : "Log in to save"
              }
            >
              💾 Save Copy to Library
            </button>
          )}

          {projectId && (
            <button
              className="share-btn"
              onClick={shareProject}
              title="Share this project with others"
            >
              🔗 Share
            </button>
          )}
        </div>

        {!isSharedView && sharedId && (
          <div className="share-section">
            <span className="share-link">
              {`${window.location.origin}/sequencer?sharedId=${sharedId}`}
            </span>
            <button
              className="copy-link-btn"
              onClick={() => {
                const link = `${window.location.origin}/sequencer?sharedId=${sharedId}`;
                navigator.clipboard.writeText(link);
                setSaveStatus("Share link copied to clipboard!");
              }}
            >
              Copy Link
            </button>
          </div>
        )}

        {saveStatus && <p className="save-status">{saveStatus}</p>}
      </section>

      <div className="tracks">
        {grid.map((track, trackIndex) => {
          const currentSoundId =
            trackSettings[trackIndex]?.sound ||
            DEFAULT_TRACK_SOUNDS[trackIndex] ||
            DEFAULT_TRACK_SOUNDS[0];

          const currentSound = getSoundById(currentSoundId);

          const isSynth = currentSound?.type === "synth";

          const reverbEnabled =
            trackSettings[trackIndex]?.reverb?.enabled || false;

          const delayEnabled =
            trackSettings[trackIndex]?.delay?.enabled || false;

          const filterLowpass =
            trackSettings[trackIndex]?.filter?.lowpass ?? 20000;

          const filterHighpass =
            trackSettings[trackIndex]?.filter?.highpass ?? 20;

          const filterActive = filterLowpass < 15000 || filterHighpass > 40;

          const isMuted = trackSettings[trackIndex]?.muted || false;

          const selectedNote =
            trackSettings[trackIndex]?.note ||
            currentSound?.synth?.note ||
            "C4";

          const selectedDuration =
            trackSettings[trackIndex]?.duration ||
            currentSound?.synth?.duration ||
            "8n";

          const isSoloed = trackSettings[trackIndex]?.soloed || false;

          return (
            <div
              key={trackIndex}
              className={`track-row ${isMuted ? "track-muted" : ""} ${isSoloed ? "track-soloed" : ""}`}
            >
              <div className="track-main">
                <span className="track-label">{TRACK_LABELS[trackIndex]}</span>

                <div className="track-controls">
                  <label>
                    <span>Sound</span>
                    <select
                      value={currentSoundId}
                      onChange={(e) =>
                        updateTrackSound(trackIndex, e.target.value)
                      }
                    >
                      {getAvailableSounds().map((sound) => (
                        <option key={sound.id} value={sound.id}>
                          {sound.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    className={`mute-track-button ${isMuted ? "muted" : ""}`}
                    onClick={() => toggleTrackMute(trackIndex)}
                    aria-pressed={isMuted}
                  >
                    {isMuted ? "🔇 Unmute" : "🔊 Mute"}
                  </button>

                  <button
                    type="button"
                    className={`solo-track-button ${isSoloed ? "soloed" : ""}`}
                    onClick={() => toggleTrackSolo(trackIndex)}
                    aria-pressed={isSoloed}
                  >
                    {isSoloed ? "🔈 Unmute All" : "🎧 Solo"}
                  </button>

                  <button
                    type="button"
                    className={`expand-chevron ${
                      expandedTrack === trackIndex ? "expanded" : ""
                    }`}
                    onClick={() => toggleTrackExpand(trackIndex)}
                    aria-label="Toggle track controls"
                  >
                    {expandedTrack === trackIndex ? "▲" : "▼"}
                  </button>

                  {reverbEnabled && (
                    <span className="effect-badge">Reverb</span>
                  )}

                  {delayEnabled && <span className="effect-badge">Delay</span>}

                  {filterActive && <span className="effect-badge">Filter</span>}

                  {isMuted && (
                    <span className="effect-badge muted-badge">Muted</span>
                  )}

                  {isSynth && (
                    <>
                      <label>
                        <span>Note</span>
                        <select
                          value={selectedNote}
                          onChange={(e) =>
                            updateTrackSetting(
                              trackIndex,
                              "note",
                              e.target.value,
                            )
                          }
                        >
                          {NOTE_OPTIONS.map((note) => (
                            <option key={note} value={note}>
                              {note}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Duration</span>
                        <select
                          value={selectedDuration}
                          onChange={(e) =>
                            updateTrackSetting(
                              trackIndex,
                              "duration",
                              e.target.value,
                            )
                          }
                        >
                          <option value="16n">16n</option>
                          <option value="8n">8n</option>
                          <option value="4n">4n</option>
                          <option value="2n">2n</option>
                        </select>
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="step-row">
                {track.map((isActive, stepIndex) => (
                  <button
                    key={stepIndex}
                    onClick={() => toggleStep(trackIndex, stepIndex)}
                    className={`
                      ${isActive ? "active" : ""}
                      ${currentStep === stepIndex && isPlaying ? "playing" : ""}
                      ${isMuted ? "muted-step" : ""}
                    `}
                  >
                    {stepIndex + 1}
                  </button>
                ))}
              </div>

              {expandedTrack === trackIndex && (
                <div className="track-controls-expanded">
                  {/* ---- DELAY ---- */}
                  <div className="slider-control">
                    <label>
                      <span>Delay On</span>
                      <input
                        type="checkbox"
                        checked={delayEnabled}
                        onChange={(e) =>
                          updateTrackSetting(trackIndex, "delay", {
                            ...trackSettings[trackIndex]?.delay,
                            enabled: e.target.checked,
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className="dial-row">
                    <Dial
                      label="Delay Time"
                      value={trackSettings[trackIndex]?.delay?.time ?? 0.25}
                      min={0.05}
                      max={0.75}
                      step={0.01}
                      formatValue={(v) => `${Math.round(v * 1000)}ms`}
                      onChange={(e) =>
                        updateTrackSetting(trackIndex, "delay", {
                          ...trackSettings[trackIndex]?.delay,
                          enabled: true,
                          time: parseFloat(e.target.value),
                        })
                      }
                    />

                    <Dial
                      label="Delay Feedback"
                      value={trackSettings[trackIndex]?.delay?.feedback ?? 0.3}
                      min={0}
                      max={0.8}
                      step={0.01}
                      formatValue={(v) => `${Math.round(v * 100)}%`}
                      onChange={(e) =>
                        updateTrackSetting(trackIndex, "delay", {
                          ...trackSettings[trackIndex]?.delay,
                          enabled: true,
                          feedback: parseFloat(e.target.value),
                        })
                      }
                    />

                    <Dial
                      label="Delay Wet"
                      value={trackSettings[trackIndex]?.delay?.wet ?? 0.3}
                      min={0}
                      max={1}
                      step={0.01}
                      formatValue={(v) => `${Math.round(v * 100)}%`}
                      onChange={(e) =>
                        updateTrackSetting(trackIndex, "delay", {
                          ...trackSettings[trackIndex]?.delay,
                          enabled: true,
                          wet: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  {/* ---- FILTER ---- */}
                  <div className="dial-row">
                    <Dial
                      label="Low Pass"
                      value={filterLowpass}
                      min={100}
                      max={20000}
                      step={10}
                      formatValue={(v) => `${Math.round(v)} Hz`}
                      onChange={(e) => {
                        const freq = parseFloat(e.target.value);
                        updateTrackSetting(trackIndex, "filter", {
                          ...trackSettings[trackIndex]?.filter,
                          enabled: true,
                          lowpass: freq,
                        });
                      }}
                    />

                    <Dial
                      label="High Pass"
                      value={filterHighpass}
                      min={20}
                      max={8000}
                      step={10}
                      formatValue={(v) => `${Math.round(v)} Hz`}
                      onChange={(e) => {
                        const freq = parseFloat(e.target.value);
                        updateTrackSetting(trackIndex, "filter", {
                          ...trackSettings[trackIndex]?.filter,
                          enabled: true,
                          highpass: freq,
                        });
                      }}
                    />
                  </div>

                  {/* ---- REVERB ---- */}
                  <div className="dial-row">
                    <Dial
                      label="Reverb Wet"
                      value={trackSettings[trackIndex]?.reverb?.wet ?? 0.35}
                      min={0}
                      max={1}
                      step={0.01}
                      formatValue={(v) => `${Math.round(v * 100)}%`}
                      onChange={(e) =>
                        updateTrackSetting(trackIndex, "reverb", {
                          ...trackSettings[trackIndex]?.reverb,
                          enabled: true,
                          wet: parseFloat(e.target.value),
                        })
                      }
                    />

                    <Dial
                      label="Reverb Decay"
                      value={trackSettings[trackIndex]?.reverb?.decay ?? 1.5}
                      min={0.1}
                      max={10}
                      step={0.1}
                      formatValue={(v) => `${v.toFixed(1)}s`}
                      onChange={(e) =>
                        updateTrackSetting(trackIndex, "reverb", {
                          ...trackSettings[trackIndex]?.reverb,
                          enabled: true,
                          decay: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="slider-control">
                    <label>
                      <span>Reverb On</span>
                      <input
                        type="checkbox"
                        checked={reverbEnabled}
                        onChange={(e) =>
                          updateTrackSetting(trackIndex, "reverb", {
                            ...trackSettings[trackIndex]?.reverb,
                            enabled: e.target.checked,
                          })
                        }
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className="preview-btn-inline"
                    onClick={() => previewTrackInline(trackIndex)}
                  >
                    &#9654; Preview
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {!isSharedView && numTracks < MAX_TRACKS && (
          <div
            className="add-track-card"
            onClick={addTrack}
            title="Add track (up to 8)"
          >
            <span className="add-track-icon">+</span>
            <span className="add-track-label">Add Track</span>
            <span className="add-track-sub">
              {numTracks}/{MAX_TRACKS} tracks
            </span>
          </div>
        )}
      </div>

      <ArrangementView
        arrangement={arrangement}
        onAddSection={addSection}
        onRemove={removeSection}
        onRename={renameSection}
        onBarsChange={changeSectionBars}
        onPlayArrangement={toggleArrangementPlay}
        isPlaying={isArrangementPlaying}
        numTracks={numTracks}
        currentStep={currentStep}
        activeSectionIndex={activeSectionIndex}
      />
    </main>
  );
}
