import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TRACK_LABELS } from "../sequencer/projectModel";
import ContextMenu from "./ContextMenu";
import "./ArrangementView.css";

const DEFAULT_BAR_WIDTH = 150; // pixels per bar (8 bars fit the panel at 100%)
const MIN_BAR_WIDTH = 25;
const MAX_BAR_WIDTH = 200;
const DRAG_THRESHOLD_PX = 4; // movement before a press becomes a drag

/** Clip face color rotates per source track so layers read at a glance. */
const CLIP_HUES = [195, 265, 145, 35, 320, 170, 55, 220];

const clampBarWidth = (value) =>
  Math.min(MAX_BAR_WIDTH, Math.max(MIN_BAR_WIDTH, Math.round(value)));

function clipColors(trackIndex) {
  const hue = CLIP_HUES[trackIndex % CLIP_HUES.length];
  return {
    backgroundColor: `hsl(${hue} 72% 62%)`,
    borderColor: `hsl(${hue} 72% 42%)`,
  };
}

function Clip({
  clip,
  barWidth,
  onRemove,
  isEditing,
  onEdit,
  onContextMenu,
  onRename,
  onMoveClip,
  onResizeClip,
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  /**
   * Hand-rolled snap-to-grid drag.
   *
   * Nothing is captured or prevented until the pointer moves past the
   * threshold, so clicks, double-clicks, context menus, and the remove
   * button all keep working natively.
   */
  const [dragBars, setDragBars] = useState(null); // null = not dragging
  const dragState = useRef(null);

  /** Live bar count while edge-resizing (null = not resizing). */
  const [resizeBars, setResizeBars] = useState(null);
  const resizeState = useRef(null);

  const isDragging = dragBars !== null;

  const effectiveBars = resizeBars ?? clip.bars;

  const style = {
    position: "absolute",
    left: `${clip.x * barWidth}px`,
    width: `${effectiveBars * barWidth}px`,
    transform: isDragging
      ? `translate3d(${dragBars * barWidth}px, 0, 0)`
      : undefined,
    zIndex: isDragging ? 10 : 1,
    ...clipColors(clip.sourceTrackIndex ?? clip.y),
  };

  const displayName = clip.name || "Clip";

  const handlePointerDown = (event) => {
    if (event.button !== 0 || isRenaming) {
      return;
    }

    dragState.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      snappedBars: 0,
      started: false,
      el: event.currentTarget,
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handlePointerMove = (event) => {
    const state = dragState.current;
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    const dx = event.clientX - state.startClientX;

    if (!state.started) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) {
        return;
      }
      state.started = true;
      try {
        state.el?.setPointerCapture(state.pointerId);
      } catch {
        // Synthetic events (tests) have no active pointer to capture
      }
    }

    // Snap to whole bars and never allow a target before bar 0
    state.snappedBars = Math.max(-clip.x, Math.round(dx / barWidth));
    setDragBars(state.snappedBars);
  };

  const handlePointerUp = (event) => {
    const state = dragState.current;

    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    dragState.current = null;

    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    setDragBars(null);

    // Never crossed the threshold -> it was a click, not a drag
    if (!state.started) {
      return;
    }

    const targetX = clip.x + state.snappedBars;
    if (targetX !== clip.x) {
      onMoveClip(clip.id, { x: targetX, y: clip.y });
    }
  };

  /* RIGHT-EDGE RESIZE (same hand-rolled pattern as the move drag) */

  const handleResizeStart = (event) => {
    if (event.button !== 0) {
      return;
    }
    // Never let a resize turn into a move drag
    event.stopPropagation();

    resizeState.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startBars: clip.bars,
      newBars: clip.bars,
      started: false,
    };

    window.addEventListener("pointermove", handleResizeMove);
    window.addEventListener("pointerup", handleResizeEnd);
  };

  const handleResizeMove = (event) => {
    const state = resizeState.current;
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    const dx = event.clientX - state.startClientX;

    if (!state.started && Math.abs(dx) < DRAG_THRESHOLD_PX) {
      return;
    }
    state.started = true;

    state.newBars = Math.max(1, state.startBars + Math.round(dx / barWidth));
    setResizeBars(state.newBars);
  };

  const handleResizeEnd = (event) => {
    const state = resizeState.current;

    window.removeEventListener("pointermove", handleResizeMove);
    window.removeEventListener("pointerup", handleResizeEnd);
    resizeState.current = null;

    if (!state || event.pointerId !== state.pointerId) {
      return;
    }

    setResizeBars(null);

    if (state.started && state.newBars !== clip.bars) {
      onResizeClip(clip.id, state.newBars);
    }
  };

  const startRename = (event) => {
    // Prevent the clip's own double-click (open editor) from firing
    event.stopPropagation();
    setNameDraft(displayName);
    setIsRenaming(true);
  };

  const commitRename = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== displayName) {
      onRename(clip.id, trimmed);
    }
    setIsRenaming(false);
  };

  return (
    <div
      style={style}
      className={`arrangement-clip ${isEditing ? "editing" : ""} ${isDragging ? "dragging" : ""}`}
      onPointerDown={handlePointerDown}
      onDoubleClick={(e) => {
        // Keep the lane's double-click (add clip) from also firing
        e.stopPropagation();
        onEdit(clip.id);
      }}
      onContextMenu={(e) => onContextMenu(e, clip.id)}
    >
      {isRenaming ? (
        <input
          className="clip-name-input"
          value={nameDraft}
          autoFocus
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="clip-name"
          title={`${displayName} (double-click to rename)`}
          onDoubleClick={startRename}
        >
          {displayName}
        </div>
      )}

      {Array.isArray(clip.grid?.[0]) && (
        <div className="clip-pattern-preview" aria-hidden="true">
          {clip.grid[0].map((active, stepIndex) => (
            <span
              key={stepIndex}
              className={`preview-step ${active ? "on" : ""}`}
            />
          ))}
        </div>
      )}

      <div
        className="clip-resize-handle"
        title="Drag to resize"
        onPointerDown={handleResizeStart}
        onDoubleClick={(e) => e.stopPropagation()}
      />

      <button
        className="clip-remove-btn"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(clip.id);
        }}
        title="Remove clip"
      >
        ×
      </button>
    </div>
  );
}

