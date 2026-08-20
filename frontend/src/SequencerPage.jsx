import * as Tone from "tone";

import { useState, useEffect } from "react";

import { useNavigate, useLocation } from "react-router";

import { getSoundById } from "./audio/soundLibrary";

import ArrangementView from "./components/ArrangementView.jsx";
import TrackRow from "./components/TrackRow.jsx";
import SequencerToolbar from "./components/SequencerToolbar.jsx";
import SaveLoadPanel from "./components/SaveLoadPanel.jsx";
import ClipEditorModal from "./components/ClipEditorModal.jsx";

import {
  MIN_TRACKS,
  MAX_TRACKS,
  NUM_STEPS,
  TRACK_LABELS,
  DEFAULT_TRACK_SOUNDS,
  createEmptyGrid,
  createEmptyStepNotes,
  createDefaultTrackSettings,
  createDefaultTrack,
  generateSmartPattern,
  generateArpNotes,
} from "./sequencer/projectModel";

import { useAudioGraph } from "./sequencer/useAudioGraph";

import { useTransport } from "./sequencer/useTransport";

import { useProjectPersistence } from "./sequencer/useProjectPersistence";

import { useKeyboardInput } from "./sequencer/useKeyboardInput";

import { downloadTrackAsWav } from "./sequencer/wavExport";
import { arrayMove } from "@dnd-kit/sortable";

import "./App.css";

