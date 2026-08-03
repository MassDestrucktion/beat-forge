export function TrackControls({
  trackIndex,
  synthNote,
  setSynthNote,
  synthWave,
  handleWaveChange,
  kickNote,
  setKickNote,
  kickDecay,
  handleKickDecayChange,
  snareType,
  handleSnareTypeChange,
  snareDecay,
  handleSnareDecayChange,
  hatFreq,
  handleHatFreqChange,
  hatDecay,
  handleHatDecayChange,
  allNotes,
  bassNotes,
}) {
  return (
    <div
      className="track-controls"
      style={{ display: "flex", gap: "6px", fontSize: "12px" }}
    >
      {/* Track 1: Synth */}
      {trackIndex === 0 && (
        <>
          <select
            value={synthNote}
            onChange={(e) => setSynthNote(e.target.value)}
          >
            {allNotes.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>
          <select
            value={synthWave}
            onChange={(e) => handleWaveChange(e.target.value)}
          >
            <option value="sawtooth">Saw</option>
            <option value="square">Square</option>
            <option value="sine">Sine</option>
            <option value="triangle">Triangle</option>
          </select>
        </>
      )}

      {/* Track 2: Kick */}
      {trackIndex === 1 && (
        <>
          <select
            value={kickNote}
            onChange={(e) => setKickNote(e.target.value)}
          >
            {bassNotes.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>
          <label>
            Decay
            <input
              type="range"
              min="0.05"
              max="0.8"
              step="0.05"
              value={kickDecay}
              onChange={(e) =>
                handleKickDecayChange(parseFloat(e.target.value))
              }
            />
          </label>
        </>
      )}

      {/* Track 3: Snare */}
      {trackIndex === 2 && (
        <>
          <select
            value={snareType}
            onChange={(e) => handleSnareTypeChange(e.target.value)}
          >
            <option value="white">White</option>
            <option value="pink">Pink</option>
            <option value="brown">Brown</option>
          </select>
          <label>
            Decay
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.05"
              value={snareDecay}
              onChange={(e) =>
                handleSnareDecayChange(parseFloat(e.target.value))
              }
            />
          </label>
        </>
      )}

      {/* Track 4: Hi-Hat */}
      {trackIndex === 3 && (
        <>
          <label>
            Pitch
            <input
              type="range"
              min="100"
              max="800"
              step="20"
              value={hatFreq}
              onChange={(e) => handleHatFreqChange(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Decay
            <input
              type="range"
              min="0.01"
              max="0.2"
              step="0.01"
              value={hatDecay}
              onChange={(e) => handleHatDecayChange(parseFloat(e.target.value))}
            />
          </label>
        </>
      )}
    </div>
  );
}
