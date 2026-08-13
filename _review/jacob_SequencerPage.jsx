import * as Tone from "tone";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "./AuthContext/AuthContext.jsx";
import "./App.css";

const NUM_STEPS = 16;

const INSTRUMENT_CONFIG = {
  kick: { type: "sample" },
  snare: { type: "sample" },
  hihat: { type: "sample" },
  stab: { type: "synth" },
  pad: { type: "synth" },
  piano: { type: "synth" },
};

const samples = new Tone.Players({
  kick:
    "https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3",
  snare:
    "https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3",
  hihat:
    "https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3",
}).toDestination();

const stabSynth =
  new Tone.MembraneSynth().toDestination();

const padSynth =
  new Tone.PolySynth(Tone.Synth).toDestination();

/*
 * Normalize a pattern so the sequencer never
 * receives undefined events.
 */
function normalizePattern(pattern, index = 0) {
  if (!pattern) {
    return {
      id: `pattern-${index}`,
      name: `Pattern ${index + 1}`,
      events: [],
    };
  }

  return {
    ...pattern,
    id:
      pattern.id ??
      `pattern-${index}`,
    name:
      pattern.name ||
      `Pattern ${index + 1}`,
    events: Array.isArray(pattern.events)
      ? pattern.events
      : [],
  };
}

/*
 * Your TrackPage may call the collection
 * gridList, grids, or patterns depending on
 * which version of the data is being used.
 */
function getPatternList(track) {
  if (!track) {
    return [];
  }

  if (Array.isArray(track.gridList)) {
    return track.gridList.map(
      normalizePattern
    );
  }

  if (Array.isArray(track.grids)) {
    return track.grids.map(
      normalizePattern
    );
  }

  if (Array.isArray(track.patterns)) {
    return track.patterns.map(
      normalizePattern
    );
  }

  return [];
}

/*
 * Always save the normalized collection back
 * as gridList because that is the current
 * sequencer data structure.
 */
function normalizeTrack(track) {
  if (!track) {
    return null;
  }

  return {
    ...track,
    gridList: getPatternList(track),
  };
}

