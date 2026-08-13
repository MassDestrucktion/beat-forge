import * as Tone from "tone";
import { useState, useEffect, useRef } from "react";
import {
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router";
import { useAuth } from "./AuthContext/AuthContext.jsx";
import {
  getSoundById,
  getSoundsByType,
  createSoundEngine,
} from "./audio/soundLibrary";
import "./App.css";

const NUM_TRACKS = 4;
const NUM_STEPS = 16;

const TRACK_LABELS = [
  "Track 1",
  "Track 2",
  "Track 3",
  "Track 4",
];

/*
 * ---------------------------------------------------------
 * DEFAULT SOUNDS
 * ---------------------------------------------------------
 *
 * These are SOUND_LIBRARY IDs.
 *
 * The sequencer no longer needs to know how a sound is
 * actually implemented. It only stores the sound ID.
 */

const DEFAULT_TRACK_SETTINGS = [
  {
    sound: "drums.kicks.cr78",
    muted: false,
  },

  {
    sound: "drums.snares.cr78",
    muted: false,
  },

  {
    sound: "drums.hihats.cr78",
    muted: false,
  },

  {
    sound: "synths.stabs.classic",
    note: "G2",
    duration: "8n",
    muted: false,
  },
];

/*
 * ---------------------------------------------------------
 * BACKWARD COMPATIBILITY
 * ---------------------------------------------------------
 *
 * Older saved projects used:
 *
 * kick
 * snare
 * hihat
 * stab
 * pad
 *
 * New projects use SOUND_LIBRARY IDs.
 *
 * This lets old projects continue working.
 */

const LEGACY_SOUND_IDS = {
  kick: "drums.kicks.cr78",
  snare: "drums.snares.cr78",
  hihat: "drums.hihats.cr78",
  stab: "synths.stabs.classic",
  pad: "synths.pads.classic",
};

/*
 * Convert an old sound ID into the new library ID.
 */
function normalizeSoundId(soundId) {
  if (!soundId) {
    return DEFAULT_TRACK_SETTINGS[0].sound;
  }

  return (
    LEGACY_SOUND_IDS[soundId] ||
    soundId
  );
}

/*
 * Create a fresh copy of the default track settings.
 */
function createDefaultTrackSettings() {
  return DEFAULT_TRACK_SETTINGS.map(
    (track) => ({
      ...track,
    })
  );
}

/*
 * Create an empty 4 x 16 sequencer grid.
 */
function createEmptyGrid() {
  return Array(NUM_TRACKS)
    .fill(null)
    .map(() =>
      Array(NUM_STEPS).fill(false)
    );
}

/*
 * ---------------------------------------------------------
 * HELPERS
 * ---------------------------------------------------------
 */

/*
 * Determine whether a library sound is a synth.
 */
function isSynthSound(soundId) {
  const sound = getSoundById(soundId);

  return sound?.type === "synth";
}

/*
 * Normalize track settings loaded from a project.
 *
 * This is also where we migrate old sound IDs.
 */
function normalizeTrackSettings(
  settings
) {
  if (!Array.isArray(settings)) {
    return createDefaultTrackSettings();
  }

  return Array.from(
    { length: NUM_TRACKS },
    (_, index) => {
      const source =
        settings[index] ||
        DEFAULT_TRACK_SETTINGS[index] ||
        DEFAULT_TRACK_SETTINGS[0];

      const soundId =
        normalizeSoundId(source.sound);

      const sound =
        getSoundById(soundId);

      /*
       * Preserve the project settings while making
       * sure the sound actually exists.
       */
      return {
        ...source,

        sound: sound
          ? sound.id
          : DEFAULT_TRACK_SETTINGS[
              index
            ]?.sound ||
            DEFAULT_TRACK_SETTINGS[0]
              .sound,

        muted:
          source.muted ?? false,
      };
    }
  );
}

/*
 * ---------------------------------------------------------
 * AUDIO ROUTING
 * ---------------------------------------------------------
 *
 * Each track:
 *
 * Sound Engine
 *      Γåô
 * Track Gain
 *      Γåô
 * Track Reverb
 *      Γåô
 * Destination
 *
 * The sequencer owns routing.
 *
 * The sound library owns sound definitions.
 *
 * The sound engine owns Tone.js instrument creation.
 */

/*
 * Create the per-track reverb effects.
 */
const trackReverbs = Array.from(
  { length: NUM_TRACKS },
  () =>
    new Tone.Reverb({
      decay: 1.5,
      wet: 0,
    })
);

/*
 * Send reverb to the master destination.
 */
trackReverbs.forEach((reverb) => {
  reverb.toDestination();
});

/*
 * Create one gain node per track.
 */
const trackGains = Array.from(
  { length: NUM_TRACKS },
  () => new Tone.Gain(1)
);

/*
 * Connect each track gain into its
 * corresponding reverb.
 */
trackGains.forEach(
  (gain, trackIndex) => {
    gain.connect(
      trackReverbs[trackIndex]
    );
  }
);

/*
 * Each track owns one sound engine.
 *
 * The engine is replaced whenever the selected
 * library sound changes.
 */
const trackEngines = Array(
  NUM_TRACKS
).fill(null);

/*
 * Dispose an individual track engine.
 */
function disposeTrackEngine(
  trackIndex
) {
  const engine =
    trackEngines[trackIndex];

  if (!engine) {
    return;
  }

  try {
    engine.dispose?.();
  } catch (error) {
    console.warn(
      "Failed to dispose track engine:",
      error
    );
  }

  trackEngines[trackIndex] =
    null;
}

/*
 * Create the engine for one track.
 */
function createTrackEngine(
  trackIndex,
  soundId
) {
  disposeTrackEngine(trackIndex);

  const sound =
    getSoundById(soundId);

  if (!sound) {
    console.warn(
      `Sound not found in library: ${soundId}`
    );

    return null;
  }

  const gain =
    trackGains[trackIndex];

  const engine =
    createSoundEngine(
      sound,
      gain
    );

  trackEngines[trackIndex] =
    engine;

  return engine;
}

/*
 * ---------------------------------------------------------
 * REACT COMPONENT
 * ---------------------------------------------------------
 */

export default function SequencerPage() {
  const {
    isAuthenticated,
    token,
  } = useAuth();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const navigate = useNavigate();

  const location = useLocation();

  const [grid, setGrid] =
    useState(createEmptyGrid);

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);

  const [
    currentStep,
    setCurrentStep,
  ] = useState(null);

  const [bpm, setBpm] =
    useState(120);

  const [
    trackSettings,
    setTrackSettings,
  ] = useState(
    createDefaultTrackSettings
  );

  const [
    projectName,
    setProjectName,
  ] = useState("");

  const [
    projectId,
    setProjectId,
  ] = useState(null);

  const [
    saveStatus,
    setSaveStatus,
  ] = useState("");

  const [loadId, setLoadId] =
    useState("");

  const [
    initialLoadDone,
    setInitialLoadDone,
  ] = useState(false);

  /*
   * Refs allow the Tone.Transport callback
   * to always access current React state.
   */

  const gridRef =
    useRef(grid);

  const settingsRef =
    useRef(trackSettings);

  const stepCountRef =
    useRef(0);

  /*
   * Keep refs synchronized.
   */

  (() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    settingsRef.current =
      trackSettings;
  }, [trackSettings]);

  /*
   * ---------------------------------------------------------
   * INITIALIZE DEFAULT SOUND ENGINES
   * ---------------------------------------------------------
   *
   * The first render has the default track settings.
   *
   * Create the corresponding sound engines once.
   */

  useEffect(() => {
    trackSettings.forEach(
      (settings, trackIndex) => {
        if (!settings?.sound) {
          return;
        }

        if (
          trackEngines[trackIndex]
        ) {
          return;
        }

        createTrackEngine(
          trackIndex,
          settings.sound
        );
      }
    );
  }, [trackSettings]);

  /*
   * ---------------------------------------------------------
   * TRACK SOUND CHANGES
   * ---------------------------------------------------------
   *
   * Whenever the selected sound changes,
   * replace the Tone.js engine.
   */

  useEffect(() => {
    trackSettings.forEach(
      (settings, trackIndex) => {
        if (!settings?.sound) {
          return;
        }

        const engine =
          trackEngines[trackIndex];

        const currentSoundId =
          engine?.soundId;

        /*
         * If the engine doesn't expose the ID,
         * create it only if missing.
         */
        if (!engine) {
          createTrackEngine(
            trackIndex,
            settings.sound
          );

          return;
        }

        if (
          currentSoundId &&
          currentSoundId !==
            settings.sound
        ) {
          createTrackEngine(
            trackIndex,
            settings.sound
          );
        }
      }
    );
  }, [trackSettings]);

  /*
   * ---------------------------------------------------------
   * TRACK EFFECTS / MUTE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    trackSettings.forEach(
      (settings, trackIndex) => {
        if (!settings) {
          return;
        }

        const reverb =
          trackReverbs[trackIndex];

        const gain =
          trackGains[trackIndex];

        if (!reverb || !gain) {
          return;
        }

        /*
         * REVERB
         */

        const reverbEnabled =
          settings.reverb?.enabled ||
          false;

        const wet =
          settings.reverb?.wet ??
          0.35;

        const decay =
          settings.reverb?.decay ??
          1.5;

        reverb.decay = decay;

        reverb.wet.value =
          reverbEnabled
            ? wet
            : 0;

        /*
         * MUTE
         */

        gain.gain.value =
          settings.muted
            ? 0
            : 1;
      }
    );
  }, [trackSettings]);

  /*
   * ---------------------------------------------------------
   * CLEANUP AUDIO
   * ---------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      trackEngines.forEach(
        (_, trackIndex) => {
          disposeTrackEngine(
            trackIndex
          );
        }
      );
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * CUSTOMIZE TRACK
   * ---------------------------------------------------------
   */

  const customizeTrack = (
    trackIndex
  ) => {
    const params =
      new URLSearchParams();

    if (projectId) {
      params.set(
        "projectId",
        String(projectId)
      );
    }

    params.set(
      "track",
      String(trackIndex)
    );

    navigate(
      `/customize-track?${params.toString()}`,
      {
        state: {
          fromSequencer: true,

          grid,

          trackSettings,

          bpm,

          projectName,

          projectId,

          trackIndex,
        },
      }
    );
  };

  /*
   * ---------------------------------------------------------
   * RETURN FROM CUSTOMIZE TRACK
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const returnedState =
      location.state;

    if (
      !returnedState?.fromCustomize
    ) {
      return;
    }useEffect

    /*
     * Restore grid.
     */

    if (
      Array.isArray(
        returnedState.grid
      )
    ) {
      setGrid(
        returnedState.grid
      );
    }

    /*
     * Restore track settings.
     */

    if (
      Array.isArray(
        returnedState.trackSettings
      )
    ) {
      setTrackSettings(
        normalizeTrackSettings(
          returnedState.trackSettings
        )
      );
    }

    /*
     * Restore BPM.
     */

    if (
      returnedState.bpm !==
      undefined
    ) {
      setBpm(
        returnedState.bpm
      );

      Tone.Transport.bpm.value =
        returnedState.bpm;
    }

    /*
     * Restore project name.
     */

    if (
      returnedState.projectName !==
      undefined
    ) {
      setProjectName(
        returnedState.projectName
      );
    }

    /*
     * Restore project ID.
     */

    if (
      returnedState.projectId !==
      undefined
    ) {
      setProjectId(
        returnedState.projectId
      );
    }

    setInitialLoadDone(true);

    /*
     * Clear router state.
     */

    navigate("/sequencer", {
      replace: true,
      state: null,
    });
  }, [
    location.state,
    navigate,
  ]);

  /*
   * ---------------------------------------------------------
   * LOAD PROJECT FROM URL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const projectIdFromUrl =
      searchParams.get(
        "projectId"
      );

    if (!projectIdFromUrl) {
      return;
    }

    if (
      location.state?.fromCustomize
    ) {
      return;
    }

    if (initialLoadDone) {
      return;
    }

    const loadProjectFromUrl =
      async () => {
        setSaveStatus(
          "Loading project..."
        );

        try {
          const response =
            await fetch(
              `/api/projects/${projectIdFromUrl}`,
              {
                headers: {
                  Authorization:
                    token
                      ? `Bearer ${token}`
                      : "",
                },
              }
            );

          if (!response.ok) {
            const text =
              await response.text();

            throw new Error(
              text ||
                "Failed to load project"
            );
          }

          const project =
            await response.json();

          applyProject(project);

          setSaveStatus(
            `Loaded "${project.name}"`
          );
        } catch (error) {
          setSaveStatus(
            `Load failed: ${error.message}`
          );
        } finally {
          setInitialLoadDone(
            true
          );
        }
      };

    loadProjectFromUrl();
  }, [
    searchParams,
    token,
    initialLoadDone,
    location.state,
  ]);

  /*
   * ---------------------------------------------------------
   * APPLY PROJECT
   * ---------------------------------------------------------
   */

  const applyProject = (
    project
  ) => {
    setProjectName(
      project.name || ""
    );

    setProjectId(project.id);

    const projectBpm =
      project.tempo || 120;

    setBpm(projectBpm);

    Tone.Transport.bpm.value =
      projectBpm;

    /*
     * Restore grid.
     */

    if (
      Array.isArray(project.grid) &&
      project.grid.length ===
        NUM_TRACKS
    ) {
      setGrid(project.grid);
    }

    /*
     * Restore track settings.
     *
     * normalizeTrackSettings()
     * also migrates old sound IDs.
     */

    if (
      Array.isArray(
        project.track_settings
      ) &&
      project.track_settings
        .length === NUM_TRACKS
    ) {
      setTrackSettings(
        normalizeTrackSettings(
          project.track_settings
        )
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * PLAY TRACK SOUND
   * ---------------------------------------------------------
   */

  const playTrackSound = (
    trackIndex,
    time
  ) => {
    const config =
      settingsRef.current[
        trackIndex
      ];

    if (!config) {
      return;
    }

    /*
     * Muted tracks don't trigger voices.
     */

    if (config.muted) {
      return;
    }

    const sound =
      getSoundById(
        normalizeSoundId(
          config.sound
        )
      );

    if (!sound) {
      console.warn(
        `Unknown sound: ${config.sound}`
      );

      return;
    }

    const engine =
      trackEngines[trackIndex];

    if (!engine) {
      return;
    }

    /*
     * Every sound engine now exposes a
     * common play() interface.
     */

    engine.play(time, {
      note:
        config.note ??
        sound.synth?.note,

      duration:
        config.duration ??
        sound.synth?.duration,
    });
  };

  /*
   * ---------------------------------------------------------
   * 16-STEP SEQUENCER LOOP
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const repeat = (time) => {
      const step =
        stepCountRef.current %
        NUM_STEPS;

      setCurrentStep(step);

      const currentGrid =
        gridRef.current;

      for (
        let trackIndex = 0;
        trackIndex < NUM_TRACKS;
        trackIndex++
      ) {
        if (
          currentGrid?.[
            trackIndex
          ]?.[step]
        ) {
          playTrackSound(
            trackIndex,
            time
          );
        }
      }

      stepCountRef.current++;
    };

    const eventId =
      Tone.Transport.scheduleRepeat(
        repeat,
        "16n"
      );

    return () => {
      Tone.Transport.clear(
        eventId
      );
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * BPM
   * ---------------------------------------------------------
   */

  const handleBpmChange = (
    newBpm
  ) => {
    setBpm(newBpm);

    Tone.Transport.bpm.value =
      newBpm;
  };

  /*
   * ---------------------------------------------------------
   * TOGGLE STEP
   * ---------------------------------------------------------
   */

  const toggleStep = async (
    trackIndex,
    stepIndex
  ) => {
    await Tone.start();

    if (
      Tone.getContext().state !==
      "running"
    ) {
      await Tone.getContext().resume();
    }

    const updatedGrid =
      grid.map((track) => [
        ...track,
      ]);

    const isTurningOn =
      !updatedGrid[trackIndex][
        stepIndex
      ];

    updatedGrid[trackIndex][
      stepIndex
    ] = isTurningOn;

    setGrid(updatedGrid);

    if (isTurningOn) {
      playTrackSound(
        trackIndex
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * MUTE / UNMUTE TRACK
   * ---------------------------------------------------------
   */

  const toggleTrackMute = (
    trackIndex
  ) => {
    setTrackSettings((prev) =>
      prev.map(
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
        }
      )
    );
  };

  /*
   * ---------------------------------------------------------
   * PLAY / STOP
   * ---------------------------------------------------------
   */

  const togglePlay =
    async () => {
      await Tone.start();

      if (
        Tone.getContext().state !==
        "running"
      ) {
        await Tone.getContext().resume();
      }

      if (isPlaying) {
        Tone.Transport.stop();

        Tone.Transport.position = 0;

        stepCountRef.current = 0;

        setIsPlaying(false);
        setCurrentStep(null);
      } else {
        Tone.Transport.position = 0;

        stepCountRef.current = 0;

        Tone.Transport.start();

        setIsPlaying(true);
      }
    };

  /*
   * ---------------------------------------------------------
   * CLEAR GRID
   * ---------------------------------------------------------
   */

  const clearGrid = () => {
    setGrid(createEmptyGrid());
  };

  /*
   * ---------------------------------------------------------
   * NEW PROJECT
   * ---------------------------------------------------------
   */

  const handleNewProject = () => {
    setProjectName("");

    setProjectId(null);

    setGrid(createEmptyGrid());

    setTrackSettings(
      createDefaultTrackSettings()
    );

    setBpm(120);

    Tone.Transport.bpm.value =
      120;

    setSaveStatus("");

    setLoadId("");

    setInitialLoadDone(false);

    setSearchParams({});
  };

  /*
   * ---------------------------------------------------------
   * AUDIO BUFFER ΓåÆ WAV
   * ---------------------------------------------------------
   */

  const audioBufferToWav = (
    buffer
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
          channel
        )
      );
    }

    const interleaved =
      new Float32Array(
        buffer.length *
          numChannels
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
        44 + dataLength
      );

    const view =
      new DataView(arrayBuffer);

    const writeString = (
      offset,
      string
    ) => {
      for (
        let i = 0;
        i < string.length;
        i++
      ) {
        view.setUint8(
          offset + i,
          string.charCodeAt(i)
        );
      }
    };

    writeString(0, "RIFF");

    view.setUint32(
      4,
      36 + dataLength,
      true
    );

    writeString(8, "WAVE");

    writeString(
      12,
      "fmt "
    );

    view.setUint32(
      16,
      16,
      true
    );

    view.setUint16(
      20,
      format,
      true
    );

    view.setUint16(
      22,
      numChannels,
      true
    );

    view.setUint32(
      24,
      sampleRate,
      true
    );

    view.setUint32(
      28,
      sampleRate *
        numChannels *
        (bitDepth / 8),
      true
    );

    view.setUint16(
      32,
      numChannels *
        (bitDepth / 8),
      true
    );

    view.setUint16(
      34,
      bitDepth,
      true
    );

    writeString(
      36,
      "data"
    );

    view.setUint32(
      40,
      dataLength,
      true
    );

    let writeOffset = 44;

    for (
      let i = 0;
      i < interleaved.length;
      i++
    ) {
      const sample =
        Math.max(
          -1,
          Math.min(
            1,
            interleaved[i]
          )
        );

      view.setInt16(
        writeOffset,
        sample < 0
          ? sample * 0x8000
          : sample * 0x7fff,
        true
      );

      writeOffset += 2;
    }

    return new Blob(
      [arrayBuffer],
      {
        type: "audio/wav",
      }
    );
  };

  /*
   * ---------------------------------------------------------
   * DOWNLOAD WAV
   * ---------------------------------------------------------
   *
   * Uses SOUND_LIBRARY definitions.
   *
   * No hardcoded sample URLs.
   * No hardcoded synth engines.
   */

  const downloadTrackAsWav =
    async (
      durationInSeconds = 4,
      filename = "track.wav"
    ) => {
      try {
        setSaveStatus(
          "Rendering track..."
        );

        const buffer =
          await Tone.Offline(
            ({ transport }) => {
              transport.bpm.value =
                bpm;

              /*
               * Offline track routing.
               */

              const offlineReverbs =
                Array.from(
                  {
                    length:
                      NUM_TRACKS,
                  },
                  (_, trackIndex) => {
                    const settings =
                      trackSettings[
                        trackIndex
                      ];

                    const reverb =
                      new Tone.Reverb({
                        decay:
                          settings
                            ?.reverb
                            ?.decay ??
                          1.5,

                        wet:
                          settings
                            ?.reverb
                            ?.enabled
                            ? settings
                                ?.reverb
                                ?.wet ??
                              0.35
                            : 0,
                      });

                    reverb.toDestination();

                    return reverb;
                  }
                );

              const offlineGains =
                Array.from(
                  {
                    length:
                      NUM_TRACKS,
                  },
                  (_, trackIndex) => {
                    const settings =
                      trackSettings[
                        trackIndex
                      ];

                    const gain =
                      new Tone.Gain(
                        settings?.muted
                          ? 0
                          : 1
                      );

                    gain.connect(
                      offlineReverbs[
                        trackIndex
                      ]
                    );

                    return gain;
                  }
                );

              /*
               * Create engines from the
               * sound library.
               */

              const offlineEngines =
                Array(
                  NUM_TRACKS
                ).fill(null);

              for (
                let trackIndex = 0;
                trackIndex <
                NUM_TRACKS;
                trackIndex++
              ) {
                const settings =
                  trackSettings[
                    trackIndex
                  ];

                if (!settings) {
                  continue;
                }

                const soundId =
                  normalizeSoundId(
                    settings.sound
                  );

                const sound =
                  getSoundById(
                    soundId
                  );

                if (!sound) {
                  continue;
                }

                offlineEngines[
                  trackIndex
                ] =
                  createSoundEngine(
                    sound,
                    offlineGains[
                      trackIndex
                    ]
                  );
              }

              /*
               * Schedule every active step.
               */

              for (
                let step = 0;
                step < NUM_STEPS;
                step++
              ) {
                /*
                 * One 16th note.
                 */

                const stepTime =
                  step *
                  (60 / bpm / 4);

                for (
                  let trackIndex = 0;
                  trackIndex <
                  NUM_TRACKS;
                  trackIndex++
                ) {
                  const settings =
                    trackSettings[
                      trackIndex
                    ];

                  if (!settings) {
                    continue;
                  }

                  /*
                   * Don't render muted
                   * tracks.
                   */

                  if (
                    settings.muted
                  ) {
                    continue;
                  }

                  if (
                    !grid?.[
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

                  const sound =
                    getSoundById(
                      normalizeSoundId(
                        settings.sound
                      )
                    );

                  if (!sound) {
                    continue;
                  }

                  engine.play(
                    stepTime,
                    {
                      note:
                        settings.note ??
                        sound.synth
                          ?.note,

                      duration:
                        settings.duration ??
                        sound.synth
                          ?.duration,
                    }
                  );
                }
              }

              transport.start();
            },
            durationInSeconds
          );

        const wavBlob =
          audioBufferToWav(
            buffer
          );

        const url =
          URL.createObjectURL(
            wavBlob
          );

        const a =
          document.createElement(
            "a"
          );

        a.href = url;

        a.download = filename;

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        setSaveStatus(
          "Track downloaded successfully."
        );
      } catch (error) {
        console.error(error);

        setSaveStatus(
          `Download failed: ${error.message}`
        );
      }
    };

  /*
   * ---------------------------------------------------------
   * UPDATE TRACK SETTING
   * ---------------------------------------------------------
   */

  const updateTrackSetting = (
    trackIndex,
    key,
    value
  ) => {
    setTrackSettings((prev) =>
      prev.map(
        (track, index) =>
          index === trackIndex
            ? {
                ...track,
                [key]:
                  key === "sound"
                    ? normalizeSoundId(
                        value
                      )
                    : value,
              }
            : track
      )
    );

    /*
     * Sound changes need an immediate
     * engine replacement.
     */

    if (key === "sound") {
      createTrackEngine(
        trackIndex,
        normalizeSoundId(value)
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * SAVE PROJECT
   * ---------------------------------------------------------
   */

  const saveProject =
    async () => {
      if (!projectName.trim()) {
        setSaveStatus(
          "Please enter a project name."
        );

        return;
      }

      if (!isAuthenticated) {
        setSaveStatus(
          "Please log in to save your project."
        );

        return;
      }

      const payload = {
        name: projectName,
        tempo: bpm,
        grid,
        track_settings:
          trackSettings,
      };

      const isUpdate =
        Boolean(projectId);

      try {
        const url = isUpdate
          ? `/api/projects/${projectId}`
          : "/api/projects";

        const method = isUpdate
          ? "PUT"
          : "POST";

        const response =
          await fetch(url, {
            method,

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                token
                  ? `Bearer ${token}`
                  : "",
            },

            body: JSON.stringify(
              payload
            ),
          });

        if (!response.ok) {
          const err =
            await response.text();

          throw new Error(
            err ||
              "Failed to save project"
          );
        }

        const project =
          await response.json();

        setProjectId(project.id);

        setSearchParams({
          projectId: String(
            project.id
          ),
        });

        setInitialLoadDone(true);

        setSaveStatus(
          isUpdate
            ? `Updated "${project.name}"`
            : `Saved "${project.name}" (ID: ${project.id})`
        );
      } catch (error) {
        setSaveStatus(
          `Save failed: ${error.message}`
        );
      }
    };

  /*
   * ---------------------------------------------------------
   * LOAD PROJECT MANUALLY
   * ---------------------------------------------------------
   */

  const loadProject =
    async () => {
      if (!loadId.trim()) {
        setSaveStatus(
          "Please enter a project ID to load."
        );

        return;
      }

      try {
        const response =
          await fetch(
            `/api/projects/${loadId.trim()}`,
            {
              headers: {
                Authorization:
                  token
                    ? `Bearer ${token}`
                    : "",
              },
            }
          );

        if (!response.ok) {
          const err =
            await response.text();

          throw new Error(
            err ||
              "Failed to load project"
          );
        }

        const project =
          await response.json();

        applyProject(project);

        setInitialLoadDone(true);

        setSearchParams({
          projectId: String(
            project.id
          ),
        });

        setSaveStatus(
          `Loaded "${project.name}"`
        );
      } catch (error) {
        setSaveStatus(
          `Load failed: ${error.message}`
        );
      }
    };

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <main className="sequencer-page">
      <section className="hero-card">
        <div>
          <p className="eyebrow">
            MVP sketchpad
          </p>

          <h1>
            BeatForge Sketchbook
          </h1>

          <p>
            A simple rhythm prototype
            for building, saving, and
            sharing beat ideas.
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

      <section className="controls-card">
        <div className="controls">
          <button
            onClick={togglePlay}
          >
            {isPlaying
              ? "ΓÅ╣ Stop"
              : "Γû╢ Play"}
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
            type="button"
            onClick={handleNewProject}
          >
            New Project
          </button>

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
                    e.target.value
                  )
                )
              }
            />

            <strong>
              {bpm}
            </strong>
          </label>
        </div>
      </section>

      <section className="save-load-card">
        <div className="save-section">
          <input
            type="text"
            placeholder="Project name"
            value={projectName}
            onChange={(e) =>
              setProjectName(
                e.target.value
              )
            }
          />

          <button
            onClick={saveProject}
          >
            {projectId
              ? "≡ƒÆ╛ Update Project"
              : "≡ƒÆ╛ Save Project"}
          </button>

          {projectId && (
            <span className="project-id">
              ID: {projectId}
            </span>
          )}
        </div>

        <div className="load-section">
          <input
            type="text"
            placeholder="Project ID to load"
            value={loadId}
            onChange={(e) =>
              setLoadId(
                e.target.value
              )
            }
          />

          <button
            onClick={loadProject}
          >
            ≡ƒôé Load Project
          </button>
        </div>

        {saveStatus && (
          <p className="save-status">
            {saveStatus}
          </p>
        )}
      </section>

      <div className="tracks">
        {grid.map(
          (
            track,
            trackIndex
          ) => {
            const currentSoundId =
              trackSettings[
                trackIndex
              ]?.sound ||
              DEFAULT_TRACK_SETTINGS[
                trackIndex
              ]?.sound;

            const currentSound =
              getSoundById(
                normalizeSoundId(
                  currentSoundId
                )
              );

            const isSynth =
              currentSound?.type ===
              "synth";

            const reverbEnabled =
              trackSettings[
                trackIndex
              ]?.reverb?.enabled ||
              false;

            const isMuted =
              trackSettings[
                trackIndex
              ]?.muted || false;

            /*
             * Get all sounds for the dropdown.
             *
             * This is temporary UI behavior.
             *
             * Later this dropdown can become the
             * full Sound Browser using categories.
             */

            const librarySounds = [
              ...getSoundsByType(
                "sample"
              ),
              ...getSoundsByType(
                "synth"
              ),
            ];

            return (
              <div
                key={trackIndex}
                className={`track-row ${
                  isMuted
                    ? "track-muted"
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
                        onChange={(
                          e
                        ) =>
                          updateTrackSetting(
                            trackIndex,
                            "sound",
                            e.target
                              .value
                          )
                        }
                      >
                        {librarySounds.map(
                          (
                            sound
                          ) => (
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
                          )
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
                          trackIndex
                        )
                      }
                      aria-pressed={
                        isMuted
                      }
                    >
                      {isMuted
                        ? "≡ƒöç Unmute"
                        : "≡ƒöè Mute"}
                    </button>

                    <button
                      type="button"
                      className="customize-track-button"
                      onClick={() =>
                        customizeTrack(
                          trackIndex
                        )
                      }
                    >
                      Customize
                    </button>

                    {reverbEnabled && (
                      <span className="effect-badge">
                        Reverb
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

                          <input
                            type="text"
                            value={
                              trackSettings[
                                trackIndex
                              ]?.note ||
                              currentSound
                                ?.synth
                                ?.note ||
                              ""
                            }
                            onChange={(
                              e
                            ) =>
                              updateTrackSetting(
                                trackIndex,
                                "note",
                                e.target
                                  .value
                              )
                            }
                          />
                        </label>

                        <label>
                          <span>
                            Duration
                          </span>

                          <select
                            value={
                              trackSettings[
                                trackIndex
                              ]?.duration ||
                              currentSound
                                ?.synth
                                ?.duration ||
                              "8n"
                            }
                            onChange={(
                              e
                            ) =>
                              updateTrackSetting(
                                trackIndex,
                                "duration",
                                e.target
                                  .value
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
                      stepIndex
                    ) => (
                      <button
                        key={
                          stepIndex
                        }
                        onClick={() =>
                          toggleStep(
                            trackIndex,
                            stepIndex
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
                    )
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </main>
  );
}
