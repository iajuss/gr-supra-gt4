// Plays the engine clip through Web Audio: the fades need a gain node (an <audio> element's volume is
// read-only on iOS). The file is fetched and decoded ahead, in an OfflineAudioContext (which needs no
// gesture); the AudioContext that plays it is created inside the visitor's gesture, which is what lets
// the browser start it.

import { clipEnvelope } from '../lib/envelope.js';

// If the recording has not arrived this long after the gesture, the page opens in silence: an engine
// starting seconds after the click would read as a glitch.
const MAX_WAIT_MS = 1500;

// Decoding rate; the playing context resamples if its own differs.
const DECODE_RATE = 48000;

/** @param {{ src: string, start: number, end: number, volume: number, fadeIn: number, fadeOut: number }} clip */
export function createEngineSound(clip) {
  let decoded = null;

  /** Starts the download and the decoding; safe to call more than once. */
  function preload() {
    decoded ??= fetch(clip.src)
      .then((response) => {
        if (!response.ok) throw new Error(`engine sound: HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then((data) => {
        const Offline = window.OfflineAudioContext ?? window.webkitOfflineAudioContext;
        return new Offline(2, 1, DECODE_RATE).decodeAudioData(data);
      });
    // A failure is reported when playing, not as an unhandled rejection here.
    decoded.catch(() => {});
    return decoded;
  }

  /** Call from within the gesture's handler. Never throws: the page opens with or without the sound. */
  async function play() {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    context.resume(); // Safari may create it suspended even inside the gesture
    try {
      const recording = await Promise.race([
        preload(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('engine sound: too slow')), MAX_WAIT_MS)),
      ]);
      const { offset, duration, gain } = clipEnvelope(clip);

      const source = context.createBufferSource();
      source.buffer = recording;
      const amp = context.createGain();
      const t0 = context.currentTime;
      gain.forEach(({ time, value }, i) => {
        if (i === 0) amp.gain.setValueAtTime(value, t0 + time);
        else amp.gain.linearRampToValueAtTime(value, t0 + time);
      });
      source.connect(amp).connect(context.destination);
      source.onended = () => context.close();
      source.start(t0, offset, duration);
    } catch (error) {
      console.warn('[supra] engine sound skipped', error);
      context.close();
    }
  }

  return { preload, play };
}
