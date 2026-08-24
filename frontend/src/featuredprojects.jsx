import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "./AuthContext/AuthContext";
import UserSearch from "./components/userSearch";

import "./styles/userPage.css";

import default_Pic from "/media/default_Pic.jpg";
import cool from "/media/cool.jpg";
import glasses from "/media/glasses.jpg";
import headphones from "/media/DarkHeadphones.jpg";
import gorilla from "/media/Gorilla.jpg";
import AVDreds from "/media/AVDreds.png";
import BlockParty from "/media/BlockParty.jpg";

const profilePictures = [
  { id: "default_pic", src: default_Pic },
  { id: "default_Pic", src: default_Pic },
  { id: "BlockParty", src: BlockParty },
  { id: "cool", src: cool },
  { id: "glasses", src: glasses },
  { id: "headphones", src: headphones },
  { id: "gorilla", src: gorilla },
  { id: "AVDreds", src: AVDreds },
];

function resolveAvatar(picurl) {
  return (
    profilePictures.find((picture) => picture.id === picurl)?.src || default_Pic
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "";

  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

/**
 * Discover page — live feed of recently created community beats.
 * Replaces the old hardcoded "Featured Projects" list.
 */
export default function FeaturedProjects() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forkingId, setForkingId] = useState(null);

  useEffect(() => {
    async function fetchRecent() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/projects/recent");

        if (!response.ok) throw new Error("Failed to load recent projects");

        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("DISCOVER ERROR:", err);
        setError(err.message || "Failed to load recent projects");
      } finally {
        setLoading(false);
      }
    }

    fetchRecent();
  }, []);

  async function handleFork(project) {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setForkingId(project.id);

      const response = await fetch(
        `/api/users/${project.user_id}/projects/${project.id}/fork`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to fork project");
      }

      const forked = await response.json();
      navigate(`/sequencer?projectId=${forked.id}&userID=${forked.user_id}`);
    } catch (err) {
      console.error("DISCOVER FORK ERROR:", err);
      setError(err.message || "Failed to fork project");
    } finally {
      setForkingId(null);
    }
  }

  function handleOpen(project) {
    navigate(`/sequencer?projectId=${project.id}&userID=${project.user_id}`);
  }

  return (
    <div>
      <div className="searchBar">
        <UserSearch />
      </div>

      <main className="dashboard">
        {/* ===== DISCOVER HEADER ===== */}
        <section className="welcomeCard">
          <h1 className="pixel-title">Discover Beats</h1>
          <p className="welcome-subtitle">
            Fresh tracks from the BeatForge community — open them, remix them,
            make them yours.
          </p>
        </section>

        {/* ===== RECENT BEATS ===== */}
        <section className="projectsSection">
          <div className="projectsHeader">
            <div>
              <h2>Recently Posted</h2>
              <p className="user-name">Latest saves across all creators</p>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          {loading && !error && (
            <p className="muted-text">Loading latest beats...</p>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="emptyProjects">
              <h3>No beats yet</h3>
              <p>
                Be the first — build a track in the sequencer and hit Save
                Project.
              </p>
            </div>
          )}

          {!loading && projects.length > 0 && (
            <div className="projectsGrid">
              {projects.map((project) => (
                <div key={project.id} className="project-card">
                  <div className="project-card-header">
                    <h3>{project.name || "Untitled Project"}</h3>
                    <span className="project-date">
                      {timeAgo(project.created_at)}
                    </span>
                    <span className="public-chip">🌍 PUBLIC</span>
                  </div>

                  <Link
                    to={`/userPage/${project.user_id}`}
                    className="discover-owner"
                  >
                    <img
                      className="discover-owner-avatar"
                      src={resolveAvatar(project.picurl)}
                      alt={`${project.username}'s avatar`}
                    />
                    <span>{project.username}</span>
                  </Link>

                  <div className="project-card-details">
                    <span>BPM: {project.tempo || 120}</span>
                  </div>

                  <div className="project-card-actions">
                    <button
                      className="nav-btn"
                      onClick={() => handleOpen(project)}
                    >
                      ▶ Open in Sequencer
                    </button>

                    <button
                      className="nav-btn fork-btn"
                      onClick={() => handleFork(project)}
                      disabled={forkingId === project.id}
                    >
                      {forkingId === project.id ? "Forking..." : "🔀 Fork"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
