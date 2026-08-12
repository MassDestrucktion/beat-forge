import * as Tone from "tone";
import { useState, useEffect } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";

const TRACK_LABELS = [
  "Track 1",
  "Track 2",
  "Track 3",
  "Track 4",
];

const DEFAULT_TRACK_SETTINGS = [
  { sound: "kick" },
  { sound: "snare" },
  { sound: "hihat" },
  {
    sound: "stab",
    note: "G2",
    duration: "8n",
  },
];

/*
 * Preview sample players.
 *
 * IMPORTANT:
 * These are NOT connected directly to the
 * destination here.
 *
 * We route them through the preview reverb
 * when the Preview button is pressed.
 */
const PREVIEW_SAMPLES = new Tone.Players({
  kick:
    "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",

  snare:
    "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",

  hihat:
    "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
});

/*
 * Preview synths.
 *
 * These also start disconnected so we can
 * dynamically route them through reverb.
 */
const previewStabSynth =
  new Tone.MembraneSynth();

const previewPadSynth =
  new Tone.PolySynth(Tone.Synth);

/*
 * Dedicated reverb for the Customize Track
 * preview.
 *
 * This is separate from the sequencer audio
 * so previewing a sound does not permanently
 * modify the sequencer's audio chain.
 */
const previewReverb =
  new Tone.Reverb({
    decay: 1.5,
    wet: 0.35,
  });

