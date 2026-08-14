// src/components/SaveLoadPanel.jsx

import { useAuth } from "../AuthContext/AuthContext.jsx";

/**
 * Save / share / load section plus the shared-view banner.
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

  onSave,
  onShare,
  onAddToLibrary,
  onCopyShareLink,
}) {
  const { isAuthenticated } = useAuth();

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
