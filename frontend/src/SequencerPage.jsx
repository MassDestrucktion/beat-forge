import * as Tone from "tone";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "./AuthContext/AuthContext.jsx";
import "./App.css";

const NUM_TRACKS = 4;
const NUM_STEPS = 16;

const TRACK_LABELS = [
  "Track 1",
  "Track 2",
  "Track 3",
  "Track 4",
];

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

function createEmptyGrid() {
  return Array(NUM_TRACKS)
    .fill(null)
    .map(() => Array(NUM_STEPS).fill(false));
}

export default function SequencerPage() {
  const { isAuthenticated, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [grid, setGrid] = useState(createEmptyGrid);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [bpm, setBpm] = useState(120);
  const [trackSettings, setTrackSettings] = useState(
    DEFAULT_TRACK_SETTINGS
  );
  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [loadId, setLoadId] = useState("");
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const gridRef = useRef(grid);
  const settingsRef = useRef(trackSettings);
  const stepCountRef = useRef(0);

  (() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    settingsRef.current = trackSettings;
  }, [trackSettings]);

  // Auto-load project from URL query param ?projectId=...
  useEffect(() => {
    const projectIdFromUrl = searchParams.get("projectId");

    if (!projectIdFromUrl || initialLoadDone) {
      return;
    }useEffect

    const loadProjectFromUrl = async () => {
      setSaveStatus("Loading project...");

      try {
        const response = await fetch(
          `/api/projects/${projectIdFromUrl}`,
          {
            headers: {
              Authorization: token
                ? `Bearer ${token}`
                : "",
            },
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            text || "Failed to load project"
          );
        }

        const project = await response.json();

        applyProject(project);

        setSaveStatus(`Loaded "${project.name}"`);
      } catch (error) {
        setSaveStatus(
          `Load failed: ${error.message}`
        );
      } finally {
        setInitialLoadDone(true);
      }
    };

    loadProjectFromUrl();
  }, [searchParams, token, initialLoadDone]);

  const applyProject = (project) => {
    setProjectName(project.name || "");
    setProjectId(project.id);
    setBpm(project.tempo || 120);

    Tone.Transport.bpm.value = project.tempo || 120;

    if (
      Array.isArray(project.grid) &&
      project.grid.length === NUM_TRACKS
    ) {
      setGrid(project.grid);
    }

    if (
      Array.isArray(project.track_settings) &&
      project.track_settings.length === NUM_TRACKS
    ) {
      setTrackSettings(project.track_settings);
    }
  };

  const playTrackSound = (trackIndex, time) => {
    const config = settingsRef.current[trackIndex];

    if (!config) {
      return;
    }

    const { sound, note, duration } = config;

    if (
      INSTRUMENT_CONFIG[sound]?.type === "sample"
    ) {
      if (
        samples.has(sound) &&
        samples.player(sound).loaded
      ) {
        samples.player(sound).start(time);
      }
    } else if (sound === "stab") {
      stabSynth.triggerAttackRelease(
        note || "G2",
        duration || "8n",
        time
      );
    } else if (sound === "pad") {
      padSynth.triggerAttackRelease(
        note || "C4",
        duration || "4n",
        time
      );
    }
  };

  useEffect(() => {
    const repeat = (time) => {
      const step =
        stepCountRef.current % NUM_STEPS;

      setCurrentStep(step);

      const currentGrid = gridRef.current;

      for (
        let trackIdx = 0;
        trackIdx < NUM_TRACKS;
        trackIdx++
      ) {
        if (currentGrid[trackIdx][step]) {
          playTrackSound(trackIdx, time);
        }
      }

      stepCountRef.current++;
    };

    const eventId = Tone.Transport.scheduleRepeat(
      repeat,
      "16n"
    );

    return () => {
      Tone.Transport.clear(eventId);
    };
  }, []);

  const handleBpmChange = (newBpm) => {
    setBpm(newBpm);
    Tone.Transport.bpm.value = newBpm;
  };

  const toggleStep = async (
    trackIndex,
    stepIndex
  ) => {
    await Tone.start();

    if (
      Tone.getContext().state !== "running"
    ) {
      await Tone.getContext().resume();
    }

    const updatedGrid = grid.map((track) => [
      ...track,
    ]);

    const isTurningOn =
      !updatedGrid[trackIndex][stepIndex];

    updatedGrid[trackIndex][stepIndex] =
      isTurningOn;

    setGrid(updatedGrid);

    if (isTurningOn) {
      playTrackSound(trackIndex);
    }
  };

  const togglePlay = async () => {
    await Tone.start();

    if (
      Tone.getContext().state !== "running"
    ) {
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
    setGrid(createEmptyGrid());
  };

  const handleNewProject = () => {
    setProjectName("");
    setProjectId(null);
    setGrid(createEmptyGrid());
    setTrackSettings(DEFAULT_TRACK_SETTINGS);
    setBpm(120);

    Tone.Transport.bpm.value = 120;

    setSaveStatus("");
    setLoadId("");
    setInitialLoadDone(false);

    setSearchParams({});
  };

  /*
   * Converts an AudioBuffer to a WAV Blob.
   */
  const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const channelData = [];

    for (
      let channel = 0;
      channel < numChannels;
      channel++
    ) {
      channelData.push(
        buffer.getChannelData(channel)
      );
    }

    const interleaved = new Float32Array(
      buffer.length * numChannels
    );

    let offset = 0;

    for (let i = 0; i < buffer.length; i++) {
      for (
        let channel = 0;
        channel < numChannels;
        channel++
      ) {
        interleaved[offset++] =
          channelData[channel][i];
      }
    }

    const dataLength =
      interleaved.length * 2;

    const arrayBuffer = new ArrayBuffer(
      44 + dataLength
    );

    const view = new DataView(arrayBuffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(
          offset + i,
          string.charCodeAt(i)
        );
      }
    };

    writeString(0, "RIFF");

    view.setUint32(
      4,
      36 + dataLength,
      true
    );

    writeString(8, "WAVE");
    writeString(12, "fmt ");

    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(
      22,
      numChannels,
      true
    );

    view.setUint32(
      24,
      sampleRate,
      true
    );

    view.setUint32(
      28,
      sampleRate *
        numChannels *
        (bitDepth / 8),
      true
    );

    view.setUint16(
      32,
      numChannels * (bitDepth / 8),
      true
    );

    view.setUint16(
      34,
      bitDepth,
      true
    );

    writeString(36, "data");

    view.setUint32(
      40,
      dataLength,
      true
    );

    let writeOffset = 44;

    for (
      let i = 0;
      i < interleaved.length;
      i++
    ) {
      const sample = Math.max(
        -1,
        Math.min(1, interleaved[i])
      );

      view.setInt16(
        writeOffset,
        sample < 0
          ? sample * 0x8000
          : sample * 0x7fff,
        true
      );

      writeOffset += 2;
    }

    return new Blob([arrayBuffer], {
      type: "audio/wav",
    });
  };

  const downloadTrackAsWav = async (
    durationInSeconds = 4,
    filename = "track.wav"
  ) => {
    try {
      setSaveStatus("Rendering track...");

      const buffer = await Tone.Offline(
        ({ transport }) => {
          transport.bpm.value = bpm;

          const offlineSynths = {
            stab: new Tone.MembraneSynth(),
            pad: new Tone.PolySynth(
              Tone.Synth
            ),
          };

          const offlinePlayers =
            new Tone.Players({
              kick:
                "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",
              snare:
                "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
              hihat:
                "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
            });

          for (
            let step = 0;
            step < NUM_STEPS;
            step++
          ) {
            const stepTime =
              step * (60 / bpm / 4);

            for (
              let trackIndex = 0;
              trackIndex < NUM_TRACKS;
              trackIndex++
            ) {
              if (!grid[trackIndex][step]) {
                continue;
              }

              const config =
                trackSettings[trackIndex];

              if (!config) {
                continue;
              }

              const {
                sound,
                note,
                duration,
              } = config;

              if (
                sound === "kick" ||
                sound === "snare" ||
                sound === "hihat"
              ) {
                offlinePlayers
                  .player(sound)
                  .start(stepTime);
              } else if (sound === "stab") {
                offlineSynths.stab.triggerAttackRelease(
                  note || "G2",
                  duration || "8n",
                  stepTime
                );
              } else if (sound === "pad") {
                offlineSynths.pad.triggerAttackRelease(
                  note || "C4",
                  duration || "4n",
                  stepTime
                );
              }
            }
          }

          transport.start();
        },
        durationInSeconds
      );

      const wavBlob =
        audioBufferToWav(buffer);

      const url =
        URL.createObjectURL(wavBlob);

      const a =
        document.createElement("a");

      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      setSaveStatus(
        "Track downloaded successfully."
      );
    } catch (error) {
      console.error(error);

      setSaveStatus(
        `Download failed: ${error.message}`
      );
    }
  };

  const updateTrackSetting = (
    trackIndex,
    key,
    value
  ) => {
    setTrackSettings((prev) =>
      prev.map((track, index) =>
        index === trackIndex
          ? {
              ...track,
              [key]: value,
            }
          : track
      )
    );
  };

  const saveProject = async () => {
    if (!projectName.trim()) {
      setSaveStatus(
        "Please enter a project name."
      );
      return;
    }

    if (!isAuthenticated) {
      setSaveStatus(
        "Please log in to save your project."
      );
      return;
    }

    const payload = {
      name: projectName,
      tempo: bpm,
      grid,
      track_settings: trackSettings,
    };

    const isUpdate = Boolean(projectId);

    try {
      const url = isUpdate
        ? `/api/projects/${projectId}`
        : "/api/projects";

      const method = isUpdate
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token
            ? `Bearer ${token}`
            : "",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err =
          await response.text();

        throw new Error(
          err || "Failed to save project"
        );
      }

      const project =
        await response.json();

      setProjectId(project.id);

      setSaveStatus(
        isUpdate
          ? `Updated "${project.name}"`
          : `Saved "${project.name}" (ID: ${project.id})`
      );
    } catch (error) {
      setSaveStatus(
        `Save failed: ${error.message}`
      );
    }
  };

  const loadProject = async () => {
    if (!loadId.trim()) {
      setSaveStatus(
        "Please enter a project ID to load."
      );
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${loadId.trim()}`,
        {
          headers: {
            Authorization: token
              ? `Bearer ${token}`
              : "",
          },
        }
      );

      if (!response.ok) {
        const err =
          await response.text();

        throw new Error(
          err || "Failed to load project"
        );
      }

      const project =
        await response.json();

      applyProject(project);

      setSaveStatus(
        `Loaded "${project.name}"`
      );
    } catch (error) {
      setSaveStatus(
        `Load failed: ${error.message}`
      );
    }
  };

  return (
    <main className="sequencer-page">
      <section className="hero-card">
        <div>
          <p className="eyebrow">
            MVP sketchpad
          </p>

          <h1>BeatForge Sketchbook</h1>

          <p>
            A simple rhythm prototype for
            building, saving, and sharing
            beat ideas.
          </p>
        </div>

        <div className="status-badge">
          <span
            className={`status-dot ${
              isPlaying
                ? "live"
                : "stopped"
            }`}
          />

          {isPlaying
            ? "Playing"
            : "Stopped"}
        </div>
      </section>

      <section className="controls-card">
        <div className="controls">
          <button onClick={togglePlay}>
            {isPlaying
              ? "⏹ Stop"
              : "▶ Play"}
          </button>

          <button onClick={clearGrid}>
            Clear Pattern
          </button>

          <button
            onClick={() =>
              downloadTrackAsWav()
            }
          >
            Download Track
          </button>

          <label className="bpm-control">
            <span>BPM</span>

            <input
              type="range"
              min="60"
              max="180"
              value={bpm}
              onChange={(e) =>
                handleBpmChange(
                  Number(e.target.value)
                )
              }
            />

            <strong>{bpm}</strong>
          </label>
        </div>
      </section>

      <section className="save-load-card">
        <div className="save-section">
          <input
            type="text"
            placeholder="Project name"
            value={projectName}
            onChange={(e) =>
              setProjectName(
                e.target.value
              )
            }
          />

          <button onClick={saveProject}>
            {projectId
              ? "💾 Update Project"
              : "💾 Save Project"}
          </button>

          {projectId && (
            <span className="project-id">
              ID: {projectId}
            </span>
          )}
        </div>

        <div className="load-section">
          <input
            type="text"
            placeholder="Project ID to load"
            value={loadId}
            onChange={(e) =>
              setLoadId(e.target.value)
            }
          />

          <button onClick={loadProject}>
            📂 Load Project
          </button>
        </div>

        {saveStatus && (
          <p className="save-status">
            {saveStatus}
          </p>
        )}
      </section>

      <div className="tracks">
        {grid.map(
          (track, trackIndex) => {
            const currentSound =
              trackSettings[trackIndex]
                ?.sound || "kick";

            const isSynth =
              INSTRUMENT_CONFIG[
                currentSound
              ]?.type === "synth";

            return (
              <div
                key={trackIndex}
                className="track-row"
              >
                <div className="track-main">
                  <span className="track-label">
                    {
                      TRACK_LABELS[
                        trackIndex
                      ]
                    }
                  </span>

                  <div className="track-controls">
                    <label>
                      <span>Sound</span>

                      <select
                        value={currentSound}
                        onChange={(e) =>
                          updateTrackSetting(
                            trackIndex,
                            "sound",
                            e.target.value
                          )
                        }
                      >
                        <option value="kick">
                          Kick
                        </option>

                        <option value="snare">
                          Snare
                        </option>

                        <option value="hihat">
                          Hi-Hat
                        </option>

                        <option value="stab">
                          Stab Synth
                        </option>

                        <option value="pad">
                          Poly Pad
                        </option>
                      </select>
                    </label>

                    {isSynth && (
                      <>
                        <label>
                          <span>Note</span>

                          <input
                            type="text"
                            value={
                              trackSettings[
                                trackIndex
                              ]?.note || ""
                            }
                            onChange={(e) =>
                              updateTrackSetting(
                                trackIndex,
                                "note",
                                e.target.value
                              )
                            }
                          />
                        </label>

                        <label>
                          <span>
                            Duration
                          </span>

                          <select
                            value={
                              trackSettings[
                                trackIndex
                              ]?.duration ||
                              "8n"
                            }
                            onChange={(e) =>
                              updateTrackSetting(
                                trackIndex,
                                "duration",
                                e.target.value
                              )
                            }
                          >
                            <option value="16n">
                              16n
                            </option>

                            <option value="8n">
                              8n
                            </option>

                            <option value="4n">
                              4n
                            </option>

                            <option value="2n">
                              2n
                            </option>
                          </select>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div className="step-row">
                  {track.map(
                    (
                      isActive,
                      stepIndex
                    ) => (
                      <button
                        key={stepIndex}
                        onClick={() =>
                          toggleStep(
                            trackIndex,
                            stepIndex
                          )
                        }
                        className={`
                          ${isActive ? "active" : ""}
                          ${
                            currentStep ===
                              stepIndex &&
                            isPlaying
                              ? "playing"
                              : ""
                          }
                        `}
                      >
                        {stepIndex + 1}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </main>
  );
}
