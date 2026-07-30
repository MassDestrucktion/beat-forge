import * as Tone from "tone";
import { useState } from "react";

console.log(Tone.context.state);

const NUM_TRACKS = 4;
const NUM_STEPS = 16;

const synths = [
  new Tone.MembraneSynth().toDestination(),
  new Tone.NoiseSynth({ noise: { type: "white" } }).toDestination(),
  new Tone.MetalSynth({ frequency: 5 }).toDestination(), //
  new Tone.Synth().toDestination(), //
];

function App() {
  const [grid, setGrid] = useState(() =>
    Array(NUM_TRACKS)
      .fill(null)
      .map(() => Array(NUM_STEPS).fill(false)),
  );

  const toggleStep = async (trackIndex, stepIndex) => {
    await Tone.start();

    const updatedGrid = grid.map((track) => [...track]);
    const isTurningOn = !updatedGrid[trackIndex][stepIndex];
    updatedGrid[trackIndex][stepIndex] = isTurningOn;
    setGrid(updatedGrid);

    if (isTurningOn) {
      if (trackIndex === 0) {
        synths[0].triggerAttackRelease("A1", "8n");
      } else if (trackIndex === 1) {
        synths[1].triggerAttackRelease("1n");
      } else if (trackIndex === 2) {
        synths[2].triggerAttackRelease("2n");
      } else if (trackIndex === 3) {
        synths[3].triggerAttackRelease("C4", "2n");
      }
    }
  };

  return (
    <div>
      <h2>4-Track Sequencer Grid</h2>

      {grid.map((track, trackIndex) => (
        <div key={trackIndex}>
          <span>Track {trackIndex + 1} </span>

          {track.map((isActive, stepIndex) => (
            <button
              key={stepIndex}
              onClick={() => toggleStep(trackIndex, stepIndex)}
              className={isActive ? "active" : ""}
            >
              {stepIndex + 1}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;
