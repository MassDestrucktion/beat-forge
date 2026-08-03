import * as Tone from "tone";
import { useState, useEffect, useRef } from "react";
import "./App.css";

const NUM_TRACKS = 4;
const NUM_STEPS = 16;
const TRACK_LABELS = ["Kick", "Snare", "Hi-Hat", "Stab"];

const samples = new Tone.Players({
  kick: "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",
  snare: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
  hihat: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
}).toDestination();

const stabSynth = new Tone.MembraneSynth().toDestination();

export default function App() {
  const [grid, setGrid] = useState(() =>
    Array(NUM_TRACKS)
      .fill(null)
      .map(() => Array(NUM_STEPS).fill(false)),
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [bpm, setBpm] = useState(120);

  const gridRef = useRef(grid);
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    let stepCount = 0;

    const repeat = (time) => {
      const step = stepCount % NUM_STEPS;
      setCurrentStep(step);

      const currentGrid = gridRef.current;

      if (currentGrid[0][step] && samples.player("kick").loaded) {
        samples.player("kick").start(time);
      }
      if (currentGrid[1][step] && samples.player("snare").loaded) {
        samples.player("snare").start(time);
      }
      if (currentGrid[2][step] && samples.player("hihat").loaded) {
        samples.player("hihat").start(time);
      }
      // Track 4: Instant sound trigger, no state or envelope tracking required
      if (currentGrid[3][step]) {
        stabSynth.triggerAttackRelease("G2", "8n", time);
      }

      stepCount++;
    };

    const eventId = Tone.Transport.scheduleRepeat(repeat, "16n");
    return () => Tone.Transport.clear(eventId);
  }, []);

  const handleBpmChange = (newBpm) => {
    setBpm(newBpm);
    Tone.Transport.bpm.value = newBpm;
  };

  const toggleStep = async (trackIndex, stepIndex) => {
    await Tone.start();
    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    const updatedGrid = grid.map((track) => [...track]);
    const isTurningOn = !updatedGrid[trackIndex][stepIndex];
    updatedGrid[trackIndex][stepIndex] = isTurningOn;
    setGrid(updatedGrid);

    if (isTurningOn) {
      if (trackIndex === 0 && samples.player("kick").loaded)
        samples.player("kick").start();
      if (trackIndex === 1 && samples.player("snare").loaded)
        samples.player("snare").start();
      if (trackIndex === 2 && samples.player("hihat").loaded)
        samples.player("hihat").start();
      if (trackIndex === 3) stabSynth.triggerAttackRelease("G2", "8n");
    }
  };

  const togglePlay = async () => {
    await Tone.start();
    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    if (isPlaying) {
      Tone.Transport.stop();
      setIsPlaying(false);
      setCurrentStep(null);
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const clearGrid = () => {
    setGrid(
      Array(NUM_TRACKS)
        .fill(null)
        .map(() => Array(NUM_STEPS).fill(false)),
    );
  };

  return (
    <div className="sequencer">
      <h2>BeatForge Sketchbook</h2>

      <div className="controls">
        <button onClick={togglePlay}>{isPlaying ? "⏹ Stop" : "▶ Play"}</button>
        <button onClick={clearGrid}>Clear Pattern</button>
        <label>
          BPM ({bpm}):
          <input
            type="range"
            min="60"
            max="180"
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="tracks">
        {grid.map((track, trackIndex) => (
          <div key={trackIndex} className="track-row">
            <span className="track-label">{TRACK_LABELS[trackIndex]}</span>
            <div className="step-row">
              {track.map((isActive, stepIndex) => (
                <button
                  key={stepIndex}
                  onClick={() => toggleStep(trackIndex, stepIndex)}
                  className={`${isActive ? "active" : ""} ${
                    currentStep === stepIndex && isPlaying ? "playing" : ""
                  }`}
                >
                  {stepIndex + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
