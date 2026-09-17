// Plays one lap per start: frame loop + lap clock. Starts when the view is half visible, pauses while it is
// off screen, stops on the line. Shared by the 2D (lite) and 3D (full) views.

import lapScene from '../data/lapScene.js';
import { createLapClock } from '../lib/lapClock.js';
import { sampleAtTime } from '../lib/telemetry.js';

const START_VISIBILITY = 0.5;

/**
 * @param {HTMLElement} root element watched for visibility
 * @param {{
 *   model: ReturnType<import('../lib/telemetry.js').createLapModel>,
 *   onFrame: (sample: ReturnType<typeof sampleAtTime>, dt: number) => void,
 *   onFinish: () => void,
 *   onRestart?: () => void,
 * }} options
 */
export function createLapPlayer(root, { model, onFrame, onFinish, onRestart }) {
  const clock = createLapClock({ lapTime: model.lapTime, duration: lapScene.duration, maxStep: lapScene.maxStep });
  let frame = 0;
  let last = 0;
  let running = false;
  let started = false;
  let finished = false;
  let visible = false;

  function tick(now) {
    const dt = Math.min(lapScene.maxStep, Math.max(0, (now - last) / 1000));
    last = now;
    const { simTime, done } = clock.advance(dt);
    if (done) {
      running = false;
      finished = true;
      onFinish();
      return;
    }
    onFrame(sampleAtTime(model, simTime), dt);
    frame = requestAnimationFrame(tick);
  }

  function resume() {
    if (running || !started || finished || !visible) return;
    running = true;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(frame);
    running = false;
  }

  function restart() {
    stop();
    clock.reset();
    started = true;
    finished = false;
    onRestart?.();
    resume();
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        stop();
        return;
      }
      if (entry.intersectionRatio >= START_VISIBILITY) started = true;
      resume();
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
