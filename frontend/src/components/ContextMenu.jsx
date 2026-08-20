import "./ContextMenu.css";

export default function ContextMenu({ x, y, options, onClose }) {
  return (
    <div className="context-menu-overlay" onClick={onClose}>
      <div className="context-menu" style={{ left: x, top: y }}>
        <ul>
          {options.map((option, index) => (
            <li key={index} onClick={option.action}>
              {option.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
