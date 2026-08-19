import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImg from "./assets/sequencer-hero.svg";
import "./GettingStarted.css";

const QUICK_START = [
  {
    icon: "🔑",
    title: "Register or Log In",
    desc: "Create an account to save and share your projects. It's quick — just a username and password.",
  },
  {
    icon: "🎛️",
    title: "Start a New Project",
    desc: "Open the Sequencer and name your project. You'll see four tracks ready to go at 120 BPM.",
  },
  {
    icon: "🥁",
    title: "Pick Your Sounds",
    desc: "Use each track's Sound dropdown to choose drums, bass, synths, percussion, FX, or instruments.",
  },
  {
    icon: "🎹",
    title: "Build Your Pattern",
    desc: "Click the 16 step buttons to toggle beats on and off. Drag across them to paint quickly.",
  },
  {
    icon: "▶️",
    title: "Play & Tweak",
    desc: "Hit Play, adjust the BPM, add effects, and mute or solo tracks to shape your groove.",
  },
  {
    icon: "💾",
    title: "Save & Share",
    desc: "Save your project to get a shareable link, or download it as a WAV file.",
  },
];

const SOUND_CATEGORIES = [
  {
    icon: "🥁",
    name: "Drums",
    sub: "Kicks, snares, hi-hats, claps, toms, cymbals",
  },
  { icon: "🔊", name: "Bass", sub: "Sub, 808, synth bass, reese, plucks" },
  {
    icon: "🎹",
    name: "Synths",
    sub: "Stabs, pads, plucks, leads, keys, bells",
  },
  {
    icon: "🪘",
    name: "Percussion",
    sub: "Shakers, congas, tambourines, hand drums",
  },
  {
    icon: "✨",
    name: "FX",
    sub: "Impacts, risers, sweeps, glitches, textures",
  },
  {
    icon: "🎻",
    name: "Instruments",
    sub: "Piano, organ, guitar, strings, brass",
  },
];

const FEATURES = {
  tracks: [
    {
      icon: "🔇",
      title: "Mute",
      text: "Silence a track without deleting its pattern.",
    },
    {
      icon: "🎧",
      title: "Solo",
      text: "Hear only this track by isolating it.",
    },
    {
      icon: "🧹",
      title: "Clear",
      text: "Remove all steps from the current track.",
    },
    {
      icon: "🎲",
      title: "Random",
      text: "Generate a random pattern instantly.",
    },
    {
      icon: "↔️",
      title: "Nudge",
      text: "Shift the whole pattern left or right one step.",
    },
    {
      icon: "🎚️",
      title: "Volume",
      text: "Vertical slider on each track controls its level.",
    },
  ],
  toolbar: [
    { icon: "▶️", title: "Play / Stop", text: "Start and stop the transport." },
    {
      icon: "🥁",
      title: "BPM",
      text: "Drag the slider or type a value (60–180).",
    },
    { icon: "🔊", title: "Master", text: "Control the overall output level." },
    {
      icon: "⬇️",
      title: "Download",
      text: "Export your pattern as a WAV file.",
    },
    {
      icon: "🧹",
      title: "Clear All",
      text: "Clear every track's pattern at once.",
    },
    {
      icon: "🎹",
      title: "Keyboard",
      text: "Enable keys to play notes and control the sequencer.",
    },
  ],
  fx: [
    {
      icon: "⏱️",
      title: "Delay",
      text: "Add echo by adjusting time, feedback, and wet mix.",
    },
    {
      icon: "🎚️",
      title: "Filter",
      text: "Sculpt sound with low-pass and high-pass filters.",
    },
    {
      icon: "🌊",
      title: "Reverb",
      text: "Add space with wet and decay controls.",
    },
    {
      icon: "🔘",
      title: "Preview",
      text: "Audition a track before committing changes.",
    },
  ],
  arrangement: [
    {
      icon: "➕",
      title: "Add Clip",
      text: "Send a track's pattern into the arrangement timeline.",
    },
    {
      icon: "➕",
      title: "Add All",
      text: "Add every non-empty track as a clip at once.",
    },
    {
      icon: "🖱️",
      title: "Double-click",
      text: "Click empty lane space to drop a clip at that bar.",
    },
    {
      icon: "↔️",
      title: "Drag & Resize",
      text: "Move clips or drag their right edge to change length.",
    },
    {
      icon: "🔍",
      title: "Zoom & Fit",
      text: "Use the zoom controls, Ctrl+scroll, or Fit to frame the timeline.",
    },
    {
      icon: "🔁",
      title: "Loop",
      text: "Loop the arrangement and drag the loop handles.",
    },
  ],
};

const KEYBOARD_SHORTCUTS = [
  { keys: ["Space"], label: "Play / Stop" },
  { keys: ["Z", "X"], label: "Octave down / up" },
  { keys: ["1–8"], label: "Toggle steps 1–8" },
  { keys: ["Shift", "1–8"], label: "Toggle steps 9–16" },
  { keys: ["↑", "↓"], label: "Select previous / next track" },
  { keys: ["Del"], label: "Clear selected track" },
  { keys: ["A–L", "W E T Y U"], label: "Play notes (white & black keys)" },
];

function GuideSection({ icon, title, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen || false);

  return (
    <div className={`gs-section ${open ? "open" : ""}`}>
      <button
        type="button"
        className="gs-section-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="gs-section-icon">{icon}</span>
        <span className="gs-section-title">{title}</span>
        <span className="gs-section-chevron">▾</span>
      </button>
      {open && <div className="gs-section-body">{children}</div>}
    </div>
  );
}

