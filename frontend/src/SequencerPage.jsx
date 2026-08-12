import * as Tone from "tone";
import {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router";

import { useAuth } from "./AuthContext/AuthContext.jsx";

import {
  SOUND_LIBRARY,
  getSoundById,
  getSoundLabel,
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

/**
 * ---------------------------------------------------------
 * DEFAULT SOUNDS
 * ---------------------------------------------------------
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

/**
 * ---------------------------------------------------------
 * DEFAULT GRID
 * ---------------------------------------------------------
 */

function createDefaultTrackSettings() {
  return DEFAULT_TRACK_SETTINGS.map((track) => ({
    ...track,
  }));
}

function createEmptyGrid() {
  return Array(NUM_TRACKS)
    .fill(null)
    .map(() => Array(NUM_STEPS).fill(false));
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
  const {
    isAuthenticated,
    token,
  } = useAuth();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const navigate = useNavigate();
  const location = useLocation();

  /**
   * -------------------------------------------------------
   * REACT STATE
   * -------------------------------------------------------
   */

  const [grid, setGrid] = useState(
    createEmptyGrid
  );

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [currentStep, setCurrentStep] =
    useState(null);

  const [bpm, setBpm] = useState(120);

  const [
    trackSettings,
    setTrackSettings,
  ] = useState(
    createDefaultTrackSettings
  );

  const [projectName, setProjectName] =
    useState("");

  const [projectId, setProjectId] =
    useState(null);

  const [saveStatus, setSaveStatus] =
    useState("");

  const [loadId, setLoadId] =
    useState("");

  const [initialLoadDone, setInitialLoadDone] =
    useState(false);

  /**
   * Audio state.
   *
   * This is intentionally separate from isPlaying.
   * The browser can have Tone's audio context suspended
   * even though the React component is mounted.
   */

  const [audioReady, setAudioReady] =
    useState(false);

  /**
   * -------------------------------------------------------
   * REFS
   * -------------------------------------------------------
   */

  const gridRef = useRef(grid);

  const settingsRef =
    useRef(trackSettings);

  const stepCountRef =
    useRef(0);

  const audioReadyRef =
    useRef(false);

  /**
   * One audio routing chain per track:
   *
   * sound engine
   *     ↓
   * gain
   *     ↓
   * reverb
   *     ↓
   * destination
   */

  const trackGainsRef =
    useRef([]);

  const trackReverbsRef =
    useRef([]);

  const soundEnginesRef =
    useRef([]);

  /**
   * Prevent overlapping audio initialization.
   */

  const audioInitPromiseRef =
    useRef(null);

  /**
   * -------------------------------------------------------
   * SYNC REFS
   * -------------------------------------------------------
   */

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    settingsRef.current =
      trackSettings;
  }, [trackSettings]);

  /**
   * -------------------------------------------------------
   * AUDIO UNLOCK
   * -------------------------------------------------------
   *
   * Browsers require AudioContext.resume()/Tone.start()
   * from a user gesture.
   *
   * We explicitly do this before playback or preview.
   */

  const ensureAudioReady = async () => {
    if (
      audioReadyRef.current &&
      Tone.getContext().state === "running"
    ) {
      return true;
    }

    if (audioInitPromiseRef.current) {
      return audioInitPromiseRef.current;
    }

    audioInitPromiseRef.current =
      (async () => {
        try {
          /**
           * Tone.start() must happen from a user gesture.
           */

          await Tone.start();

          /**
           * Explicitly resume the underlying context too.
           */

          const context =
            Tone.getContext();

          if (
            context.state !== "running"
          ) {
            await context.resume();
          }

          /**
           * Wait for Tone's audio assets/buffers.
           *
           * This is especially important if the sound
           * library uses Tone.Player or loaded samples.
           */

          try {
            await Tone.loaded();
          } catch (loadError) {
            console.warn(
              "Tone.loaded() warning:",
              loadError
            );
          }

          /**
           * Make absolutely sure the context is running.
           */

          if (
            Tone.getContext().state !==
            "running"
          ) {
            const rawContext =
              Tone.getContext()
                .rawContext;

            if (
              rawContext?.state ===
              "suspended"
            ) {
              await rawContext.resume();
            }
          }

          const running =
            Tone.getContext().state ===
            "running";

          audioReadyRef.current =
            running;

          setAudioReady(running);

          if (!running) {
            console.error(
              "Tone audio context could not be started."
            );
          }

          return running;
        } catch (error) {
          console.error(
            "Failed to initialize audio:",
            error
          );

          audioReadyRef.current =
            false;

          setAudioReady(false);

          return false;
        } finally {
          audioInitPromiseRef.current =
            null;
        }
      })();

    return audioInitPromiseRef.current;
  };

  /**
   * -------------------------------------------------------
   * CREATE TRACK AUDIO ROUTING
   * -------------------------------------------------------
   */

  useEffect(() => {
    const gains = [];
    const reverbs = [];

    for (
      let trackIndex = 0;
      trackIndex < NUM_TRACKS;
      trackIndex++
    ) {
      const gain =
        new Tone.Gain(1);

      const reverb =
        new Tone.Reverb({
          decay: 1.5,
          wet: 0,
        });

      gain.connect(reverb);

      reverb.toDestination();

      gains.push(gain);
      reverbs.push(reverb);
    }

    trackGainsRef.current =
      gains;

    trackReverbsRef.current =
      reverbs;

    return () => {
      soundEnginesRef.current.forEach(
        (engine) => {
          try {
            engine?.dispose?.();
          } catch (error) {
            console.warn(
              "Error disposing sound engine:",
              error
            );
          }
        }
      );

      soundEnginesRef.current = [];

      gains.forEach((gain) => {
        try {
          gain.dispose();
        } catch (error) {
          console.warn(
            "Error disposing gain:",
            error
          );
        }
      });

      reverbs.forEach((reverb) => {
        try {
          reverb.dispose();
        } catch (error) {
          console.warn(
            "Error disposing reverb:",
            error
          );
        }
      });
    };
  }, []);

  /**
   * -------------------------------------------------------
   * UPDATE TRACK EFFECTS
   * -------------------------------------------------------
   */

  useEffect(() => {
    trackSettings.forEach(
      (settings, trackIndex) => {
        const gain =
          trackGainsRef.current[
            trackIndex
          ];

        const reverb =
          trackReverbsRef.current[
            trackIndex
          ];

        if (!gain || !reverb) {
          return;
        }

        /**
         * MUTE
         */

        gain.gain.value =
          settings?.muted
            ? 0
            : 1;

        /**
         * REVERB
         */

        const reverbEnabled =
          settings?.reverb
            ?.enabled ?? false;

        const wet =
          settings?.reverb
            ?.wet ?? 0.35;

        const decay =
          settings?.reverb
            ?.decay ?? 1.5;

        reverb.decay = decay;

        reverb.wet.value =
          reverbEnabled
            ? wet
            : 0;
      }
    );
  }, [trackSettings]);

  /**
   * -------------------------------------------------------
   * CREATE / RECREATE SOUND ENGINES
   * -------------------------------------------------------
   */

  useEffect(() => {
    const rebuildEngines = () => {
      const gains =
        trackGainsRef.current;

      if (
        gains.length !==
        NUM_TRACKS
      ) {
        return;
      }

      for (
        let trackIndex = 0;
        trackIndex < NUM_TRACKS;
        trackIndex++
      ) {
        const settings =
          trackSettings[
            trackIndex
          ];

        const sound =
          getSoundById(
            settings?.sound
          );

        /**
         * Dispose old engine.
         */

        const oldEngine =
          soundEnginesRef.current[
            trackIndex
          ];

        if (oldEngine) {
          try {
            oldEngine.dispose();
          } catch (error) {
            console.warn(
              "Error disposing old sound engine:",
              error
            );
          }
        }

        soundEnginesRef.current[
          trackIndex
        ] = null;

        /**
         * No sound selected.
         */

        if (!sound) {
          console.warn(
            `Sound not found: ${settings?.sound}`
          );

          continue;
        }

        /**
         * Create new engine.
         */

        try {
          const engine =
            createSoundEngine(
              sound,
              gains[trackIndex]
            );

          soundEnginesRef.current[
            trackIndex
          ] = engine;

          console.log(
            `Created sound engine for track ${
              trackIndex + 1
            }: ${sound.id}`
          );
        } catch (error) {
          console.error(
            `Failed to create sound engine for track ${
              trackIndex + 1
            }:`,
            error
          );
        }
      }
    };

    rebuildEngines();
  }, [trackSettings]);

  /**
   * -------------------------------------------------------
   * CUSTOMIZE TRACK
   * -------------------------------------------------------
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

  /**
   * -------------------------------------------------------
   * RETURN FROM CUSTOMIZE TRACK
   * -------------------------------------------------------
   */

  useEffect(() => {
    const returnedState =
      location.state;

    if (
      !returnedState?.fromCustomize
    ) {
      return;
    }

    if (
      Array.isArray(
        returnedState.grid
      )
    ) {
      setGrid(
        returnedState.grid
      );
    }

    if (
      Array.isArray(
        returnedState.trackSettings
      )
    ) {
      setTrackSettings(
        returnedState.trackSettings.map(
          (track) => ({
            ...track,
            muted:
              track?.muted ??
              false,
          })
        )
      );
    }

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

    if (
      returnedState.projectName !==
      undefined
    ) {
      setProjectName(
        returnedState.projectName
      );
    }

    if (
      returnedState.projectId !==
      undefined
    ) {
      setProjectId(
        returnedState.projectId
      );
    }

    setInitialLoadDone(true);

    navigate("/sequencer", {
      replace: true,
      state: null,
    });
  }, [
    location.state,
    navigate,
  ]);

  /**
   * -------------------------------------------------------
   * APPLY PROJECT
   * -------------------------------------------------------
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

    if (
      Array.isArray(project.grid) &&
      project.grid.length ===
        NUM_TRACKS
    ) {
      setGrid(project.grid);
    }

    if (
      Array.isArray(
        project.track_settings
      ) &&
      project.track_settings.length ===
        NUM_TRACKS
    ) {
      const normalized =
        project.track_settings.map(
          (track, index) => ({
            ...track,

            sound:
              getSoundById(
                track?.sound
              )
                ? track.sound
                : DEFAULT_TRACK_SETTINGS[
                    index
                  ]?.sound,

            muted:
              track?.muted ??
              false,
          })
        );

      setTrackSettings(
        normalized
      );
    }
  };

  /**
   * -------------------------------------------------------
   * LOAD PROJECT FROM URL
   * -------------------------------------------------------
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
                  Authorization: token
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

  /**
   * -------------------------------------------------------
   * PLAY TRACK SOUND
   * -------------------------------------------------------
   */

  const playTrackSound = (
    trackIndex,
    time,
    overrides = {}
  ) => {
    const settings =
      settingsRef.current[
        trackIndex
      ];

    if (!settings) {
      return;
    }

    if (settings.muted) {
      return;
    }

    const engine =
      soundEnginesRef.current[
        trackIndex
      ];

    if (!engine) {
      console.warn(
        `No sound engine for track ${
          trackIndex + 1
        }`
      );

      return;
    }

    try {
      /**
       * Important:
       *
       * The engine is responsible for routing
       * into the track gain. We don't bypass
       * that routing here.
       */

      engine.play(
        time,
        overrides
      );
    } catch (error) {
      console.error(
        "Failed to play track sound:",
        error
      );
    }
  };

  /**
   * -------------------------------------------------------
   * 16-STEP TRANSPORT LOOP
   * -------------------------------------------------------
   */

  useEffect(() => {
    const repeat = (
      time
    ) => {
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

  /**
   * -------------------------------------------------------
   * BPM
   * -------------------------------------------------------
   */

  const handleBpmChange = (
    newBpm
  ) => {
    setBpm(newBpm);

    Tone.Transport.bpm.value =
      newBpm;
  };

  /**
   * -------------------------------------------------------
   * TOGGLE STEP
   * -------------------------------------------------------
   */

  const toggleStep = async (
    trackIndex,
    stepIndex
  ) => {
    /**
     * Unlock audio BEFORE trying to preview.
     */

    const ready =
      await ensureAudioReady();

    if (!ready) {
      setSaveStatus(
        "Audio could not start. Check your browser audio permissions."
      );
    }

    const updatedGrid =
      gridRef.current.map(
        (track) => [
          ...track,
        ]
      );

    const isTurningOn =
      !updatedGrid[
        trackIndex
      ][stepIndex];

    updatedGrid[
      trackIndex
    ][stepIndex] =
      isTurningOn;

    setGrid(updatedGrid);

    /**
     * Preview immediately.
     */

    if (
      isTurningOn &&
      ready
    ) {
      playTrackSound(
        trackIndex
      );
    }
  };

  /**
   * -------------------------------------------------------
   * MUTE
   * -------------------------------------------------------
   */

  const toggleTrackMute = (
    trackIndex
  ) => {
    setTrackSettings(
      (previous) =>
        previous.map(
          (
            track,
            index
          ) => {
            if (
              index !==
              trackIndex
            ) {
              return track;
            }

            return {
              ...track,
              muted:
                !track?.muted,
            };
          }
        )
    );
  };

  /**
   * -------------------------------------------------------
   * CHANGE SOUND
   * -------------------------------------------------------
   */

  const updateTrackSound = (
    trackIndex,
    soundId
  ) => {
    const sound =
      getSoundById(soundId);

    if (!sound) {
      console.warn(
        `Sound not found: ${soundId}`
      );

      return;
    }

    setTrackSettings(
      (previous) =>
        previous.map(
          (
            track,
            index
          ) => {
            if (
              index !==
              trackIndex
            ) {
              return track;
            }

            return {
              ...track,

              sound:
                sound.id,

              note:
                sound.type ===
                "synth"
                  ? track.note ??
                    sound.synth
                      ?.note ??
                    "C4"
                  : undefined,

              duration:
                sound.type ===
                "synth"
                  ? track.duration ??
                    sound.synth
                      ?.duration ??
                    "8n"
                  : undefined,
            };
          }
        )
    );
  };

  /**
   * -------------------------------------------------------
   * PLAY / STOP
   * -------------------------------------------------------
   */

  const togglePlay = async () => {
    /**
     * This MUST happen from the button click.
     */

    const ready =
      await ensureAudioReady();

    if (!ready) {
      setSaveStatus(
        "Audio could not start. Check your browser audio permissions."
      );

      return;
    }

    if (isPlaying) {
      Tone.Transport.stop();

      Tone.Transport.position =
        0;

      stepCountRef.current = 0;

      setIsPlaying(false);
      setCurrentStep(null);

      return;
    }

    /**
     * Stop/reset before starting.
     */

    Tone.Transport.stop();

    Tone.Transport.position =
      0;

    stepCountRef.current = 0;

    Tone.Transport.bpm.value =
      bpm;

    /**
     * Start the Tone transport.
     */

    Tone.Transport.start();

    setIsPlaying(true);

    setSaveStatus("");
  };

  /**
   * -------------------------------------------------------
   * CLEAR GRID
   * -------------------------------------------------------
   */

  const clearGrid = () => {
    setGrid(
      createEmptyGrid()
    );
  };

  /**
   * -------------------------------------------------------
   * NEW PROJECT
   * -------------------------------------------------------
   */

  const handleNewProject = () => {
    Tone.Transport.stop();

    Tone.Transport.position =
      0;

    stepCountRef.current = 0;

    setIsPlaying(false);
    setCurrentStep(null);

    setProjectName("");
    setProjectId(null);

    setGrid(
      createEmptyGrid()
    );

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

  /**
   * -------------------------------------------------------
   * UPDATE TRACK SETTING
   * -------------------------------------------------------
   */

  const updateTrackSetting = (
    trackIndex,
    key,
    value
  ) => {
    setTrackSettings(
      (previous) =>
        previous.map(
          (
            track,
            index
          ) =>
            index ===
            trackIndex
              ? {
                  ...track,
                  [key]:
                    value,
                }
              : track
        )
    );
  };

  /**
   * -------------------------------------------------------
   * AUDIO BUFFER → WAV
   * -------------------------------------------------------
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
          channelData[
            channel
          ][i];
      }
    }

    const dataLength =
      interleaved.length * 2;

    const arrayBuffer =
      new ArrayBuffer(
        44 + dataLength
      );

    const view =
      new DataView(
        arrayBuffer
      );

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

    writeString(
      0,
      "RIFF"
    );

    view.setUint32(
      4,
      36 + dataLength,
      true
    );

    writeString(
      8,
      "WAVE"
    );

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

  /**
   * -------------------------------------------------------
   * DOWNLOAD WAV
   * -------------------------------------------------------
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

        const renderGrid =
          gridRef.current;

        const renderSettings =
          settingsRef.current;

        const buffer =
          await Tone.Offline(
            (context) => {
              context.transport.bpm.value =
                bpm;

              const offlineReverbs =
                [];

              const offlineGains =
                [];

              const offlineEngines =
                [];

              for (
                let trackIndex = 0;
                trackIndex <
                NUM_TRACKS;
                trackIndex++
              ) {
                const settings =
                  renderSettings[
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

                const gain =
                  new Tone.Gain(
                    settings?.muted
                      ? 0
                      : 1
                  );

                gain.connect(
                  reverb
                );

                offlineReverbs.push(
                  reverb
                );

                offlineGains.push(
                  gain
                );

                const sound =
                  getSoundById(
                    settings?.sound
                  );

                if (sound) {
                  const engine =
                    createSoundEngine(
                      sound,
                      gain
                    );

                  offlineEngines.push(
                    engine
                  );
                } else {
                  offlineEngines.push(
                    null
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
                  NUM_TRACKS;
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
                    }
                  );
                }
              }

              context.transport.start();
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

        document.body.removeChild(
          a
        );

        URL.revokeObjectURL(
          url
        );

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

  /**
   * -------------------------------------------------------
   * SAVE PROJECT
   * -------------------------------------------------------
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
        const url =
          isUpdate
            ? `/api/projects/${projectId}`
            : "/api/projects";

        const method =
          isUpdate
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

        setProjectId(
          project.id
        );

        setSearchParams({
          projectId:
            String(project.id),
        });

        setInitialLoadDone(
          true
        );

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

  /**
   * -------------------------------------------------------
   * MANUAL LOAD
   * -------------------------------------------------------
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
                Authorization: token
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

        setInitialLoadDone(
          true
        );

        setSearchParams({
          projectId:
            String(project.id),
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

          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.8rem",
              opacity: 0.7,
            }}
          >
            {audioReady
              ? "🔊 Audio Ready"
              : "🔇 Audio Not Started"}
          </span>
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
            onClick={
              saveProject
            }
          >
            {projectId
              ? "💾 Update Project"
              : "💾 Save Project"}
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
            onClick={
              loadProject
            }
          >
            📂 Load Project
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
                currentSoundId
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
              ]?.muted ||
              false;

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
                          updateTrackSound(
                            trackIndex,
                            e.target
                              .value
                          )
                        }
                      >
                        {getAvailableSounds().map(
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
                        ? "🔇 Unmute"
                        : "🔊 Mute"}
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
                              "C4"
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