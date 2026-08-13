import { useNavigate } from "react-router";
import { useAuth } from "./AuthContext/AuthContext.jsx";
import "./App.css";

export default function TrackPage() {
  const {
    track,
    setTrack,
  } = useAuth();

  const navigate = useNavigate();

  /*
   * No track exists.
   */

  if (!track) {
    return (
      <main className="page">
        <button
          className="back-btn"
          onClick={() =>
            navigate("/sequencer")
          }
        >
          ΓåÉ Back to Sequencer
        </button>

        <section className="empty-state">
          <h1>No track loaded</h1>

          <p>
            Create or load a track
            first.
          </p>
        </section>
      </main>
    );
  }

  /*
   * Always normalize gridList.
   *
   * This prevents:
   *
   * track.gridList === undefined
   *
   * from breaking the page.
   */

  const gridList =
    Array.isArray(
      track.gridList
    )
      ? track.gridList
      : Array.isArray(
          track.grid_list
        )
      ? track.grid_list
      : [];

  /*
   * Add a new pattern.
   */

  const addGrid = () => {
    const newGrid = {
      id:
        Date.now() +
        Math.random(),

      name: `Pattern ${
        gridList.length + 1
      }`,

      events: [],
    };

    setTrack((previousTrack) => ({
      ...previousTrack,

      gridList: [
        ...(Array.isArray(
          previousTrack.gridList
        )
          ? previousTrack.gridList
          : []),

        newGrid,
      ],
    }));
  };

  /*
   * Delete pattern.
   */

  const deleteGrid = (
    gridId
  ) => {
    setTrack((previousTrack) => ({
      ...previousTrack,

      gridList:
        (
          Array.isArray(
            previousTrack.gridList
          )
            ? previousTrack.gridList
            : []
        ).filter(
          (grid) =>
            String(grid.id) !==
            String(gridId)
        ),
    }));
  };

  /*
   * Rename pattern.
   */

  const updateGridName = (
    gridId,
    name
  ) => {
    setTrack((previousTrack) => ({
      ...previousTrack,

      gridList:
        (
          Array.isArray(
            previousTrack.gridList
          )
            ? previousTrack.gridList
            : []
        ).map(
          (grid) =>
            String(grid.id) ===
            String(gridId)
              ? {
                  ...grid,
                  name,
                }
              : grid
        ),
    }));
  };

  /*
   * Open a pattern directly
   * in the sequencer.
   */

  const openPattern = (
    gridId
  ) => {
    navigate(
      `/sequencer?patternId=${encodeURIComponent(
        gridId
      )}`
    );
  };

  return (
    <main className="page">
      <header className="hero-card">
        <button
          className="back-btn"
          onClick={() =>
            navigate("/sequencer")
          }
        >
          ΓåÉ Back to Sequencer
        </button>

        <div>
          <p className="eyebrow">
            Track
          </p>

          <h1>
            {track.name ||
              "Untitled Track"}
          </h1>

          <span className="instrument-label">
            Instrument:{" "}
            {track.instrument ||
              "piano"}
          </span>
        </div>

        <button
          className="add-grid-btn"
          onClick={addGrid}
        >
          + Add Pattern
        </button>
      </header>

      <section className="grid-list">
        {gridList.length ===
        0 ? (
          <div className="empty-grid-list">
            <div className="empty-pattern-icon">
              ΓÖ¬
            </div>

            <h2>
              No patterns yet
            </h2>

            <p>
              Add your first pattern
              to start building this
              track.
            </p>

            <button
              onClick={addGrid}
            >
              + Add Pattern
            </button>
          </div>
        ) : (
          gridList.map(
            (grid) => {
              const events =
                Array.isArray(
                  grid.events
                )
                  ? grid.events
                  : [];

              /*
               * Build a visual 16-step
               * preview.
               */

              const activeSteps =
                new Set(
                  events.map(
                    (event) =>
                      Number(
                        event.step
                      )
                  )
                );

              return (
                <article
                  key={grid.id}
                  className="grid-card"
                >
                  <div className="grid-card-header">
                    <div>
                      <input
                        type="text"
                        value={
                          grid.name ||
                          "Untitled Pattern"
                        }
                        onChange={(
                          event
                        ) =>
                          updateGridName(
                            grid.id,
                            event
                              .target
                              .value
                          )
                        }
                      />

                      <span>
                        {
                          events.length
                        }{" "}
                        {events.length ===
                        1
                          ? "note"
                          : "notes"}
                      </span>
                    </div>

                    <div className="grid-actions">
                      <button
                        onClick={() =>
                          openPattern(
                            grid.id
                          )
                        }
                      >
                        Open
                      </button>

                      <button
                        className="delete-grid-btn"
                        onClick={() =>
                          deleteGrid(
                            grid.id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <button
                    className="pattern-preview-button"
                    onClick={() =>
                      openPattern(
                        grid.id
                      )
                    }
                    aria-label={`Open ${grid.name}`}
                  >
                    <div className="step-labels">
                      {Array.from(
                        {
                          length: 16,
                        },
                        (
                          _,
                          index
                        ) => (
                          <span
                            key={
                              index
                            }
                          >
                            {index +
                              1}
                          </span>
                        )
                      )}
                    </div>

                    <div className="pattern-notes">
                      {Array.from(
                        {
                          length: 16,
                        },
                        (
                          _,
                          stepIndex
                        ) => (
                          <div
                            key={
                              stepIndex
                            }
                            className={`
                              preview-step
                              ${
                                activeSteps.has(
                                  stepIndex
                                )
                                  ? "active"
                                  : ""
                              }
                            `}
                          >
                            {activeSteps.has(
                              stepIndex
                            ) && (
                              <span>
                                ΓùÅ
                              </span>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </button>

                  <div className="pattern-card-footer">
                    <span>
                      {
                        events.length
                      }{" "}
                      notes
                    </span>

                    <button
                      onClick={() =>
                        openPattern(
                          grid.id
                        )
                      }
                    >
                      Edit Pattern ΓåÆ
                    </button>
                  </div>
                </article>
              );
            }
          )
        )}
      </section>
    </main>
  );
}

