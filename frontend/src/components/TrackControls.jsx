export function StepGrid({
  track,
  trackIndex,
  currentStep,
  isPlaying,
  toggleStep,
}) {
  return (
    <div className="step-row">
      {track.map((isActive, stepIndex) => {
        const isPlayhead = currentStep === stepIndex && isPlaying;
        return (
          <button
            key={stepIndex}
            onClick={() => toggleStep(trackIndex, stepIndex)}
            className={`${isActive ? "active" : ""} ${isPlayhead ? "playhead" : ""}`}
          >
            {stepIndex + 1}
          </button>
        );
      })}
    </div>
  );
}
