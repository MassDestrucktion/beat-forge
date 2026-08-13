/**
 * ArrangementView
 *
 * Renders a horizontal timeline of arrangement sections.
 * Each section holds a snapshot of the grid + track settings
 * from the moment the user clicked "Save as Section".
 *
 * Props:
 *   arrangement   — array of { id, name, bars, grid, tempo }
 *   onAddSection  — () => void   (saves current grid as a new section)
 *   onRemove      — (id) => void
 *   onRename      — (id, newName) => void
 *   onBarsChange  — (id, newBars) => void
 *   onPlayArrangement — () => void
 *   isPlaying     — boolean
 *   numTracks     — number of tracks (for mini-grid width)
 *   currentStep   — current step within the active section (0-15)
 *   activeSectionIndex — which section is currently playing
 */

import "./ArrangementView.css";

export default function ArrangementView({
  arrangement,
  onAddSection,
  onRemove,
  onRename,
  onBarsChange,
  onPlayArrangement,
  isPlaying,
  numTracks,
  currentStep,
  activeSectionIndex,
}) {
  const totalBars = arrangement.reduce((sum, s) => sum + s.bars, 0);

  return (
    <div className="arrangement-view">
      <div className="arrangement-header">
        <h2>Arrangement</h2>

        <button
          className={`play-arrangement-btn ${isPlaying ? "playing" : ""}`}
          onClick={onPlayArrangement}
        >
          {isPlaying ? "⏹ Stop Arrangement" : "▶ Play Arrangement"}
        </button>

        <button
          className="add-section-btn"
          onClick={onAddSection}
          title="Save current pattern as a new section"
        >
          + Section
        </button>

        <span className="arrangement-summary">
          {totalBars} bar{totalBars !== 1 ? "s" : ""} · {arrangement.length}{" "}
          section{arrangement.length !== 1 ? "s" : ""}
        </span>
      </div>

      {arrangement.length === 0 ? (
        <div className="arrangement-empty">
          Click "+ Section" to save your current pattern and start arranging.
        </div>
      ) : (
        <div className="arrangement-timeline">
          {arrangement.map((section, idx) => {
            const isActive = idx === activeSectionIndex;

            const displayName = section.name || `Section ${idx + 1}`;

            return (
              <div
                key={section.id}
                className={`arrangement-section ${isActive ? "active" : ""} ${
                  isActive && isPlaying ? "playing" : ""
                }`}
              >
                <div className="section-header">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => onRename(section.id, e.target.value)}
                    placeholder={`Section ${idx + 1}`}
                    className="section-name-input"
                  />

                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={section.bars}
                    onChange={(e) =>
                      onBarsChange(section.id, Number(e.target.value))
                    }
                    className="section-bars-input"
                  />

                  <span className="section-bars-label">bars</span>

                  <button
                    className="section-remove-btn"
                    onClick={() => onRemove(section.id)}
                    title="Remove section"
                  >
                    ×
                  </button>
                </div>

                <div className="section-grid-preview">
                  {section.grid?.slice(0, numTracks).map((track, tIdx) => (
                    <div key={tIdx} className="section-track-preview">
                      {track?.slice(0, 16).map((active, sIdx) => (
                        <div
                          key={sIdx}
                          className={`section-step-preview ${
                            active ? "active" : ""
                          } ${
                            isActive && currentStep === sIdx ? "playing" : ""
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
