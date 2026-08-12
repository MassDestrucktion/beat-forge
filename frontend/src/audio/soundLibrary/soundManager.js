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

  /**
   * -------------------------------------------------------
   * REGISTER SAMPLES
   * -------------------------------------------------------
   */
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
            autostart: false,
          });

        /**
         * IMPORTANT:
         *
         * The manager's players go directly to
         * the Tone destination.
         *
         * The sequencer can instead create
         * track-specific engines when it needs
         * per-track routing.
         */
        player.toDestination();

        this.players.set(
          sound.id,
          player
        );
      });
  }

  /**
   * -------------------------------------------------------
   * LOAD
   * -------------------------------------------------------
   */
  async load() {
    this.registerSamples();

    if (!this.loadingPromise) {
      this.loadingPromise =
        Tone.loaded();
    }

    await this.loadingPromise;

    return this;
  }

  /**
   * -------------------------------------------------------
   * CONNECT SAMPLE
   * -------------------------------------------------------
   */
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

    if (destination) {
      player.connect(destination);
    } else {
      player.toDestination();
    }

    return player;
  }

  /**
   * -------------------------------------------------------
   * GET PLAYER
   * -------------------------------------------------------
   */
  getPlayer(soundId) {
    return (
      this.players.get(soundId) ||
      null
    );
  }

  /**
   * -------------------------------------------------------
   * IS LOADED
   * -------------------------------------------------------
   */
  isLoaded(soundId) {
    const player =
      this.players.get(soundId);

    return Boolean(
      player?.loaded
    );
  }

  /**
   * -------------------------------------------------------
   * PLAY
   * -------------------------------------------------------
   */
  async play(
    soundId,
    time
  ) {
    const player =
      this.players.get(soundId);

    if (!player) {
      console.warn(
        `Sound not found: ${soundId}`
      );

      return;
    }

    /**
     * Make sure the browser audio context
     * is running.
     */
    await Tone.start();

    /**
     * Wait for the sample buffers.
     */
    if (!player.loaded) {
      await Tone.loaded();
    }

    if (!player.loaded) {
      console.warn(
        `Sample failed to load: ${soundId}`
      );

      return;
    }

    player.start(time);
  }

  /**
   * -------------------------------------------------------
   * DISPOSE
   * -------------------------------------------------------
   */
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