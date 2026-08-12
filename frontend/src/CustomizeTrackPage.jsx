// src/CustomizeTrackPage.jsx

import * as Tone from "tone";
import { useState, useEffect, useRef } from "react";

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  SOUND_LIBRARY,
  getSoundById,
  getSoundLabel,
  createSoundEngine,
} from "./audio/soundLibrary";

import "./App.css";


const TRACK_LABELS = [
  "Track 1",
  "Track 2",
  "Track 3",
  "Track 4",
];


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
 * NOTE OPTIONS
 * ---------------------------------------------------------
 *
 * Keep these as common musical notes.
 *
 * The selected note is passed directly into the
 * sound engine for synth sounds.
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
 * DURATION OPTIONS
 * ---------------------------------------------------------
 *
 * These are intentionally based around the 16-step
 * sequencer.
 *
 * 16n = one 16th-note step
 * 8n  = two 16th-note steps
 * 4n  = four 16th-note steps
 * 2n  = eight 16th-note steps
 */

const DURATION_OPTIONS = [
  {
    value: "16n",
    label: "16th note — 1 step",
  },

  {
    value: "8n",
    label: "8th note — 2 steps",
  },

  {
    value: "4n",
    label: "Quarter note — 4 steps",
  },

  {
    value: "2n",
    label: "Half note — 8 steps",
  },

  {
    value: "1n",
    label: "Whole note — 16 steps",
  },
];


/**
 * ---------------------------------------------------------
 * SOUND HELPERS
 * ---------------------------------------------------------
 */

function getAvailableSounds() {
  return Array.isArray(SOUND_LIBRARY)
    ? SOUND_LIBRARY
    : [];
}


function getSoundName(sound) {
  if (!sound) {
    return "Unknown sound";
  }

  try {
    return (
      getSoundLabel(sound.id) ||
      sound.name ||
      sound.id
    );
  } catch {
    return (
      sound.name ||
      sound.id ||
      "Unknown sound"
    );
  }
}


/**
 * ---------------------------------------------------------
 * CUSTOMIZE TRACK
 * ---------------------------------------------------------
 */

