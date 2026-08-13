/**
 * PianoRoll.jsx
 * A standalone piano roll component for Beat Forge
 * Shows piano keys (natural notes only) on the left and a step grid on the right
 */

import { useState } from "react";

/**
 * Natural notes only: C, D, E, F, G, A, B across C3–C5
 * (no sharps/flats — keeps the music-theory barrier low)
 */
const NOTE_OPTIONS = [
  // C3 octave
  "C3",
  "D3",
  "E3",
  "F3",
  "G3",
  "A3",
  "B3",
  // C4 octave
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  // C5 (high C)
  "C5",
];

const NUM_STEPS = 16;

/**
 * Single color per note (no black-key distinction needed
 * since we only show naturals).
 */
const NOTE_COLORS = {
  C3: "#3a7dff",
  D3: "#3a9dff",
  E3: "#3ab1ff",
  F3: "#3ad3ff",
  G3: "#3affd7",
  A3: "#3affa3",
  B3: "#3aff82",
  C4: "#3a7dff",
  D4: "#3a9dff",
  E4: "#3ab1ff",
  F4: "#3ad3ff",
  G4: "#3affd7",
  A4: "#3affa3",
  B4: "#3aff82",
  C5: "#3a7dff",
};

function getNoteColor(note) {
  return NOTE_COLORS[note] || "#6b6b6b";
}

