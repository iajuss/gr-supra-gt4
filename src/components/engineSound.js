// Plays the engine clip through Web Audio: the fades need a gain node (an <audio> element's volume is
// read-only on iOS). The file is fetched and decoded ahead, in an OfflineAudioContext (which needs no
// gesture); the AudioContext that plays it is created ahead, suspended, and resumed inside the visitor's
// gesture, which is what lets the browser start it.

import { clipEnvelope } from '../lib/envelope.js';
import { reverbImpulse } from '../lib/impulse.js';
import { loudnessCurve } from '../lib/loudness.js';

// If the recording has not arrived this long after the gesture, the page opens in silence: an engine
// starting seconds after the click would read as a glitch.
const MAX_WAIT_MS = 1500;

// Decoding rate; the playing context resamples if its own differs.
const DECODE_RATE = 48000;

// Resolution of the loudness curve the picture follows (components/ignitionShow.js).
export const LOUDNESS_WINDOW = 0.05;

/**
 * @param {{ src: string, start: number, end: number, volume: number, fadeIn: number, fadeOut: number,
 *   space?: { wet: number, seconds: number, decay: number, lowShelf: { frequency: number, gain: number } } | null }} clip
 *   space: a room around the engine and a low shelf; none when absent
 */
export function createEngineSound(clip) {
  let decoded = null;
  let early = null; // the playing context, created ahead and suspended (see warmUp)

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

  /**
   * Creates the playing context ahead of the gesture, suspended. Opening the audio device blocks the
   * main thread for a moment (~200 ms measured on first use, ~500 ms in Lighthouse); done here, the
   * gesture only resumes it. Call it on a sign the visitor is about to choose, not while the page
   * loads. The browser may log that the context could not start yet: expected, the gesture starts it.
   */
  function warmUp() {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (early || !AudioContextClass) return;
    try {
      early = new AudioContextClass();
    } catch {
      early = null; // created in the gesture instead
    }
  }

  /**
   * Call from within the gesture's handler. Never throws: the page opens with or without the sound.
   * @param {{ delay?: number }} [options] seconds to wait before the clip starts (the context itself
   *   is resumed at once, inside the gesture)
   * @returns {Promise<number | null>} when the clip is heard, on the performance.now() clock, or null
   *   if it was skipped
   */
  async function play({ delay = 0 } = {}) {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return null;

    const context = early ?? new AudioContextClass();
    early = null;
    context.resume(); // the warmed-up context waits suspended; Safari may create one so even in the gesture
    try {
      const recording = await Promise.race([
        preload(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('engine sound: too slow')), MAX_WAIT_MS)),
      ]);
      const { offset, duration, gain } = clipEnvelope(clip);

      const source = context.createBufferSource();
      source.buffer = recording;
      const amp = context.createGain();
      const t0 = context.currentTime + delay;
      gain.forEach(({ time, value }, i) => {
        if (i === 0) amp.gain.setValueAtTime(value, t0 + time);
        else amp.gain.linearRampToValueAtTime(value, t0 + time);
      });
      source.connect(amp);
      if (clip.space) connectRoom(context, amp, clip.space);
      else amp.connect(context.destination);
      // With a room, its echo outlives the clip: close once it has died away.
      const ring = clip.space ? clip.space.seconds * 1000 : 0;
      source.onended = () => setTimeout(() => context.close(), ring);
      source.start(t0, offset, duration);
      // The speakers lag the context clock by the output latency; visuals synced to the clip wait for it.
      const latency = (context.baseLatency ?? 0) + (context.outputLatency ?? 0);
      return performance.now() + (delay + latency) * 1000;
    } catch (error) {
      console.warn('[supra] engine sound skipped', error);
      context.close();
      return null;
    }
  }

  /**
   * How loud the clip is over time, from the decoded file (so it exists without sound too).
   * @returns {Promise<Float32Array>} one value per LOUDNESS_WINDOW from clip.start
   */
  async function loudness() {
    const recording = await preload();
    const from = Math.floor(clip.start * recording.sampleRate);
    const to = Math.floor(clip.end * recording.sampleRate);
    return loudnessCurve(recording.getChannelData(0).subarray(from, to), recording.sampleRate, LOUDNESS_WINDOW);
  }

  return { preload, warmUp, play, loudness };
}

/** Low shelf, then the dry signal plus a generated room. */
function connectRoom(context, input, { wet, seconds, decay, lowShelf }) {
  const shelf = context.createBiquadFilter();
  shelf.type = 'lowshelf';
  shelf.frequency.value = lowShelf.frequency;
  shelf.gain.value = lowShelf.gain;
  input.connect(shelf);
  shelf.connect(context.destination);

  const channels = reverbImpulse({ seconds, decay, sampleRate: context.sampleRate, seed: 58 });
  const impulse = context.createBuffer(2, channels[0].length, context.sampleRate);
  channels.forEach((samples, i) => impulse.copyToChannel(samples, i));
  const room = context.createConvolver();
  room.buffer = impulse;
  const level = context.createGain();
  level.gain.value = wet;
  shelf.connect(room).connect(level).connect(context.destination);
}
