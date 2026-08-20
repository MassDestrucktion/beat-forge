import { useState, useEffect } from "react";
import Dial from "./Dial.jsx";
import SoundPicker from "./SoundPicker.jsx";
import { NOTE_OPTIONS, DURATION_OPTIONS } from "../sequencer/projectModel";
import { getSoundById } from "../audio/soundLibrary";
import "./ClipEditorModal.css";

export default function ClipEditorModal({
  clip,
  trackSetting,
  onUpdate,
  onUpdateSound,
  onUpdateSetting,
  onClose,
  onPreviewSound,
}) {
  const [grid, setGrid] = useState(clip?.grid || []);

  useEffect(() => {
    setGrid(clip?.grid || []);
  }, [clip]);

  if (!clip) {
    return null;
  }

  const handleToggleStep = (trackIndex, stepIndex) => {
    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      const newTrack = [...newGrid[trackIndex]];
      newTrack[stepIndex] = !newTrack[stepIndex];
      newGrid[trackIndex] = newTrack;
      return newGrid;
    });
  };

  const handleSave = () => {
    onUpdate(clip.id, grid);
    onClose();
  };

  const currentSoundId = trackSetting?.sound;
  const currentSound = getSoundById(currentSoundId);
  const isSynth = currentSound?.type === "synth";
  const reverbEnabled = trackSetting?.reverb?.enabled || false;
  const delayEnabled = trackSetting?.delay?.enabled || false;
  const filterLowpass = trackSetting?.filter?.lowpass ?? 20000;
  const filterHighpass = trackSetting?.filter?.highpass ?? 20;
  const selectedNote = trackSetting?.note || currentSound?.synth?.note || "C4";
  const selectedDuration =
    trackSetting?.duration || currentSound?.synth?.duration || "8n";
  const volume = trackSetting?.volume ?? 1;

  return (
    <div className="clip-editor-modal-overlay">
      <div className="clip-editor-modal">
        <div className="clip-editor-header">
          <h2>Edit Clip: {clip.name}</h2>
          <button onClick={handleSave} className="save-btn">
            Save & Close
          </button>
        </div>
        <div className="clip-editor-content">
          <div className="step-row">
            {grid[0]?.map((isActive, stepIndex) => (
              <button
                key={stepIndex}
                onClick={() => handleToggleStep(0, stepIndex)}
                className={`
                  ${isActive ? "active" : ""}
                `}
              >
                {stepIndex + 1}
              </button>
            ))}
          </div>
          <div className="track-controls-expanded">
            <div className="track-controls">
              <label>
                <span>Sound</span>
                <SoundPicker
                  value={currentSoundId}
                  onChange={(soundId) =>
                    onUpdateSound(clip.sourceTrackIndex, soundId)
                  }
                  onPreview={onPreviewSound}
                />
              </label>
              {isSynth && (
                <>
                  <label>
                    <span>Note</span>
                    <select
                      value={selectedNote}
                      onChange={(e) =>
                        onUpdateSetting(
                          clip.sourceTrackIndex,
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
                        onUpdateSetting(
                          clip.sourceTrackIndex,
                          "duration",
                          e.target.value,
                        )
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
            <div className="clip-editor-volume-row">
              <label className="control-field">
                <span>Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) =>
                    onUpdateSetting(
                      clip.sourceTrackIndex,
                      "volume",
                      parseFloat(e.target.value),
                    )
                  }
                />
              </label>
              <span className="volume-value">{Math.round(volume * 100)}%</span>
            </div>
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
                  onUpdateSetting(clip.sourceTrackIndex, "delay", {
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
                  onUpdateSetting(clip.sourceTrackIndex, "delay", {
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
                  onUpdateSetting(clip.sourceTrackIndex, "delay", {
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
                  onUpdateSetting(clip.sourceTrackIndex, "filter", {
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
                  onUpdateSetting(clip.sourceTrackIndex, "filter", {
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
                  onUpdateSetting(clip.sourceTrackIndex, "reverb", {
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
                  onUpdateSetting(clip.sourceTrackIndex, "reverb", {
                    ...trackSetting?.reverb,
                    enabled: true,
                    decay: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
