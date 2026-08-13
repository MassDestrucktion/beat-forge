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
  },
  {
    sound: "drums.snares.cr78",
  },
  {
    sound: "drums.hihats.cr78",
  },
  {
    sound: "synths.stabs.classic",
    note: "G2",
    durationSteps: 2,
  },
];

/**
 * -------------------------------------------------------
 * PREVIEW AUDIO
 * -------------------------------------------------------
 */

const PREVIEW_SAMPLES = new Tone.Players({
  kick:
    "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",

  snare:
    "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",

  hihat:
    "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
});

const previewStabSynth =
  new Tone.MembraneSynth();

const previewPadSynth =
  new Tone.PolySynth(Tone.Synth);

const previewGain =
  new Tone.Gain(1);

const previewFilter =
  new Tone.Filter({
    type: "lowpass",
    frequency: 20000,
    rolloff: -12,
  });

const previewDistortion =
  new Tone.Distortion(0);

const previewDelay =
  new Tone.FeedbackDelay({
    delayTime: "8n",
    feedback: 0.25,
    wet: 0,
  });

const previewReverb =
  new Tone.Reverb({
    decay: 1.5,
    wet: 0,
  });

/**
 * -------------------------------------------------------
 * EFFECT CHAIN
 *
 * Sound
 *   ↓
 * Gain
 *   ↓
 * Filter
 *   ↓
 * Distortion
 *   ↓
 * Delay
 *   ↓
 * Reverb
 *   ↓
 * Destination
 * -------------------------------------------------------
 */

previewGain.connect(previewFilter);
previewFilter.connect(previewDistortion);
previewDistortion.connect(previewDelay);
previewDelay.connect(previewReverb);
previewReverb.toDestination();

/**
 * -------------------------------------------------------
 * NORMALIZE EFFECT SETTINGS
 * -------------------------------------------------------
 */

function normalizeEffects(track) {
  const effects = track?.effects || {};

  return {
    reverb: {
      enabled:
        effects.reverb?.enabled ?? false,

      wet:
        effects.reverb?.wet ?? 0.35,

      decay:
        effects.reverb?.decay ?? 1.5,
    },

    delay: {
      enabled:
        effects.delay?.enabled ?? false,

      wet:
        effects.delay?.wet ?? 0.25,

      delayTime:
        effects.delay?.delayTime ?? "8n",

      feedback:
        effects.delay?.feedback ?? 0.25,
    },

    distortion: {
      enabled:
        effects.distortion?.enabled ?? false,

      amount:
        effects.distortion?.amount ?? 0.25,
    },

    filter: {
      enabled:
        effects.filter?.enabled ?? false,

      frequency:
        effects.filter?.frequency ?? 2000,

      type:
        effects.filter?.type ?? "lowpass",

      rolloff:
        effects.filter?.rolloff ?? -12,
    },
  };
}

/**
 * -------------------------------------------------------
 * APPLY EFFECT SETTINGS
 *
 * This is the single source of truth for the preview
 * effect chain.
 * -------------------------------------------------------
 */

function applyPreviewEffects(effects) {
  const {
    reverb,
    delay,
    distortion,
    filter,
  } = effects;

  /**
   * -----------------------------------------------------
   * REVERB
   * -----------------------------------------------------
   */

  previewReverb.wet.value =
    reverb.enabled
      ? reverb.wet
      : 0;

  try {
    previewReverb.decay =
      reverb.decay;
  } catch (error) {
    console.warn(
      "Could not update reverb decay:",
      error
    );
  }

  /**
   * -----------------------------------------------------
   * DELAY
   * -----------------------------------------------------
   */

  previewDelay.wet.value =
    delay.enabled
      ? delay.wet
      : 0;

  previewDelay.feedback.value =
    delay.enabled
      ? delay.feedback
      : 0;

  previewDelay.delayTime.value =
    delay.delayTime;

  /**
   * -----------------------------------------------------
   * DISTORTION
   * -----------------------------------------------------
   */

  previewDistortion.distortion =
    distortion.enabled
      ? distortion.amount
      : 0;

  /**
   * -----------------------------------------------------
   * FILTER
   * -----------------------------------------------------
   */

  if (filter.enabled) {
    previewFilter.type =
      filter.type;

    previewFilter.frequency.value =
      filter.frequency;
  } else {
    previewFilter.type =
      "lowpass";

    previewFilter.frequency.value =
      20000;
  }
}