export default function CustomizeTrackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  /*
   * The SequencerPage sends the current
   * sequencer state through React Router.
   */
  const incomingState = location.state;

  /*
   * Determine which track is being customized.
   */
  const trackIndex =
    incomingState?.trackIndex ??
    Number(searchParams.get("track") || 0);

  /*
   * Use the settings passed from the sequencer.
   */
  const originalTrackSettings =
    Array.isArray(incomingState?.trackSettings)
      ? incomingState.trackSettings
      : DEFAULT_TRACK_SETTINGS;

  /*
   * Preserve the current beat grid.
   */
  const originalGrid =
    Array.isArray(incomingState?.grid)
      ? incomingState.grid
      : null;

  /*
   * Get this track's current settings.
   */
  const currentTrack =
    originalTrackSettings[trackIndex] || {
      sound: "kick",
    };

  /*
   * -------------------------
   * REVERB STATE
   * -------------------------
   */

  const [reverbEnabled, setReverbEnabled] =
    useState(
      currentTrack.reverb?.enabled || false
    );

  const [reverbWet, setReverbWet] =
    useState(
      currentTrack.reverb?.wet ?? 0.35
    );

  const [reverbDecay, setReverbDecay] =
    useState(
      currentTrack.reverb?.decay ?? 1.5
    );

  /*
   * -------------------------
   * PREVIEW STATE
   * -------------------------
   */

  const [isPreviewing, setIsPreviewing] =
    useState(false);

  const [saveStatus, setSaveStatus] =
    useState("");

  /*
   * -------------------------
   * UPDATE REVERB LIVE
   * -------------------------
   *
   * This is important.
   *
   * When the user moves the Wet or Decay
   * slider while previewing, the actual
   * Tone.Reverb is updated immediately.
   */

  useEffect(() => {
    previewReverb.wet.value =
      reverbEnabled ? reverbWet : 0;

    previewReverb.decay =
      reverbDecay;
  }, [
    reverbEnabled,
    reverbWet,
    reverbDecay,
  ]);

  /*
   * -------------------------
   * CLEANUP
   * -------------------------
   */

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  /*
   * -------------------------
   * ROUTE PREVIEW AUDIO
   * -------------------------
   *
   * This determines whether the preview
   * audio goes:
   *
   * sound -> speakers
   *
   * OR
   *
   * sound -> reverb -> speakers
   */

  const routePreviewAudio = () => {
    /*
     * First disconnect everything so we
     * don't accidentally create duplicate
     * audio connections.
     */
    PREVIEW_SAMPLES.disconnect();

    previewStabSynth.disconnect();

    previewPadSynth.disconnect();

    /*
     * Make sure the reverb has the current
     * settings.
     */
    previewReverb.wet.value =
      reverbEnabled ? reverbWet : 0;

    previewReverb.decay =
      reverbDecay;

    /*
     * If reverb is enabled, send all
     * preview instruments through it.
     */
    if (reverbEnabled) {
      PREVIEW_SAMPLES.connect(
        previewReverb
      );

      previewStabSynth.connect(
        previewReverb
      );

      previewPadSynth.connect(
        previewReverb
      );

      /*
       * Reverb itself goes to speakers.
       */
      previewReverb.toDestination();
    } else {
      /*
       * No reverb.
       *
       * Send instruments directly to
       * the speakers.
       */
      PREVIEW_SAMPLES.toDestination();

      previewStabSynth.toDestination();

      previewPadSynth.toDestination();
    }
  };

  /*
   * -------------------------
   * PREVIEW SOUND
   * -------------------------
   */

  const previewTrack = async () => {
    try {
      /*
       * Start Tone's audio context.
       */
      await Tone.start();

      if (
        Tone.getContext().state !==
        "running"
      ) {
        await Tone.getContext().resume();
      }

      /*
       * Stop anything currently previewing.
       */
      stopPreview();

      /*
       * Apply the current routing.
       *
       * This is what makes the preview
       * actually use the reverb settings.
       */
      routePreviewAudio();

      const sound =
        currentTrack.sound || "kick";

      /*
       * -------------------------
       * SAMPLE INSTRUMENTS
       * -------------------------
       */

      if (
        sound === "kick" ||
        sound === "snare" ||
        sound === "hihat"
      ) {
        const player =
          PREVIEW_SAMPLES.player(sound);

        /*
         * Wait for samples to load.
         */
        if (!player.loaded) {
          setSaveStatus(
            "Loading sound..."
          );

          await PREVIEW_SAMPLES.load();

          setSaveStatus("");
        }

        /*
         * Make sure the routing is still
         * correct after loading.
         */
        routePreviewAudio();

        /*
         * Play sample.
         */
        player.start();

        setIsPreviewing(true);

        /*
         * Automatically reset the button.
         */
        setTimeout(() => {
          setIsPreviewing(false);
        }, 1200);

        return;
      }

      /*
       * -------------------------
       * STAB SYNTH
       * -------------------------
       */

      if (sound === "stab") {
        const note =
          currentTrack.note || "G2";

        const duration =
          currentTrack.duration || "8n";

        previewStabSynth.triggerAttackRelease(
          note,
          duration
        );

        setIsPreviewing(true);

        const durationMs =
          Tone.Time(
            duration
          ).toMilliseconds();

        setTimeout(() => {
          setIsPreviewing(false);
        }, durationMs + 500);

        return;
      }

      /*
       * -------------------------
       * PAD SYNTH
       * -------------------------
       */

      if (sound === "pad") {
        const note =
          currentTrack.note || "C4";

        const duration =
          currentTrack.duration || "4n";

        previewPadSynth.triggerAttackRelease(
          note,
          duration
        );

        setIsPreviewing(true);

        const durationMs =
          Tone.Time(
            duration
          ).toMilliseconds();

        setTimeout(() => {
          setIsPreviewing(false);
        }, durationMs + 500);

        return;
      }
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

  /*
   * -------------------------
   * STOP PREVIEW
   * -------------------------
   */

  const stopPreview = () => {
    try {
      /*
       * Stop sample playback.
       */
      PREVIEW_SAMPLES.stopAll();

      /*
       * Stop synths.
       */
      previewStabSynth.triggerRelease();

      previewPadSynth.releaseAll();
    } catch (error) {
      console.error(
        "Could not stop preview:",
        error
      );
    }

    setIsPreviewing(false);
  };

  /*
   * -------------------------
   * PREVIEW BUTTON
   * -------------------------
   */

  const handlePreview = async () => {
    if (isPreviewing) {
      stopPreview();
      return;
    }

    await previewTrack();
  };

  /*
   * -------------------------
   * SAVE CUSTOMIZATION
   * -------------------------
   */

  const handleDone = () => {
    /*
     * Stop preview before returning.
     */
    stopPreview();

    /*
     * Copy every track's settings.
     */
    const updatedTrackSettings =
      originalTrackSettings.map(
        (track, index) => {
          if (index !== trackIndex) {
            return {
              ...track,
            };
          }

          /*
           * Only modify the track being
           * customized.
           */
          return {
            ...track,

            reverb: {
              enabled: reverbEnabled,
              wet: reverbWet,
              decay: reverbDecay,
            },
          };
        }
      );

    /*
     * Return to the sequencer with the
     * complete current state.
     */
    navigate("/sequencer", {
      state: {
        fromCustomize: true,

        /*
         * Preserve the existing beat pattern.
         */
        grid: originalGrid,

        /*
         * Return modified track settings.
         */
        trackSettings:
          updatedTrackSettings,

        /*
         * Preserve project information.
         */
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
    });
  };

  /*
   * -------------------------
   * CANCEL
   * -------------------------
   */

  const handleCancel = () => {
    stopPreview();

    navigate("/sequencer", {
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
    });
  };

  /*
   * -------------------------
   * DIRECT VISIT
   * -------------------------
   */

  if (!incomingState) {
    return (
      <main className="customize-track-page">
        <section className="customize-card">
          <h1>No track selected</h1>

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
              {TRACK_LABELS[
                trackIndex
              ] ||
                `Track ${
                  trackIndex + 1
                }`}
            </h1>

            <p>
              Customize the effects and
              sound of this track.
            </p>
          </div>

          <div className="track-sound-badge">
            {currentTrack.sound ||
              "kick"}
          </div>
        </div>

        {/* =========================
            PREVIEW
        ========================== */}

        <section className="effect-section preview-section">
          <div className="effect-header">
            <div>
              <h2>Sound Preview</h2>

              <p>
                Hear the current track
                with your effects applied.
              </p>
            </div>

            <button
              type="button"
              className={
                isPreviewing
                  ? "preview-button playing"
                  : "preview-button"
              }
              onClick={handlePreview}
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
              <h2>Reverb</h2>

              <p>
                Add space and ambience
                to this track.
              </p>
            </div>

            <label className="toggle">
              <input
                type="checkbox"
                checked={reverbEnabled}
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
                value={reverbWet}
                disabled={!reverbEnabled}
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
                value={reverbDecay}
                disabled={!reverbEnabled}
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

        {/* =========================
            ACTIONS
        ========================== */}

        <div className="customize-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="done-button"
            onClick={handleDone}
          >
            Done
          </button>
        </div>
      </section>
    </main>
  );
}