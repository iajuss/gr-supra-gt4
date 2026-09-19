// Plays one lap per start: frame loop + lap clock. Starts when the view is half visible, pauses while it is
// off screen or on demand ([data-lap-pause]), stops on the line. Shared by the 2D (lite) and 3D (full) views.
// The rules of when to move live in lib/lapPlayback.js; this file only follows them.

import lapScene from '../data/lapScene.js';
import { createLapClock } from '../lib/lapClock.js';
import * as playback from '../lib/lapPlayback.js';
import { sampleAtTime } from '../lib/telemetry.js';

const START_VISIBILITY = 0.5;

/**
 * @param {HTMLElement} root element watched for visibility, holding the [data-lap-pause] button
 * @param {{
 *   model: ReturnType<import('../lib/telemetry.js').createLapModel>,
 *   onFrame: (sample: ReturnType<typeof sampleAtTime>, dt: number) => void,
 *   onFinish: () => void,
 *   onRestart?: () => void,
 * }} options
 */
export function createLapPlayer(root, { model, onFrame, onFinish, onRestart }) {
  const clock = createLapClock({ lapTime: model.lapTime, duration: lapScene.duration, maxStep: lapScene.maxStep });
  const pauseButton = root.querySelector('[data-lap-pause]');
  let state = playback.initialPlayback;
  let frame = 0;
  let last = 0;
  let running = false;

  function tick(now) {
    const dt = Math.min(lapScene.maxStep, Math.max(0, (now - last) / 1000));
    last = now;
    const { simTime, done } = clock.advance(dt);
    if (done) {
      running = false;
      state = playback.finish(state);
      onFinish();
      return;
    }
    onFrame(sampleAtTime(model, simTime), dt);
    frame = requestAnimationFrame(tick);
  }

  /** Starts or stops the loop to match the state, and shows the state on the pause button. */
  function sync() {
    pauseButton?.setAttribute('aria-pressed', String(state.paused));
    const run = playback.shouldRun(state);
    if (run === running) return;
    running = run;
    if (run) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
    }
  }

  function restart() {
    cancelAnimationFrame(frame);
    running = false;
    clock.reset();
    state = playback.restart(state);
    onRestart?.();
    sync();
  }

  function togglePause() {
    state = playback.togglePause(state);
    sync();
  }

  pauseButton?.addEventListener('click', togglePause);

  const observer = new IntersectionObserver(
    ([entry]) => {
      // An edge-on intersection reports ratio 0 while still intersecting: it counts as in view.
      const ratio = entry.isIntersecting ? Math.max(entry.intersectionRatio, Number.MIN_VALUE) : 0;
      state = playback.see(state, ratio, START_VISIBILITY);
      sync();
    },
    { threshold: [0, START_VISIBILITY] },
  );
  observer.observe(root);

  return {
    restart,
    get running() {
      return running;
    },
  };
}
