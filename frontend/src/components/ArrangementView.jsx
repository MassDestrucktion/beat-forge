import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { useDraggable } from "@dnd-kit/core";
import { TRACK_LABELS } from "../sequencer/projectModel";
import "./ArrangementView.css";

const BAR_WIDTH = 100; // pixels

function DraggableClip({ clip, onBarsChange, onRemove, isEditing, onEdit }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: clip.id,
    data: { type: 'move' },
  });

  const { attributes: resizeAttributes, listeners: resizeListeners, setNodeRef: resizeNodeRef } = useDraggable({
    id: `${clip.id}-resize`,
    data: { type: 'resize', clip },
  });

  const style = {
    position: 'absolute',
    left: `${clip.x * BAR_WIDTH}px`,
    width: `${clip.bars * BAR_WIDTH}px`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: transform ? 10 : 1,
  };

  const displayName = clip.name || `Clip`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`arrangement-clip ${isEditing ? 'editing' : ''}`}
      onDoubleClick={() => onEdit(clip.id)}
    >
      <div className="clip-content">
        <div className="clip-name" title={displayName}>
          {displayName}
        </div>

        <div className="clip-controls">
          {clip.sourceTrackIndex !== undefined && (
            <span className="clip-single-track-badge" title="Single track">
              🎵
            </span>
          )}
          <input
            type="number"
            min="1"
            max="16"
            value={clip.bars}
            onChange={(e) => onBarsChange(clip.id, Number(e.target.value))}
            className="clip-bars-input"
            onClick={(e) => e.stopPropagation()} // Prevent drag from starting
          />
          <span className="clip-bars-label">bars</span>
          <button
            className="clip-remove-btn"
            onClick={() => onRemove(clip.id)}
            title="Remove clip"
          >
            ×
          </button>
        </div>
      </div>
      <div
        ref={resizeNodeRef}
        {...resizeListeners}
        {...resizeAttributes}
        className="clip-resize-handle"
      />
    </div>
  );
}

export default function ArrangementView({
  arrangement,
  numTracks,
  onAddSection,
  onRemove,
  onRename,
  onBarsChange,
  onMoveClip,
  onClipResize, // New prop for resizing
  onPlayArrangement,
  isPlaying,
  editingClipId,
  onEditClip,
}) {
  const [activeDrag, setActiveDrag] = useState(null);

  const clipsByTrack = useMemo(() => {
    const byTrack = Array.from({ length: numTracks }, () => []);
    for (const clip of arrangement) {
      if (clip.y >= 0 && clip.y < numTracks) {
        byTrack[clip.y].push(clip);
      }
    }
    return byTrack;
  }, [arrangement, numTracks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event) {
    if (!activeDrag) return;

    const { active, delta } = event;
    const { type, clip } = activeDrag.data.current;

    if (type === 'move') {
      onMoveClip(active.id, { x: delta.x / BAR_WIDTH, y: 0 });
    } else if (type === 'resize') {
      const newBars = Math.max(1, Math.round((clip.bars * BAR_WIDTH + delta.x) / BAR_WIDTH));
      onBarsChange(clip.id, newBars);
    }

    setActiveDrag(null);
  }

  function handleDragStart(event) {
    setActiveDrag(event.active);
  }

  function handleDragMove(event) {
    if (!activeDrag) return;

    const { delta } = event;
    const { type, clip } = activeDrag.data.current;

    if (type === 'resize') {
      const newBars = Math.max(1, Math.round((clip.bars * BAR_WIDTH + delta.x) / BAR_WIDTH));
      onClipResize(clip.id, newBars);
    }
  }

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
      </div>

      <div className="arrangement-lanes">
                <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          {clipsByTrack.map((clips, trackIndex) => (
            <div key={trackIndex} className="track-lane">
              <div className="track-lane-header">
                {TRACK_LABELS[trackIndex] || `Track ${trackIndex + 1}`}
              </div>
              <div className="track-lane-clips">
                {clips.map((clip) => (
                  <DraggableClip
                    key={clip.id}
                    clip={clip}
                    onBarsChange={onBarsChange}
                    onRemove={onRemove}
                    isEditing={editingClipId === clip.id}
                    onEdit={onEditClip}
                  />
                ))}
              </div>
            </div>
          ))}
        </DndContext>
      </div>
    </div>
  );
}
