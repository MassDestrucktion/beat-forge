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
 * PROJECT / TRACK HELPERS
 * ---------------------------------------------------------
 */

function createEmptyGrid(numTracks = MIN_TRACKS) {
  return Array.from({ length: numTracks }, () =>
    Array(NUM_STEPS).fill(false),
  );
}

function createDefaultTrackSettings(numTracks = MIN_TRACKS) {
  return Array.from({ length: numTracks }, (_, i) => {
    const soundId = DEFAULT_TRACK_SOUNDS[i] || DEFAULT_TRACK_SOUNDS[0];

    const sound = getSoundById(soundId);

    const track = {
      sound: sound ? sound.id : soundId,
      muted: false,
      soloed: false,

      reverb: {
        enabled: false,
        wet: 0.35,
        decay: 1.5,
      },

      delay: {
        enabled: false,
        time: 0.25,
        feedback: 0.3,
        wet: 0.3,
      },

      filter: {
        lowpass: 20000,
        highpass: 20,
        enabled: false,
      },
    };

    if (sound?.type === "synth") {
      track.note = sound.synth?.note;
      track.duration = sound.synth?.duration || "8n";
    }

    return track;
  });
}

function createDefaultTrack(soundId) {
  const sound = getSoundById(soundId);

  const track = {
    sound: sound ? sound.id : soundId,
    muted: false,
    soloed: false,

    reverb: {
      enabled: false,
      wet: 0.35,
      decay: 1.5,
    },

    delay: {
      enabled: false,
      time: 0.25,
      feedback: 0.3,
      wet: 0.3,
    },

    filter: {
      lowpass: 20000,
      highpass: 20,
      enabled: false,
    },
  };

  if (sound?.type === "synth") {
    track.note = sound.synth?.note;
    track.duration = sound.synth?.duration || "8n";
  }

  return track;
}

function getAvailableSounds() {
  return SOUND_LIBRARY;
}

/**
 * Normalize project data coming from the backend.
 *
 * The database project is the source of truth:
 *
 * projects.grid
 * projects.track_settings
 * projects.arrangement
 */