/**
 * -------------------------------------------------------
 * COMPONENT
 * -------------------------------------------------------
 */

export default function CustomizeTrack() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [searchParams] =
    useSearchParams();

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
    ] || {
      sound: "drums.kicks.cr78",
    };

  const sound =
    getSoundById(
      currentTrack.sound
    );

  const [effects, setEffects] =
    useState(() =>
      normalizeEffects(
        currentTrack
      )
    );

  const [
    isPreviewing,
    setIsPreviewing,
  ] = useState(false);

  const [
    saveStatus,
    setSaveStatus,
  ] = useState("");

  const previewTimeoutRef =
    useRef(null);

  /**
   * -------------------------------------------------------
   * UPDATE PREVIEW EFFECTS
   * -------------------------------------------------------
   */

  useEffect(() => {
    try {
      applyPreviewEffects(
        effects
      );
    } catch (error) {
      console.error(
        "Could not update preview effects:",
        error
      );
    }
  }, [effects]);

  /**
   * -------------------------------------------------------
   * CLEANUP
   * -------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      try {
        PREVIEW_SAMPLES.stopAll();

        previewStabSynth.triggerRelease();

        previewPadSynth.releaseAll();
      } catch (error) {
        console.error(
          "Could not stop preview during cleanup:",
          error
        );
      }

      if (
        previewTimeoutRef.current
      ) {
        clearTimeout(
          previewTimeoutRef.current
        );

        previewTimeoutRef.current =
          null;
      }
    };
  }, []);

  /**
   * -------------------------------------------------------
   * EFFECT UPDATE
   * -------------------------------------------------------
   */

  const updateEffect = (
    effectName,
    key,
    value
  ) => {
    setEffects(
      (previous) => ({
        ...previous,

        [effectName]: {
          ...previous[
            effectName
          ],

          [key]: value,
        },
      })
    );
  };

  /**
   * -------------------------------------------------------
   * STOP PREVIEW
   * -------------------------------------------------------
   */

  const stopPreview = () => {
    try {
      PREVIEW_SAMPLES.stopAll();

      previewStabSynth.triggerRelease();

      previewPadSynth.releaseAll();
    } catch (error) {
      console.error(
        "Could not stop preview:",
        error
      );
    }

    if (
      previewTimeoutRef.current
    ) {
      clearTimeout(
        previewTimeoutRef.current
      );

      previewTimeoutRef.current =
        null;
    }

    setIsPreviewing(false);
  };

  /**
   * -------------------------------------------------------
   * PREVIEW
   * -------------------------------------------------------
   */

  const previewTrack =
    async () => {
      try {
        await Tone.start();

        if (
          Tone.getContext().state !==
          "running"
        ) {
          await Tone.getContext().resume();
        }

        stopPreview();

        applyPreviewEffects(
          effects
        );

        const soundId =
          currentTrack.sound;

        /**
         * ---------------------------------------------------
         * SAMPLE
         * ---------------------------------------------------
         */

        if (
          soundId ===
            "drums.kicks.cr78" ||
          soundId ===
            "drums.snares.cr78" ||
          soundId ===
            "drums.hihats.cr78"
        ) {
          let playerName =
            "kick";

          if (
            soundId ===
            "drums.snares.cr78"
          ) {
            playerName =
              "snare";
          }

          if (
            soundId ===
            "drums.hihats.cr78"
          ) {
            playerName =
              "hihat";
          }

          const player =
            PREVIEW_SAMPLES.player(
              playerName
            );

          if (!player.loaded) {
            await PREVIEW_SAMPLES.load();
          }

          PREVIEW_SAMPLES.disconnect();

          PREVIEW_SAMPLES.connect(
            previewGain
          );

          player.start();

          setIsPreviewing(true);

          previewTimeoutRef.current =
            setTimeout(() => {
              setIsPreviewing(false);

              previewTimeoutRef.current =
                null;
            }, 1500);

          return;
        }

        /**
         * ---------------------------------------------------
         * STAB
         * ---------------------------------------------------
         */

        if (
          soundId ===
          "synths.stabs.classic"
        ) {
          previewStabSynth.disconnect();

          previewStabSynth.connect(
            previewGain
          );

          const note =
            currentTrack.note ||
            "G2";

          const durationSteps =
            Number(
              currentTrack.durationSteps
            ) || 2;

          const duration =
            `${
              Math.max(
                1,
                durationSteps
              ) * 4
            }n`;

          previewStabSynth.triggerAttackRelease(
            note,
            duration
          );

          setIsPreviewing(true);

          previewTimeoutRef.current =
            setTimeout(() => {
              setIsPreviewing(false);

              previewTimeoutRef.current =
                null;
            }, 1500);

          return;
        }

        /**
         * ---------------------------------------------------
         * PAD / GENERIC SYNTH
         * ---------------------------------------------------
         */

        previewPadSynth.disconnect();

        previewPadSynth.connect(
          previewGain
        );

        const note =
          currentTrack.note ||
          sound?.synth?.note ||
          "C4";

        const durationSteps =
          Number(
            currentTrack.durationSteps
          ) || 4;

        const duration =
          `${
            Math.max(
              1,
              durationSteps
            ) * 4
          }n`;

        previewPadSynth.triggerAttackRelease(
          note,
          duration
        );

        setIsPreviewing(true);

        previewTimeoutRef.current =
          setTimeout(() => {
            setIsPreviewing(false);

            previewTimeoutRef.current =
              null;
          }, 1500);
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
   * SAVE
   * -------------------------------------------------------
   */

  const handleDone = () => {
    stopPreview();

    const updatedTrackSettings =
      originalTrackSettings.map(
        (
          track,
          index
        ) => {
          if (
            index !==
            trackIndex
          ) {
            return {
              ...track,
            };
          }

          return {
            ...track,

            effects: {
              ...effects,
            },
          };
        }
      );

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

  const handleCancel = () => {
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

  return (
    <main className="customize-track-page">
      <section className="customize-card">

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
              Shape the sound with
              effects and preview
              everything before
              saving.
            </p>
          </div>

          <div className="track-sound-badge">
            {sound?.name ||
              currentTrack.sound ||
              "Sound"}
          </div>
        </div>

        {/* -------------------------------------------------
            SOUND PREVIEW
        -------------------------------------------------- */}

        <section className="effect-section preview-section">
          <div className="effect-header">
            <div>
              <h2>
                Sound Preview
              </h2>

              <p>
                Hear the current
                sound with your
                effects applied.
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

        {/* -------------------------------------------------
            REVERB
        -------------------------------------------------- */}

        <section className="effect-section">
          <div className="effect-header">
            <div>
              <h2>
                Reverb
              </h2>

              <p>
                Add space and
                ambience.
              </p>
            </div>

            <label className="toggle">
              <input
                type="checkbox"
                checked={
                  effects.reverb
                    .enabled
                }
                onChange={(e) =>
                  updateEffect(
                    "reverb",
                    "enabled",
                    e.target.checked
                  )
                }
              />

              <span>
                {effects.reverb
                  .enabled
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
                    effects
                      .reverb
                      .wet * 100
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
                  effects.reverb
                    .wet
                }
                disabled={
                  !effects.reverb
                    .enabled
                }
                onChange={(e) =>
                  updateEffect(
                    "reverb",
                    "wet",
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
                  {effects.reverb
                    .decay.toFixed(
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
                  effects.reverb
                    .decay
                }
                disabled={
                  !effects.reverb
                    .enabled
                }
                onChange={(e) =>
                  updateEffect(
                    "reverb",
                    "decay",
                    Number(
                      e.target.value
                    )
                  )
                }
              />
            </label>
          </div>
        </section>

        {/* -------------------------------------------------
            DELAY
        -------------------------------------------------- */}

        <section className="effect-section">
          <div className="effect-header">
            <div>
              <h2>
                Delay
              </h2>

              <p>
                Create echoes and
                rhythmic repeats.
              </p>
            </div>

            <label className="toggle">
              <input
                type="checkbox"
                checked={
                  effects.delay
                    .enabled
                }
                onChange={(e) =>
                  updateEffect(
                    "delay",
                    "enabled",
                    e.target.checked
                  )
                }
              />

              <span>
                {effects.delay
                  .enabled
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
                    effects
                      .delay
                      .wet * 100
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
                  effects.delay
                    .wet
                }
                disabled={
                  !effects.delay
                    .enabled
                }
                onChange={(e) =>
                  updateEffect(
                    "delay",
                    "wet",
                    Number(
                      e.target.value
                    )
                  )
                }
              />
            </label>

            <label>
              <span>
                Feedback

                <strong>
                  {Math.round(
                    effects
                      .delay
                      .feedback * 100
                  )}
                  %
                </strong>
              </span>

              <input
                type="range"
                min="0"
                max="0.9"
                step="0.01"
                value={
                  effects.delay
                    .feedback
                }
                disabled={
                  !effects.delay
                    .enabled
                }
                onChange={(e) =>
                  updateEffect(
                    "delay",
                    "feedback",
                    Number(
                      e.target.value
                    )
                  )
                }
              />
            </label>

            <label>
              <span>
                Time
              </span>

              <select
                value={
                  effects.delay
                    .delayTime
                }
                disabled={
                  !effects.delay
                    .enabled
                }
                onChange={(e) =>
                  updateEffect(
                    "delay",
                    "delayTime",
                    e.target.value
                  )
                }
              >
                <option value="16n">
                  1/16
                </option>

                <option value="8n">
                  1/8
                </option>

                <option value="4n">
                  1/4
                </option>

                <option value="2n">
                  1/2
                </option>
              </select>
            </label>
          </div>
        </section>

        {/* -------------------------------------------------
            DISTORTION
        -------------------------------------------------- */}

        <section className="effect-section">
          <div className="effect-header">
            <div>
              <h2>
                Distortion
              </h2>

              <p>
                Add grit, drive,
                and character.
              </p>
            </div>

            <label className="toggle">
              <input
                type="checkbox"
                checked={
                  effects
                    .distortion
                    .enabled
                }
                onChange={(e) =>
                  updateEffect(
                    "distortion",
                    "enabled",
                    e.target.checked
                  )
                }
              />

              <span>
                {effects
                  .distortion
                  .enabled
                  ? "Enabled"
                  : "Disabled"}
              </span>
            </label>
          </div>

          <div className="effect-controls">
            <label>
              <span>
                Amount

                <strong>
                  {Math.round(
                    effects
                      .distortion
                      .amount * 100
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
                  effects
                    .distortion
                    .amount
                }
                disabled={
                  !effects
                    .distortion
                    .enabled
                }
                onChange={(e) =>
                  updateEffect(
                    "distortion",
                    "amount",
                    Number(
                      e.target.value
                    )
                  )
                }
              />
            </label>
          </div>
        </section>

        {/* -------------------------------------------------
            FILTER
        -------------------------------------------------- */}

        <section className="effect-section">
          <div className="effect-header">
            <div>
              <h2>
                Filter
              </h2>

              <p>
                Shape the tone by
                cutting high or low
                frequencies.
              </p>
            </div>

            <label className="toggle">
              <input
                type="checkbox"
                checked={
                  effects.filter
                    .enabled
                }
                onChange={(e) =>
                  updateEffect(
                    "filter",
                    "enabled",
                    e.target.checked
                  )
                }
              />

              <span>
                {effects.filter
                  .enabled
                  ? "Enabled"
                  : "Disabled"}
              </span>
            </label>
          </div>

          <div className="effect-controls">
            <label>
              <span>
                Type
              </span>

              <select
                value={
                  effects.filter
                    .type
                }
                disabled={
                  !effects.filter
                    .enabled
                }
                onChange={(e) =>
                  updateEffect(
                    "filter",
                    "type",
                    e.target.value
                  )
                }
              >
                <option value="lowpass">
                  Low Pass
                </option>

                <option value="highpass">
                  High Pass
                </option>

                <option value="bandpass">
                  Band Pass
                </option>
              </select>
            </label>

            <label>
              <span>
                Frequency

                <strong>
                  {Math.round(
                    effects.filter
                      .frequency
                  )}{" "}
                  Hz
                </strong>
              </span>

              <input
                type="range"
                min="100"
                max="10000"
                step="50"
                value={
                  effects.filter
                    .frequency
                }
                disabled={
                  !effects.filter
                    .enabled
                }
                onChange={(e) =>
                  updateEffect(
                    "filter",
                    "frequency",
                    Number(
                      e.target.value
                    )
                  )
                }
              />
            </label>
          </div>
        </section>

        {/* -------------------------------------------------
            STATUS
        -------------------------------------------------- */}

        {saveStatus && (
          <p className="save-status">
            {saveStatus}
          </p>
        )}

        {/* -------------------------------------------------
            ACTIONS
        -------------------------------------------------- */}

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