function SortableLane({
  trackIndex,
  trackName,
  clips,
  barWidth,
  editingClipId,
  onEditClip,
  onRemove,
  onContextMenu,
  onRenameClip,
  onRenameTrack,
  onMoveClip,
  onAddClipAtBar,
  onResizeClip,
  isMuted,
  isSoloed,
  onToggleMute,
  onToggleSolo,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trackIndex });

  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  const startRename = (event) => {
    event.stopPropagation();
    setNameDraft(trackName);
    setIsRenaming(true);
  };

  const commitRename = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== trackName) {
      onRenameTrack(trackIndex, trimmed);
    }
    setIsRenaming(false);
  };

  const handleLaneDoubleClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const bar = Math.floor((event.clientX - rect.left) / barWidth);
    onAddClipAtBar(trackIndex, Math.max(0, bar));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`track-lane ${isDragging ? "dragging" : ""}`}
    >
      <div className="track-lane-header">
        <span
          className="lane-drag-handle"
          title="Drag to reorder tracks"
          {...listeners}
          {...attributes}
        >
          ⠿
        </span>
        {isRenaming ? (
          <input
            className="track-name-input"
            value={nameDraft}
            autoFocus
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="track-lane-name"
            title={`${trackName} (double-click to rename)`}
            onDoubleClick={startRename}
          >
            {trackName}
          </span>
        )}
        <div className="lane-header-buttons">
          <button
            type="button"
            className={`lane-mute-btn ${isMuted ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute(trackIndex);
            }}
            title={isMuted ? "Unmute track" : "Mute track"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
          <button
            type="button"
            className={`lane-solo-btn ${isSoloed ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSolo(trackIndex);
            }}
            title={isSoloed ? "Unsolo track" : "Solo track"}
          >
            🎧
          </button>
        </div>
      </div>
      <div
        className="track-lane-clips"
        style={{ backgroundSize: `${barWidth}px 100%` }}
        onDoubleClick={handleLaneDoubleClick}
        title="Double-click empty space to add a clip"
      >
        {clips.map((clip) => (
          <Clip
            key={clip.id}
            clip={clip}
            barWidth={barWidth}
            onRemove={onRemove}
            isEditing={editingClipId === clip.id}
            onEdit={onEditClip}
            onContextMenu={onContextMenu}
            onRename={onRenameClip}
            onMoveClip={onMoveClip}
            onResizeClip={onResizeClip}
          />
        ))}
      </div>
    </div>
  );
}

