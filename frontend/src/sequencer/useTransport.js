// src/sequencer/useTransport.js

import { useEffect, useRef, useState } from "react";

import * as Tone from "tone";

import { NUM_STEPS } from "./projectModel";

export function useTransport({ grid, arrangement, bpm, playTrackSound }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const [currentStep, setCurrentStep] = useState(null);

  const [isArrangementPlaying, setIsArrangementPlaying] = useState(false);

  const [activeSectionIndex, setActiveSectionIndex] = useState(null);

  const gridRef = useRef(grid);

  const arrangementRef = useRef(arrangement);

  const stepCountRef = useRef(0);

  const isArrangementPlayingRef = useRef(false);

  const arrangementStepRef = useRef(0);

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

  /* TRANSPORT LOOP */

  useEffect(() => {
    const repeat = (time) => {
      if (isArrangementPlayingRef.current) {
        const transportTimeInSeconds = Tone.Transport.seconds;
        const beatsPerSecond = Tone.Transport.bpm.value / 60;
        const beats = transportTimeInSeconds * beatsPerSecond;
        const bars = beats / Tone.Transport.timeSignature;
        const sixteenths = (transportTimeInSeconds * Tone.Transport.bpm.value * 4) / 60;

        const clips = arrangementRef.current;

        for (const clip of clips) {
          const clipStartBar = clip.x;
          const clipEndBar = clip.x + clip.bars;

          if (bars >= clipStartBar && bars < clipEndBar) {
            const barsIntoClip = bars - clipStartBar;
            const sixteenthsIntoClip = Math.floor(barsIntoClip * 16);
            const step = sixteenthsIntoClip % NUM_STEPS;

            const clipGrid = clip.grid;
            if (clipGrid && clipGrid[0] && clipGrid[0][step]) {
              const timeOffset = (sixteenths - Math.floor(sixteenths)) * (60 / (Tone.Transport.bpm.value * 4));
              playTrackSoundRef.current(clip.sourceTrackIndex, time + timeOffset);
            }
          }
        }
        setCurrentStep(Math.floor(sixteenths % 16));
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

  /* PLAY / STOP (PATTERN) */

  const togglePlay = async () => {
    await Tone.start();

    if (Tone.getContext().state !== "running") {
      await Tone.getContext().resume();
    }

    if (isArrangementPlayingRef.current) {
      isArrangementPlayingRef.current = false;

      setIsArrangementPlaying(false);
      setActiveSectionIndex(null);

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
      Tone.Transport.stop();
      Tone.Transport.position = 0;

      arrangementStepRef.current = 0;
      stepCountRef.current = 0;

      isArrangementPlayingRef.current = false;

      setIsArrangementPlaying(false);
      setActiveSectionIndex(null);
      setCurrentStep(null);

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

    isArrangementPlayingRef.current = true;

    setIsArrangementPlaying(true);
    setActiveSectionIndex(0);

    Tone.Transport.start();
  };

  /* RESET */

  const resetTransport = () => {
    Tone.Transport.stop();
    Tone.Transport.position = 0;

    stepCountRef.current = 0;
    arrangementStepRef.current = 0;

    isArrangementPlayingRef.current = false;

    setIsArrangementPlaying(false);
    setActiveSectionIndex(null);
    setIsPlaying(false);
    setCurrentStep(null);
  };

  return {
    isPlaying,
    isArrangementPlaying,
    currentStep,
    activeSectionIndex,

    togglePlay,
    toggleArrangementPlay,
    resetTransport,
  };
}
