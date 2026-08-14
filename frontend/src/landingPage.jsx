import { NavLink } from "react-router-dom";
import heroImg from "./assets/sequencer-hero.svg";
import bgHero from "./media/pacha-wide-LEAD.webp";

export default function LandingPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section
        className="landing-hero"
        style={{
          backgroundImage: `url(${bgHero})`,
        }}
      >
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <h1 className="landing-title pixel-title">BeatForge</h1>
          <p className="landing-tagline">Craft. Collaborate. Share.</p>
          <p className="landing-description">
            BeatForge is a dynamic web-based beat-making application. Create
            16-step patterns with curated drum machines, synths, and FX, then
            save and share your grooves with the world.
          </p>
          <div className="landing-cta">
            <NavLink to="/sequencer" className="cta-btn primary">
              Start Creating
            </NavLink>
            <NavLink to="/featuredprojects" className="cta-btn secondary">
              View Examples
            </NavLink>
          </div>
        </div>
        <div className="landing-hero-image">
          <img src={heroImg} alt="BeatForge interface preview" />
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">🎵</div>
          <h3>Create</h3>
          <p>
            Build beats with a 16-step sequencer, choose from drum machines,
            synths, and bass sounds, and tweak each track's note and effects.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💾</div>
          <h3>Save</h3>
          <p>
            Register for an account to save your projects to the cloud. Pick up
            right where you left off anytime.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🌐</div>
          <h3>Share</h3>
          <p>
            Every project gets a shareable link. Collaborate with other
            BeatForge users and discover community beats.
          </p>
        </div>
      </section>
    </>
  );
}