function normalizeProject(project) {
  const rawGrid = Array.isArray(project?.grid)
    ? project.grid
    : createEmptyGrid(MIN_TRACKS);

  const rawSettings = Array.isArray(project?.track_settings)
    ? project.track_settings
    : createDefaultTrackSettings(MIN_TRACKS);

  const trackCount = Math.min(
    Math.max(
      Math.max(rawGrid.length, rawSettings.length),
      MIN_TRACKS,
    ),
    MAX_TRACKS,
  );

  const grid = Array.from({ length: trackCount }, (_, trackIndex) => {
    const row = rawGrid[trackIndex];

    if (!Array.isArray(row)) {
      return Array(NUM_STEPS).fill(false);
    }

    return Array.from(
      { length: NUM_STEPS },
      (_, stepIndex) => Boolean(row[stepIndex]),
    );
  });

  const trackSettings = Array.from(
    { length: trackCount },
    (_, trackIndex) => {
      const existing = rawSettings[trackIndex];

      if (!existing) {
        return createDefaultTrackSettings(trackCount)[trackIndex];
      }

      return {
        ...createDefaultTrackSettings(trackCount)[trackIndex],
        ...existing,

        reverb: {
          ...createDefaultTrackSettings(trackCount)[trackIndex].reverb,
          ...(existing.reverb || {}),
        },

        delay: {
          ...createDefaultTrackSettings(trackCount)[trackIndex].delay,
          ...(existing.delay || {}),
        },

        filter: {
          ...createDefaultTrackSettings(trackCount)[trackIndex].filter,
          ...(existing.filter || {}),
        },

        muted: existing.muted ?? false,
        soloed: existing.soloed ?? false,
      };
    },
  );

  return {
    ...project,
    name: project?.name || "",
    description: project?.description || "",
    tempo: Number(project?.tempo) || 120,
    grid,
    track_settings: trackSettings,
    arrangement: Array.isArray(project?.arrangement)
      ? project.arrangement
      : [],
    shared_id: project?.shared_id || null,
  };
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

  /**
   * This maps directly to projects.name.
   */
  const [projectName, setProjectName] = useState("");

  /**
   * This maps directly to projects.description.
   */
  const [projectDescription, setProjectDescription] = useState("");

  /**
   * This maps to projects.id.
   */
  const [projectId, setProjectId] = useState(null);

  const [saveStatus, setSaveStatus] = useState("");

  const [loadId, setLoadId] = useState("");

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const [expandedTrack, setExpandedTrack] = useState(null);

  /**
   * Arrangement is stored directly in projects.arrangement.
   */
  const [arrangement, setArrangement] = useState([]);

  const [isArrangementPlaying, setIsArrangementPlaying] =
    useState(false);

  const [activeSectionIndex, setActiveSectionIndex] = useState(null);

  /**
   * Share state.
   *
   * shared_id comes from the project row.
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

      gain.gain.value = settings?.muted ? 0 : 1;

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
        lpf.frequency.value =
          settings?.filter?.lowpass ?? 20000;
      }

      if (hpf) {
        hpf.frequency.value =
          settings?.filter?.highpass ?? 20;
      }

      const reverbEnabled =
        settings?.reverb?.enabled ?? false;

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
    for (
      let trackIndex = 0;
      trackIndex < trackSettings.length;
      trackIndex++
    ) {
      const settings = trackSettings[trackIndex];

      const sound = getSoundById(settings?.sound);

      const oldEngine =
        soundEnginesRef.current[trackIndex];

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

      setNumTracks(
        Math.min(
          Math.max(returnedState.grid.length, MIN_TRACKS),
          MAX_TRACKS,
        ),
      );
    }

    if (Array.isArray(returnedState.trackSettings)) {
      setTrackSettings(
        returnedState.trackSettings.map((track) => ({
          ...track,
          muted: track?.muted ?? false,
          soloed: track?.soloed ?? false,
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

    if (returnedState.projectDescription !== undefined) {
      setProjectDescription(
        returnedState.projectDescription,
      );
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
   * EXPAND TRACK
   * -------------------------------------------------------
   */

  const toggleTrackExpand = (trackIndex) => {
    setExpandedTrack(
      expandedTrack === trackIndex ? null : trackIndex,
    );
  };

  /**
   * -------------------------------------------------------
   * PREVIEW TRACK
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
   */

  useEffect(() => {
    const projectIdFromUrl =
      searchParams.get("projectId");

    const sharedIdFromUrl =
      searchParams.get("sharedId");

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
       * SHARED PROJECT
       */

      if (sharedIdFromUrl && !projectIdFromUrl) {
        setSaveStatus("Loading shared project...");

        try {
          const response = await fetch(
            `/api/projects/shared/${sharedIdFromUrl}`,
            {
              headers: {
                Authorization: token
                  ? `Bearer ${token}`
                  : "",
              },
            },
          );

          if (!response.ok) {
            const text = await response.text();

            throw new Error(
              text || "Failed to load shared project",
            );
          }

          const project = normalizeProject(
            await response.json(),
          );

          applyProject(project);

          setIsSharedView(true);
          setSharedId(
            project.shared_id || sharedIdFromUrl,
          );
          setSharedBy(project.username || "");
          setProjectId(null);

          setSaveStatus(
            `Loaded shared project "${project.name}"`,
          );
        } catch (error) {
          setSaveStatus(
            `Load failed: ${error.message}`,
          );
        } finally {
          setInitialLoadDone(true);
        }

        return;
      }

      /**
       * OWNED PROJECT
       */

      setSaveStatus("Loading project...");

      try {
        const response = await fetch(
          `/api/users/${user.id}/projects/${projectIdFromUrl}`,
          {
            headers: {
              Authorization: token
                ? `Bearer ${token}`
                : "",
            },
          },
        );

        if (!response.ok) {
          const text = await response.text();

          throw new Error(
            text || "Failed to load project",
          );
        }

        const project = normalizeProject(
          await response.json(),
        );

        applyProject(project);

        setSharedId(project.shared_id || null);

        setSaveStatus(`Loaded "${project.name}"`);
      } catch (error) {
        setSaveStatus(
          `Load failed: ${error.message}`,
        );
      } finally {
        setInitialLoadDone(true);
      }
    };

    loadProjectFromUrl();
  }, [
    searchParams,
    token,
    initialLoadDone,
    location.state,
  ]);

  /**
   * -------------------------------------------------------
   * APPLY PROJECT
   * -------------------------------------------------------
   */

  const applyProject = (incomingProject) => {
    const project = normalizeProject(incomingProject);

    setProjectName(project.name);
    setProjectDescription(project.description);

    setProjectId(project.id || null);

    setBpm(project.tempo);
    Tone.Transport.bpm.value = project.tempo;

    setGrid(project.grid);

    setTrackSettings(project.track_settings);

    setNumTracks(project.grid.length);

    setArrangement(project.arrangement);

    setSharedId(project.shared_id || null);
  };

  /**
   * -------------------------------------------------------
   * ADD TRACK
   * -------------------------------------------------------
   */

  const addTrack = () => {
    if (numTracks >= MAX_TRACKS) {
      return;
    }

    const soundId =
      DEFAULT_TRACK_SOUNDS[numTracks] ||
      DEFAULT_TRACK_SOUNDS[0];

    setNumTracks((previous) => previous + 1);

    setGrid((previous) => [
      ...previous,
      Array(NUM_STEPS).fill(false),
    ]);

    setTrackSettings((previous) => [
      ...previous,
      createDefaultTrack(soundId),
    ]);
  };

  /**
   * -------------------------------------------------------
   * REMOVE TRACK
   * -------------------------------------------------------
   */

  const removeTrack = () => {
    if (numTracks <= MIN_TRACKS) {
      return;
    }

    const newNumTracks = numTracks - 1;

    setNumTracks(newNumTracks);

    setGrid((previous) =>
      previous.slice(0, newNumTracks),
    );

    setTrackSettings((previous) =>
      previous.slice(0, newNumTracks),
    );
  };

  /**
   * -------------------------------------------------------
   * PLAY TRACK SOUND
   * -------------------------------------------------------
   */

  const playTrackSound = (
    trackIndex,
    time,
    overrides = {},
  ) => {
    const settings =
      settingsRef.current[trackIndex];

    if (!settings) {
      return;
    }

    if (settings.muted) {
      return;
    }

    const anySolo =
      settingsRef.current.some(
        (s) => s?.soloed,
      );

    if (anySolo && !settings?.soloed) {
      return;
    }

    const engine =
      soundEnginesRef.current[trackIndex];

    if (!engine) {
      console.warn(
        `No sound engine for track ${
          trackIndex + 1
        }`,
      );

      return;
    }

    const playOverrides = {
      note:
        overrides.note ?? settings.note,
      duration:
        overrides.duration ??
        settings.duration,
    };

    try {
      engine.play(time, playOverrides);
    } catch (error) {
      console.error(
        "Failed to play track sound:",
        error,
      );
    }
  };

  /**
   * -------------------------------------------------------
   * TRANSPORT LOOP
   * -------------------------------------------------------
   */

  useEffect(() => {
    const repeat = (time) => {
      if (isArrangementPlayingRef.current) {
        const sections =
          arrangementRef.current;

        if (
          !sections ||
          sections.length === 0
        ) {
          isArrangementPlayingRef.current =
            false;

          setIsArrangementPlaying(false);
          setActiveSectionIndex(null);
          setCurrentStep(null);

          return;
        }

        const totalSteps =
          sections.reduce(
            (sum, section) =>
              sum +
              (section.bars || 1) *
                NUM_STEPS,
            0,
          );

        const globalStep =
          arrangementStepRef.current;

        if (globalStep >= totalSteps) {
          Tone.Transport.stop();
          Tone.Transport.position = 0;

          arrangementStepRef.current = 0;
          stepCountRef.current = 0;

          isArrangementPlayingRef.current =
            false;

          setIsArrangementPlaying(false);
          setActiveSectionIndex(null);
          setCurrentStep(null);

          return;
        }

        let remaining = globalStep;
        let sectionIndex = 0;

        for (
          let i = 0;
          i < sections.length;
          i++
        ) {
          const sectionSteps =
            (sections[i].bars || 1) *
            NUM_STEPS;

          if (remaining < sectionSteps) {
            sectionIndex = i;
            break;
          }

          remaining -= sectionSteps;
        }

        const step =
          remaining % NUM_STEPS;

        setCurrentStep(step);
        setActiveSectionIndex(
          sectionIndex,
        );

        const sectionGrid =
          sections[sectionIndex]?.grid;

        const trackCount =
          sectionGrid?.length || 0;

        for (
          let trackIndex = 0;
          trackIndex < trackCount;
          trackIndex++
        ) {
          if (
            sectionGrid?.[trackIndex]?.[step]
          ) {
            playTrackSound(
              trackIndex,
              time,
            );
          }
        }

        arrangementStepRef.current++;
        stepCountRef.current++;

        return;
      }

      const step =
        stepCountRef.current %
        NUM_STEPS;

      setCurrentStep(step);

      const currentGrid =
        gridRef.current;

      const trackCount =
        currentGrid?.length || 0;

      for (
        let trackIndex = 0;
        trackIndex < trackCount;
        trackIndex++
      ) {
        if (
          currentGrid?.[trackIndex]?.[step]
        ) {
          playTrackSound(
            trackIndex,
            time,
          );
        }
      }

      stepCountRef.current++;
    };

    const eventId =
      Tone.Transport.scheduleRepeat(
        repeat,
        "16n",
      );

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

  const toggleStep = async (
    trackIndex,
    stepIndex,
  ) => {
    await Tone.start();

    if (
      Tone.getContext().state !==
      "running"
    ) {
      await Tone.getContext().resume();
    }

    setGrid((previous) => {
      const updatedGrid =
        previous.map((track) => [
          ...track,
        ]);

      const isTurningOn =
        !updatedGrid[trackIndex][
          stepIndex
        ];

      updatedGrid[trackIndex][
        stepIndex
      ] = isTurningOn;

      if (isTurningOn) {
        playTrackSound(trackIndex);
      }

      return updatedGrid;
    });
  };

  /**
   * -------------------------------------------------------
   * MUTE
   * -------------------------------------------------------
   */

  const toggleTrackMute = (
    trackIndex,
  ) => {
    setTrackSettings((previous) =>
      previous.map(
        (track, index) => {
          if (
            index !== trackIndex
          ) {
            return track;
          }

          return {
            ...track,
            muted: !track?.muted,
          };
        },
      ),
    );
  };

  /**
   * -------------------------------------------------------
   * SOLO
   * -------------------------------------------------------
   */

  const toggleTrackSolo = (
    trackIndex,
  ) => {
    setTrackSettings((previous) =>
      previous.map(
        (track, index) => {
          if (
            index !== trackIndex
          ) {
            return track;
          }

          return {
            ...track,
            soloed: !track?.soloed,
          };
        },
      ),
    );
  };

  /**
   * -------------------------------------------------------
   * CHANGE SOUND
   * -------------------------------------------------------
   */

  const updateTrackSound = (
    trackIndex,
    soundId,
  ) => {
    const sound =
      getSoundById(soundId);

    if (!sound) {
      console.warn(
        `Sound not found: ${soundId}`,
      );

      return;
    }

    setTrackSettings((previous) =>
      previous.map(
        (track, index) => {
          if (
            index !== trackIndex
          ) {
            return track;
          }

          return {
            ...track,

            sound: sound.id,

            note:
              sound.type === "synth"
                ? (
                    track.note ??
                    sound.synth?.note ??
                    "C4"
                  )
                : undefined,

            duration:
              sound.type === "synth"
                ? (
                    track.duration ??
                    sound.synth?.duration ??
                    "8n"
                  )
                : undefined,
          };
        },
      ),
    );
  };

  /**
   * -------------------------------------------------------
   * PLAY / STOP
   * -------------------------------------------------------
   */

  const togglePlay = async () => {
    await Tone.start();

    if (
      Tone.getContext().state !==
      "running"
    ) {
      await Tone.getContext().resume();
    }

    if (
      isArrangementPlayingRef.current
    ) {
      isArrangementPlayingRef.current =
        false;

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
    setArrangement((previous) => [
      ...previous,

      {
        id: crypto.randomUUID(),
        name: "",
        bars: 1,

        /**
         * Snapshot the current project grid.
         */
        grid: grid.map((track) => [
          ...track,
        ]),

        tempo: bpm,
      },
    ]);
  };

  const removeSection = (id) => {
    setArrangement((previous) =>
      previous.filter(
        (section) =>
          section.id !== id,
      ),
    );
  };

  const renameSection = (
    id,
    newName,
  ) => {
    setArrangement((previous) =>
      previous.map((section) =>
        section.id === id
          ? {
              ...section,
              name: newName,
            }
          : section,
      ),
    );
  };

  const changeSectionBars = (
    id,
    newBars,
  ) => {
    const clamped = Math.min(
      16,
      Math.max(
        1,
        Number(newBars) || 1,
      ),
    );

    setArrangement((previous) =>
      previous.map((section) =>
        section.id === id
          ? {
              ...section,
              bars: clamped,
            }
          : section,
      ),
    );
  };

  const toggleArrangementPlay =
    async () => {
      await Tone.start();

      if (
        Tone.getContext().state !==
        "running"
      ) {
        await Tone.getContext().resume();
      }

      if (
        isArrangementPlayingRef.current
      ) {
        Tone.Transport.stop();
        Tone.Transport.position = 0;

        arrangementStepRef.current = 0;
        stepCountRef.current = 0;

        isArrangementPlayingRef.current =
          false;

        setIsArrangementPlaying(false);
        setActiveSectionIndex(null);
        setCurrentStep(null);

        return;
      }

      if (isPlaying) {
        setIsPlaying(false);
      }

      Tone.Transport.stop();
      Tone.Transport.position = 0;

      arrangementStepRef.current = 0;
      stepCountRef.current = 0;

      Tone.Transport.bpm.value = bpm;

      isArrangementPlayingRef.current =
        true;

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
    setGrid(
      createEmptyGrid(numTracks),
    );
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

    isArrangementPlayingRef.current =
      false;

    setIsArrangementPlaying(false);
    setActiveSectionIndex(null);
    setIsPlaying(false);
    setCurrentStep(null);

    setProjectName("");
    setProjectDescription("");

    setProjectId(null);
    setSharedId(null);

    setIsSharedView(false);
    setSharedBy("");

    setArrangement([]);

    setGrid(
      createEmptyGrid(MIN_TRACKS),
    );

    setTrackSettings(
      createDefaultTrackSettings(
        MIN_TRACKS,
      ),
    );

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

  const updateTrackSetting = (
    trackIndex,
    key,
    value,
  ) => {
    setTrackSettings((previous) =>
      previous.map(
        (track, index) =>
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

  const audioBufferToWav = (
    buffer,
  ) => {
    const numChannels =
      buffer.numberOfChannels;

    const sampleRate =
      buffer.sampleRate;

    const format = 1;
    const bitDepth = 16;

    const channelData = [];

    for (
      let channel = 0;
      channel < numChannels;
      channel++
    ) {
      channelData.push(
        buffer.getChannelData(
          channel,
        ),
      );
    }

    const interleaved =
      new Float32Array(
        buffer.length *
          numChannels,
      );

    let offset = 0;

    for (
      let i = 0;
      i < buffer.length;
      i++
    ) {
      for (
        let channel = 0;
        channel < numChannels;
        channel++
      ) {
        interleaved[offset++] =
          channelData[channel][i];
      }
    }

    const dataLength =
      interleaved.length * 2;

    const arrayBuffer =
      new ArrayBuffer(
        44 + dataLength,
      );

    const view =
      new DataView(arrayBuffer);

    const writeString = (
      offset,
      string,
    ) => {
      for (
        let i = 0;
        i < string.length;
        i++
      ) {
        view.setUint8(
          offset + i,
          string.charCodeAt(i),
        );
      }
    };

    writeString(0, "RIFF");

    view.setUint32(
      4,
      36 + dataLength,
      true,
    );

    writeString(8, "WAVE");
    writeString(12, "fmt ");

    view.setUint32(
      16,
      16,
      true,
    );

    view.setUint16(
      20,
      format,
      true,
    );

    view.setUint16(
      22,
      numChannels,
      true,
    );

    view.setUint32(
      24,
      sampleRate,
      true,
    );

    view.setUint32(
      28,
      sampleRate *
        numChannels *
        (bitDepth / 8),
      true,
    );

    view.setUint16(
      32,
      numChannels *
        (bitDepth / 8),
      true,
    );

    view.setUint16(
      34,
      bitDepth,
      true,
    );

    writeString(36, "data");

    view.setUint32(
      40,
      dataLength,
      true,
    );

    let writeOffset = 44;

    for (
      let i = 0;
      i < interleaved.length;
      i++
    ) {
      const sample = Math.max(
        -1,
        Math.min(
          1,
          interleaved[i],
        ),
      );

      view.setInt16(
        writeOffset,
        sample < 0
          ? sample * 0x8000
          : sample * 0x7fff,
        true,
      );

      writeOffset += 2;
    }

    return new Blob(
      [arrayBuffer],
      {
        type: "audio/wav",
      },
    );
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
      setSaveStatus(
        "Rendering track...",
      );

      const renderGrid =
        gridRef.current;

      const renderSettings =
        settingsRef.current;

      const renderTrackCount =
        renderGrid?.length || 0;

      const buffer =
        await Tone.Offline(
          (context) => {
            context.transport.bpm.value =
              bpm;

            const offlineGains = [];
            const offlineDelays = [];
            const offlineLPFs = [];
            const offlineHPFs = [];
            const offlineReverbs = [];
            const offlineEngines = [];

            for (
              let trackIndex = 0;
              trackIndex <
              renderTrackCount;
              trackIndex++
            ) {
              const settings =
                renderSettings[
                  trackIndex
                ];

              const gain =
                new Tone.Gain(
                  settings?.muted
                    ? 0
                    : 1,
                );

              const delay =
                new Tone.FeedbackDelay(
                  {
                    delayTime:
                      settings?.delay
                        ?.time ??
                      0.25,

                    feedback:
                      settings?.delay
                        ?.feedback ??
                      0.3,

                    wet: settings
                      ?.delay
                      ?.enabled
                      ? settings
                          ?.delay
                          ?.wet ??
                        0.3
                      : 0,
                  },
                );

              const lpf =
                new Tone.Filter(
                  settings?.filter
                    ?.lowpass ??
                    20000,
                  "lowpass",
                );

              const hpf =
                new Tone.Filter(
                  settings?.filter
                    ?.highpass ??
                    20,
                  "highpass",
                );

              const reverb =
                new Tone.Reverb({
                  decay:
                    settings?.reverb
                      ?.decay ??
                    1.5,

                  wet: settings
                    ?.reverb
                    ?.enabled
                    ? settings
                        ?.reverb
                        ?.wet ??
                      0.35
                    : 0,
                });

              gain.connect(delay);
              delay.connect(lpf);
              lpf.connect(hpf);
              hpf.connect(reverb);
              reverb.toDestination();

              offlineGains.push(gain);
              offlineDelays.push(
                delay,
              );
              offlineLPFs.push(lpf);
              offlineHPFs.push(hpf);
              offlineReverbs.push(
                reverb,
              );

              const sound =
                getSoundById(
                  settings?.sound,
                );

              if (sound) {
                const engine =
                  createSoundEngine(
                    sound,
                    gain,
                  );

                offlineEngines.push(
                  engine,
                );
              } else {
                offlineEngines.push(
                  null,
                );
              }
            }

            for (
              let step = 0;
              step < NUM_STEPS;
              step++
            ) {
              const stepTime =
                step *
                (60 / bpm / 4);

              for (
                let trackIndex = 0;
                trackIndex <
                renderTrackCount;
                trackIndex++
              ) {
                const settings =
                  renderSettings[
                    trackIndex
                  ];

                if (
                  settings?.muted
                ) {
                  continue;
                }

                if (
                  !renderGrid?.[
                    trackIndex
                  ]?.[step]
                ) {
                  continue;
                }

                const engine =
                  offlineEngines[
                    trackIndex
                  ];

                if (!engine) {
                  continue;
                }

                engine.play(
                  stepTime,
                  {
                    note:
                      settings?.note,

                    duration:
                      settings?.duration,
                  },
                );
              }
            }

            context.transport.start();
          },
          durationInSeconds,
        );

      const wavBlob =
        audioBufferToWav(buffer);

      const url =
        URL.createObjectURL(
          wavBlob,
        );

      const a =
        document.createElement("a");

      a.href = url;
      a.download = filename;

      document.body.appendChild(a);

      a.click();

      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      setSaveStatus(
        "Track downloaded successfully.",
      );
    } catch (error) {
      console.error(error);

      setSaveStatus(
        `Download failed: ${error.message}`,
      );
    }
  };

  /**
   * -------------------------------------------------------
   * SAVE PROJECT
   * -------------------------------------------------------
   *
   * IMPORTANT:
   *
   * The frontend payload mirrors the projects table.
   *
   * We send:
   *
   *   name
   *   description
   *   tempo
   *   grid
   *   track_settings
   *   arrangement
   *
   * We do NOT send:
   *
   *   id
   *   user_id
   *   created_at
   *   updated_at
   *   shared_id
   *
   * Those belong to the backend/database.
   */

  const saveProject = async () => {
    if (!projectName.trim()) {
      setSaveStatus(
        "Please enter a project name.",
      );

      return;
    }

    if (!isAuthenticated) {
      setSaveStatus(
        "Please log in to save your project.",
      );

      return;
    }

    const payload = {
      name: projectName.trim(),

      description:
        projectDescription.trim() || null,

      tempo: bpm,

      grid,

      track_settings:
        trackSettings,

      arrangement,
    };

    const isUpdate =
      Boolean(projectId);

    try {
      const url = isUpdate
        ? `/api/users/${user.id}/projects/${projectId}`
        : `/api/users/${user.id}/projects`;

      const method = isUpdate
        ? "PUT"
        : "POST";

      const response =
        await fetch(url, {
          method,

          headers: {
            "Content-Type":
              "application/json",

            Authorization: token
              ? `Bearer ${token}`
              : "",
          },

          body: JSON.stringify(
            payload,
          ),
        });

      if (!response.ok) {
        const err =
          await response.text();

        throw new Error(
          err ||
            "Failed to save project",
        );
      }

      const project =
        normalizeProject(
          await response.json(),
        );

      /**
       * Backend is authoritative after save.
       */
      setProjectId(project.id);

      setSharedId(
        project.shared_id || null,
      );

      setProjectName(
        project.name,
      );

      setProjectDescription(
        project.description,
      );

      setSearchParams({
        projectId: String(
          project.id,
        ),
      });

      setInitialLoadDone(true);

      setSaveStatus(
        isUpdate
          ? `Updated "${project.name}"`
          : `Saved "${project.name}"`,
      );
    } catch (error) {
      setSaveStatus(
        `Save failed: ${error.message}`,
      );
    }
  };

  /**
   * -------------------------------------------------------
   * SHARE PROJECT
   * -------------------------------------------------------
   */

  const shareProject = async () => {
    if (!projectId) {
      setSaveStatus(
        "Please save your project first.",
      );

      return;
    }

    if (!isAuthenticated) {
      setSaveStatus(
        "Please log in to share your project.",
      );

      return;
    }

    setSaveStatus(
      "Generating share link...",
    );

    try {
      const response =
        await fetch(
          `/api/projects/${projectId}/share`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization: token
                ? `Bearer ${token}`
                : "",
            },
          },
        );

      if (!response.ok) {
        const err =
          await response.text();

        throw new Error(
          err ||
            "Failed to share project",
        );
      }

      const project =
        normalizeProject(
          await response.json(),
        );

      setSharedId(
        project.shared_id,
      );

      const link =
        `${window.location.origin}/sequencer?sharedId=${project.shared_id}`;

      setShareLink(link);

      setSaveStatus(
        "Project shared! Link copied to clipboard.",
      );

      navigator.clipboard.writeText(
        link,
      );
    } catch (error) {
      setSaveStatus(
        `Share failed: ${error.message}`,
      );
    }
  };

  /**
   * -------------------------------------------------------
   * ADD TO MY LIBRARY
   * -------------------------------------------------------
   */

  const addToMyLibrary = () => {
    setIsSharedView(false);

    setSharedId(null);

    setSharedBy("");

    setProjectId(null);

    setProjectName(
      `Copy of ${projectName}`,
    );

    setSaveStatus(
      "Edit your copy, then click 'Save Project' to add it to your library.",
    );

    setSearchParams({});
  };

  /**
   * -------------------------------------------------------
   * MANUAL LOAD
   * -------------------------------------------------------
   */

  const loadProject = async () => {
    if (!loadId.trim()) {
      setSaveStatus(
        "Please enter a project ID to load.",
      );

      return;
    }

    if (!isAuthenticated) {
      setSaveStatus(
        "Please log in to load your project.",
      );

      return;
    }

    try {
      const response =
        await fetch(
          `/api/users/${user.id}/projects/${loadId.trim()}`,
          {
            headers: {
              Authorization: token
                ? `Bearer ${token}`
                : "",
            },
          },
        );

      if (!response.ok) {
        const err =
          await response.text();

        throw new Error(
          err ||
            "Failed to load project",
        );
      }

      const project =
        normalizeProject(
          await response.json(),
        );

      applyProject(project);

      setSharedId(
        project.shared_id || null,
      );

      setIsSharedView(false);

      setSharedBy("");

      setInitialLoadDone(true);

      setSearchParams({
        projectId: String(
          project.id,
        ),
      });

      setSaveStatus(
        `Loaded "${project.name}"`,
      );
    } catch (error) {
      setSaveStatus(
        `Load failed: ${error.message}`,
      );
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
            {isSharedView
              ? "Shared beat"
              : "MVP sketchpad"}
          </p>

          <h1>
            {isSharedView
              ? `BeatForge: ${
                  projectName ||
                  "Shared Project"
                }`
              : "BeatForge Sketchbook"}
          </h1>

          <p>
            {isSharedView
              ? `A beat shared with you by ${
                  sharedBy
                    ? `@${sharedBy}`
                    : "another creator"
                }. Edit it and add it to your library.`
              : "A simple rhythm prototype for building, saving, and sharing beat ideas."}
          </p>
        </div>

        <div className="status-badge">
          <span
            className={`status-dot ${
              isPlaying
                ? "live"
                : "stopped"
            }`}
          />

          {isPlaying
            ? "Playing"
            : "Stopped"}
        </div>
      </section>

      {isSharedView && (
        <section className="shared-view-banner">
          <div className="shared-banner-content">
            <span className="shared-banner-icon">
              🔗
            </span>

            <span>
              Viewing shared project:
              <strong>
                {" "}
                {projectName}
              </strong>

              {sharedBy &&
                ` by @${sharedBy}`}
            </span>

            <button
              className="add-to-library-btn"
              onClick={
                addToMyLibrary
              }
            >
              📥 Add to My Library
            </button>
          </div>
        </section>
      )}

      <section className="controls-card">
        <div className="controls">
          <button
            onClick={togglePlay}
          >
            {isPlaying
              ? "⏹ Stop"
              : "▶ Play"}
          </button>

          <button
            onClick={clearGrid}
          >
            Clear Pattern
          </button>

          <button
            onClick={() =>
              downloadTrackAsWav()
            }
          >
            Download Track
          </button>

          <button
            onClick={
              handleNewProject
            }
          >
            New Project
          </button>

          {!isSharedView && (
            <>
              <button
                className="track-count-btn"
                onClick={
                  removeTrack
                }
                disabled={
                  numTracks <=
                  MIN_TRACKS
                }
                title="Remove track"
              >
                − Track
              </button>

              <button
                className="track-count-btn"
                onClick={addTrack}
                disabled={
                  numTracks >=
                  MAX_TRACKS
                }
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
              onChange={(e) =>
                handleBpmChange(
                  Number(
                    e.target.value,
                  ),
                )
              }
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
              isSharedView
                ? "Enter name for your copy..."
                : "Project name"
            }
            value={projectName}
            onChange={(e) =>
              setProjectName(
                e.target.value,
              )
            }
          />

          <input
            type="text"
            placeholder="Project description"
            value={
              projectDescription
            }
            onChange={(e) =>
              setProjectDescription(
                e.target.value,
              )
            }
          />

          <button
            onClick={saveProject}
            disabled={
              isSharedView &&
              !isAuthenticated
            }
            title={
              isSharedView
                ? isAuthenticated
                  ? "Save this as a new project in your library"
                  : "Log in to save"
                : ""
            }
          >
            {isSharedView
              ? "💾 Save Copy to Library"
              : projectId
                ? "💾 Update Project"
                : "💾 Save Project"}
          </button>

          {projectId && (
            <button
              className="share-btn"
              onClick={
                shareProject
              }
              title="Share this project with others"
            >
              🔗 Share
            </button>
          )}
        </div>

        {!isSharedView &&
          sharedId && (
            <div className="share-section">
              <span className="share-link">
                {`${window.location.origin}/sequencer?sharedId=${sharedId}`}
              </span>

              <button
                className="copy-link-btn"
                onClick={() => {
                  const link =
                    `${window.location.origin}/sequencer?sharedId=${sharedId}`;

                  navigator.clipboard.writeText(
                    link,
                  );

                  setSaveStatus(
                    "Share link copied to clipboard!",
                  );
                }}
              >
                Copy Link
              </button>
            </div>
          )}

        {saveStatus && (
          <p className="save-status">
            {saveStatus}
          </p>
        )}
      </section>

      <div className="tracks">
        {grid.map(
          (track, trackIndex) => {
            const currentSoundId =
              trackSettings[
                trackIndex
              ]?.sound ||
              DEFAULT_TRACK_SOUNDS[
                trackIndex
              ] ||
              DEFAULT_TRACK_SOUNDS[0];

            const currentSound =
              getSoundById(
                currentSoundId,
              );

            const isSynth =
              currentSound?.type ===
              "synth";

            const reverbEnabled =
              trackSettings[
                trackIndex
              ]?.reverb?.enabled ||
              false;

            const delayEnabled =
              trackSettings[
                trackIndex
              ]?.delay?.enabled ||
              false;

            const filterLowpass =
              trackSettings[
                trackIndex
              ]?.filter?.lowpass ??
              20000;

            const filterHighpass =
              trackSettings[
                trackIndex
              ]?.filter?.highpass ??
              20;

            const filterActive =
              filterLowpass <
                15000 ||
              filterHighpass > 40;

            const isMuted =
              trackSettings[
                trackIndex
              ]?.muted || false;

            const selectedNote =
              trackSettings[
                trackIndex
              ]?.note ||
              currentSound?.synth
                ?.note ||
              "C4";

            const selectedDuration =
              trackSettings[
                trackIndex
              ]?.duration ||
              currentSound?.synth
                ?.duration ||
              "8n";

            const isSoloed =
              trackSettings[
                trackIndex
              ]?.soloed || false;

            return (
              <div
                key={trackIndex}
                className={`track-row ${
                  isMuted
                    ? "track-muted"
                    : ""
                } ${
                  isSoloed
                    ? "track-soloed"
                    : ""
                }`}
              >
                <div className="track-main">
                  <span className="track-label">
                    {
                      TRACK_LABELS[
                        trackIndex
                      ]
                    }
                  </span>

                  <div className="track-controls">
                    <label>
                      <span>
                        Sound
                      </span>

                      <select
                        value={
                          currentSoundId
                        }
                        onChange={(e) =>
                          updateTrackSound(
                            trackIndex,
                            e.target
                              .value,
                          )
                        }
                      >
                        {getAvailableSounds().map(
                          (sound) => (
                            <option
                              key={
                                sound.id
                              }
                              value={
                                sound.id
                              }
                            >
                              {
                                sound.name
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <button
                      type="button"
                      className={`mute-track-button ${
                        isMuted
                          ? "muted"
                          : ""
                      }`}
                      onClick={() =>
                        toggleTrackMute(
                          trackIndex,
                        )
                      }
                      aria-pressed={
                        isMuted
                      }
                    >
                      {isMuted
                        ? "🔇 Unmute"
                        : "🔊 Mute"}
                    </button>

                    <button
                      type="button"
                      className={`solo-track-button ${
                        isSoloed
                          ? "soloed"
                          : ""
                      }`}
                      onClick={() =>
                        toggleTrackSolo(
                          trackIndex,
                        )
                      }
                      aria-pressed={
                        isSoloed
                      }
                    >
                      {isSoloed
                        ? "🔈 Unmute All"
                        : "🎧 Solo"}
                    </button>

                    <button
                      type="button"
                      className={`expand-chevron ${
                        expandedTrack ===
                        trackIndex
                          ? "expanded"
                          : ""
                      }`}
                      onClick={() =>
                        toggleTrackExpand(
                          trackIndex,
                        )
                      }
                      aria-label="Toggle track controls"
                    >
                      {expandedTrack ===
                      trackIndex
                        ? "▲"
                        : "▼"}
                    </button>

                    {reverbEnabled && (
                      <span className="effect-badge">
                        Reverb
                      </span>
                    )}

                    {delayEnabled && (
                      <span className="effect-badge">
                        Delay
                      </span>
                    )}

                    {filterActive && (
                      <span className="effect-badge">
                        Filter
                      </span>
                    )}

                    {isMuted && (
                      <span className="effect-badge muted-badge">
                        Muted
                      </span>
                    )}

                    {isSynth && (
                      <>
                        <label>
                          <span>
                            Note
                          </span>

                          <select
                            value={
                              selectedNote
                            }
                            onChange={(e) =>
                              updateTrackSetting(
                                trackIndex,
                                "note",
                                e
                                  .target
                                  .value,
                              )
                            }
                          >
                            {NOTE_OPTIONS.map(
                              (note) => (
                                <option
                                  key={
                                    note
                                  }
                                  value={
                                    note
                                  }
                                >
                                  {
                                    note
                                  }
                                </option>
                              ),
                            )}
                          </select>
                        </label>

                        <label>
                          <span>
                            Duration
                          </span>

                          <select
                            value={
                              selectedDuration
                            }
                            onChange={(e) =>
                              updateTrackSetting(
                                trackIndex,
                                "duration",
                                e
                                  .target
                                  .value,
                              )
                            }
                          >
                            <option value="16n">
                              16n
                            </option>

                            <option value="8n">
                              8n
                            </option>

                            <option value="4n">
                              4n
                            </option>

                            <option value="2n">
                              2n
                            </option>
                          </select>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div className="step-row">
                  {track.map(
                    (
                      isActive,
                      stepIndex,
                    ) => (
                      <button
                        key={
                          stepIndex
                        }
                        onClick={() =>
                          toggleStep(
                            trackIndex,
                            stepIndex,
                          )
                        }
                        className={`
                          ${
                            isActive
                              ? "active"
                              : ""
                          }
                          ${
                            currentStep ===
                              stepIndex &&
                            isPlaying
                              ? "playing"
                              : ""
                          }
                          ${
                            isMuted
                              ? "muted-step"
                              : ""
                          }
                        `}
                      >
                        {stepIndex + 1}
                      </button>
                    ),
                  )}
                </div>

                {expandedTrack ===
                  trackIndex && (
                  <div className="track-controls-expanded">
                    <div className="slider-control">
                      <label>
                        <span>
                          Delay On
                        </span>

                        <input
                          type="checkbox"
                          checked={
                            delayEnabled
                          }
                          onChange={(e) =>
                            updateTrackSetting(
                              trackIndex,
                              "delay",
                              {
                                ...trackSettings[
                                  trackIndex
                                ]?.delay,

                                enabled:
                                  e
                                    .target
                                    .checked,
                              },
                            )
                          }
                        />
                      </label>
                    </div>

                    <div className="dial-row">
                      <Dial
                        label="Delay Time"
                        value={
                          trackSettings[
                            trackIndex
                          ]?.delay
                            ?.time ??
                          0.25
                        }
                        min={0.05}
                        max={0.75}
                        step={0.01}
                        formatValue={(
                          value,
                        ) =>
                          `${Math.round(
                            value *
                              1000,
                          )}ms`
                        }
                        onChange={(e) =>
                          updateTrackSetting(
                            trackIndex,
                            "delay",
                            {
                              ...trackSettings[
                                trackIndex
                              ]?.delay,

                              enabled:
                                true,

                              time: parseFloat(
                                e.target
                                  .value,
                              ),
                            },
                          )
                        }
                      />

                      <Dial
                        label="Delay Feedback"
                        value={
                          trackSettings[
                            trackIndex
                          ]?.delay
                            ?.feedback ??
                          0.3
                        }
                        min={0}
                        max={0.8}
                        step={0.01}
                        formatValue={(
                          value,
                        ) =>
                          `${Math.round(
                            value *
                              100,
                          )}%`
                        }
                        onChange={(e) =>
                          updateTrackSetting(
                            trackIndex,
                            "delay",
                            {
                              ...trackSettings[
                                trackIndex
                              ]?.delay,

                              enabled:
                                true,

                              feedback:
                                parseFloat(
                                  e
                                    .target
                                    .value,
                                ),
                            },
                          )
                        }
                      />

                      <Dial
                        label="Delay Wet"
                        value={
                          trackSettings[
                            trackIndex
                          ]?.delay
                            ?.wet ??
                          0.3
                        }
                        min={0}
                        max={1}
                        step={0.01}
                        formatValue={(
                          value,
                        ) =>
                          `${Math.round(
                            value *
                              100,
                          )}%`
                        }
                        onChange={(e) =>
                          updateTrackSetting(
                            trackIndex,
                            "delay",
                            {
                              ...trackSettings[
                                trackIndex
                              ]?.delay,

                              enabled:
                                true,

                              wet: parseFloat(
                                e.target
                                  .value,
                              ),
                            },
                          )
                        }
                      />
                    </div>

                    <div className="dial-row">
                      <Dial
                        label="Low Pass"
                        value={
                          filterLowpass
                        }
                        min={100}
                        max={20000}
                        step={10}
                        formatValue={(
                          value,
                        ) =>
                          `${Math.round(
                            value,
                          )} Hz`
                        }
                        onChange={(e) => {
                          const freq =
                            parseFloat(
                              e.target
                                .value,
                            );

                          updateTrackSetting(
                            trackIndex,
                            "filter",
                            {
                              ...trackSettings[
                                trackIndex
                              ]?.filter,

                              enabled:
                                true,

                              lowpass:
                                freq,
                            },
                          );
                        }}
                      />

                      <Dial
                        label="High Pass"
                        value={
                          filterHighpass
                        }
                        min={20}
                        max={8000}
                        step={10}
                        formatValue={(
                          value,
                        ) =>
                          `${Math.round(
                            value,
                          )} Hz`
                        }
                        onChange={(e) => {
                          const freq =
                            parseFloat(
                              e.target
                                .value,
                            );

                          updateTrackSetting(
                            trackIndex,
                            "filter",
                            {
                              ...trackSettings[
                                trackIndex
                              ]?.filter,

                              enabled:
                                true,

                              highpass:
                                freq,
                            },
                          );
                        }}
                      />
                    </div>

                    <div className="dial-row">
                      <Dial
                        label="Reverb Wet"
                        value={
                          trackSettings[
                            trackIndex
                          ]?.reverb
                            ?.wet ??
                          0.35
                        }
                        min={0}
                        max={1}
                        step={0.01}
                        formatValue={(
                          value,
                        ) =>
                          `${Math.round(
                            value *
                              100,
                          )}%`
                        }
                        onChange={(e) =>
                          updateTrackSetting(
                            trackIndex,
                            "reverb",
                            {
                              ...trackSettings[
                                trackIndex
                              ]?.reverb,

                              enabled:
                                true,

                              wet: parseFloat(
                                e.target
                                  .value,
                              ),
                            },
                          )
                        }
                      />

                      <Dial
                        label="Reverb Decay"
                        value={
                          trackSettings[
                            trackIndex
                          ]?.reverb
                            ?.decay ??
                          1.5
                        }
                        min={0.1}
                        max={10}
                        step={0.1}
                        formatValue={(
                          value,
                        ) =>
                          `${value.toFixed(
                            1,
                          )}s`
                        }
                        onChange={(e) =>
                          updateTrackSetting(
                            trackIndex,
                            "reverb",
                            {
                              ...trackSettings[
                                trackIndex
                              ]?.reverb,

                              enabled:
                                true,

                              decay: parseFloat(
                                e.target
                                  .value,
                              ),
                            },
                          )
                        }
                      />
                    </div>

                    <div className="slider-control">
                      <label>
                        <span>
                          Reverb On
                        </span>

                        <input
                          type="checkbox"
                          checked={
                            reverbEnabled
                          }
                          onChange={(e) =>
                            updateTrackSetting(
                              trackIndex,
                              "reverb",
                              {
                                ...trackSettings[
                                  trackIndex
                                ]?.reverb,

                                enabled:
                                  e
                                    .target
                                    .checked,
                              },
                            )
                          }
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      className="preview-btn-inline"
                      onClick={() =>
                        previewTrackInline(
                          trackIndex,
                        )
                      }
                    >
                      &#9654; Preview
                    </button>
                  </div>
                )}
              </div>
            );
          },
        )}

        {!isSharedView &&
          numTracks < MAX_TRACKS && (
            <div
              className="add-track-card"
              onClick={addTrack}
              title="Add track (up to 8)"
            >
              <span className="add-track-icon">
                +
              </span>

              <span className="add-track-label">
                Add Track
              </span>

              <span className="add-track-sub">
                {numTracks}/
                {MAX_TRACKS} tracks
              </span>
            </div>
          )}
      </div>

      <ArrangementView
        arrangement={arrangement}
        onAddSection={addSection}
        onRemove={removeSection}
        onRename={renameSection}
        onBarsChange={
          changeSectionBars
        }
        onPlayArrangement={
          toggleArrangementPlay
        }
        isPlaying={
          isArrangementPlaying
        }
        numTracks={numTracks}
        currentStep={currentStep}
        activeSectionIndex={
          activeSectionIndex
        }
      />
    </main>
  );
}