// src/components/TrackRow.jsx

import Dial from "./Dial.jsx";

import {
  TRACK_LABELS,
  DEFAULT_TRACK_SOUNDS,
  NOTE_OPTIONS,
  DURATION_OPTIONS,
  getAvailableSounds,
} from "../sequencer/projectModel";

import { getSoundById } from "../audio/soundLibrary";

/**
 * A single sequencer track: sound select, mute/solo/clear controls,
 * effect badges, synth note/duration selects, the 16 step buttons,
 * the 7 effect dials, and the expanded controls panel.
 */
export default function TrackRow({
  trackIndex,
  track,
  trackSetting,
  expandedTrack,
  currentStep,
  isPlaying,

  onToggleStep,
  onToggleMute,
  onToggleSolo,
  onClearPattern,
  onUpdateSound,
  onUpdateSetting,
  onToggleExpand,
  onPreview,
  onAddToArrangement,
}) {
  const currentSoundId =
    trackSetting?.sound ||
    DEFAULT_TRACK_SOUNDS[trackIndex] ||
    DEFAULT_TRACK_SOUNDS[0];

  const currentSound = getSoundById(currentSoundId);

  const isSynth = currentSound?.type === "synth";

  const reverbEnabled = trackSetting?.reverb?.enabled || false;

  const delayEnabled = trackSetting?.delay?.enabled || false;

  const filterLowpass = trackSetting?.filter?.lowpass ?? 20000;

  const filterHighpass = trackSetting?.filter?.highpass ?? 20;

  const filterActive = filterLowpass < 15000 || filterHighpass > 40;

  const isMuted = trackSetting?.muted || false;

  const selectedNote = trackSetting?.note || currentSound?.synth?.note || "C4";

  const selectedDuration =
    trackSetting?.duration || currentSound?.synth?.duration || "8n";

  const isSoloed = trackSetting?.soloed || false;

  return (
    <div
      className={`track-row ${isMuted ? "track-muted" : ""} ${
        isSoloed ? "track-soloed" : ""
      }`}
    >
      <div className="track-main">
        <span className="track-label">{TRACK_LABELS[trackIndex]}</span>

        <div className="track-controls">
          <label>
            <span>Sound</span>

            <select
              value={currentSoundId}
              onChange={(e) => onUpdateSound(trackIndex, e.target.value)}
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
            onClick={() => onToggleMute(trackIndex)}
            aria-pressed={isMuted}
          >
            {isMuted ? "🔇 Unmute" : "🔊 Mute"}
          </button>

          <button
            type="button"
            className={`solo-track-button ${isSoloed ? "soloed" : ""}`}
            onClick={() => onToggleSolo(trackIndex)}
            aria-pressed={isSoloed}
          >
            {isSoloed ? "🔈 Unmute All" : "🎧 Solo"}
          </button>

          <button
            type="button"
            className="clear-track-button"
            onClick={() => onClearPattern(trackIndex)}
            title="Clear this track's pattern"
          >
            🧹 Clear
          </button>

          <button
            type="button"
            className="add-to-arrangement-button"
            onClick={() => onAddToArrangement(trackIndex)}
            title="Add this track as a new section in the arrangement"
          >
            ➕ To Arrangement
          </button>

          <button
            type="button"
            className={`expand-chevron ${
              expandedTrack === trackIndex ? "expanded" : ""
            }`}
            onClick={() => onToggleExpand(trackIndex)}
            aria-label="Toggle track controls"
          >
            {expandedTrack === trackIndex ? "▲" : "▼"}
          </button>

          {reverbEnabled && <span className="effect-badge">Reverb</span>}

          {delayEnabled && <span className="effect-badge">Delay</span>}

          {filterActive && <span className="effect-badge">Filter</span>}

          {isMuted && <span className="effect-badge muted-badge">Muted</span>}

          {isSynth && (
            <>
              <label>
                <span>Note</span>

                <select
                  value={selectedNote}
                  onChange={(e) =>
                    onUpdateSetting(trackIndex, "note", e.target.value)
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
                    onUpdateSetting(trackIndex, "duration", e.target.value)
                  }
                >
                  {DURATION_OPTIONS.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration}
                    </option>
                  ))}
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
            onClick={() => onToggleStep(trackIndex, stepIndex)}
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

      <div className="track-dials">
        <div className="dial-row">
          <Dial
            label="Delay Time"
            value={trackSetting?.delay?.time ?? 0.25}
            min={0.05}
            max={0.75}
            step={0.01}
            size={64}
            formatValue={(value) => `${Math.round(value * 1000)}ms`}
            onChange={(e) =>
              onUpdateSetting(trackIndex, "delay", {
                ...trackSetting?.delay,

                enabled: true,

                time: parseFloat(e.target.value),
              })
            }
          />

          <Dial
            label="Delay Feedback"
            value={trackSetting?.delay?.feedback ?? 0.3}
            min={0}
            max={0.8}
            step={0.01}
            size={64}
            formatValue={(value) => `${Math.round(value * 100)}%`}
            onChange={(e) =>
              onUpdateSetting(trackIndex, "delay", {
                ...trackSetting?.delay,

                enabled: true,

                feedback: parseFloat(e.target.value),
              })
            }
          />

          <Dial
            label="Delay Wet"
            value={trackSetting?.delay?.wet ?? 0.3}
            min={0}
            max={1}
            step={0.01}
            size={64}
            formatValue={(value) => `${Math.round(value * 100)}%`}
            onChange={(e) =>
              onUpdateSetting(trackIndex, "delay", {
                ...trackSetting?.delay,

                enabled: true,

                wet: parseFloat(e.target.value),
              })
            }
          />

          <Dial
            label="Low Pass"
            value={filterLowpass}
            min={100}
            max={20000}
            step={10}
            size={64}
            formatValue={(value) => `${Math.round(value)} Hz`}
            onChange={(e) => {
              const freq = parseFloat(e.target.value);

              onUpdateSetting(trackIndex, "filter", {
                ...trackSetting?.filter,

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
            size={64}
            formatValue={(value) => `${Math.round(value)} Hz`}
            onChange={(e) => {
              const freq = parseFloat(e.target.value);

              onUpdateSetting(trackIndex, "filter", {
                ...trackSetting?.filter,

                enabled: true,

                highpass: freq,
              });
            }}
          />

          <Dial
            label="Reverb Wet"
            value={trackSetting?.reverb?.wet ?? 0.35}
            min={0}
            max={1}
            step={0.01}
            size={64}
            formatValue={(value) => `${Math.round(value * 100)}%`}
            onChange={(e) =>
              onUpdateSetting(trackIndex, "reverb", {
                ...trackSetting?.reverb,

                enabled: true,

                wet: parseFloat(e.target.value),
              })
            }
          />

          <Dial
            label="Reverb Decay"
            value={trackSetting?.reverb?.decay ?? 1.5}
            min={0.1}
            max={10}
            step={0.1}
            size={64}
            formatValue={(value) => `${value.toFixed(1)}s`}
            onChange={(e) =>
              onUpdateSetting(trackIndex, "reverb", {
                ...trackSetting?.reverb,

                enabled: true,

                decay: parseFloat(e.target.value),
              })
            }
          />
        </div>
      </div>

      {expandedTrack === trackIndex && (
        <div className="track-controls-expanded">
          <div className="slider-control">
            <label>
              <span>Delay On</span>

              <input
                type="checkbox"
                checked={delayEnabled}
                onChange={(e) =>
                  onUpdateSetting(trackIndex, "delay", {
                    ...trackSetting?.delay,

                    enabled: e.target.checked,
                  })
                }
              />
            </label>
          </div>

          <div className="slider-control">
            <label>
              <span>Reverb On</span>

              <input
                type="checkbox"
                checked={reverbEnabled}
                onChange={(e) =>
                  onUpdateSetting(trackIndex, "reverb", {
                    ...trackSetting?.reverb,

                    enabled: e.target.checked,
                  })
                }
              />
            </label>
          </div>

          <button
            type="button"
            className="preview-btn-inline"
            onClick={() => onPreview(trackIndex)}
          >
            &#9654; Preview
          </button>
        </div>
      )}
    </div>
  );
}
