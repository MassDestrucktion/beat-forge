// src/components/SequencerToolbar.jsx

import { MIN_TRACKS, MAX_TRACKS } from "../sequencer/projectModel";

/**
 * Hero card + transport controls:
 *
 * play/stop, clear pattern, download WAV, new project,
 * add/remove track, and the BPM slider.
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
  onNewProject,
  onAddTrack,
  onRemoveTrack,
  onBpmChange,
}) {
  return (
    <>
      <section className="hero-card">
        <div>
          <p className="eyebrow">
            {isSharedView ? "Shared beat" : "MVP sketchpad"}
          </p>

          <h1>
            {isSharedView
              ? `BeatForge: ${projectName || "Shared Project"}`
              : "BeatForge Sketchbook"}
          </h1>

          <p>
            {isSharedView
              ? `A beat shared with you by ${
                  sharedBy ? `@${sharedBy}` : "another creator"
                }. Edit it and add it to your library.`
              : "A simple rhythm prototype for building, saving, and sharing beat ideas."}
          </p>
        </div>

        <div className="status-badge">
          <span className={`status-dot ${isPlaying ? "live" : "stopped"}`} />

          {isPlaying ? "Playing" : "Stopped"}
        </div>
      </section>

      <section className="controls-card">
        <div className="controls">
          <button onClick={onTogglePlay}>
            {isPlaying ? "⏹ Stop" : "▶ Play"}
          </button>

          <button onClick={onClearGrid}>Clear Pattern</button>

          <button onClick={onDownloadWav}>Download Track</button>

          <button onClick={onNewProject}>New Project</button>

          {!isSharedView && (
            <>
              <button
                className="track-count-btn"
                onClick={onRemoveTrack}
                disabled={numTracks <= MIN_TRACKS}
                title="Remove track"
              >
                − Track
              </button>

              <button
                className="track-count-btn"
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

            <strong>{bpm}</strong>
          </label>
        </div>
      </section>
    </>
  );
}
