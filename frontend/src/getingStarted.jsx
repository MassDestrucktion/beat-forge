import { useNavigate } from "react-router-dom";
import heroImg from "./assets/hero.png";

export default function GettingStarted() {
  const navigate = useNavigate();

  return (
    <div className="getting-started-wrapper">
      <section className="getting-header">
        <img src={heroImg} alt="BeatForge" className="getting-hero-img" />
        <h1>Getting Started</h1>
        <p className="getting-intro">
          BeatForge is your sketchpad for building 16-step beat patterns. Follow
          the steps below to start creating, saving, and sharing your grooves.
        </p>
      </section>

      <section className="getting-steps">
        <div className="step-card">
          <div className="step-number">1</div>
          <h3>Register or Log In</h3>
          <p>
            To save and share your projects, you need an account. It’s quick —
            just pick a username and a password.
          </p>
          <div className="step-links">
            <button
              className="cta-btn secondary"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
            <button
              className="cta-btn secondary"
              onClick={() => navigate("/login")}
            >
              Log In
            </button>
          </div>
        </div>

        <div className="step-card">
          <div className="step-number">2</div>
          <h3>Start a New Project</h3>
          <p>
            Head to the Sequencer and give your project a name. You’ll see four
            tracks — kick, snare, hi-hat, and a synth stab — ready to go at 120
            BPM.
          </p>
          <button
            className="cta-btn primary"
            onClick={() => navigate("/sequencer")}
          >
            Open Sequencer
          </button>
        </div>

        <div className="step-card">
          <div className="step-number">3</div>
          <h3>Choose Your Sounds</h3>
          <p>
            Each track has a dropdown where you can pick different instruments —
            drum samples, synth stabs, bass sounds, leads, bells, and more.
          </p>
        </div>

        <div className="step-card">
          <div className="step-number">4</div>
          <h3>Build Your Beat</h3>
          <p>
            Click the 16 step buttons to activate or mute each beat. Adjust the
            BPM slider to speed up or slow down your groove. Hit play to hear it
            in real time.
          </p>
        </div>

        <div className="step-card">
          <div className="step-number">5</div>
          <h3>Save & Share</h3>
          <p>
            Once you’re happy with your pattern, give it a name and click Save.
            Your project gets a shareable ID so you can come back or let others
            remix it.
          </p>
        </div>
      </section>

      <section className="getting-cta">
        <button
          className="cta-btn primary large"
          onClick={() => navigate("/sequencer")}
        >
          Start Creating Now
        </button>
      </section>
    </div>
  );
}
