// src/components/NotePicker.jsx

import { useEffect, useRef, useState } from "react";

import { isNoteInScale } from "../sequencer/projectModel";

import "./NotePicker.css";

/**
 * A clickable piano-strip note picker — a friendlier replacement for the
 * old note <select> dropdowns.
 *
 * Renders a trigger showing the current note; clicking it opens a popover
 * with a 2-octave piano. Clicking a key selects the note and (optionally)
 * previews it. When a scale root/type is supplied, in-scale keys are
 * highlighted so it's easy to stay in key.
 *
 * Props:
 *   value        current note (e.g. "C4") or null/"" for "default"
 *   onChange     (note | null) => void
 *   onPreview?   (note) => void  — play the track's sound at this pitch
 *   scaleRoot?   e.g. "C" — enables in-scale highlighting
 *   scaleType?   e.g. "major-pentatonic"
 *   allowDefault? show a "use track default" button (per-step editor)
 *   defaultLabel? label for the default button / empty trigger
 *   label?       fallback trigger label when there's no value
 */

const WHITE_NOTES = ["C", "D", "E", "F", "G", "A", "B"];

// Black keys sit on the boundary AFTER the given white-key index.
const BLACK_NOTES = [
  { name: "C#", afterWhite: 0 },
  { name: "D#", afterWhite: 1 },
  { name: "F#", afterWhite: 3 },
  { name: "G#", afterWhite: 4 },
  { name: "A#", afterWhite: 5 },
];

// Key geometry (kept in sync with NotePicker.css).
const WHITE_W = 30;
const BLACK_W = 20;

const MIN_OCTAVE = 1;
const MAX_BASE_OCTAVE = 4; // shows baseOctave..baseOctave+1, so max top is C5-B5

export default function NotePicker({
  value,
  onChange,
  onPreview,
  scaleRoot = null,
  scaleType = "major-pentatonic",
  allowDefault = false,
  defaultLabel = "Track default",
  label = "Note",
}) {
  const [open, setOpen] = useState(false);
  const [baseOctave, setBaseOctave] = useState(3);
  const rootRef = useRef(null);

  const octaves = [baseOctave, baseOctave + 1];

  // Center the piano on the current value's octave when opened.
  useEffect(() => {
    if (!open || !value) return;
    const match = /(-?\d+)$/.exec(value);
    if (match) {
      const octave = parseInt(match[1], 10);
      setBaseOctave(Math.min(MAX_BASE_OCTAVE, Math.max(MIN_OCTAVE, octave)));
    }
  }, [open, value]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (note) => {
    onChange(note);
    onPreview?.(note);
  };

  const keyClassName = (note, base) => {
    const classes = [base];
    if (value === note) classes.push("selected");
    classes.push(
      isNoteInScale(note, scaleRoot, scaleType) ? "in-scale" : "out-scale",
    );
    return classes.join(" ");
  };

  const triggerLabel = value || (allowDefault ? defaultLabel : label);

  return (
    <div className="note-picker" ref={rootRef}>
      <button
        type="button"
        className={`note-picker-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Choose a note"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="note-picker-value">{triggerLabel}</span>
        <span className="note-picker-caret">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          className="note-picker-menu"
          role="dialog"
          aria-label="Note picker"
        >
          <div className="note-picker-octave-row">
            <button
              type="button"
              className="np-octave-btn"
              onClick={() => setBaseOctave((o) => Math.max(MIN_OCTAVE, o - 1))}
              disabled={baseOctave <= MIN_OCTAVE}
              title="Octave down"
            >
              ◀
            </button>
            <span className="np-octave-label">
              Oct {baseOctave}–{baseOctave + 1}
            </span>
            <button
              type="button"
              className="np-octave-btn"
              onClick={() =>
                setBaseOctave((o) => Math.min(MAX_BASE_OCTAVE, o + 1))
              }
              disabled={baseOctave >= MAX_BASE_OCTAVE}
              title="Octave up"
            >
              ▶
            </button>
          </div>

          <div className="np-piano">
            {octaves.map((octave) => (
              <div className="np-octave" key={octave}>
                {WHITE_NOTES.map((name) => {
                  const note = `${name}${octave}`;
                  return (
                    <button
                      key={note}
                      type="button"
                      className={keyClassName(note, "np-key np-white")}
                      onClick={() => pick(note)}
                      title={note}
                    >
                      <span className="np-key-label">{note}</span>
                    </button>
                  );
                })}

                {BLACK_NOTES.map((black) => {
                  const note = `${black.name}${octave}`;
                  const left = (black.afterWhite + 1) * WHITE_W - BLACK_W / 2;
                  return (
                    <button
                      key={note}
                      type="button"
                      className={keyClassName(note, "np-key np-black")}
                      style={{ left: `${left}px`, width: `${BLACK_W}px` }}
                      onClick={() => pick(note)}
                      title={note}
                      aria-label={note}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {scaleRoot && (
            <div className="np-scale-hint">
              In {scaleRoot} {scaleType.replace(/-/g, " ")}
            </div>
          )}

          {allowDefault && (
            <button
              type="button"
              className="np-default-btn"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              {defaultLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
