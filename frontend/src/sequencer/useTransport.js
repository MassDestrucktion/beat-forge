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
        const sections = arrangementRef.current;

        if (!sections || sections.length === 0) {
          isArrangementPlayingRef.current = false;

          setIsArrangementPlaying(false);
          setActiveSectionIndex(null);
          setCurrentStep(null);

          return;
        }

        const totalSteps = sections.reduce(
          (sum, section) => sum + (section.bars || 1) * NUM_STEPS,
          0,
        );

        const globalStep = arrangementStepRef.current;

        if (globalStep >= totalSteps) {
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

        let remaining = globalStep;
        let sectionIndex = 0;

        for (let i = 0; i < sections.length; i++) {
          const sectionSteps = (sections[i].bars || 1) * NUM_STEPS;

          if (remaining < sectionSteps) {
            sectionIndex = i;
            break;
          }

          remaining -= sectionSteps;
        }

        const step = remaining % NUM_STEPS;

        setCurrentStep(step);
        setActiveSectionIndex(sectionIndex);

        const sectionGrid = sections[sectionIndex]?.grid;

        const trackCount = sectionGrid?.length || 0;

        for (let trackIndex = 0; trackIndex < trackCount; trackIndex++) {
          if (sectionGrid?.[trackIndex]?.[step]) {
            playTrackSoundRef.current(trackIndex, time);
          }
        }

        arrangementStepRef.current++;
        stepCountRef.current++;

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
