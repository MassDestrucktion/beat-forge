// src/components/TrackRow.jsx

import { useState, useRef } from "react";

import Dial from "./Dial.jsx";
import SoundPicker from "./SoundPicker.jsx";

import {
  TRACK_LABELS,
  DEFAULT_TRACK_SOUNDS,
  NOTE_OPTIONS,
  DURATION_OPTIONS,
  CHORD_TYPES,
  buildChord,
} from "../sequencer/projectModel";

import { KEYBOARD_LEGEND } from "../sequencer/useKeyboardInput";

import { getSoundById } from "../audio/soundLibrary";

/**
 * A single sequencer track card:
 *
 *   [ side panel ]  [ steps + compact control row ]  [ volume rail ]
 *
 * The side panel holds the (renameable) track name and mute/solo.
 * The 7 effect dials, effect toggles, and preview live behind the
 * FX toggle to keep the default view clean.
 */
export default function TrackRow({
  trackIndex,
  track,
  stepNotes,
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
  onRenameTrack,
  onPreviewSound,
  onRandomPattern,
  onRandomArp,
  isKeyboardSelected,
  onSelectTrack,
  onToggleKeys,
  keyboardOctave,
  keysEnabled,
  onNudgePattern,
  onSetStepsRange,
  onSetStepNote,
}) {
  const [isRenaming, setIsRenaming] = useState(false);

  const [nameDraft, setNameDraft] = useState("");

  const [showLegend, setShowLegend] = useState(false);

  // Per-step note editor panel
  const [noteEditingStep, setNoteEditingStep] = useState(null);
  const [chordRoot, setChordRoot] = useState("C4");
  const [chordType, setChordType] = useState("major");

  // Drag-to-highlight state
  const dragRef = useRef(null);

  const trackName = trackSetting?.name || TRACK_LABELS[trackIndex];

  const startRename = () => {
    setNameDraft(trackName);
    setIsRenaming(true);
  };

  const commitRename = () => {
    const trimmed = nameDraft.trim();

    if (trimmed && trimmed !== trackName) {
      onRenameTrack(trackIndex, trimmed);
    }

    setIsRenaming(false);
  };

  const currentSoundId =
    trackSetting?.sound ||
    DEFAULT_TRACK_SOUNDS[trackIndex] ||
    DEFAULT_TRACK_SOUNDS[0];

  const currentSound = getSoundById(currentSoundId);

  const isSynth = currentSound?.type === "synth";
  const isPoly = isSynth && currentSound?.synth?.engine === "poly";

  const reverbEnabled = trackSetting?.reverb?.enabled || false;

  const delayEnabled = trackSetting?.delay?.enabled || false;

  const filterLowpass = trackSetting?.filter?.lowpass ?? 20000;

  const filterHighpass = trackSetting?.filter?.highpass ?? 20;

  const filterActive = filterLowpass < 15000 || filterHighpass > 40;

  const anyFxActive = reverbEnabled || delayEnabled || filterActive;

  const isMuted = trackSetting?.muted || false;

  const selectedNote = trackSetting?.note || currentSound?.synth?.note || "C4";

  const selectedDuration =
    trackSetting?.duration || currentSound?.synth?.duration || "8n";

  const isSoloed = trackSetting?.soloed || false;

  const isExpanded = expandedTrack === trackIndex;

  const volume = trackSetting?.volume ?? 1;

  return (
    <div
      className={`track-row ${isMuted ? "track-muted" : ""} ${
        isSoloed ? "track-soloed" : ""
      } ${isKeyboardSelected ? "keyboard-selected" : ""}`}
    >
      <div className="track-row-main">
        {/* LEFT SIDE PANEL: name + mute/solo */}
        <div
          className="track-side-panel"
          onClick={() => onSelectTrack?.(trackIndex)}
          title="Click to select for keyboard input"
        >
          {isRenaming ? (
            <input
              className="track-label-input"
              value={nameDraft}
              autoFocus
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setIsRenaming(false);
              }}
            />
          ) : (
            <span
              className="track-label"
              title={`${trackName} (double-click to rename)`}
              onDoubleClick={startRename}
            >
              {trackName}
            </span>
          )}

          <div className="track-status" aria-live="polite">
            {isSynth && isKeyboardSelected && keysEnabled && (
              <span
                className="octave-badge"
                title="Current octave (Z/X to change)"
              >
                Oct {keyboardOctave}
              </span>
            )}
          </div>
          <div className="side-panel-buttons">
            <button
              type="button"
              className={`icon-btn ${isMuted ? "active-danger" : ""}`}
              onClick={() => onToggleMute(trackIndex)}
              aria-pressed={isMuted}
              title={isMuted ? "Unmute track" : "Mute track"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>

            <button
              type="button"
              className={`icon-btn ${isSoloed ? "active-warn" : ""}`}
              onClick={() => onToggleSolo(trackIndex)}
              aria-pressed={isSoloed}
              title={isSoloed ? "Unsolo track" : "Solo track"}
            >
              🎧
            </button>

            {isSynth && (
              <>
                <button
                  type="button"
                  className={`icon-btn ${isKeyboardSelected ? "active-keys" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleKeys?.(trackIndex);
                  }}
                  title={
                    isKeyboardSelected
                      ? "Disable keyboard for this track"
                      : "Enable keyboard for this track"
                  }
                >
                  🎹
                </button>
              </>
            )}

            <button
              type="button"
              className="icon-btn legend-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowLegend(!showLegend);
              }}
              title="Keyboard shortcuts"
            >
              ?
            </button>
          </div>

          {showLegend && (
            <div
              className="keyboard-legend-overlay"
              onClick={() => setShowLegend(false)}
            >
              <div
                className="keyboard-legend-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="legend-close-btn"
                  onClick={() => setShowLegend(false)}
                  title="Close"
                >
                  ✕
                </button>
                <h3>Keyboard Shortcuts</h3>
                <div className="legend-section">
                  <strong>White Keys</strong>
                  <div className="legend-keys">
                    {KEYBOARD_LEGEND.whiteKeys.map(({ key, note }) => (
                      <span key={key} className="legend-key">
                        <kbd>{key}</kbd> → {note}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="legend-section">
                  <strong>Black Keys</strong>
                  <div className="legend-keys">
                    {KEYBOARD_LEGEND.blackKeys.map(({ key, note }) => (
                      <span key={key} className="legend-key">
                        <kbd>{key}</kbd> → {note}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="legend-section">
                  <strong>Controls</strong>
                  <div className="legend-keys">
                    {KEYBOARD_LEGEND.controls.map(({ key, action }) => (
                      <span key={key} className="legend-key">
                        <kbd>{key}</kbd> → {action}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BODY: steps (hero) + compact control row */}
        <div className="track-body">
          <div className="step-row">
            {track.map((isActive, stepIndex) => (
              <button
                key={stepIndex}
                onContextMenu={(e) => {
                  if (!isSynth) return;
                  e.preventDefault();
                  setNoteEditingStep(stepIndex);
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  const newValue = !isActive;
                  onToggleStep(trackIndex, stepIndex);
                  dragRef.current = {
                    trackIndex,
                    startStep: stepIndex,
                    value: newValue,
                  };
                  window.addEventListener(
                    "pointerup",
                    () => {
                      dragRef.current = null;
                    },
                    { once: true },
                  );
                }}
                onPointerEnter={() => {
                  if (
                    dragRef.current &&
                    dragRef.current.trackIndex === trackIndex
                  ) {
                    const { startStep, value } = dragRef.current;
                    if (stepIndex !== startStep) {
                      onSetStepsRange?.(
                        trackIndex,
                        startStep,
                        stepIndex,
                        value,
                      );
                    }
                  }
                }}
                className={`
                  ${isActive ? "active" : ""}
                  ${currentStep === stepIndex && isPlaying ? "playing" : ""}
                  ${isMuted ? "muted-step" : ""}
                  ${isSynth ? "step-synth" : ""}
                `}
                title={isSynth && isActive ? selectedNote : undefined}
              >
                {isSynth && isActive ? (
                  <span className="step-note-label">
                    {Array.isArray(stepNotes?.[stepIndex])
                      ? stepNotes[stepIndex]
                          .map((n) => n.replace(/\d+$/, ""))
                          .join("·")
                      : stepNotes?.[stepIndex] || selectedNote}
                  </span>
                ) : (
                  stepIndex + 1
                )}
              </button>
            ))}
          </div>

          {isSynth && noteEditingStep != null && (
            <div className="step-note-panel">
              <span>Step {noteEditingStep + 1}</span>
              <select
                value={
                  typeof stepNotes?.[noteEditingStep] === "string"
                    ? stepNotes[noteEditingStep]
                    : ""
                }
                onChange={(e) =>
                  onSetStepNote?.(
                    trackIndex,
                    noteEditingStep,
                    e.target.value || null,
                  )
                }
                title="Set a single note or use the track default"
              >
                <option value="">Track default</option>
                {NOTE_OPTIONS.map((note) => (
                  <option key={note} value={note}>
                    {note}
                  </option>
                ))}
              </select>

              {isPoly && (
                <>
                  <select
                    value={chordRoot}
                    onChange={(e) => setChordRoot(e.target.value)}
                    title="Chord root note"
                  >
                    {NOTE_OPTIONS.map((note) => (
                      <option key={note} value={note}>
                        {note}
                      </option>
                    ))}
                  </select>
                  <select
                    value={chordType}
                    onChange={(e) => setChordType(e.target.value)}
                    title="Chord type"
                  >
                    {Object.keys(CHORD_TYPES).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() =>
                      onSetStepNote?.(
                        trackIndex,
                        noteEditingStep,
                        buildChord(chordRoot, chordType),
                      )
                    }
                    title="Apply chord"
                  >
                    🎹
                  </button>
                </>
              )}

              <button
                type="button"
                className="icon-btn"
                onClick={() => setNoteEditingStep(null)}
                title="Close note editor"
              >
                ✕
              </button>
            </div>
          )}

          <div className="track-control-row">
            <label className="control-field">
              <span>Sound</span>

              <SoundPicker
                value={currentSoundId}
                onChange={(soundId) => onUpdateSound(trackIndex, soundId)}
                onPreview={onPreviewSound}
              />
            </label>

            {isSynth && (
              <>
                <label className="control-field">
                  <span>Note</span>

                  <select
                    value={selectedNote}
                    onChange={(e) => {
                      onUpdateSetting(trackIndex, "note", e.target.value);
                      onPreview?.(trackIndex);
                    }}
                  >
                    {NOTE_OPTIONS.map((note) => (
                      <option key={note} value={note}>
                        {note}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="control-field">
                  <span>Dur</span>

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

            <div className="control-row-buttons">
              <button
                type="button"
                className="icon-btn"
                onClick={() => onClearPattern(trackIndex)}
                title="Clear this track's pattern"
              >
                🧹
                <span className="icon-btn-label">Clear</span>
              </button>

              <button
                type="button"
                className="icon-btn"
                onClick={() => onRandomPattern(trackIndex)}
                title="Generate a random pattern"
              >
                🎲
                <span className="icon-btn-label">Rand</span>
              </button>

              {isSynth && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onRandomArp?.(trackIndex)}
                  title="Generate a random arpeggio (scale-based notes)"
                >
                  🎵
                  <span className="icon-btn-label">Arp</span>
                </button>
              )}

              <button
                type="button"
                className="icon-btn"
                onClick={() => onAddToArrangement(trackIndex)}
                title="Add this track as a clip in the arrangement"
              >
                ➕<span className="icon-btn-label">Clip</span>
              </button>

              <button
                type="button"
                className="icon-btn"
                onClick={() => onNudgePattern?.(trackIndex, "left")}
                title="Nudge pattern left"
              >
                ←
              </button>

              <button
                type="button"
                className="icon-btn"
                onClick={() => onNudgePattern?.(trackIndex, "right")}
                title="Nudge pattern right"
              >
                →
              </button>

              <button
                type="button"
                className={`fx-toggle ${isExpanded ? "expanded" : ""} ${
                  anyFxActive ? "has-fx" : ""
                }`}
                onClick={() => onToggleExpand(trackIndex)}
                title={
                  isExpanded
                    ? "Hide effects"
                    : "Show effects (delay/filter/reverb)"
                }
              >
                FX
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT EDGE: vertical volume slider */}
        <div
          className="track-volume-rail"
          title={`Volume: ${Math.round(volume * 100)}%`}
        >
          <span className="volume-label">Vol</span>
          <input
            type="range"
            className="volume-vertical"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) =>
              onUpdateSetting(trackIndex, "volume", parseFloat(e.target.value))
            }
          />
        </div>
      </div>

      {isExpanded && (
        <div className="track-controls-expanded">
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

          <div className="fx-panel-footer">
            <label className="fx-enable-toggle">
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
              <span>Delay On</span>
            </label>

            <label className="fx-enable-toggle">
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
              <span>Reverb On</span>
            </label>

            <button
              type="button"
              className="preview-btn-inline"
              onClick={() => onPreview(trackIndex)}
            >
              &#9654; Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