export default function SequencerPage() {
  const navigate = useNavigate();

  const location = useLocation();

  /* MUSICAL STATE */

  const [numTracks, setNumTracks] = useState(MIN_TRACKS);

  const [grid, setGrid] = useState(createEmptyGrid);

  const [stepNotes, setStepNotes] = useState(createEmptyStepNotes);

  const [bpm, setBpm] = useState(120);

  const [trackSettings, setTrackSettings] = useState(
    createDefaultTrackSettings,
  );

  const [expandedTrack, setExpandedTrack] = useState(null);

  const [keysEnabled, setKeysEnabled] = useState(false);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);

  const [arrangement, setArrangement] = useState([]);
  const [editingClipId, setEditingClipId] = useState(null);

  const [masterVolume, setMasterVolume] = useState(0);

  /**
   * Display order of the arrangement track lanes. Clip data (clip.y) is
   * never changed by reordering — this is purely visual.
   */
  const [trackOrder, setTrackOrder] = useState(() =>
    Array.from({ length: MIN_TRACKS }, (_, i) => i),
  );

  /* AUDIO + TRANSPORT + PERSISTENCE */

  const { playTrackSound, previewSound } = useAudioGraph({
    numTracks,

    trackSettings,
  });

  const {
    isPlaying,
    isArrangementPlaying,
    currentStep,
    playheadBars,
    loopArrangement,

    togglePlay,
    toggleArrangementPlay,
    toggleArrangementLoop,
    resetTransport,
    seekTo,
    setLoopStartBar,
    setLoopEndBar,
    loopStartBar,
    loopEndBar,
    arrangementEndBars,
  } = useTransport({
    grid,

    stepNotes,

    arrangement,

    bpm,

    playTrackSound,
  });

  const {
    projectName,
    setProjectName,

    projectDescription,
    setProjectDescription,

    projectId,
    setProjectId,

    saveStatus,
    setSaveStatus,

    sharedId,
    setSharedId,

    isSharedView,
    setIsSharedView,

    sharedBy,
    setSharedBy,

    setLoadId,

    setInitialLoadDone,

    setSearchParams,

    saveProject,
    shareProject,
    addToMyLibrary,
  } = useProjectPersistence({
    bpm,

    grid,

    stepNotes,

    trackSettings,

    arrangement,

    trackOrder,

    setBpm,

    setGrid,

    setStepNotes,

    setTrackSettings,

    setNumTracks,

    setArrangement,

    setTrackOrder,
  });

  /* RETURN FROM CUSTOMIZE TRACK */

  useEffect(() => {
    const returnedState = location.state;

    if (!returnedState?.fromCustomize) {
      return;
    }

    if (Array.isArray(returnedState.grid)) {
      setGrid(returnedState.grid);

      setNumTracks(
        Math.min(Math.max(returnedState.grid.length, MIN_TRACKS), MAX_TRACKS),
      );
    }

    if (Array.isArray(returnedState.trackSettings)) {
      setTrackSettings(
        returnedState.trackSettings.map((track) => ({
          ...track,
          muted: track?.muted ?? false,
          soloed: track?.soloed ?? false,
        })),
      );
    }

    if (returnedState.bpm !== undefined) {
      setBpm(returnedState.bpm);
      Tone.Transport.bpm.value = returnedState.bpm;
    }

    if (returnedState.projectName !== undefined) {
      setProjectName(returnedState.projectName);
    }

    if (returnedState.projectDescription !== undefined) {
      setProjectDescription(returnedState.projectDescription);
    }

    if (returnedState.projectId !== undefined) {
      setProjectId(returnedState.projectId);
    }

    setInitialLoadDone(true);

    navigate("/sequencer", {
      replace: true,
      state: null,
    });
  }, [location.state, navigate]);

  /* TRACK HANDLERS   */

  const toggleTrackExpand = (trackIndex) => {
    setExpandedTrack(expandedTrack === trackIndex ? null : trackIndex);
  };

  const previewTrackInline = async (trackIndex) => {
    await Tone.start();

    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    playTrackSound(trackIndex);
  };

  const addTrack = () => {
    if (numTracks >= MAX_TRACKS) {
      return;
    }

    const soundId = DEFAULT_TRACK_SOUNDS[numTracks] || DEFAULT_TRACK_SOUNDS[0];

    setNumTracks((previous) => previous + 1);

    setGrid((previous) => [...previous, Array(NUM_STEPS).fill(false)]);

    setStepNotes((previous) => [...previous, Array(NUM_STEPS).fill(null)]);

    setTrackSettings((previous) => [...previous, createDefaultTrack(soundId)]);

    // The new track's index equals the pre-increment numTracks value
    setTrackOrder((previous) => [...previous, numTracks]);
  };

  const removeTrack = () => {
    if (numTracks <= MIN_TRACKS) {
      return;
    }

    const newNumTracks = numTracks - 1;

    setNumTracks(newNumTracks);

    setGrid((previous) => previous.slice(0, newNumTracks));

    setStepNotes((previous) => previous.slice(0, newNumTracks));

    setTrackSettings((previous) => previous.slice(0, newNumTracks));

    // The removed track is always the last index
    setTrackOrder((previous) =>
      previous.filter((index) => index !== numTracks - 1),
    );
  };

  const toggleStep = async (trackIndex, stepIndex) => {
    await Tone.start();

    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    setGrid((previous) => {
      const updatedGrid = previous.map((track) => [...track]);

      const isTurningOn = !updatedGrid[trackIndex][stepIndex];

      updatedGrid[trackIndex][stepIndex] = isTurningOn;

      if (isTurningOn) {
        playTrackSound(trackIndex);
      }

      return updatedGrid;
    });
  };

  const toggleTrackMute = (trackIndex) => {
    setTrackSettings((previous) =>
      previous.map((track, index) => {
        if (index !== trackIndex) {
          return track;
        }

        return {
          ...track,
          muted: !track?.muted,
        };
      }),
    );
  };

  const toggleTrackSolo = (trackIndex) => {
    setTrackSettings((previous) =>
      previous.map((track, index) => {
        if (index !== trackIndex) {
          return track;
        }

        return {
          ...track,
          soloed: !track?.soloed,
        };
      }),
    );
  };

  const clearTrackPattern = (trackIndex) => {
    setGrid((previous) =>
      previous.map((track, index) =>
        index === trackIndex ? Array(NUM_STEPS).fill(false) : track,
      ),
    );

    setStepNotes((previous) =>
      previous.map((row, index) =>
        index === trackIndex ? Array(NUM_STEPS).fill(null) : row,
      ),
    );
  };

  const randomizePattern = (trackIndex) => {
    setStepNotes((previous) =>
      previous.map((row, index) =>
        index === trackIndex ? Array(NUM_STEPS).fill(null) : row,
      ),
    );

    setGrid((previous) =>
      previous.map((track, index) =>
        index === trackIndex ? generateSmartPattern() : track,
      ),
    );
  };

  const randomizeArp = (trackIndex) => {
    const pattern = generateSmartPattern();
    const notes = generateArpNotes(pattern);

    setGrid((previous) =>
      previous.map((track, index) => (index === trackIndex ? pattern : track)),
    );

    setStepNotes((previous) =>
      previous.map((row, index) => (index === trackIndex ? notes : row)),
    );
  };

  const setStepsRange = (trackIndex, fromStep, toStep, value) => {
    setGrid((previous) =>
      previous.map((track, index) => {
        if (index !== trackIndex) return track;
        const row = [...track];
        const start = Math.min(fromStep, toStep);
        const end = Math.max(fromStep, toStep);
        for (let i = start; i <= end; i++) {
          row[i] = value;
        }
        return row;
      }),
    );
  };

  const nudgePattern = (trackIndex, direction) => {
    const shiftRow = (row) => {
      const copy = [...row];
      if (direction === "right") {
        const last = copy.pop();
        copy.unshift(last);
      } else {
        const first = copy.shift();
        copy.push(first);
      }
      return copy;
    };

    setGrid((previous) =>
      previous.map((track, index) =>
        index === trackIndex ? shiftRow(track) : track,
      ),
    );

    setStepNotes((previous) =>
      previous.map((row, index) =>
        index === trackIndex ? shiftRow(row) : row,
      ),
    );
  };

  const { octave: keyboardOctave } = useKeyboardInput({
    enabled: keysEnabled,
    playTrackSound,
    togglePlay,
    onToggleStep: toggleStep,
    onSetNote: (trackIndex, note) =>
      updateTrackSetting(trackIndex, "note", note),
    onClearTrack: clearTrackPattern,
    onSelectTrack: setSelectedTrackIndex,
    selectedTrackIndex,
    numTracks,
  });

  const updateTrackSound = (trackIndex, soundId) => {
    const sound = getSoundById(soundId);

    if (!sound) {
      console.warn(`Sound not found: ${soundId}`);

      return;
    }

    setTrackSettings((previous) =>
      previous.map((track, index) => {
        if (index !== trackIndex) {
          return track;
        }

        return {
          ...track,

          sound: sound.id,

          note:
            sound.type === "synth"
              ? (track.note ?? sound.synth?.note ?? "C4")
              : undefined,

          duration:
            sound.type === "synth"
              ? (track.duration ?? sound.synth?.duration ?? "8n")
              : undefined,
        };
      }),
    );
  };

  const updateTrackSetting = (trackIndex, key, value) => {
    setTrackSettings((previous) =>
      previous.map((track, index) =>
        index === trackIndex
          ? {
              ...track,
              [key]: value,
            }
          : track,
      ),
    );
  };

  const renameTrack = (trackIndex, name) => {
    updateTrackSetting(trackIndex, "name", name);
  };

  const setStepNote = (trackIndex, stepIndex, note) => {
    setStepNotes((previous) =>
      previous.map((row, index) => {
        if (index !== trackIndex) return row;
        const updated = [...row];
        updated[stepIndex] = note;
        return updated;
      }),
    );
  };

  /**
   * Reorder lanes by track index (not position) so it works even when
   * only a subset of lanes is visible in the arrangement view.
   */
  const reorderTracks = (activeTrackIndex, overTrackIndex) => {
    setTrackOrder((previous) => {
      const oldIndex = previous.indexOf(activeTrackIndex);
      const newIndex = previous.indexOf(overTrackIndex);
      if (oldIndex === -1 || newIndex === -1) {
        return previous;
      }
      return arrayMove(previous, oldIndex, newIndex);
    });
  };

  /* TRANSPORT HANDLERS */

  const handleBpmChange = (newBpm) => {
    setBpm(newBpm);
    Tone.Transport.bpm.value = newBpm;
  };

  const handleMasterVolumeChange = (value) => {
    setMasterVolume(value);
    Tone.Destination.volume.value = value;
  };

  const clearGrid = () => {
    setGrid(createEmptyGrid(numTracks));
    setStepNotes(createEmptyStepNotes(numTracks));
  };

  const handleNewProject = () => {
    resetTransport();

    setProjectName("");
    setProjectDescription("");

    setProjectId(null);
    setSharedId(null);

    setIsSharedView(false);
    setSharedBy("");

    setArrangement([]);

    setTrackOrder(Array.from({ length: MIN_TRACKS }, (_, i) => i));

    setGrid(createEmptyGrid(MIN_TRACKS));

    setStepNotes(createEmptyStepNotes(MIN_TRACKS));

    setTrackSettings(createDefaultTrackSettings(MIN_TRACKS));

    setNumTracks(MIN_TRACKS);

    setBpm(120);

    Tone.Transport.bpm.value = 120;

    setSaveStatus("");
    setLoadId("");

    setInitialLoadDone(false);

    setSearchParams({});
  };

  const handleDownloadWav = async () => {
    try {
      setSaveStatus("Rendering track...");

      await downloadTrackAsWav({
        grid,

        stepNotes,

        trackSettings,

        bpm,
      });

      setSaveStatus("Track downloaded successfully.");
    } catch (error) {
      console.error(error);

      setSaveStatus(`Download failed: ${error.message}`);
    }
  };

  /* ARRANGEMENT HANDLERS  */

  const clearArrangement = () => {
    setArrangement([]);
  };

  const removeClip = (clipId) => {
    console.log("Removing clip:", clipId);
    setArrangement((prev) => prev.filter((clip) => clip.id !== clipId));
  };

  const handleClipNameChange = (clipId, newName) => {
    setArrangement((prev) =>
      prev.map((clip) =>
        clip.id === clipId ? { ...clip, name: newName } : clip,
      ),
    );
  };

  /**
   * Resize a clip (right-edge drag). Minimum 1 bar; growth is clamped so
   * the clip never swallows the next clip in its lane.
   */
  const handleClipBarsChange = (clipId, newBars) => {
    setArrangement((prev) => {
      const clip = prev.find((c) => c.id === clipId);
      if (!clip) {
        return prev;
      }

      const bars = Math.max(1, Math.round(newBars));

      const nextClip = prev
        .filter((c) => c.y === clip.y && c.id !== clipId && c.x > clip.x)
        .sort((a, b) => a.x - b.x)[0];

      const maxBars = nextClip ? nextClip.x - clip.x : Infinity;
      const clampedBars = Math.min(bars, maxBars);

      if (clampedBars < 1) {
        return prev;
      }

      return prev.map((c) =>
        c.id === clipId ? { ...c, bars: clampedBars } : c,
      );
    });
  };

  const handleUpdateClipGrid = (clipId, newGrid) => {
    setArrangement((prev) =>
      prev.map((clip) =>
        clip.id === clipId ? { ...clip, grid: newGrid } : clip,
      ),
    );
  };

  const handleDuplicateClip = (clipId) => {
    setArrangement((prevArrangement) => {
      const clipToDuplicate = prevArrangement.find((c) => c.id === clipId);
      if (!clipToDuplicate) {
        return prevArrangement;
      }

      /**
       * Intelligent placement: scan forward from the end of the original
       * clip for the first gap that fits the duplicate. If the rest of the
       * lane is packed, the duplicate lands at the end of the timeline.
       */
      const laneClips = prevArrangement
        .filter((c) => c.y === clipToDuplicate.y && c.id !== clipId)
        .sort((a, b) => a.x - b.x);

      let candidateX = clipToDuplicate.x + clipToDuplicate.bars;

      for (const other of laneClips) {
        const overlaps =
          candidateX < other.x + other.bars &&
          other.x < candidateX + clipToDuplicate.bars;

        if (overlaps) {
          candidateX = other.x + other.bars;
        }
      }

      const newClip = {
        ...clipToDuplicate,
        id: crypto.randomUUID(),
        x: candidateX,
      };

      const clipIndex = prevArrangement.findIndex((c) => c.id === clipId);
      const newArrangement = [...prevArrangement];
      newArrangement.splice(clipIndex + 1, 0, newClip);

      return newArrangement;
    });
  };

  const moveClip = (id, newPosition) => {
    setArrangement((prevArrangement) => {
      const clip = prevArrangement.find((c) => c.id === id);
      if (!clip) {
        return prevArrangement;
      }

      const targetX = Math.max(0, newPosition.x);

      /**
       * Reject drops that would overlap another clip in the same lane —
       * the clip simply snaps back to its original position.
       */
      const overlaps = prevArrangement.some(
        (other) =>
          other.id !== id &&
          other.y === clip.y &&
          targetX < other.x + other.bars &&
          other.x < targetX + clip.bars,
      );

      if (overlaps) {
        return prevArrangement;
      }

      return prevArrangement.map((c) =>
        c.id === id ? { ...c, x: targetX } : c,
      );
    });
  };

  const addTrackToArrangement = (trackIndex) => {
    setArrangement((prevArrangement) => {
      const clipsInTrack = prevArrangement.filter(
        (clip) => clip.y === trackIndex,
      );
      const nextX = clipsInTrack.reduce(
        (max, clip) => Math.max(max, clip.x + clip.bars),
        0,
      );

      const newClip = {
        id: crypto.randomUUID(),
        name: trackSettings[trackIndex]?.name || TRACK_LABELS[trackIndex] || "",
        bars: 1,
        grid: [grid[trackIndex]],
        stepNotes: [stepNotes[trackIndex] || []],
        settings: { ...trackSettings[trackIndex] }, // Copy track settings
        tempo: bpm,
        sourceTrackIndex: trackIndex,
        x: nextX, // This will now represent the bar number
        y: trackIndex,
      };

      return [...prevArrangement, newClip];
    });
  };

  /**
   * Double-click on empty lane space: drop a 1-bar clip at that bar.
   * Refused if the spot overlaps an existing clip in the lane.
   */
  const addAllToArrangement = () => {
    for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
      if (grid[trackIndex]?.some(Boolean)) {
        addTrackToArrangement(trackIndex);
      }
    }
  };

  const addClipAtBar = (trackIndex, bar) => {
    setArrangement((prevArrangement) => {
      const overlaps = prevArrangement.some(
        (c) => c.y === trackIndex && bar < c.x + c.bars && c.x < bar + 1,
      );

      if (overlaps) {
        return prevArrangement;
      }

      const newClip = {
        id: crypto.randomUUID(),
        name: trackSettings[trackIndex]?.name || TRACK_LABELS[trackIndex] || "",
        bars: 1,
        grid: [grid[trackIndex]],
        stepNotes: [stepNotes[trackIndex] || []],
        settings: { ...trackSettings[trackIndex] },
        tempo: bpm,
        sourceTrackIndex: trackIndex,
        x: bar,
        y: trackIndex,
      };

      return [...prevArrangement, newClip];
    });
  };

  /* RENDER */

  return (
    <main className="sequencer-page">
      <SequencerToolbar
        isPlaying={isPlaying}
        isSharedView={isSharedView}
        projectName={projectName}
        sharedBy={sharedBy}
        numTracks={numTracks}
        bpm={bpm}
        onTogglePlay={togglePlay}
        onClearGrid={clearGrid}
        onDownloadWav={handleDownloadWav}
        onNewProject={handleNewProject}
        onAddTrack={addTrack}
        onRemoveTrack={removeTrack}
        onBpmChange={handleBpmChange}
        masterVolume={masterVolume}
        onMasterVolumeChange={handleMasterVolumeChange}
      />

      <SaveLoadPanel
        projectName={projectName}
        onProjectNameChange={setProjectName}
        projectDescription={projectDescription}
        onProjectDescriptionChange={setProjectDescription}
        projectId={projectId}
        sharedId={sharedId}
        isSharedView={isSharedView}
        sharedBy={sharedBy}
        saveStatus={saveStatus}
        onSave={saveProject}
        onShare={shareProject}
        onAddToLibrary={addToMyLibrary}
        onCopyShareLink={() => {
          const link = `${window.location.origin}/sequencer?sharedId=${sharedId}`;

          navigator.clipboard.writeText(link);

          setSaveStatus("Share link copied to clipboard!");
        }}
      />

      <div className="tracks">
        {grid.map((track, trackIndex) => (
          <TrackRow
            key={trackIndex}
            trackIndex={trackIndex}
            track={track}
            stepNotes={stepNotes[trackIndex]}
            trackSetting={trackSettings[trackIndex]}
            expandedTrack={expandedTrack}
            currentStep={currentStep}
            isPlaying={isPlaying}
            onToggleStep={toggleStep}
            onToggleMute={toggleTrackMute}
            onToggleSolo={toggleTrackSolo}
            onClearPattern={clearTrackPattern}
            onUpdateSound={updateTrackSound}
            onUpdateSetting={updateTrackSetting}
            onToggleExpand={toggleTrackExpand}
            onPreview={previewTrackInline}
            onAddToArrangement={addTrackToArrangement}
            onRenameTrack={renameTrack}
            onPreviewSound={previewSound}
            onRandomPattern={randomizePattern}
            onRandomArp={randomizeArp}
            isKeyboardSelected={
              keysEnabled && selectedTrackIndex === trackIndex
            }
            onSelectTrack={(idx) => setSelectedTrackIndex(idx)}
            onToggleKeys={(trackIndex) => {
              if (keysEnabled && selectedTrackIndex === trackIndex) {
                setKeysEnabled(false);
              } else {
                setKeysEnabled(true);
                setSelectedTrackIndex(trackIndex);
              }
            }}
            keyboardOctave={keyboardOctave}
            keysEnabled={keysEnabled}
            onNudgePattern={nudgePattern}
            onSetStepsRange={setStepsRange}
            onSetStepNote={setStepNote}
          />
        ))}
      </div>

      <ArrangementView
        arrangement={arrangement}
        numTracks={numTracks}
        trackOrder={trackOrder}
        trackSettings={trackSettings}
        onClearArrangement={clearArrangement}
        onRemove={removeClip}
        onRenameClip={handleClipNameChange}
        onRenameTrack={renameTrack}
        onReorderTracks={reorderTracks}
        onMoveClip={moveClip}
        onAddClipAtBar={addClipAtBar}
        onResizeClip={handleClipBarsChange}
        onPlayArrangement={toggleArrangementPlay}
        onToggleLoop={toggleArrangementLoop}
        loopArrangement={loopArrangement}
        isPlaying={isArrangementPlaying}
        playheadBars={playheadBars}
        editingClipId={editingClipId}
        onEditClip={setEditingClipId}
        onDuplicateClip={handleDuplicateClip}
        onToggleMute={toggleTrackMute}
        onToggleSolo={toggleTrackSolo}
        onAddAllToArrangement={addAllToArrangement}
        onSeekTo={seekTo}
        loopStartBar={loopStartBar}
        loopEndBar={loopEndBar}
        arrangementEndBars={arrangementEndBars}
        onSetLoopStartBar={setLoopStartBar}
        onSetLoopEndBar={setLoopEndBar}
      />

      {editingClipId && (
        <ClipEditorModal
          clip={arrangement.find((c) => c.id === editingClipId)}
          trackSetting={
            trackSettings[
              arrangement.find((c) => c.id === editingClipId)?.sourceTrackIndex
            ]
          }
          onUpdate={handleUpdateClipGrid}
          onUpdateSound={updateTrackSound}
          onUpdateSetting={updateTrackSetting}
          onClose={() => setEditingClipId(null)}
          onPreviewSound={previewSound}
        />
      )}
    </main>
  );
}