export default function ArrangementView({
  arrangement,
  numTracks,
  trackOrder,
  trackSettings,
  onClearArrangement,
  onRemove,
  onEditClip,
  onDuplicateClip,
  onRenameClip,
  onRenameTrack,
  onReorderTracks,
  onMoveClip,
  onAddClipAtBar,
  onResizeClip,
  onPlayArrangement,
  onToggleLoop,
  loopArrangement,
  isPlaying,
  playheadBars,
  editingClipId,
  onToggleMute,
  onToggleSolo,
  onAddAllToArrangement,
  onSeekTo,
  loopStartBar,
  loopEndBar,
  arrangementEndBars,
  onSetLoopStartBar,
  onSetLoopEndBar,
}) {
  const [contextMenu, setContextMenu] = useState(null);

  const [barWidth, setBarWidth] = useState(DEFAULT_BAR_WIDTH);

  const [showEmptyLanes, setShowEmptyLanes] = useState(false);

  const lanesRef = useRef(null);

  const clipsByTrack = useMemo(() => {
    const byTrack = {};
    for (const clip of arrangement) {
      if (!byTrack[clip.y]) {
        byTrack[clip.y] = [];
      }
      byTrack[clip.y].push(clip);
    }
    return byTrack;
  }, [arrangement]);

  /**
   * Lanes render in the user-defined trackOrder. Any track indices missing
   * from trackOrder (e.g. newly added tracks) are appended, and any clip
   * lanes outside the current track count are kept visible at the bottom.
   */
  const laneOrder = useMemo(() => {
    const all = Array.from({ length: numTracks }, (_, i) => i);
    const valid = (trackOrder || []).filter((i) => all.includes(i));
    const missing = all.filter((i) => !valid.includes(i));
    const orphanedClipLanes = Object.keys(clipsByTrack)
      .map(Number)
      .filter((i) => !all.includes(i));
    return [...valid, ...missing, ...orphanedClipLanes];
  }, [trackOrder, numTracks, clipsByTrack]);

  /**
   * Dynamic lanes: by default only tracks that actually have clips are
   * shown. The toggle reveals every track lane.
   */
  const visibleLanes = useMemo(
    () =>
      showEmptyLanes
        ? laneOrder
        : laneOrder.filter((i) => clipsByTrack[i]?.length > 0),
    [showEmptyLanes, laneOrder, clipsByTrack],
  );

  /** Total bars visible on the timeline (with a little headroom). */
  const maxBar = useMemo(() => {
    const maxEnd = arrangement.reduce(
      (max, clip) => Math.max(max, clip.x + clip.bars),
      0,
    );
    return Math.max(8, maxEnd + 2);
  }, [arrangement]);

  /** Ruler label density: thin out labels when zoomed far out. */
  const rulerLabelEvery = barWidth >= 60 ? 1 : barWidth >= 35 ? 2 : 4;

  /* ZOOM */

  const zoomBy = (factor) => setBarWidth((w) => clampBarWidth(w * factor));

  const zoomToFit = () => {
    const containerWidth = lanesRef.current?.clientWidth ?? 800;
    setBarWidth(clampBarWidth((containerWidth - 140) / maxBar));
  };

  useEffect(() => {
    const el = lanesRef.current;
    if (!el) {
      return;
    }

    const onWheel = (event) => {
      if (!event.ctrlKey) {
        return;
      }
      event.preventDefault();
      setBarWidth((w) =>
        clampBarWidth(w * (event.deltaY < 0 ? 1.15 : 1 / 1.15)),
      );
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* LANE REORDER (vertical, handle-only) */

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  function handleLaneDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    // Reorder by track index — SequencerPage maps them into the full order
    onReorderTracks(active.id, over.id);
  }

  const handleContextMenu = (event, clipId) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      clipId,
    });
  };

  return (
    <div className="arrangement-view">
      <div className="arrangement-header">
        <h2>Arrangement</h2>

        <div className="arrangement-header-controls">
          <div className="zoom-controls" title="Zoom timeline (Ctrl + scroll)">
            <button onClick={() => zoomBy(1 / 1.25)} title="Zoom out">
              −
            </button>
            <input
              className="zoom-level-input"
              type="number"
              min={Math.round((MIN_BAR_WIDTH / DEFAULT_BAR_WIDTH) * 100)}
              max={Math.round((MAX_BAR_WIDTH / DEFAULT_BAR_WIDTH) * 100)}
              value={Math.round((barWidth / DEFAULT_BAR_WIDTH) * 100)}
              onChange={(e) => {
                const pct = parseFloat(e.target.value);
                if (!isNaN(pct) && pct > 0) {
                  setBarWidth(clampBarWidth((pct / 100) * DEFAULT_BAR_WIDTH));
                }
              }}
              title="Zoom percentage"
            />
            <span className="zoom-level-suffix">%</span>
            <button onClick={() => zoomBy(1.25)} title="Zoom in">
              +
            </button>
            <button onClick={zoomToFit} title="Zoom to fit arrangement">
              Fit
            </button>
          </div>

          <button
            className="add-all-btn"
            onClick={onAddAllToArrangement}
            title="Add all tracks with patterns as clips in the arrangement"
          >
            ➕ Add All
          </button>

          <button
            className={`play-arrangement-btn ${isPlaying ? "playing" : ""}`}
            onClick={onPlayArrangement}
          >
            {isPlaying ? "⏹ Stop Arrangement" : "▶ Play Arrangement"}
          </button>

          <button
            className={`loop-arrangement-btn ${loopArrangement ? "active" : ""}`}
            onClick={onToggleLoop}
            title={loopArrangement ? "Disable loop" : "Enable loop"}
          >
            {loopArrangement ? "🔁 Looping" : "🔁 Loop"}
          </button>

          <button
            className="clear-arrangement-btn"
            onClick={onClearArrangement}
            title="Remove all clips from the arrangement"
          >
            🧹 Clear
          </button>
        </div>
      </div>

      <div className="arrangement-lanes" ref={lanesRef}>
        <div
          className="lanes-scroll-content"
          style={{ minWidth: `${maxBar * barWidth + 130}px` }}
        >
          <div
            className="arrangement-ruler"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left - 130; // offset past header spacer
              const bar = Math.max(0, Math.round(x / barWidth));
              onSeekTo?.(bar);
            }}
            title="Click to seek"
          >
            <div className="ruler-header-spacer" />
            <div className="ruler-bars">
              {Array.from({ length: maxBar }, (_, bar) => (
                <div
                  key={bar}
                  className="ruler-bar"
                  style={{ width: `${barWidth}px` }}
                >
                  {bar % rulerLabelEvery === 0 ? bar + 1 : ""}
                </div>
              ))}
            </div>
            {/* Loop region highlight */}
            {loopArrangement && (
              <div
                className="loop-region-highlight"
                style={{
                  left: `${130 + loopStartBar * barWidth}px`,
                  width: `${((loopEndBar ?? arrangementEndBars) - loopStartBar) * barWidth}px`,
                }}
              />
            )}
            {/* Loop start handle */}
            {loopArrangement && (
              <div
                className="loop-handle loop-start-handle"
                style={{ left: `${130 + loopStartBar * barWidth - 4}px` }}
                title="Drag to set loop start"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const startX = e.clientX;
                  const startBar = loopStartBar;
                  const onMove = (ev) => {
                    const dx = ev.clientX - startX;
                    const newBar = Math.max(
                      0,
                      Math.min(
                        startBar + Math.round(dx / barWidth),
                        (loopEndBar ?? arrangementEndBars) - 1,
                      ),
                    );
                    onSetLoopStartBar?.(newBar);
                  };
                  const onUp = () => {
                    window.removeEventListener("pointermove", onMove);
                    window.removeEventListener("pointerup", onUp);
                  };
                  window.addEventListener("pointermove", onMove);
                  window.addEventListener("pointerup", onUp);
                }}
              />
            )}
            {/* Loop end handle */}
            {loopArrangement && (
              <div
                className="loop-handle loop-end-handle"
                style={{
                  left: `${130 + (loopEndBar ?? arrangementEndBars) * barWidth - 4}px`,
                }}
                title="Drag to set loop end"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const startX = e.clientX;
                  const startBar = loopEndBar ?? arrangementEndBars;
                  const onMove = (ev) => {
                    const dx = ev.clientX - startX;
                    const newBar = Math.max(
                      loopStartBar + 1,
                      Math.min(
                        startBar + Math.round(dx / barWidth),
                        arrangementEndBars,
                      ),
                    );
                    onSetLoopEndBar?.(newBar);
                  };
                  const onUp = () => {
                    window.removeEventListener("pointermove", onMove);
                    window.removeEventListener("pointerup", onUp);
                  };
                  window.addEventListener("pointermove", onMove);
                  window.addEventListener("pointerup", onUp);
                }}
              />
            )}
          </div>

          {isPlaying && playheadBars != null && (
            <div
              className="playhead"
              style={{ left: `${130 + playheadBars * barWidth}px` }}
            />
          )}

          {visibleLanes.length === 0 ? (
            <div className="arrangement-empty-state">
              <p>No clips in the arrangement yet.</p>
              <p>
                Use the ➕ button on any track row to add its pattern as a clip.
              </p>
            </div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleLaneDragEnd}>
              <SortableContext
                items={visibleLanes}
                strategy={verticalListSortingStrategy}
              >
                {visibleLanes.map((trackIndex) => (
                  <SortableLane
                    key={trackIndex}
                    trackIndex={trackIndex}
                    trackName={
                      trackSettings?.[trackIndex]?.name ||
                      TRACK_LABELS[trackIndex] ||
                      `Track ${trackIndex + 1}`
                    }
                    clips={clipsByTrack[trackIndex] || []}
                    barWidth={barWidth}
                    editingClipId={editingClipId}
                    onEditClip={onEditClip}
                    onRemove={onRemove}
                    onContextMenu={handleContextMenu}
                    onRenameClip={onRenameClip}
                    onRenameTrack={onRenameTrack}
                    onMoveClip={onMoveClip}
                    onAddClipAtBar={onAddClipAtBar}
                    onResizeClip={onResizeClip}
                    isMuted={trackSettings?.[trackIndex]?.muted || false}
                    isSoloed={trackSettings?.[trackIndex]?.soloed || false}
                    onToggleMute={onToggleMute}
                    onToggleSolo={onToggleSolo}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          options={[
            {
              label: "Duplicate",
              action: () => {
                onDuplicateClip(contextMenu.clipId);
                setContextMenu(null);
              },
            },
            {
              label: "Delete",
              action: () => {
                onRemove(contextMenu.clipId);
                setContextMenu(null);
              },
            },
          ]}
        />
      )}
    </div>
  );
}