export default function CustomizeTrackPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchParams] =
    useSearchParams();


  /**
   * -------------------------------------------------------
   * INCOMING STATE
   * -------------------------------------------------------
   */

  const incomingState =
    location.state;


  const trackIndex =
    incomingState?.trackIndex ??
    Number(
      searchParams.get("track") || 0
    );


  const originalTrackSettings =
    Array.isArray(
      incomingState?.trackSettings
    )
      ? incomingState.trackSettings
      : DEFAULT_TRACK_SETTINGS;


  const originalGrid =
    Array.isArray(
      incomingState?.grid
    )
      ? incomingState.grid
      : null;


  const currentTrack =
    originalTrackSettings[
      trackIndex
    ] || DEFAULT_TRACK_SETTINGS[
      trackIndex
    ] || {
      sound:
        "drums.kicks.cr78",
      muted: false,
    };


  /**
   * Resolve the actual sound-library
   * definition.
   */

  const currentSound =
    getSoundById(
      currentTrack?.sound
    );


  const isSynth =
    currentSound?.type ===
    "synth";


  /**
   * -------------------------------------------------------
   * REVERB STATE
   * -------------------------------------------------------
   */

  const [
    reverbEnabled,
    setReverbEnabled,
  ] = useState(
    currentTrack?.reverb
      ?.enabled ?? false
  );


  const [
    reverbWet,
    setReverbWet,
  ] = useState(
    currentTrack?.reverb
      ?.wet ?? 0.35
  );


  const [
    reverbDecay,
    setReverbDecay,
  ] = useState(
    currentTrack?.reverb
      ?.decay ?? 1.5
  );


  /**
   * -------------------------------------------------------
   * NOTE / DURATION STATE
   * -------------------------------------------------------
   *
   * These are initialized from the current
   * track settings, then fall back to the
   * sound definition.
   */

  const [
    selectedNote,
    setSelectedNote,
  ] = useState(
    currentTrack?.note ??
      currentSound?.synth
        ?.note ??
      "C4"
  );


  const [
    selectedDuration,
    setSelectedDuration,
  ] = useState(
    currentTrack?.duration ??
      currentSound?.synth
        ?.duration ??
      "8n"
  );


  /**
   * -------------------------------------------------------
   * PREVIEW STATE
   * -------------------------------------------------------
   */

  const [
    isPreviewing,
    setIsPreviewing,
  ] = useState(false);


  const [
    saveStatus,
    setSaveStatus,
  ] = useState("");


  /**
   * -------------------------------------------------------
   * AUDIO REFS
   * -------------------------------------------------------
   *
   * Preview chain:
   *
   * sound engine
   *      ↓
   * preview gain
   *      ↓
   * preview reverb
   *      ↓
   * destination
   */

  const previewGainRef =
    useRef(null);


  const previewReverbRef =
    useRef(null);


  const previewEngineRef =
    useRef(null);


  const previewTimerRef =
    useRef(null);


  /**
   * -------------------------------------------------------
   * CREATE PREVIEW AUDIO CHAIN
   * -------------------------------------------------------
   */

  useEffect(() => {
    const gain =
      new Tone.Gain(1);


    const reverb =
      new Tone.Reverb({
        decay: 1.5,
        wet: 0,
      });


    gain.connect(reverb);

    reverb.toDestination();


    previewGainRef.current =
      gain;

    previewReverbRef.current =
      reverb;


    return () => {
      /**
       * Dispose preview sound engine.
       */

      if (
        previewEngineRef.current
      ) {
        try {
          previewEngineRef.current.dispose();
        } catch (error) {
          console.warn(
            "Could not dispose preview engine:",
            error
          );
        }

        previewEngineRef.current =
          null;
      }


      /**
       * Dispose routing.
       */

      try {
        gain.dispose();
      } catch {
        // Ignore cleanup errors.
      }


      try {
        reverb.dispose();
      } catch {
        // Ignore cleanup errors.
      }


      previewGainRef.current =
        null;

      previewReverbRef.current =
        null;
    };
  }, []);


  /**
   * -------------------------------------------------------
   * UPDATE PREVIEW REVERB
   * -------------------------------------------------------
   */

  useEffect(() => {
    const reverb =
      previewReverbRef.current;


    if (!reverb) {
      return;
    }


    reverb.wet.value =
      reverbEnabled
        ? reverbWet
        : 0;


    reverb.decay =
      reverbDecay;
  }, [
    reverbEnabled,
    reverbWet,
    reverbDecay,
  ]);


  /**
   * -------------------------------------------------------
   * CLEANUP PREVIEW
   * -------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);


  /**
   * -------------------------------------------------------
   * STOP PREVIEW
   * -------------------------------------------------------
   */

  const stopPreview = () => {
    /**
     * Cancel timeout.
     */

    if (previewTimerRef.current) {
      clearTimeout(
        previewTimerRef.current
      );

      previewTimerRef.current =
        null;
    }


    /**
     * Dispose current preview
     * engine.
     */

    if (
      previewEngineRef.current
    ) {
      try {
        previewEngineRef.current.dispose();
      } catch (error) {
        console.warn(
          "Could not dispose preview engine:",
          error
        );
      }

      previewEngineRef.current =
        null;
    }


    setIsPreviewing(false);
  };


  /**
   * -------------------------------------------------------
   * CREATE PREVIEW ENGINE
   * -------------------------------------------------------
   */

  const createPreviewEngine =
    () => {
      const gain =
        previewGainRef.current;


      if (!gain) {
        console.warn(
          "Preview audio chain is not ready."
        );

        return null;
      }


      const sound =
        getSoundById(
          currentTrack?.sound
        );


      if (!sound) {
        console.warn(
          `Sound not found: ${currentTrack?.sound}`
        );

        return null;
      }


      const engine =
        createSoundEngine(
          sound,
          gain
        );


      if (!engine) {
        console.warn(
          `Could not create preview engine for "${sound.id}".`
        );

        return null;
      }


      previewEngineRef.current =
        engine;


      return engine;
    };


  /**
   * -------------------------------------------------------
   * PREVIEW SOUND
   * -------------------------------------------------------
   */

  const previewTrack =
    async () => {
      try {
        /**
         * Start browser audio.
         */

        await Tone.start();


        if (
          Tone.getContext().state !==
          "running"
        ) {
          await Tone.getContext().resume();
        }


        /**
         * Stop previous preview.
         */

        stopPreview();


        /**
         * Refresh reverb settings.
         */

        const reverb =
          previewReverbRef.current;


        if (reverb) {
          reverb.wet.value =
            reverbEnabled
              ? reverbWet
              : 0;

          reverb.decay =
            reverbDecay;
        }


        /**
         * Resolve current sound.
         */

        const sound =
          getSoundById(
            currentTrack?.sound
          );


        if (!sound) {
          setSaveStatus(
            "This sound could not be found in the sound library."
          );

          return;
        }


        /**
         * Create engine using the
         * exact same factory used by
         * the sequencer.
         */

        const engine =
          createPreviewEngine();


        if (!engine) {
          setSaveStatus(
            "Unable to create preview sound."
          );

          return;
        }


        /**
         * Samples need to load.
         *
         * Synths return immediately.
         */

        if (
          typeof engine.load ===
          "function"
        ) {
          setSaveStatus(
            "Loading sound..."
          );

          await engine.load();

          setSaveStatus("");
        }


        /**
         * Make sure the audio context
         * did not get suspended while
         * loading.
         */

        if (
          Tone.getContext().state !==
          "running"
        ) {
          await Tone.getContext().resume();
        }


        /**
         * Play through the SAME sound
         * engine used by the sequencer.
         *
         * Note and duration are only
         * relevant for synth sounds.
         */

        if (sound.type === "synth") {
          engine.play(
            undefined,
            {
              note:
                selectedNote,

              duration:
                selectedDuration,
            }
          );
        } else {
          engine.play();
        }


        setIsPreviewing(true);


        /**
         * Determine how long the
         * preview button should stay
         * active.
         */

        let durationMs = 1000;


        if (sound.type === "synth") {
          try {
            durationMs =
              Tone.Time(
                selectedDuration
              ).toMilliseconds();
          } catch {
            durationMs = 1000;
          }
        }


        /**
         * Keep the preview state alive
         * slightly beyond the note.
         */

        previewTimerRef.current =
          setTimeout(
            () => {
              previewTimerRef.current =
                null;

              setIsPreviewing(false);

              /**
               * Dispose the engine after
               * the preview has finished.
               */

              if (
                previewEngineRef.current
              ) {
                try {
                  previewEngineRef.current.dispose();
                } catch {
                  // Ignore cleanup errors.
                }

                previewEngineRef.current =
                  null;
              }
            },
            Math.max(
              1000,
              durationMs + 300
            )
          );
      } catch (error) {
        console.error(
          "Preview failed:",
          error
        );


        setIsPreviewing(false);


        setSaveStatus(
          `Preview failed: ${error.message}`
        );
      }
    };


  /**
   * -------------------------------------------------------
   * PREVIEW BUTTON
   * -------------------------------------------------------
   */

  const handlePreview =
    async () => {
      if (isPreviewing) {
        stopPreview();
        return;
      }


      await previewTrack();
    };


  /**
   * -------------------------------------------------------
   * CHANGE NOTE
   * -------------------------------------------------------
   */

  const handleNoteChange =
    (event) => {
      setSelectedNote(
        event.target.value
      );
    };


  /**
   * -------------------------------------------------------
   * CHANGE DURATION
   * -------------------------------------------------------
   */

  const handleDurationChange =
    (event) => {
      setSelectedDuration(
        event.target.value
      );
    };


  /**
   * -------------------------------------------------------
   * SAVE CUSTOMIZATION
   * -------------------------------------------------------
   */

  const handleDone =
    () => {
      stopPreview();


      /**
       * Return all track settings,
       * changing only this track.
       */

      const updatedTrackSettings =
        originalTrackSettings.map(
          (track, index) => {
            if (
              index !== trackIndex
            ) {
              return {
                ...track,
              };
            }


            const updatedTrack = {
              ...track,

              reverb: {
                enabled:
                  reverbEnabled,

                wet:
                  reverbWet,

                decay:
                  reverbDecay,
              },
            };


            /**
             * Only synth tracks get
             * note/duration settings.
             */

            if (isSynth) {
              updatedTrack.note =
                selectedNote;

              updatedTrack.duration =
                selectedDuration;
            } else {
              /**
               * Remove stale synth
               * properties when switching
               * back to a sample.
               */

              delete updatedTrack.note;

              delete updatedTrack.duration;
            }


            return updatedTrack;
          }
        );


      /**
       * Return to sequencer.
       */

      navigate(
        "/sequencer",
        {
          state: {
            fromCustomize:
              true,

            grid:
              originalGrid,

            trackSettings:
              updatedTrackSettings,

            bpm:
              incomingState?.bpm ??
              120,

            projectName:
              incomingState?.projectName ??
              "",

            projectId:
              incomingState?.projectId ??
              null,

            trackIndex,
          },
        }
      );
    };


  /**
   * -------------------------------------------------------
   * CANCEL
   * -------------------------------------------------------
   */

  const handleCancel =
    () => {
      stopPreview();


      navigate(
        "/sequencer",
        {
          state: {
            fromCustomize:
              true,

            grid:
              originalGrid,

            trackSettings:
              originalTrackSettings,

            bpm:
              incomingState?.bpm ??
              120,

            projectName:
              incomingState?.projectName ??
              "",

            projectId:
              incomingState?.projectId ??
              null,
          },
        }
      );
    };


  /**
   * -------------------------------------------------------
   * DIRECT VISIT
   * -------------------------------------------------------
   */

  if (!incomingState) {
    return (
      <main className="customize-track-page">
        <section className="customize-card">
          <h1>
            No track selected
          </h1>

          <p>
            Open Customize from a
            track on the sequencer
            first.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/sequencer"
              )
            }
          >
            Back to Sequencer
          </button>
        </section>
      </main>
    );
  }


  /**
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (
    <main className="customize-track-page">
      <section className="customize-card">

        {/* =========================
            HEADER
        ========================== */}

        <div className="customize-header">
          <div>
            <p className="eyebrow">
              Track customization
            </p>

            <h1>
              {
                TRACK_LABELS[
                  trackIndex
                ] ||
                `Track ${
                  trackIndex + 1
                }`
              }
            </h1>

            <p>
              Customize the sound,
              note, duration, and
              effects of this track.
            </p>
          </div>

          <div className="track-sound-badge">
            {getSoundName(
              currentSound
            )}
          </div>
        </div>


        {/* =========================
            SOUND
        ========================== */}

        <section className="effect-section">
          <div className="effect-header">
            <div>
              <h2>
                Sound
              </h2>

              <p>
                Choose the sound used
                by this track.
              </p>
            </div>
          </div>

          <div className="effect-controls">
            <label>
              <span>
                Sound
              </span>

              <select
                value={
                  currentTrack?.sound ||
                  ""
                }
                onChange={(e) => {
                  /**
                   * Sound selection is
                   * ultimately handled by
                   * the SequencerPage.
                   *
                   * Customize Track keeps
                   * this page focused on
                   * customization, so changing
                   * sound returns it to the
                   * selected library sound
                   * for preview/state.
                   */

                  const newSound =
                    getSoundById(
                      e.target.value
                    );

                  if (!newSound) {
                    return;
                  }

                  /**
                   * We cannot mutate the
                   * incoming router state.
                   *
                   * Instead, navigate back
                   * through Done with a
                   * temporary local track
                   * representation.
                   */

                  const updatedTrack =
                    {
                      ...currentTrack,
                      sound:
                        newSound.id,
                    };


                  /**
                   * Synth defaults.
                   */

                  if (
                    newSound.type ===
                    "synth"
                  ) {
                    updatedTrack.note =
                      currentTrack.note ??
                      newSound.synth
                        ?.note ??
                      "C4";

                    updatedTrack.duration =
                      currentTrack.duration ??
                      newSound.synth
                        ?.duration ??
                      "8n";
                  } else {
                    delete updatedTrack.note;
                    delete updatedTrack.duration;
                  }


                  /**
                   * Replace the incoming
                   * state object locally by
                   * navigating to this same
                   * page with updated state.
                   *
                   * This makes the selected
                   * sound immediately affect
                   * preview and controls.
                   */

                  const updatedSettings =
                    originalTrackSettings.map(
                      (
                        track,
                        index
                      ) =>
                        index ===
                        trackIndex
                          ? updatedTrack
                          : {
                              ...track,
                            }
                    );


                  navigate(
                    `/customize-track?track=${trackIndex}`,
                    {
                      replace:
                        true,

                      state: {
                        ...incomingState,

                        trackSettings:
                          updatedSettings,

                        trackIndex,
                      },
                    }
                  );
                }}
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
                      {getSoundName(
                        sound
                      )}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>
        </section>


        {/* =========================
            SYNTH SETTINGS
        ========================== */}

        {isSynth && (
          <section className="effect-section">
            <div className="effect-header">
              <div>
                <h2>
                  Note & Duration
                </h2>

                <p>
                  These values are used
                  every time this synth
                  is triggered by the
                  sequencer.
                </p>
              </div>
            </div>

            <div className="effect-controls">

              {/* NOTE */}

              <label>
                <span>
                  Note
                </span>

                <select
                  value={
                    selectedNote
                  }
                  onChange={
                    handleNoteChange
                  }
                >
                  {NOTE_OPTIONS.map(
                    (note) => (
                      <option
                        key={note}
                        value={note}
                      >
                        {note}
                      </option>
                    )
                  )}
                </select>
              </label>


              {/* DURATION */}

              <label>
                <span>
                  Duration
                </span>

                <select
                  value={
                    selectedDuration
                  }
                  onChange={
                    handleDurationChange
                  }
                >
                  {DURATION_OPTIONS.map(
                    (duration) => (
                      <option
                        key={
                          duration.value
                        }
                        value={
                          duration.value
                        }
                      >
                        {
                          duration.label
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

            </div>
          </section>
        )}


        {/* =========================
            PREVIEW
        ========================== */}

        <section className="effect-section preview-section">
          <div className="effect-header">
            <div>
              <h2>
                Sound Preview
              </h2>

              <p>
                Hear the current sound
                with your note,
                duration, and effects.
              </p>
            </div>

            <button
              type="button"
              className={
                isPreviewing
                  ? "preview-button playing"
                  : "preview-button"
              }
              onClick={
                handlePreview
              }
            >
              {isPreviewing
                ? "⏹ Stop"
                : "▶ Preview"}
            </button>
          </div>
        </section>


        {/* =========================
            REVERB
        ========================== */}

        <section className="effect-section">
          <div className="effect-header">
            <div>
              <h2>
                Reverb
              </h2>

              <p>
                Add space and ambience
                to this track.
              </p>
            </div>

            <label className="toggle">
              <input
                type="checkbox"
                checked={
                  reverbEnabled
                }
                onChange={(e) =>
                  setReverbEnabled(
                    e.target.checked
                  )
                }
              />

              <span>
                {reverbEnabled
                  ? "Enabled"
                  : "Disabled"}
              </span>
            </label>
          </div>


          <div className="effect-controls">

            {/* WET */}

            <label>
              <span>
                Wet

                <strong>
                  {Math.round(
                    reverbWet * 100
                  )}
                  %
                </strong>
              </span>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={
                  reverbWet
                }
                disabled={
                  !reverbEnabled
                }
                onChange={(e) =>
                  setReverbWet(
                    Number(
                      e.target.value
                    )
                  )
                }
              />
            </label>


            {/* DECAY */}

            <label>
              <span>
                Decay

                <strong>
                  {reverbDecay.toFixed(
                    1
                  )}
                  s
                </strong>
              </span>

              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={
                  reverbDecay
                }
                disabled={
                  !reverbEnabled
                }
                onChange={(e) =>
                  setReverbDecay(
                    Number(
                      e.target.value
                    )
                  )
                }
              />
            </label>

          </div>
        </section>


        {/* =========================
            STATUS
        ========================== */}

        {saveStatus && (
          <p className="save-status">
            {saveStatus}
          </p>
        )}


        {/* =========================
            ACTIONS
        ========================== */}

        <div className="customize-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={
              handleCancel
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="done-button"
            onClick={
              handleDone
            }
          >
            Done
          </button>
        </div>

      </section>
    </main>
  );
}