export default function PianoRoll({ onSave, onLoad }) {
  const [tracks, setTracks] = useState([
    {
      id: 0,
      label: "Track 1",
      muted: false,
      soloed: false,
      steps: Array.from({ length: NUM_STEPS }, () => ({
        isActive: false,
        pitch: null,
      })),
    },
    {
      id: 1,
      label: "Track 2",
      muted: false,
      soloed: false,
      steps: Array.from({ length: NUM_STEPS }, () => ({
        isActive: false,
        pitch: null,
      })),
    },
  ]);

  const [selectedPitch, setSelectedPitch] = useState(null);

  // Toggle a step on/off
  const toggleStep = (trackIndex, stepIndex) => {
    setTracks((prev) => {
      const newTracks = [...prev];
      const track = { ...newTracks[trackIndex] };
      const step = { ...track.steps[stepIndex] };
      if (step.isActive) {
        step.isActive = false;
        step.pitch = null;
      } else {
        step.isActive = true;
        step.pitch = selectedPitch || "C4";
      }
      track.steps[stepIndex] = step;
      newTracks[trackIndex] = track;
      return newTracks;
    });
  };

  // Save current sequence
  const saveSequence = () => {
    const payload = {
      name: "PianoRollSequence",
      savedAt: new Date().toISOString(),
      transport: {
        bpm: 120,
      },
      tracks: tracks.map((track, i) => ({
        trackIndex: i,
        instrumentType: "Synth",
        note: track.steps.find((s) => s.pitch)?.pitch || "C4",
        duration: "8n",
        steps: track.steps.map((s) => s.isActive),
        pitches: track.steps.map((s) => s.pitch),
      })),
    };
    if (onSave) onSave(payload);
    localStorage.setItem("pianoroll-sequence", JSON.stringify(payload));
    alert("Sequence saved to localStorage!");
  };

  // Load sequence from localStorage
  const loadSequence = () => {
    const saved = localStorage.getItem("pianoroll-sequence");
    if (saved) {
      const data = JSON.parse(saved);
      const newTracks = data.tracks.map((t, i) => ({
        id: i,
        label: data.tracks[i]?.label || `Track ${i + 1}`,
        muted: false,
        soloed: false,
        steps: t.steps.map((isActive, j) => ({
          isActive: isActive,
          pitch: t.pitches[j] || null,
        })),
      }));
      setTracks(newTracks);
      if (onLoad) onLoad(data);
      alert("Sequence loaded from localStorage!");
    }
  };

  // Clear all notes
  const clearAll = () => {
    setTracks((prev) =>
      prev.map((track) => ({
        ...track,
        steps: track.steps.map((step) => ({ isActive: false, pitch: null })),
      })),
    );
  };

  // Render piano keys sidebar (natural keys only)
  const PianoKeySidebar = () => (
    <div className="piano-keys-sidebar">
      {NOTE_OPTIONS.map((note) => (
        <div
          key={note}
          className={
            "piano-key " + (selectedPitch === note ? "active" : "") + " natural"
          }
          onClick={() => setSelectedPitch(note)}
          style={{
            backgroundColor:
              selectedPitch === note ? getNoteColor(note) : "#333",
            color: selectedPitch === note ? "#fff" : "#aaa",
            fontSize: "11px",
            padding: "4px 8px",
            textAlign: "center",
            cursor: "pointer",
            borderBottom: "1px solid #555",
          }}
        >
          {note}
        </div>
      ))}
    </div>
  );

  // Render a single track row
  const TrackRow = ({ track, trackIndex }) => (
    <div className="track-row">
      <div className="track-label">
        {track.label}
        <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
          <button
            onClick={() => {
              setTracks((prev) => {
                const newTracks = [...prev];
                newTracks[trackIndex] = { ...track, muted: !track.muted };
                return newTracks;
              });
            }}
            style={{ fontSize: "10px", padding: "2px 6px" }}
          >
            {track.muted ? "Unmute" : "Mute"}
          </button>
          <button
            onClick={() => {
              setTracks((prev) => {
                const newTracks = [...prev];
                newTracks[trackIndex] = { ...track, soloed: !track.soloed };
                return newTracks;
              });
            }}
            style={{ fontSize: "10px", padding: "2px 6px" }}
          >
            {track.soloed ? "Unsolo" : "Solo"}
          </button>
        </div>
      </div>
      <div className="steps-grid">
        {track.steps.map((step, stepIndex) => (
          <div
            key={stepIndex}
            className="step-cell"
            onClick={() => toggleStep(trackIndex, stepIndex)}
            style={{
              width: "40px",
              height: "24px",
              margin: "1px",
              backgroundColor: step.isActive
                ? step.pitch
                  ? getNoteColor(step.pitch)
                  : "#ff6b6b"
                : "#eee",
              color: step.isActive ? "#fff" : "#666",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              cursor: "pointer",
              borderRadius: "2px",
              border: step.isActive ? "1px solid #fff" : "1px solid #ddd",
            }}
          >
            {step.isActive && step.pitch ? step.pitch : ""}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="piano-roll-app"
      style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}
    >
      <h2>Beat Forge - Piano Roll</h2>

      {/* Pitch selection controls */}
      <div className="pitch-selection" style={{ marginBottom: "15px" }}>
        <strong>Selected Pitch:</strong>{" "}
        <span
          style={{
            color: selectedPitch ? getNoteColor(selectedPitch) : "#999",
          }}
        >
          {selectedPitch || "None"}
        </span>
        <div style={{ marginTop: "8px" }}>
          {NOTE_OPTIONS.map((note) => (
            <span
              key={note}
              onClick={() => setSelectedPitch(note)}
              style={{
                display: "inline-block",
                padding: "4px 8px",
                margin: "2px",
                backgroundColor:
                  selectedPitch === note ? getNoteColor(note) : "#eee",
                color: selectedPitch === note ? "#fff" : "#333",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "10px",
              }}
            >
              {note}
            </span>
          ))}
        </div>
      </div>

      {/* Piano Roll Grid */}
      <div
        className="piano-roll-container"
        style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
      >
        <PianoKeySidebar />
        <div className="grid-section">
          {/* Step headers */}
          <div
            className="step-headers"
            style={{ display: "flex", marginBottom: "5px" }}
          >
            {[...Array(NUM_STEPS)].map((_, i) => (
              <div
                key={i}
                className="step-header"
                style={{
                  width: "40px",
                  textAlign: "center",
                  fontSize: "10px",
                  color: "#888",
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Tracks */}
          {tracks.map((track, trackIndex) => (
            <TrackRow key={track.id} track={track} trackIndex={trackIndex} />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div
        className="piano-roll-actions"
        style={{ display: "flex", gap: "10px", marginTop: "20px" }}
      >
        <button
          onClick={saveSequence}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Save Sequence
        </button>
        <button
          onClick={loadSequence}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Load Sequence
        </button>
        <button
          onClick={clearAll}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear All
        </button>
        <button
          onClick={() => {
            const newTrack = {
              id: tracks.length,
              label: "Track " + (tracks.length + 1),
              muted: false,
              soloed: false,
              steps: Array.from({ length: NUM_STEPS }, () => ({
                isActive: false,
                pitch: null,
              })),
            };
            setTracks([...tracks, newTrack]);
          }}
          disabled={tracks.length >= 8}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          + Add Track
        </button>
      </div>
    </div>
  );
}