export default function SequencerPage() {
  const {
    track,
    setTrack,
    user,
    isAuthenticated,
    token,
  } = useAuth();

  const navigate = useNavigate();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const [selectedGridId, setSelectedGridId] =
    useState(null);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [currentStep, setCurrentStep] =
    useState(null);

  const [bpm, setBpm] =
    useState(120);

  const [projectName, setProjectName] =
    useState("");

  const [projectId, setProjectId] =
    useState(null);

  const [saveStatus, setSaveStatus] =
    useState("");

  const [loadId, setLoadId] =
    useState("");

  const [initialLoadDone, setInitialLoadDone] =
    useState(false);

  const stepCountRef =
    useRef(0);

  const trackRef =
    useRef(track);

  const gridRef =
    useRef(null);

  /*
   * Keep the track ref synchronized.
   */
  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  /*
   * Normalize incoming track data.
   *
   * This is important because TrackPage can
   * have patterns while the sequencer expects
   * gridList.
   */
  useEffect(() => {
    if (!track) {
      return;
    }

    const normalized =
      normalizeTrack(track);

    const originalPatterns =
      getPatternList(track);

    if (
      !Array.isArray(track.gridList) ||
      track.gridList.length !==
        originalPatterns.length
    ) {
      setTrack(normalized);
    }
  }, [track, setTrack]);

  /*
   * Get all patterns.
   */
  const patterns =
    getPatternList(track);

  /*
   * Select the pattern from the URL.
   */
  useEffect(() => {
    if (!patterns.length) {
      setSelectedGridId(null);
      return;
    }

    const patternIdFromUrl =
      searchParams.get("patternId");

    if (patternIdFromUrl) {
      const matchingPattern =
        patterns.find(
          (pattern) =>
            String(pattern.id) ===
            String(patternIdFromUrl)
        );

      if (matchingPattern) {
        setSelectedGridId(
          matchingPattern.id
        );

        return;
      }
    }

    /*
     * Otherwise select the first pattern.
     */
    setSelectedGridId(
      patterns[0].id
    );
  }, [
    track,
    searchParams,
  ]);

  /*
   * Currently selected pattern.
   */
  const currentGrid =
    patterns.find(
      (pattern) =>
        String(pattern.id) ===
        String(selectedGridId)
    ) || null;

  /*
   * Keep current pattern available to
   * Tone.Transport callbacks.
   */
  useEffect(() => {
    gridRef.current =
      currentGrid;
  }, [currentGrid]);

  /*
   * Change selected pattern.
   */
  const handlePatternChange = (
    gridId
  ) => {
    setSelectedGridId(gridId);

    setSearchParams({
      patternId: gridId,
    });

    setCurrentStep(null);

    stepCountRef.current = 0;
  };

  /*
   * Update the selected pattern.
   */
  const updateCurrentGrid = (
    updater
  ) => {
    if (
      selectedGridId === null ||
      selectedGridId === undefined
    ) {
      return;
    }

    setTrack((prev) => {
      if (!prev) {
        return prev;
      }

      const existingPatterns =
        getPatternList(prev);

      return {
        ...prev,

        gridList:
          existingPatterns.map(
            (pattern) =>
              String(pattern.id) ===
              String(selectedGridId)
                ? normalizePattern(
                    updater(pattern)
                  )
                : pattern
          ),
      };
    });
  };

  /*
   * Play an individual event.
   */
  const playEvent = (
    event,
    time
  ) => {
    if (!event) {
      return;
    }

    const instrument =
      trackRef.current?.instrument ||
      "piano";

    if (
      INSTRUMENT_CONFIG[
        instrument
      ]?.type === "sample"
    ) {
      if (
        samples.has(instrument) &&
        samples
          .player(instrument)
          .loaded
      ) {
        samples
          .player(instrument)
          .start(time);
      }

      return;
    }

    if (
      instrument === "stab"
    ) {
      stabSynth.triggerAttackRelease(
        event.note || "G2",
        event.duration || "8n",
        time
      );

      return;
    }

    /*
     * Piano and pad currently use the
     * poly synth.
     */
    padSynth.triggerAttackRelease(
      event.note || "C4",
      event.duration || "4n",
      time
    );
  };

  /*
   * Sequencer playback.
   */
  useEffect(() => {
    const repeat = (time) => {
      const step =
        stepCountRef.current %
        NUM_STEPS;

      setCurrentStep(step);

      const grid =
        gridRef.current;

      if (
        grid &&
        Array.isArray(
          grid.events
        )
      ) {
        const eventsAtStep =
          grid.events.filter(
            (event) =>
              Number(event.step) ===
              step
          );

        eventsAtStep.forEach(
          (event) => {
            playEvent(
              event,
              time
            );
          }
        );
      }

      stepCountRef.current++;
    };

    const eventId =
      Tone.Transport.scheduleRepeat(
        repeat,
        "16n"
      );

    return () => {
      Tone.Transport.clear(
        eventId
      );
    };
  }, []);

  /*
   * BPM.
   */
  const handleBpmChange = (
    newBpm
  ) => {
    setBpm(newBpm);

    Tone.Transport.bpm.value =
      newBpm;
  };

  /*
   * Add/remove a step.
   */
  const toggleStep = async (
    stepIndex
  ) => {
    if (!currentGrid) {
      return;
    }

    await Tone.start();

    if (
      Tone.getContext()
        .state !== "running"
    ) {
      await Tone.getContext().resume();
    }

    const events =
      Array.isArray(
        currentGrid.events
      )
        ? currentGrid.events
        : [];

    const existingEvent =
      events.find(
        (event) =>
          Number(event.step) ===
          stepIndex
      );

    if (existingEvent) {
      updateCurrentGrid(
        (grid) => ({
          ...grid,

          events:
            grid.events.filter(
              (event) =>
                event.id !==
                existingEvent.id
            ),
        })
      );

      return;
    }

    const newEvent = {
      id:
        Date.now() +
        Math.random(),

      step: stepIndex,

      note:
        track?.instrument ===
        "stab"
          ? "G2"
          : "C4",

      duration:
        track?.instrument ===
        "stab"
          ? "8n"
          : "4n",
    };

    updateCurrentGrid(
      (grid) => ({
        ...grid,

        events: [
          ...grid.events,
          newEvent,
        ],
      })
    );

    playEvent(newEvent);
  };

  /*
   * Change note.
   */
  const updateEventNote = (
    eventId,
    note
  ) => {
    updateCurrentGrid(
      (grid) => ({
        ...grid,

        events:
          grid.events.map(
            (event) =>
              event.id ===
              eventId
                ? {
                    ...event,
                    note,
                  }
                : event
          ),
      })
    );
  };

  /*
   * Change duration.
   */
  const updateEventDuration = (
    eventId,
    duration
  ) => {
    updateCurrentGrid(
      (grid) => ({
        ...grid,

        events:
          grid.events.map(
            (event) =>
              event.id ===
              eventId
                ? {
                    ...event,
                    duration,
                  }
                : event
          ),
      })
    );
  };

  /*
   * Delete event.
   */
  const deleteEvent = (
    eventId
  ) => {
    updateCurrentGrid(
      (grid) => ({
        ...grid,

        events:
          grid.events.filter(
            (event) =>
              event.id !==
              eventId
          ),
      })
    );
  };

  /*
   * Play / stop.
   */
  const togglePlay = async () => {
    await Tone.start();

    if (
      Tone.getContext()
        .state !== "running"
    ) {
      await Tone.getContext().resume();
    }

    if (isPlaying) {
      Tone.Transport.stop();

      Tone.Transport.position = 0;

      stepCountRef.current = 0;

      setIsPlaying(false);
      setCurrentStep(null);

      return;
    }

    Tone.Transport.position = 0;

    stepCountRef.current = 0;

    Tone.Transport.bpm.value =
      bpm;

    Tone.Transport.start();

    setIsPlaying(true);
  };

  /*
   * Clear current pattern.
   */
  const clearGrid = () => {
    updateCurrentGrid(
      (grid) => ({
        ...grid,
        events: [],
      })
    );

    setCurrentStep(null);

    stepCountRef.current = 0;
  };

  /*
   * Apply loaded project.
   */
  const applyProject = (
    project
  ) => {
    setProjectName(
      project.name || ""
    );

    setProjectId(
      project.id || null
    );

    const projectTempo =
      project.tempo || 120;

    setBpm(projectTempo);

    Tone.Transport.bpm.value =
      projectTempo;

    /*
     * New format:
     *
     * project.track
     */
    if (project.track) {
      setTrack(
        normalizeTrack(
          project.track
        )
      );

      return;
    }

    /*
     * Alternative format where the API
     * returns gridList directly.
     */
    if (
      Array.isArray(
        project.gridList
      )
    ) {
      setTrack({
        id:
          project.id || null,

        name:
          project.name || "",

        instrument:
          project.instrument ||
          "piano",

        gridList:
          project.gridList.map(
            normalizePattern
          ),
      });

      return;
    }

    /*
     * Also support grids/patterns.
     */
    if (
      Array.isArray(
        project.grids
      ) ||
      Array.isArray(
        project.patterns
      )
    ) {
      setTrack(
        normalizeTrack({
          id:
            project.id || null,

          name:
            project.name || "",

          instrument:
            project.instrument ||
            "piano",

          grids:
            project.grids,

          patterns:
            project.patterns,
        })
      );
    }
  };

  /*
   * Auto-load project from URL.
   */
  useEffect(() => {
    const projectIdFromUrl =
      searchParams.get(
        "projectId"
      );

    if (
      !projectIdFromUrl ||
      initialLoadDone ||
      !user?.id
    ) {
      return;
    }

    const loadProjectFromUrl =
      async () => {
        setSaveStatus(
          "Loading project..."
        );

        try {
          const response =
            await fetch(
              `/api/users/${user.id}/projects/${projectIdFromUrl}`,
              {
                headers: {
                  Authorization:
                    token
                      ? `Bearer ${token}`
                      : "",
                },
              }
            );

          if (!response.ok) {
            const text =
              await response.text();

            throw new Error(
              text ||
                "Failed to load project"
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
        } finally {
          setInitialLoadDone(
            true
          );
        }
      };

    loadProjectFromUrl();
  }, [
    searchParams,
    token,
    user?.id,
    initialLoadDone,
  ]);

  /*
   * Save project.
   */
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
      track:
        normalizeTrack(track),
    };

    const isUpdate =
      Boolean(projectId);

    try {
      const url = isUpdate
        ? `/api/users/${user.id}/${projectId}`
        : `/api/users/${user.id}/projects`;

      const method = isUpdate
        ? "PUT"
        : "POST";

      const response =
        await fetch(url, {
          method,

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              token
                ? `Bearer ${token}`
                : "",
          },

          body: JSON.stringify(
            payload
          ),
        });

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            "Failed to save project"
        );
      }

      const project =
        await response.json();

      setProjectId(
        project.id
      );

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

  /*
   * Load project by ID.
   */
  const loadProject = async () => {
    if (!loadId.trim()) {
      setSaveStatus(
        "Please enter a project ID to load."
      );

      return;
    }

    try {
      const response =
        await fetch(
          `/api/projects/${loadId.trim()}`,
          {
            headers: {
              Authorization:
                token
                  ? `Bearer ${token}`
                  : "",
            },
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            "Failed to load project"
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

  /*
   * Determine whether a pattern has
   * an event at this step.
   */
  const isStepActive = (
    pattern,
    stepIndex
  ) => {
    if (
      !pattern ||
      !Array.isArray(
        pattern.events
      )
    ) {
      return false;
    }

    return pattern.events.some(
      (event) =>
        Number(event.step) ===
        stepIndex
    );
  };

  /*
   * Count events safely.
   */
  const getEventCount = (
    pattern
  ) => {
    return Array.isArray(
      pattern?.events
    )
      ? pattern.events.length
      : 0;
  };

  /*
   * No track.
   */
  if (!track) {
    return (
      <main className="sequencer">
        <button
          className="back-btn"
          onClick={() =>
            navigate("/track")
          }
        >
          ΓåÉ Track
        </button>

        <section className="hero-card">
          <div>
            <p className="eyebrow">
              Sequencer
            </p>

            <h1>
              No track loaded
            </h1>

            <p className="hero-text">
              Create or customize a
              track before opening the
              sequencer.
            </p>
          </div>
        </section>
      </main>
    );
  }

  /*
   * No patterns.
   */
  if (!patterns.length) {
    return (
      <main className="sequencer">
        <button
          className="back-btn"
          onClick={() =>
            navigate("/track")
          }
        >
          ΓåÉ Track
        </button>

        <section className="hero-card">
          <div>
            <p className="eyebrow">
              Sequencer
            </p>

            <h1>
              {track.name ||
                "Untitled Track"}
            </h1>

            <p className="hero-text">
              This track does not have
              any patterns yet.
            </p>
          </div>

          <div className="status-badge">
            <span className="status-dot stopped" />
            No patterns
          </div>
        </section>

        <section className="empty-pattern-card">
          <div className="empty-pattern-icon">
            ΓÖ¬
          </div>

          <h2>
            No patterns created
          </h2>

          <p>
            Go to Manage Patterns to
            create your first pattern.
          </p>

          <button
            onClick={() =>
              navigate("/track")
            }
          >
            Manage Patterns
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="sequencer">
      <section className="hero-card">
        <div>
          <p className="eyebrow">
            BeatForge Sequencer
          </p>

          <h1>
            {track.name ||
              "Untitled Track"}
          </h1>

          <p className="hero-text">
            {currentGrid?.name ||
              "Pattern"}{" "}
            ┬╖{" "}
            {track.instrument ||
              "piano"}{" "}
            ┬╖{" "}
            {getEventCount(
              currentGrid
            )}{" "}
            beats
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
          <button
            className="primary-control"
            onClick={togglePlay}
          >
            {isPlaying
              ? "ΓÅ╣ Stop"
              : "Γû╢ Play"}
          </button>

          <button
            onClick={clearGrid}
          >
            Clear Pattern
          </button>

          <button
            onClick={() =>
              navigate("/track")
            }
          >
            Manage Patterns
          </button>
        </div>

        <label className="bpm-control">
          <span>BPM</span>

          <input
            type="range"
            min="60"
            max="180"
            value={bpm}
            onChange={(e) =>
              handleBpmChange(
                Number(
                  e.target.value
                )
              )
            }
          />

          <strong>{bpm}</strong>
        </label>
      </section>

      {/*
       * Pattern selector
       */}
      <section className="pattern-header">
        <div>
          <p className="eyebrow">
            Patterns
          </p>

          <h2>
            Choose a pattern
          </h2>
        </div>

        <select
          className="pattern-select"
          value={
            selectedGridId ?? ""
          }
          onChange={(e) =>
            handlePatternChange(
              e.target.value
            )
          }
        >
          {patterns.map(
            (pattern) => (
              <option
                key={pattern.id}
                value={pattern.id}
              >
                {pattern.name}
              </option>
            )
          )}
        </select>
      </section>

      {/*
       * Main sequencer.
       *
       * This deliberately resembles the
       * original UI: pattern rows with
       * large 16-step buttons.
       */}
      <section className="tracks">
        {patterns.map(
          (pattern, patternIndex) => {
            const isSelected =
              String(
                pattern.id
              ) ===
              String(
                selectedGridId
              );

            const eventCount =
              getEventCount(
                pattern
              );

            return (
              <div
                key={pattern.id}
                className={`track-row ${
                  isSelected
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handlePatternChange(
                    pattern.id
                  )
                }
              >
                <div className="track-main">
                  <div className="track-identity">
                    <div className="track-number">
                      {String(
                        patternIndex +
                          1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div>
                      <span className="track-label">
                        {pattern.name}
                      </span>

                      <span className="track-meta">
                        {track.instrument ||
                          "piano"}{" "}
                        ┬╖{" "}
                        {eventCount}{" "}
                        {eventCount ===
                        1
                          ? "beat"
                          : "beats"}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="selected-pattern">
                      Editing
                    </span>
                  )}
                </div>

                <div
                  className="step-wrapper"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <div className="step-numbers">
                    {Array.from(
                      {
                        length:
                          NUM_STEPS,
                      },
                      (
                        _,
                        stepIndex
                      ) => (
                        <span
                          key={
                            stepIndex
                          }
                        >
                          {stepIndex +
                            1}
                        </span>
                      )
                    )}
                  </div>

                  <div className="step-row">
                    {Array.from(
                      {
                        length:
                          NUM_STEPS,
                      },
                      (
                        _,
                        stepIndex
                      ) => {
                        const active =
                          isStepActive(
                            pattern,
                            stepIndex
                          );

                        const playing =
                          currentStep ===
                            stepIndex &&
                          isPlaying;

                        return (
                          <button
                            key={
                              stepIndex
                            }
                            onClick={() => {
                              handlePatternChange(
                                pattern.id
                              );

                              toggleStep(
                                stepIndex
                              );
                            }}
                            className={`
                              ${
                                active
                                  ? "active"
                                  : ""
                              }
                              ${
                                playing
                                  ? "playing"
                                  : ""
                              }
                              ${
                                stepIndex %
                                  4 ===
                                3
                                  ? "beat-end"
                                  : ""
                              }
                            `}
                            aria-label={`${pattern.name} step ${
                              stepIndex +
                              1
                            }`}
                          />
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </section>

      {/*
       * Selected pattern details.
       */}
      {currentGrid && (
        <section className="events-list">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                Pattern Editor
              </p>

              <h2>
                {currentGrid.name}
              </h2>
            </div>

            <span className="event-count">
              {getEventCount(
                currentGrid
              )}{" "}
              notes
            </span>
          </div>

          {getEventCount(
            currentGrid
          ) === 0 ? (
            <div className="empty-events">
              <span>ΓÖ¬</span>

              <p>
                Click one of the 16
                steps above to add a
                beat.
              </p>
            </div>
          ) : (
            [...currentGrid.events]
              .sort(
                (a, b) =>
                  Number(a.step) -
                  Number(b.step)
              )
              .map((event) => (
                <div
                  key={event.id}
                  className="event-row"
                >
                  <span className="event-step">
                    Step{" "}
                    {Number(
                      event.step
                    ) + 1}
                  </span>

                  <input
                    type="text"
                    value={
                      event.note ||
                      "C4"
                    }
                    onChange={(e) =>
                      updateEventNote(
                        event.id,
                        e.target.value
                      )
                    }
                  />

                  <select
                    value={
                      event.duration ||
                      "4n"
                    }
                    onChange={(e) =>
                      updateEventDuration(
                        event.id,
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

                  <button
                    className="delete-event"
                    onClick={() =>
                      deleteEvent(
                        event.id
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              ))
          )}
        </section>
      )}

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

          <button
            onClick={
              saveProject
            }
          >
            {projectId
              ? "≡ƒÆ╛ Update Project"
              : "≡ƒÆ╛ Save Project"}
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
              setLoadId(
                e.target.value
              )
            }
          />

          <button
            onClick={
              loadProject
            }
          >
            ≡ƒôé Load Project
          </button>
        </div>

        {saveStatus && (
          <p className="save-status">
            {saveStatus}
          </p>
        )}
      </section>
    </main>
  );
}
