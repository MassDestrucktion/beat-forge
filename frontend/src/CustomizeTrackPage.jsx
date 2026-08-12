import * as Tone from "tone";
import {
  useState,
  useEffect,
  useRef,
} from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  getSoundById,
  createSoundEngine,
  getSoundLabel,
} from "./audio/soundLibrary";

import "./CustomizeTrack.css";

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

export default function CustomizeTrackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  /**
   * ---------------------------------------------------------
   * INCOMING SEQUENCER STATE
   * ---------------------------------------------------------
   */

  const incomingState = location.state;

  const trackIndex =
    incomingState?.trackIndex ??
    Number(searchParams.get("track") || 0);

  const originalTrackSettings =
    Array.isArray(
      incomingState?.trackSettings
    )
      ? incomingState.trackSettings
      : DEFAULT_TRACK_SETTINGS;

  const originalGrid =
    Array.isArray(incomingState?.grid)
      ? incomingState.grid
      : null;

  const currentTrack =
    originalTrackSettings[trackIndex] ||
    DEFAULT_TRACK_SETTINGS[trackIndex] ||
    DEFAULT_TRACK_SETTINGS[0];

  /**
   * ---------------------------------------------------------
   * REVERB STATE
   * ---------------------------------------------------------
   */

  const [reverbEnabled, setReverbEnabled] =
    useState(
      currentTrack?.reverb?.enabled ??
        false
    );

  const [reverbWet, setReverbWet] =
    useState(
      currentTrack?.reverb?.wet ??
        0.35
    );

  const [reverbDecay, setReverbDecay] =
    useState(
      currentTrack?.reverb?.decay ??
        1.5
    );

  /**
   * ---------------------------------------------------------
   * PREVIEW STATE
   * ---------------------------------------------------------
   */

  const [isPreviewing, setIsPreviewing] =
    useState(false);

  const [saveStatus, setSaveStatus] =
    useState("");

  /**
   * ---------------------------------------------------------
   * PREVIEW AUDIO REFS
   * ---------------------------------------------------------
   *
   * We use the exact same sound engine
   * as the sequencer.
   */

  const previewGainRef =
    useRef(null);

  const previewReverbRef =
    useRef(null);

  const previewEngineRef =
    useRef(null);

  /**
   * ---------------------------------------------------------
   * CREATE PREVIEW AUDIO CHAIN
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const gain =
      new Tone.Gain(1);

    const reverb =
      new Tone.Reverb({
        decay: reverbDecay,
        wet: reverbEnabled
          ? reverbWet
          : 0,
      });

    gain.connect(reverb);
    reverb.toDestination();

    previewGainRef.current = gain;
    previewReverbRef.current = reverb;

    return () => {
      try {
        previewEngineRef.current?.dispose?.();
        previewEngineRef.current = null;

        gain.dispose();
        reverb.dispose();
      } catch (error) {
        console.error(
          "Preview cleanup failed:",
          error
        );
      }
    };
  }, []);

  /**
   * ---------------------------------------------------------
   * UPDATE PREVIEW EFFECTS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const reverb =
      previewReverbRef.current;

    if (!reverb) {
      return;
    }

    reverb.decay =
      reverbDecay;

    reverb.wet.value =
      reverbEnabled
        ? reverbWet
        : 0;
  }, [
    reverbEnabled,
    reverbWet,
    reverbDecay,
  ]);

  /**
   * ---------------------------------------------------------
   * REBUILD PREVIEW ENGINE
   * ---------------------------------------------------------
   *
   * Whenever the selected sound changes,
   * create the exact same engine the
   * sequencer uses.
   */

  useEffect(() => {
    const gain =
      previewGainRef.current;

    if (!gain) {
      return;
    }

    try {
      previewEngineRef.current?.dispose?.();
      previewEngineRef.current = null;

      const sound =
        getSoundById(
          currentTrack?.sound
        );

      if (!sound) {
        console.warn(
          "Preview sound not found:",
          currentTrack?.sound
        );

        return;
      }

      const engine =
        createSoundEngine(
          sound,
          gain
        );

      previewEngineRef.current =
        engine;
    } catch (error) {
      console.error(
        "Could not create preview engine:",
        error
      );
    }

    return () => {
      previewEngineRef.current?.dispose?.();
      previewEngineRef.current = null;
    };
  }, [currentTrack?.sound]);

  /**
   * ---------------------------------------------------------
   * PREVIEW
   * ---------------------------------------------------------
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

        const engine =
          previewEngineRef.current;

        if (!engine) {
          setSaveStatus(
            "No preview sound is available."
          );

          return;
        }

        /**
         * Stop previous preview.
         */
        stopPreview();

        /**
         * Rebuild because stopPreview
         * may have disposed the engine.
         */
        const gain =
          previewGainRef.current;

        if (!gain) {
          throw new Error(
            "Preview audio chain is unavailable."
          );
        }

        const sound =
          getSoundById(
            currentTrack?.sound
          );

        if (!sound) {
          throw new Error(
            `Sound not found: ${currentTrack?.sound}`
          );
        }

        const newEngine =
          createSoundEngine(
            sound,
            gain
          );

        previewEngineRef.current =
          newEngine;

        if (!newEngine) {
          throw new Error(
            "Unable to create preview sound."
          );
        }

        /**
         * Wait for samples when necessary.
         */
        if (
          typeof newEngine.load ===
          "function"
        ) {
          await newEngine.load();
        }

        /**
         * Re-apply current reverb values.
         */
        const reverb =
          previewReverbRef.current;

        if (reverb) {
          reverb.decay =
            reverbDecay;

          reverb.wet.value =
            reverbEnabled
              ? reverbWet
              : 0;
        }

        /**
         * Build synth/sample overrides.
         *
         * Samples simply ignore these.
         * Synth engines use them.
         */
        const overrides = {};

        if (
          currentTrack?.note
        ) {
          overrides.note =
            currentTrack.note;
        }

        if (
          currentTrack?.duration
        ) {
          overrides.duration =
            currentTrack.duration;
        }

        /**
         * Play immediately.
         */
        newEngine.play(
          undefined,
          overrides
        );

        setIsPreviewing(true);
        setSaveStatus("");

        /**
         * Reset preview button.
         */
        let timeoutMs = 1200;

        if (
          sound.type === "synth" &&
          currentTrack?.duration
        ) {
          try {
            timeoutMs =
              Tone.Time(
                currentTrack.duration
              ).toMilliseconds() +
              500;
          } catch {
            timeoutMs = 1200;
          }
        }

        window.setTimeout(() => {
          setIsPreviewing(false);
        }, timeoutMs);
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
   * ---------------------------------------------------------
   * STOP PREVIEW
   * ---------------------------------------------------------
   */

  const stopPreview = () => {
    try {
      const engine =
        previewEngineRef.current;

      if (
        engine?.node &&
        typeof engine.node.stop ===
          "function"
      ) {
        try {
          engine.node.stop();
        } catch {
          // Some Tone nodes may already be stopped.
        }
      }

      if (
        engine?.node &&
        typeof engine.node.releaseAll ===
          "function"
      ) {
        try {
          engine.node.releaseAll();
        } catch {
          // Ignore release errors.
        }
      }
    } catch (error) {
      console.error(
        "Could not stop preview:",
        error
      );
    }

    setIsPreviewing(false);
  };

  /**
   * ---------------------------------------------------------
   * PREVIEW BUTTON
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * CLEANUP
   * ---------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      try {
        previewEngineRef.current?.dispose?.();
        previewEngineRef.current = null;

        previewGainRef.current?.dispose?.();
        previewGainRef.current = null;

        previewReverbRef.current?.dispose?.();
        previewReverbRef.current = null;
      } catch (error) {
        console.error(
          "Preview cleanup failed:",
          error
        );
      }
    };
  }, []);

  /**
   * ---------------------------------------------------------
   * SAVE CUSTOMIZATION
   * ---------------------------------------------------------
   */

  const handleDone = () => {
    stopPreview();

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

          return {
            ...track,

            reverb: {
              enabled:
                reverbEnabled,
              wet: reverbWet,
              decay: reverbDecay,
            },
          };
        }
      );

    navigate(
      "/sequencer",
      {
        state: {
          fromCustomize: true,

          grid: originalGrid,

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
   * ---------------------------------------------------------
   * CANCEL
   * ---------------------------------------------------------
   */

  const handleCancel = () => {
    stopPreview();

    navigate(
      "/sequencer",
      {
        state: {
          fromCustomize: true,

          grid: originalGrid,

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
   * ---------------------------------------------------------
   * DIRECT VISIT
   * ---------------------------------------------------------
   */

  if (!incomingState) {
    return (
      <main className="customize-track-page">
        <section className="customize-card">
          <h1>
            No track selected
          </h1>

          <p>
            Open Customize from a track
            on the sequencer first.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/sequencer")
            }
          >
            Back to Sequencer
          </button>
        </section>
      </main>
    );
  }

  /**
   * ---------------------------------------------------------
   * CURRENT SOUND
   * ---------------------------------------------------------
   */

  const currentSound =
    getSoundById(
      currentTrack?.sound
    );

  const soundLabel =
    currentSound
      ? getSoundLabel(
          currentSound.id
        )
      : currentTrack?.sound ||
        "Unknown sound";

  const isSynth =
    currentSound?.type ===
    "synth";

  /**
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <main className="customize-track-page">
      <section className="customize-card">

        {/* HEADER */}

        <div className="customize-header">
          <div>
            <p className="eyebrow">
              Track customization
            </p>

            <h1>
              {TRACK_LABELS[
                trackIndex
              ] ||
                `Track ${
                  trackIndex + 1
                }`}
            </h1>

            <p>
              Customize the effects and
              preview the sound used by
              this track.
            </p>
          </div>

          <div className="track-sound-badge">
            {soundLabel}
          </div>
        </div>

        {/* PREVIEW */}

        <section className="effect-section preview-section">
          <div className="effect-header">
            <div>
              <h2>
                Sound Preview
              </h2>

              <p>
                Hear the actual sound
                currently assigned to
                this track.
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

        {/* NOTE / DURATION */}

        {isSynth && (
          <section className="effect-section">
            <div className="effect-header">
              <div>
                <h2>
                  Synth Settings
                </h2>

                <p>
                  These settings are
                  used by the sequencer
                  and preview.
                </p>
              </div>
            </div>

            <div className="effect-controls">
              <label>
                <span>
                  Note
                </span>

                <input
                  type="text"
                  value={
                    currentTrack.note ||
                    currentSound?.synth
                      ?.note ||
                    "C4"
                  }
                  readOnly
                />
              </label>

              <label>
                <span>
                  Duration
                </span>

                <input
                  type="text"
                  value={
                    currentTrack.duration ||
                    currentSound?.synth
                      ?.duration ||
                    "8n"
                  }
                  readOnly
                />
              </label>
            </div>
          </section>
        )}

        {/* REVERB */}

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

        {saveStatus && (
          <p className="save-status">
            {saveStatus}
          </p>
        )}

        {/* ACTIONS */}

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