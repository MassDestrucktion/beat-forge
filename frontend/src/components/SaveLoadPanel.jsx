// src/components/SaveLoadPanel.jsx

import { useEffect, useState } from "react";

import { useAuth } from "../AuthContext/AuthContext.jsx";

/**
 * Save / share / load section plus the shared-view banner.
 *
 * Also hosts:
 * - the "My Projects" switcher (jump between your saved projects
 *   without leaving the sequencer)
 * - the Publish / Unpublish button (private by default; publishing
 *   makes a project visible on profiles + Discover and forkable)
 */
export default function SaveLoadPanel({
  projectName,
  onProjectNameChange,
  projectDescription,
  onProjectDescriptionChange,
  projectId,
  sharedId,
  isSharedView,
  sharedBy,
  saveStatus,
  isPublic,
  onSave,
  onShare,
  onPublish,
  onLoadProjectById,
  onAddToLibrary,
  onCopyShareLink,
}) {
  const { isAuthenticated, token, user } = useAuth();

  /**
   * The signed-in user's own projects — used by the switcher.
   */
  const [myProjects, setMyProjects] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !token) {
      setMyProjects([]);
      return;
    }

    let cancelled = false;

    async function fetchMyProjects() {
      try {
        const response = await fetch(`/api/users/${user.id}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const data = await response.json();

        if (!cancelled && Array.isArray(data)) {
          setMyProjects(data);
        }
      } catch {
        // The switcher is a convenience — silently ignore failures.
      }
    }

    fetchMyProjects();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, token]);

  return (
    <>
      {isSharedView && (
        <section className="shared-view-banner">
          <div className="shared-banner-content">
            <span className="shared-banner-icon">🔗</span>

            <span>
              Viewing shared project:
              <strong> {projectName}</strong>
              {sharedBy && ` by @${sharedBy}`}
            </span>

            <button className="add-to-library-btn" onClick={onAddToLibrary}>
              📥 Add to My Library
            </button>
          </div>
        </section>
      )}

      <section className="save-load-card">
        <div className="save-section">
          {/* Project switcher — jump between your saved projects */}
          {isAuthenticated && myProjects.length > 0 && (
            <label className="project-switcher">
              <span>📁</span>

              <select
                value={projectId ?? ""}
                onChange={(event) => {
                  const selectedId = event.target.value;

                  if (selectedId && selectedId !== projectId) {
                    onLoadProjectById?.(selectedId);
                  }
                }}
                title="Switch between your saved projects"
              >
                {!projectId && <option value="">New / unsaved project</option>}

                {myProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name || "Untitled Project"}
                    {project.is_public ? " 🌍" : " 🔒"}
                  </option>
                ))}
              </select>
            </label>
          )}

          <input
            type="text"
            placeholder={
              isSharedView ? "Enter name for your copy..." : "Project name"
            }
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
          />

          <input
            type="text"
            placeholder="Project description"
            value={projectDescription}
            onChange={(e) => onProjectDescriptionChange(e.target.value)}
          />

          <button
            onClick={onSave}
            disabled={isSharedView && !isAuthenticated}
            title={
              isSharedView
                ? isAuthenticated
                  ? "Save this as a new project in your library"
                  : "Log in to save"
                : ""
            }
          >
            {isSharedView
              ? "💾 Save Copy to Library"
              : projectId
                ? "💾 Update Project"
                : "💾 Save Project"}
          </button>

          {projectId && !isSharedView && (
            <button
              className={`publish-btn ${isPublic ? "published" : ""}`}
              onClick={() => onPublish?.(!isPublic)}
              title={
                isPublic
                  ? "This project is public. Click to make it private again."
                  : "Make this project public so it shows on your profile and Discover, and can be forked."
              }
            >
              {isPublic ? "🌍 Published" : "🔒 Private — Publish?"}
            </button>
          )}

          {projectId && (
            <button
              className="share-btn"
              onClick={onShare}
              title="Share this project with others"
            >
              🔗 Share
            </button>
          )}
        </div>

        {!isSharedView && sharedId && (
          <div className="share-section">
            <span className="share-link">
              {`${window.location.origin}/sequencer?sharedId=${sharedId}`}
            </span>

            <button className="copy-link-btn" onClick={onCopyShareLink}>
              Copy Link
            </button>
          </div>
        )}

        {saveStatus && <p className="save-status">{saveStatus}</p>}
      </section>
    </>
  );
}
