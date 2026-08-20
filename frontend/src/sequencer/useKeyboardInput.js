// src/sequencer/useKeyboardInput.js

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

/**
 * Maps computer keyboard keys to musical notes and transport controls.
 *
 * White keys (bottom row): A S D F G H J K L → C D E F G A B C D
 * Black keys (row above):  W E   T Y U   → C# D# F# G# A#
 * Z → octave down, X → octave up
 * Space → toggle play/stop
 * 1-8 → toggle steps 1-8, Shift+1-8 → toggle steps 9-16
 * ↑/↓ → select previous/next track
 * Delete/Backspace → clear selected track pattern
 */
const KEY_TO_NOTE = {
  a: "C",
  w: "C#",
  s: "D",
  e: "D#",
  d: "E",
  f: "F",
  t: "F#",
  g: "G",
  y: "G#",
  h: "A",
  u: "A#",
  j: "B",
  k: "C",
  l: "D",
};

/**
 * Human-readable legend for the keyboard mapping.
 * Exported so UI components can render a tooltip.
 */
export const KEYBOARD_LEGEND = {
  whiteKeys: [
    { key: "A", note: "C" },
    { key: "S", note: "D" },
    { key: "D", note: "E" },
    { key: "F", note: "F" },
    { key: "G", note: "G" },
    { key: "H", note: "A" },
    { key: "J", note: "B" },
    { key: "K", note: "C" },
    { key: "L", note: "D" },
  ],
  blackKeys: [
    { key: "W", note: "C#" },
    { key: "E", note: "D#" },
    { key: "T", note: "F#" },
    { key: "Y", note: "G#" },
    { key: "U", note: "A#" },
  ],
  controls: [
    { key: "Space", action: "Play / Stop" },
    { key: "Z", action: "Octave Down" },
    { key: "X", action: "Octave Up" },
    { key: "1–8", action: "Toggle Steps 1–8" },
    { key: "Shift+1–8", action: "Toggle Steps 9–16" },
    { key: "↑ / ↓", action: "Select Track" },
    { key: "Del / Backspace", action: "Clear Track" },
  ],
};

const MIN_OCTAVE = 1;
const MAX_OCTAVE = 7;
const DEFAULT_OCTAVE = 4;

export function useKeyboardInput({
  enabled,
  playTrackSound,
  togglePlay,
  onToggleStep,
  onSetNote,
  onClearTrack,
  onSelectTrack,
  selectedTrackIndex = 0,
  numTracks = 4,
}) {
  const [octave, setOctave] = useState(DEFAULT_OCTAVE);

  const octaveRef = useRef(octave);

  const playTrackSoundRef = useRef(playTrackSound);
  const togglePlayRef = useRef(togglePlay);
  const onToggleStepRef = useRef(onToggleStep);
  const onSetNoteRef = useRef(onSetNote);
  const onClearTrackRef = useRef(onClearTrack);
  const onSelectTrackRef = useRef(onSelectTrack);
  const selectedTrackIndexRef = useRef(selectedTrackIndex);
  const numTracksRef = useRef(numTracks);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    playTrackSoundRef.current = playTrackSound;
  }, [playTrackSound]);

  useEffect(() => {
    togglePlayRef.current = togglePlay;
  }, [togglePlay]);

  useEffect(() => {
    onToggleStepRef.current = onToggleStep;
  }, [onToggleStep]);

  useEffect(() => {
    onSetNoteRef.current = onSetNote;
  }, [onSetNote]);

  useEffect(() => {
    onClearTrackRef.current = onClearTrack;
  }, [onClearTrack]);

  useEffect(() => {
    onSelectTrackRef.current = onSelectTrack;
  }, [onSelectTrack]);

  useEffect(() => {
    selectedTrackIndexRef.current = selectedTrackIndex;
  }, [selectedTrackIndex]);

  useEffect(() => {
    numTracksRef.current = numTracks;
  }, [numTracks]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    octaveRef.current = octave;
  }, [octave]);

  useEffect(() => {
    const handleKeyDown = async (event) => {
      if (!enabledRef.current) return;

      // Ignore if user is typing in an input/textarea/select
      const tag = event.target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") {
        return;
      }

      const key = event.key.toLowerCase();

      // Space → toggle play/stop
      if (key === " ") {
        event.preventDefault();
        togglePlayRef.current();
        return;
      }

      // Z → octave down
      if (key === "z") {
        event.preventDefault();
        setOctave((prev) => Math.max(MIN_OCTAVE, prev - 1));
        return;
      }

      // X → octave up
      if (key === "x") {
        event.preventDefault();
        setOctave((prev) => Math.min(MAX_OCTAVE, prev + 1));
        return;
      }

      // ArrowUp → select previous track
      if (key === "arrowup") {
        event.preventDefault();
        const current = selectedTrackIndexRef.current;
        const prev = current > 0 ? current - 1 : numTracksRef.current - 1;
        if (onSelectTrackRef.current) {
          onSelectTrackRef.current(prev);
        }
        return;
      }

      // ArrowDown → select next track
      if (key === "arrowdown") {
        event.preventDefault();
        const current = selectedTrackIndexRef.current;
        const next = current < numTracksRef.current - 1 ? current + 1 : 0;
        if (onSelectTrackRef.current) {
          onSelectTrackRef.current(next);
        }
        return;
      }

      // Delete / Backspace → clear selected track pattern
      if (key === "delete" || key === "backspace") {
        event.preventDefault();
        if (onClearTrackRef.current) {
          onClearTrackRef.current(selectedTrackIndexRef.current);
        }
        return;
      }

      // Number keys 1-8 → toggle steps (use event.code for Shift compatibility)
      const digitMatch = event.code?.match(/^Digit(\d)$/);
      if (digitMatch) {
        const digit = parseInt(digitMatch[1]);
        if (digit >= 1 && digit <= 8) {
          event.preventDefault();
          const stepIndex = event.shiftKey ? digit + 7 : digit - 1;
          if (stepIndex < 16) {
            onToggleStepRef.current(selectedTrackIndexRef.current, stepIndex);
          }
          return;
        }
      }

      // Musical note keys
      const noteName = KEY_TO_NOTE[key];
      if (noteName) {
        event.preventDefault();
        const fullNote = `${noteName}${octaveRef.current}`;
        await Tone.start();
        if (Tone.getContext().state !== "running") {
          await Tone.getContext().resume();
        }
        // Set the track's base note
        if (onSetNoteRef.current) {
          onSetNoteRef.current(selectedTrackIndexRef.current, fullNote);
        }
        // Defer playback until React processes the state update,
        // so the note is already in trackSettings when playTrackSound runs.
        const trackIdx = selectedTrackIndexRef.current;
        setTimeout(() => {
          playTrackSoundRef.current(trackIdx);
        }, 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { octave };
}
