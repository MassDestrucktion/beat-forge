import * as Tone from "tone";
import { useState, useEffect, useRef } from "react";
import "./App.css";

const NUM_TRACKS = 4;
//const NUM_STEPS = 16;

const TRACK_LABELS = ["Track 1", "Track 2", "Track 3", "Track 4"];

const INSTRUMENT_CONFIG = {
  kick: { type: "sample" },
  snare: { type: "sample" },
  hihat: { type: "sample" },
  stab: { type: "synth" },
  pad: { type: "synth" },
};

const DEFAULT_TRACK_SETTINGS = [
  { sound: "kick" },
  { sound: "snare" },
  { sound: "hihat" },
  { sound: "stab", note: "G2", duration: "8n" },
];

const samples = new Tone.Players({
  kick: "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",
  snare: "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
  hihat: "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
}).toDestination();

const stabSynth = new Tone.MembraneSynth().toDestination();
const padSynth = new Tone.PolySynth(Tone.Synth).toDestination();

export default function App() {
  const [beatCount, setBeatCount] = useState(16);
  
  const [grid, setGrid] = useState(() =>
    Array(NUM_TRACKS)
      .fill(null)
      .map(() => Array(beatCount).fill(false)),
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [bpm, setBpm] = useState(120);
  const [trackSettings, setTrackSettings] = useState(DEFAULT_TRACK_SETTINGS);

  const gridRef = useRef(grid);
  const settingsRef = useRef(trackSettings);
  const stepCountRef = useRef(0);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    settingsRef.current = trackSettings;
  }, [trackSettings]);

  const playTrackSound = (trackIndex, time) => {
    const config = settingsRef.current[trackIndex];
    if (!config) return;

    const { sound, note, duration } = config;

    if (INSTRUMENT_CONFIG[sound]?.type === "sample") {
      if (samples.has(sound) && samples.player(sound).loaded) {
        samples.player(sound).start(time);
      }
    } else if (sound === "stab") {
      stabSynth.triggerAttackRelease(note || "G2", duration || "8n", time);
    } else if (sound === "pad") {
      padSynth.triggerAttackRelease(note || "C4", duration || "4n", time);
    }
  };

  useEffect(() => {
    const repeat = (time) => {
      const step = stepCountRef.current % beatCount;
      setCurrentStep(step);

      const currentGrid = gridRef.current;

      for (let trackIdx = 0; trackIdx < beatCount; trackIdx++) {
        if (currentGrid[trackIdx][step]) {
          playTrackSound(trackIdx, time);
        }
      }

      stepCountRef.current++;
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
      playTrackSound(trackIndex);
    }
  };

  const togglePlay = async () => {
    await Tone.start();
    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      stepCountRef.current = 0;
      setIsPlaying(false);
      setCurrentStep(null);
    } else {
      Tone.Transport.position = 0;
      stepCountRef.current = 0;
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const clearGrid = () => {
    setGrid(
      Array(NUM_TRACKS)
        .fill(null)
        .map(() => Array(beatCount).fill(false)),
    );
  };

  const startDowload = () => {
    
  }

  const updateTrackSetting = (trackIndex, key, value) => {
    setTrackSettings((prev) =>
      prev.map((track, index) =>
        index === trackIndex ? { ...track, [key]: value } : track,
      ),
    );
  };

  return (
    <div className="sequencer">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">MVP sketchpad</p>
          <h2>BeatForge Sketchbook</h2>
          <p className="hero-text">
            A simple rhythm prototype for building, saving, and sharing beat
            ideas.
          </p>
        </div>

        <div className="status-badge">
          <span className={`status-dot ${isPlaying ? "live" : "stopped"}`} />
          {isPlaying ? "Playing" : "Stopped"}
        </div>
      </section>

      <section className="controls-card">
        <div className="controls">
          <button onClick={togglePlay}>
            {isPlaying ? "⏹ Stop" : "▶ Play"}
          </button>
          <button onClick={clearGrid}>Clear Pattern</button>
          <button onClick={startDowload}>Clear Pattern</button>
        </div>

        <label className="bpm-control">
          <span>BPM</span>
          <input
            type="range"
            min="60"
            max="180"
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
          />
          <strong>{bpm}</strong>
        </label>
      </section>

      <div className="tracks">
        {grid.map((track, trackIndex) => {
          const currentSound = trackSettings[trackIndex]?.sound || "kick";
          const isSynth = INSTRUMENT_CONFIG[currentSound]?.type === "synth";

          return (
            <div key={trackIndex} className="track-row">
              <div className="track-main">
                <span className="track-label">{TRACK_LABELS[trackIndex]}</span>
                <div className="track-controls">
                  <label>
                    <span>Sound</span>
                    <select
                      value={currentSound}
                      onChange={(e) =>
                        updateTrackSetting(trackIndex, "sound", e.target.value)
                      }
                    >
                      <option value="kick">Kick</option>
                      <option value="snare">Snare</option>
                      <option value="hihat">Hi-Hat</option>
                      <option value="stab">Stab Synth</option>
                      <option value="pad">Poly Pad</option>
                    </select>
                  </label>

                  {isSynth && (
                    <>
                      <label>
                        <span>Note</span>
                        <input
                          type="text"
                          value={trackSettings[trackIndex]?.note || ""}
                          onChange={(e) =>
                            updateTrackSetting(
                              trackIndex,
                              "note",
                              e.target.value,
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>Duration</span>
                        <select
                          value={trackSettings[trackIndex]?.duration || "8n"}
                          onChange={(e) =>
                            updateTrackSetting(
                              trackIndex,
                              "duration",
                              e.target.value,
                            )
                          }
                        >
                          <option value="16n">16n</option>
                          <option value="8n">8n</option>
                          <option value="4n">4n</option>
                          <option value="2n">2n</option>
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
          );
        })}
      </div>
    </div>
  );
}
