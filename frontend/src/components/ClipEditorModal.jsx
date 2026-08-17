import "./ClipEditorModal.css";

export default function ClipEditorModal({ clip, onUpdate, onClose }) {
  if (!clip) {
    return null;
  }

  return (
    <div className="clip-editor-modal-overlay">
      <div className="clip-editor-modal">
        <div className="clip-editor-header">
          <h2>Edit Clip: {clip.name}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="clip-editor-content">
          <p>Editing functionality for the clip will go here.</p>
        </div>
      </div>
    </div>
  );
}