function FeatureGrid({ items }) {
  return (
    <div className="gs-grid">
      {items.map((item) => (
        <div className="gs-feature" key={item.title}>
          <span className="gs-feature-icon">{item.icon}</span>
          <div className="gs-feature-text">
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GettingStarted() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const current = QUICK_START[step];

  return (
    <div className="gs-wrapper">
      <section className="gs-header">
        <img src={heroImg} alt="BeatForge" className="gs-hero-img" />
        <h1 className="gs-title">How to BeatForge</h1>
        <p className="gs-intro">
          Everything you need to create beats, build arrangements, and share
          your music. Dive in below — expand any section or follow the Quick
          Start path to make your first groove.
        </p>
      </section>

      <section className="gs-quickstart">
        <h2 className="gs-section-label">Quick Start</h2>
        <div className="qs-card">
          <span className="qs-icon">{current.icon}</span>
          <h3 className="qs-title">{current.title}</h3>
          <p className="qs-desc">{current.desc}</p>
          <div className="qs-controls">
            <button
              type="button"
              className="qs-btn"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              ← Prev
            </button>
            <div className="qs-dots">
              {QUICK_START.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`qs-dot ${i === step ? "active" : ""}`}
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              className="qs-btn"
              onClick={() =>
                setStep((s) => Math.min(QUICK_START.length - 1, s + 1))
              }
              disabled={step === QUICK_START.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </section>

      <section className="gs-sections">
        <GuideSection icon="🎛️" title="The Sequencer Layout" defaultOpen>
          <p>
            The Sequencer page is your main workspace. At the top is the hero
            banner (logo + title), followed by the transport toolbar, the track
            list, and finally the Arrangement view.
          </p>
          <p>
            Each <strong>track row</strong> holds a sound, a 16-step pattern,
            its own controls, and a volume slider — all editable in real time.
          </p>
        </GuideSection>

        <GuideSection icon="🥁" title="Choosing Sounds">
          <p>
            Every track has a <strong>Sound</strong> dropdown. Click it to
            browse the sound library, organized into six categories. Selecting a
            sound reloads it instantly, and the 🔊 button lets you preview it.
          </p>
          <div className="gs-cat-list">
            {SOUND_CATEGORIES.map((cat) => (
              <span className="gs-cat" key={cat.name}>
                {cat.icon} {cat.name}
                <span className="gs-cat-sub">{cat.sub}</span>
              </span>
            ))}
          </div>
        </GuideSection>

        <GuideSection icon="🎹" title="Building a Pattern">
          <p>
            Click any of the 16 step buttons to toggle a beat on or off. Active
            steps glow green. You can also <strong>click and drag</strong>{" "}
            across steps to paint multiple beats at once.
          </p>
          <p>
            Use the <strong>BPM</strong> control to set your tempo — drag the
            slider or type a number directly — then hit <strong>Play</strong> to
            hear it loop.
          </p>
        </GuideSection>

        <GuideSection icon="🎚️" title="Track Controls">
          <p>
            Each track gives you several tools for shaping its pattern and
            mixing it into the full beat.
          </p>
          <FeatureGrid items={FEATURES.tracks} />
        </GuideSection>

        <GuideSection icon="🧰" title="The Toolbar">
          <p>
            The toolbar controls playback and global settings for the whole
            project.
          </p>
          <FeatureGrid items={FEATURES.toolbar} />
        </GuideSection>

        <GuideSection icon="✨" title="Effects (FX)">
          <p>
            Click the <strong>FX</strong> button on a track to expand its effect
            controls. Use the dials to dial in delay, filtering, and reverb.
          </p>
          <FeatureGrid items={FEATURES.fx} />
          <p>
            Toggle <strong>Delay On</strong> or <strong>Reverb On</strong> to
            enable each effect, then hit <strong>▶ Preview</strong> to hear your
            changes.
          </p>
        </GuideSection>

        <GuideSection icon="⌨️" title="Keyboard Shortcuts">
          <p>
            Turn on keyboard mode (the 🎹 button) on a synth track to play notes
            and control the sequencer right from your keyboard.
          </p>
          <div className="gs-grid">
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <div className="gs-feature" key={shortcut.label}>
                <span className="gs-feature-icon">⌨️</span>
                <div className="gs-feature-text">
                  <div className="gs-kbd-row">
                    {shortcut.keys.map((k) => (
                      <kbd
                        className={`gs-kbd ${k.length > 2 ? "gs-kbd-wide" : ""}`}
                        key={k}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                  <span style={{ marginTop: 6 }}>{shortcut.label}</span>
                </div>
              </div>
            ))}
          </div>
        </GuideSection>

        <GuideSection icon="🗂️" title="The Arrangement View">
          <p>
            The Arrangement view lets you sequence clips across a timeline to
            build a full song structure.
          </p>
          <FeatureGrid items={FEATURES.arrangement} />
        </GuideSection>

        <GuideSection icon="💾" title="Save, Share & Export">
          <p>
            Name your project and hit <strong>Save</strong> to keep it in your
            library. The <strong>Share</strong> button generates a link others
            can open, and the <strong>⬇ Download</strong> button exports your
            current pattern as a WAV file.
          </p>
          <p>
            When you open a shared link, you'll see a banner to{" "}
            <strong>Add to Library</strong> so you can remix it yourself.
          </p>
        </GuideSection>
      </section>

      <section className="gs-cta">
        <button
          className="cta-btn primary"
          onClick={() => navigate("/sequencer")}
        >
          Open the Sequencer
        </button>
      </section>
    </div>
  );
}
