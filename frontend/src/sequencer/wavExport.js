// src/sequencer/wavExport.js

import * as Tone from "tone";

import { getSoundById, createSoundEngine } from "../audio/soundLibrary";

import { NUM_STEPS } from "./projectModel";

/**
 * ---------------------------------------------------------
 * AUDIO BUFFER → WAV
 * ---------------------------------------------------------
 */

export function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;

  const sampleRate = buffer.sampleRate;

  const format = 1;
  const bitDepth = 16;

  const channelData = [];

  for (let channel = 0; channel < numChannels; channel++) {
    channelData.push(buffer.getChannelData(channel));
  }

  const interleaved = new Float32Array(buffer.length * numChannels);

  let offset = 0;

  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      interleaved[offset++] = channelData[channel][i];
    }
  }

  const dataLength = interleaved.length * 2;

  const arrayBuffer = new ArrayBuffer(44 + dataLength);

  const view = new DataView(arrayBuffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");

  view.setUint32(4, 36 + dataLength, true);

  writeString(8, "WAVE");
  writeString(12, "fmt ");

  view.setUint32(16, 16, true);

  view.setUint16(20, format, true);

  view.setUint16(22, numChannels, true);

  view.setUint32(24, sampleRate, true);

  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);

  view.setUint16(32, numChannels * (bitDepth / 8), true);

  view.setUint16(34, bitDepth, true);

  writeString(36, "data");

  view.setUint32(40, dataLength, true);

  let writeOffset = 44;

  for (let i = 0; i < interleaved.length; i++) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]));

    view.setInt16(
      writeOffset,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true,
    );

    writeOffset += 2;
  }

  return new Blob([arrayBuffer], {
    type: "audio/wav",
  });
}

/**
 * ---------------------------------------------------------
 * OFFLINE RENDER
 * ---------------------------------------------------------
 */

/**
 * Render the current grid/settings to an AudioBuffer using Tone.Offline.
 *
 * Mirrors the realtime audio graph: gain → delay → lowpass → highpass → reverb → destination.
 */
export async function renderTrackToBuffer({
  grid,
  stepNotes,
  trackSettings,
  bpm,
  durationInSeconds = 4,
}) {
  const renderGrid = grid;
  const renderSettings = trackSettings;

  const renderTrackCount = renderGrid?.length || 0;

  return Tone.Offline((context) => {
    context.transport.bpm.value = bpm;

    const offlineEngines = [];

    for (let trackIndex = 0; trackIndex < renderTrackCount; trackIndex++) {
      const settings = renderSettings[trackIndex];

      const gain = new Tone.Gain(settings?.muted ? 0 : 1);

      const delay = new Tone.FeedbackDelay({
        delayTime: settings?.delay?.time ?? 0.25,

        feedback: settings?.delay?.feedback ?? 0.3,

        wet: settings?.delay?.enabled ? (settings?.delay?.wet ?? 0.3) : 0,
      });

      const lpf = new Tone.Filter(
        settings?.filter?.lowpass ?? 20000,
        "lowpass",
      );

      const hpf = new Tone.Filter(settings?.filter?.highpass ?? 20, "highpass");

      const reverb = new Tone.Reverb({
        decay: settings?.reverb?.decay ?? 1.5,

        wet: settings?.reverb?.enabled ? (settings?.reverb?.wet ?? 0.35) : 0,
      });

      gain.connect(delay);
      delay.connect(lpf);
      lpf.connect(hpf);
      hpf.connect(reverb);
      reverb.toDestination();

      const sound = getSoundById(settings?.sound);

      if (sound) {
        const engine = createSoundEngine(sound, gain);

        offlineEngines.push(engine);
      } else {
        offlineEngines.push(null);
      }
    }

    for (let step = 0; step < NUM_STEPS; step++) {
      const stepTime = step * (60 / bpm / 4);

      for (let trackIndex = 0; trackIndex < renderTrackCount; trackIndex++) {
        const settings = renderSettings[trackIndex];

        if (settings?.muted) {
          continue;
        }

        if (!renderGrid?.[trackIndex]?.[step]) {
          continue;
        }

        const engine = offlineEngines[trackIndex];

        if (!engine) {
          continue;
        }

        engine.play(stepTime, {
          note: stepNotes?.[trackIndex]?.[step] ?? settings?.note,

          duration: settings?.duration,
        });
      }
    }

    context.transport.start();
  }, durationInSeconds);
}

/**
 * ---------------------------------------------------------
 * DOWNLOAD
 * ---------------------------------------------------------
 */

export async function downloadTrackAsWav({
  grid,
  stepNotes,
  trackSettings,
  bpm,
  durationInSeconds = 4,
  filename = "track.wav",
}) {
  const buffer = await renderTrackToBuffer({
    grid,
    stepNotes,
    trackSettings,
    bpm,
    durationInSeconds,
  });

  const wavBlob = audioBufferToWav(buffer);

  const url = URL.createObjectURL(wavBlob);

  const a = document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);

  a.click();

  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
