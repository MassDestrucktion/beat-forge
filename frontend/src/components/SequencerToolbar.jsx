// src/components/SequencerToolbar.jsx

import { useEffect, useState } from "react";
import { MIN_TRACKS, MAX_TRACKS } from "../sequencer/projectModel";
import heroImg from "../assets/sequencer-hero.svg";

/**
 * Hero card + transport controls:
 *
 * play/stop, clear pattern, download WAV,
 * add/remove track, BPM slider, master volume.
 */
export default function SequencerToolbar({
  isPlaying,
  isSharedView,
  projectName,
  sharedBy,
  numTracks,
  bpm,

  onTogglePlay,
  onClearGrid,
  onDownloadWav,
  onAddTrack,
  onRemoveTrack,
  onBpmChange,

  masterVolume,
  onMasterVolumeChange,
}) {
  const [bpmText, setBpmText] = useState(String(bpm));

  useEffect(() => {
    setBpmText(String(bpm));
  }, [bpm]);

  function handleBpmCommit() {
    const num = Number(bpmText);
    if (bpmText.trim() !== "" && Number.isFinite(num)) {
      const clamped = Math.min(180, Math.max(60, Math.round(num)));
      onBpmChange(clamped);
      setBpmText(String(clamped));
    } else {
      setBpmText(String(bpm));
    }
  }

  return (
    <>
      <section className="hero-card">
        <div className="hero-card-left">
          <img src={heroImg} alt="Sequencer" className="hero-card-logo" />
          <div className="hero-card-text">
            <h1 className="pixel-title">
              {isSharedView
                ? `${projectName || "Shared Project"}`
                : "Sequencer"}
            </h1>
            {isSharedView && (
              <p className="hero-subtitle">
                A beat shared with you by{" "}
                {sharedBy ? `@${sharedBy}` : "another creator"}. Edit it and add
                it to your library.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="controls-card">
        <div className="controls">
          <button onClick={onTogglePlay}>
            {isPlaying ? "⏹ Stop" : "▶ Play"}
          </button>

          <button onClick={onClearGrid}>🧹 Clear</button>

          <button onClick={onDownloadWav}>⬇ Download</button>

          {!isSharedView && (
            <>
              <button
                onClick={onRemoveTrack}
                disabled={numTracks <= MIN_TRACKS}
                title="Remove track"
              >
                − Track
              </button>

              <button
                onClick={onAddTrack}
                disabled={numTracks >= MAX_TRACKS}
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
              onChange={(e) => onBpmChange(Number(e.target.value))}
            />
            <input
              type="number"
              min="60"
              max="180"
              step="1"
              value={bpmText}
              onChange={(e) => setBpmText(e.target.value)}
              onBlur={handleBpmCommit}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="bpm-number-input"
              aria-label="BPM value"
            />
          </label>

          <label className="toolbar-slider">
            <span>Master</span>
            <input
              type="range"
              min="-40"
              max="6"
              step="0.5"
              value={masterVolume}
              onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
              title={`Master volume: ${masterVolume > 0 ? "+" : ""}${masterVolume} dB`}
            />
            <strong>
              {masterVolume > 0 ? "+" : ""}
              {masterVolume} dB
            </strong>
          </label>

          <div className="status-badge">
            <span className={`status-dot ${isPlaying ? "live" : "stopped"}`} />
            {isPlaying ? "Playing" : "Stopped"}
          </div>
        </div>
      </section>
    </>
  );
}
