// src/components/SoundPicker.jsx

import { useEffect, useMemo, useRef, useState } from "react";

import {
  SOUND_LIBRARY,
  SOUND_CATEGORIES,
  getSoundById,
} from "../audio/soundLibrary";

import "./SoundPicker.css";

/**
 * Progressive-disclosure sound picker (accordion):
 *
 *   Category (click to expand)
 *     └─ Subcategory (click to expand)
 *          └─ Sound (click to select)
 *
 * The tree is derived from SOUND_LIBRARY, so categories and
 * subcategories that contain no sounds never appear — no dead ends.
 * SOUND_CATEGORIES only supplies icons, display names, and ordering.
 *
 * If a category has exactly one subcategory, its sounds are shown
 * directly under the category (the redundant level is skipped).
 */
export default function SoundPicker({ value, onChange, className, onPreview }) {
  const [open, setOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(() => new Set());
  const [expandedSubs, setExpandedSubs] = useState(() => new Set());

  const rootRef = useRef(null);

  const selectedSound = getSoundById(value);

  // Build the menu tree from the actual sound library.
  const tree = useMemo(() => {
    const categoryMeta = new Map(SOUND_CATEGORIES.map((c) => [c.id, c]));

    // Group: category -> subcategory -> sounds[]
    const byCategory = new Map();
    for (const sound of SOUND_LIBRARY) {
      const subId = sound.subcategory || "";
      if (!byCategory.has(sound.category)) {
        byCategory.set(sound.category, new Map());
      }
      const subMap = byCategory.get(sound.category);
      if (!subMap.has(subId)) subMap.set(subId, []);
      subMap.get(subId).push(sound);
    }

    const pretty = (id) =>
      id
        ? id
            .split("-")
            .map((word) => word[0].toUpperCase() + word.slice(1))
            .join(" ")
        : "General";

    // Categories in SOUND_CATEGORIES order first, then any extras A-Z.
    const orderedCategoryIds = [
      ...SOUND_CATEGORIES.map((c) => c.id).filter((id) => byCategory.has(id)),
      ...[...byCategory.keys()].filter((id) => !categoryMeta.has(id)).sort(),
    ];

    return orderedCategoryIds.map((categoryId) => {
      const meta = categoryMeta.get(categoryId);
      const subMap = byCategory.get(categoryId);
      const childMeta = new Map(
        (meta?.children || []).map((child) => [child.id, child]),
      );

      const orderedSubIds = [
        ...(meta?.children || [])
          .map((child) => child.id)
          .filter((id) => subMap.has(id)),
        ...[...subMap.keys()].filter((id) => !childMeta.has(id)).sort(),
      ];

      const subs = orderedSubIds.map((subId) => ({
        id: subId,
        name: childMeta.get(subId)?.name || pretty(subId),
        sounds: subMap.get(subId),
      }));

      return {
        id: categoryId,
        name: meta?.name || pretty(categoryId),
        icon: meta?.icon || "🎵",
        subs,
        count: subs.reduce((total, sub) => total + sub.sounds.length, 0),
      };
    });
  }, []);

  // When opening, expand the path to the currently selected sound.
  useEffect(() => {
    if (!open || !selectedSound) return;
    setExpandedCategories(new Set([selectedSound.category]));
    setExpandedSubs(
      new Set([
        `${selectedSound.category}::${selectedSound.subcategory || ""}`,
      ]),
    );
  }, [open, selectedSound]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const toggleIn = (setFn, key) => {
    setFn((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelect = (soundId) => {
    onChange(soundId);
    setOpen(false);
  };

  const renderSound = (sound) => (
    <button
      key={sound.id}
      type="button"
      role="treeitem"
      className={`sound-picker-item sound-picker-sound ${
        value === sound.id ? "selected-sound" : ""
      }`}
      onClick={() => handleSelect(sound.id)}
    >
      <span className="sound-picker-sound-type">
        {sound.type === "sample" ? "♪" : "■"}
      </span>
      <span className="sound-picker-item-label">{sound.name}</span>
      {value === sound.id && <span className="sound-picker-check">✓</span>}
      {onPreview && (
        <span
          role="button"
          tabIndex={0}
          className="sound-picker-preview-btn"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(sound.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onPreview(sound.id);
            }
          }}
          title={`Preview ${sound.name}`}
        >
          ▶
        </span>
      )}
    </button>
  );

  return (
    <div className={`sound-picker ${className || ""}`} ref={rootRef}>
      <button
        type="button"
        className={`sound-picker-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Choose a sound"
        aria-haspopup="tree"
        aria-expanded={open}
      >
        <span className="sound-picker-value">
          {selectedSound?.name || value || "Choose sound"}
        </span>
        <span className="sound-picker-caret">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="sound-picker-menu" role="tree">
          {tree.map((category) => {
            const categoryExpanded = expandedCategories.has(category.id);
            const categorySelected = selectedSound?.category === category.id;
            // Skip the subcategory level when there is only one of them.
            const flatten = category.subs.length === 1;

            return (
              <div className="sound-picker-group" key={category.id}>
                <button
                  type="button"
                  className={`sound-picker-item sound-picker-category ${
                    categoryExpanded ? "expanded" : ""
                  } ${categorySelected ? "selected-sound" : ""}`}
                  onClick={() => toggleIn(setExpandedCategories, category.id)}
                  aria-expanded={categoryExpanded}
                  role="treeitem"
                >
                  <span className="sound-picker-item-icon">
                    {category.icon}
                  </span>
                  <span className="sound-picker-item-label">
                    {category.name}
                  </span>
                  <span className="sound-picker-count">{category.count}</span>
                  <span className="sound-picker-item-caret">▸</span>
                </button>

                {categoryExpanded && (
                  <div className="sound-picker-children" role="group">
                    {flatten
                      ? category.subs[0].sounds.map(renderSound)
                      : category.subs.map((sub) => {
                          const subKey = `${category.id}::${sub.id}`;
                          const subExpanded = expandedSubs.has(subKey);
                          const subSelected =
                            categorySelected &&
                            (selectedSound?.subcategory || "") === sub.id;

                          return (
                            <div className="sound-picker-group" key={subKey}>
                              <button
                                type="button"
                                className={`sound-picker-item sound-picker-subcategory ${
                                  subExpanded ? "expanded" : ""
                                } ${subSelected ? "selected-sound" : ""}`}
                                onClick={() =>
                                  toggleIn(setExpandedSubs, subKey)
                                }
                                aria-expanded={subExpanded}
                                role="treeitem"
                              >
                                <span className="sound-picker-item-label">
                                  {sub.name}
                                </span>
                                <span className="sound-picker-count">
                                  {sub.sounds.length}
                                </span>
                                <span className="sound-picker-item-caret">
                                  ▸
                                </span>
                              </button>

                              {subExpanded && (
                                <div
                                  className="sound-picker-children"
                                  role="group"
                                >
                                  {sub.sounds.map(renderSound)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
