// src/sequencer/useTransport.js

import { useEffect, useMemo, useRef, useState } from "react";

import * as Tone from "tone";

import { NUM_STEPS } from "./projectModel";

export function useTransport({ grid, arrangement, bpm, playTrackSound }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const [currentStep, setCurrentStep] = useState(null);

  const [isArrangementPlaying, setIsArrangementPlaying] = useState(false);

  const [activeSectionIndex, setActiveSectionIndex] = useState(null);

  /** Live playhead position (in bars) during arrangement playback. */
  const [playheadBars, setPlayheadBars] = useState(null);

  /** Loop the arrangement back to bar 0 when it reaches the end. */
  const [loopArrangement, setLoopArrangement] = useState(false);

  /** User-defined loop region (in bars). */
  const [loopStartBar, setLoopStartBar] = useState(0);
  const [loopEndBar, setLoopEndBar] = useState(null); // null = auto (end of arrangement)

  const gridRef = useRef(grid);

  const arrangementRef = useRef(arrangement);

  const stepCountRef = useRef(0);

  const isArrangementPlayingRef = useRef(false);

  const loopArrangementRef = useRef(false);

  const loopStartBarRef = useRef(0);
  const loopEndBarRef = useRef(null);

  const arrangementStepRef = useRef(0);

  const arrangementEndBarsRef = useRef(1);

  const playTrackSoundRef = useRef(playTrackSound);

  useEffect(() => {
    playTrackSoundRef.current = playTrackSound;
  }, [playTrackSound]);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    arrangementRef.current = arrangement;
  }, [arrangement]);

  useEffect(() => {
    loopArrangementRef.current = loopArrangement;
  }, [loopArrangement]);

  useEffect(() => {
    loopStartBarRef.current = loopStartBar;
  }, [loopStartBar]);

  useEffect(() => {
    loopEndBarRef.current = loopEndBar;
  }, [loopEndBar]);

  /**
   * Compute the total arrangement length (bars) whenever the arrangement
   * changes, so Tone.Transport can loop back to bar 0.
   */
  const arrangementEndBars = useMemo(() => {
    let maxEnd = 0;
    for (const clip of arrangement) {
      maxEnd = Math.max(maxEnd, clip.x + clip.bars);
    }
    return Math.max(1, maxEnd);
  }, [arrangement]);

  useEffect(() => {
    arrangementEndBarsRef.current = arrangementEndBars;
  }, [arrangementEndBars]);

  // Apply the loop range to Tone.Transport
  useEffect(() => {
    const start = loopStartBarRef.current;
    const end = loopEndBarRef.current ?? arrangementEndBars;
    Tone.Transport.loopStart = `${start}m`;
    Tone.Transport.loopEnd = `${end}m`;
  }, [arrangementEndBars, bpm, loopStartBar, loopEndBar]);

  /* TRANSPORT LOOP */

  useEffect(() => {
    const repeat = (time) => {
      if (isArrangementPlayingRef.current) {
        const currentSixteenth = arrangementStepRef.current;
        const clips = arrangementRef.current;

        const effectiveEnd =
          loopEndBarRef.current ?? arrangementEndBarsRef.current;

        // Check if we've passed the loop end
        if (currentSixteenth >= effectiveEnd * 16) {
          if (loopArrangementRef.current) {
            // Loop back to loop start — fall through to play sounds this tick
            arrangementStepRef.current = loopStartBarRef.current * 16;
            setPlayheadBars(loopStartBarRef.current);
            // Don't return — process the reset position below
          } else {
            // Stop at end
            Tone.Transport.stop();
            Tone.Transport.position = 0;
            arrangementStepRef.current = 0;
            isArrangementPlayingRef.current = false;
            setIsArrangementPlaying(false);
            setActiveSectionIndex(null);
            setCurrentStep(null);
            setPlayheadBars(null);
            return;
          }
        }

        // Re-read currentSixteenth in case we just reset it for looping
        const stepToPlay = arrangementStepRef.current;

        for (const clip of clips) {
          const clipStartStep = clip.x * 16;
          const clipEndStep = clipStartStep + clip.bars * 16;

          if (stepToPlay >= clipStartStep && stepToPlay < clipEndStep) {
            const stepInClip = (stepToPlay - clipStartStep) % NUM_STEPS;

            const clipGrid = clip.grid;
            if (clipGrid && clipGrid[0] && clipGrid[0][stepInClip]) {
              playTrackSoundRef.current(clip.sourceTrackIndex, time);
            }
          }
        }
        setCurrentStep(stepToPlay % NUM_STEPS);
        setPlayheadBars(stepToPlay / 16);
        arrangementStepRef.current++;
        return;
      }

      const step = stepCountRef.current % NUM_STEPS;

      setCurrentStep(step);

      const currentGrid = gridRef.current;

      const trackCount = currentGrid?.length || 0;

      for (let trackIndex = 0; trackIndex < trackCount; trackIndex++) {
        if (currentGrid?.[trackIndex]?.[step]) {
          playTrackSoundRef.current(trackIndex, time);
        }
      }

      stepCountRef.current++;
    };

    const eventId = Tone.Transport.scheduleRepeat(repeat, "16n");

    return () => {
      Tone.Transport.clear(eventId);
    };
  }, []);

  /* SEEK */

  const seekTo = (bar) => {
    const clamped = Math.max(0, bar);
    if (isArrangementPlayingRef.current) {
      arrangementStepRef.current = Math.round(clamped * 16);
      Tone.Transport.position = `${clamped}m`;
    }
  };

  /* PLAY / STOP (PATTERN) */

  const togglePlay = async () => {
    await Tone.start();

    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    if (isArrangementPlayingRef.current) {
      Tone.Transport.loop = false;
      isArrangementPlayingRef.current = false;

      setIsArrangementPlaying(false);
      setActiveSectionIndex(null);
      setPlayheadBars(null);

      arrangementStepRef.current = 0;
    }

    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.position = 0;

      stepCountRef.current = 0;

      setIsPlaying(false);
      setCurrentStep(null);

      return;
    }

    Tone.Transport.stop();
    Tone.Transport.position = 0;

    stepCountRef.current = 0;

    Tone.Transport.bpm.value = bpm;

    Tone.Transport.start();

    setIsPlaying(true);
  };

  /* PLAY / STOP (ARRANGEMENT) */

  const toggleArrangementPlay = async () => {
    await Tone.start();

    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    if (isArrangementPlayingRef.current) {
      Tone.Transport.loop = false;
      Tone.Transport.stop();
      Tone.Transport.position = 0;

      arrangementStepRef.current = 0;
      stepCountRef.current = 0;

      isArrangementPlayingRef.current = false;

      setIsArrangementPlaying(false);
      setActiveSectionIndex(null);
      setCurrentStep(null);
      setPlayheadBars(null);

      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
    }

    Tone.Transport.stop();
    Tone.Transport.position = 0;

    arrangementStepRef.current = 0;
    stepCountRef.current = 0;

    Tone.Transport.bpm.value = bpm;

    Tone.Transport.loop = loopArrangementRef.current;

    isArrangementPlayingRef.current = true;

    setIsArrangementPlaying(true);
    setActiveSectionIndex(0);

    Tone.Transport.start();
  };

  /* RESET */

  const resetTransport = () => {
    Tone.Transport.loop = false;
    Tone.Transport.stop();
    Tone.Transport.position = 0;

    stepCountRef.current = 0;
    arrangementStepRef.current = 0;

    isArrangementPlayingRef.current = false;

    setIsArrangementPlaying(false);
    setActiveSectionIndex(null);
    setIsPlaying(false);
    setCurrentStep(null);
    setPlayheadBars(null);
  };

  const toggleArrangementLoop = () => {
    setLoopArrangement((v) => {
      const next = !v;
      loopArrangementRef.current = next;
      if (isArrangementPlayingRef.current) {
        Tone.Transport.loop = next;
      }
      return next;
    });
  };

  return {
    isPlaying,
    isArrangementPlaying,
    currentStep,
    activeSectionIndex,
    playheadBars,
    loopArrangement,
    loopStartBar,
    loopEndBar,
    arrangementEndBars,

    togglePlay,
    toggleArrangementPlay,
    toggleArrangementLoop,
    resetTransport,
    seekTo,
    setLoopStartBar,
    setLoopEndBar,
  };
}
