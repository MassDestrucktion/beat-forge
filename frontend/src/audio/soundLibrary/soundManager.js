// src/audio/soundLibrary/soundManager.js

import * as Tone from "tone";

import {
  SOUND_LIBRARY,
} from "./soundLibrary";

class SoundManager {
  constructor() {
    this.players = new Map();
    this.loadingPromise = null;
  }

  registerSamples() {
    SOUND_LIBRARY
      .filter(
        (sound) =>
          sound.type === "sample" &&
          sound.url
      )
      .forEach((sound) => {
        if (this.players.has(sound.id)) {
          return;
        }

        const player =
          new Tone.Player({
            url: sound.url,
          });

        this.players.set(
          sound.id,
          player
        );
      });
  }

  async load() {
    this.registerSamples();

    if (!this.loadingPromise) {
      this.loadingPromise =
        Tone.loaded();
    }

    await this.loadingPromise;
  }

  getPlayer(soundId) {
    return (
      this.players.get(soundId) ||
      null
    );
  }

  isLoaded(soundId) {
    const player =
      this.players.get(soundId);

    return Boolean(
      player?.loaded
    );
  }

  connectSample(
    soundId,
    destination
  ) {
    const player =
      this.players.get(soundId);

    if (!player) {
      console.warn(
        `Sample not found: ${soundId}`
      );

      return null;
    }

    player.disconnect();
    player.connect(destination);

    return player;
  }

  play(soundId, time) {
    const player =
      this.players.get(soundId);

    if (!player) {
      console.warn(
        `Sound not found: ${soundId}`
      );

      return;
    }

    if (!player.loaded) {
      return;
    }

    player.start(time);
  }

  dispose() {
    this.players.forEach(
      (player) => {
        player.dispose();
      }
    );

    this.players.clear();

    this.loadingPromise = null;
  }
}

export const soundManager =
  new SoundManager();