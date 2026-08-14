export default function Dial({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  formatValue = (v) => `${Math.round(v * 100)}%`,
  disabled = false,
  size = 110,
}) {
  const percentage = (value - min) / (max - min);
  const safePct = Number.isFinite(percentage)
    ? Math.max(0, Math.min(1, percentage))
    : 0;

  // 270° arc
  const angle = safePct * 270 - 135;
  const rad = (angle * Math.PI) / 180;

  const RADIUS = 36;
  const CENTER = 50;
  const markerX = CENTER + RADIUS * Math.cos(rad);
  const markerY = CENTER + RADIUS * Math.sin(rad);

  const circumference = 2 * Math.PI * RADIUS;
  const dashOffset = circumference * (1 - safePct);

  const scale = size / 110;
  const fontSize = 10.5 * scale;
  const textY = 50 + 6 * scale;

  return (
    <div className={`dial-control ${disabled ? "disabled" : ""}`}>
      <span className="dial-label">{label}</span>

      <div className="dial-wrapper" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="dial-svg"
        >
          /* Track circle */
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="4"
          />
          /* Active */
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 0.1s ease" }}
          />
          /* Marker */
          <line
            x1="50"
            y1="50"
            x2={markerX}
            y2={markerY}
            stroke="#f59e0b"
            strokeWidth="2"
            style={{ transition: "all 0.1s ease" }}
          />
          /* Value */
          <text
            x="50"
            y={textY}
            textAnchor="middle"
            fill="#f9fafb"
            fontSize={fontSize}
            fontWeight="700"
          >
            {formatValue(value)}
          </text>
        </svg>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="dial-input"
          aria-label={label}
        />
      </div>
    </div>
  );
}
