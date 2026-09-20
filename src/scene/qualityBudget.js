// An explicit budget for the stage: it watches the first frames the visitor actually gets and, if the
// machine cannot keep up, gives something back — once, and for good (lib/quality.js holds the rule).
//
// What it gives up, in order: the handheld camera first, because it is what makes the page draw
// forever and it is the least visible loss, then the bloom, which is the car's signature.
//
// This sampler is itself a loop that runs every frame, so it stops the moment it has decided.

import { QUALITY, judgeFrames } from '../lib/quality.js';

/**
 * @param {object} options
 * @param {{ dropBloom: Function }} options.view
 * @param {{ park: Function }} options.handheld
 * @param {{ warmUp?: number, sample?: number }} [options.settings] plus any lib/quality.js threshold
 * @param {Promise<unknown>} [options.after] the opening; nothing is watched until it is over
 * @param {(verdict: ReturnType<typeof judgeFrames>) => void} [options.onDecision]
 */
export function createQualityBudget({ view, handheld, settings = {}, after, onDecision }) {
  const { warmUp = 30, sample = 90, ...rules } = settings;
  const gaps = [];
  let active = false;
  let frame = 0;
  let last = null;
  let warmed = 0;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  /** Only once enough clean frames are in; until then it keeps watching. */
  function settle() {
    const verdict = judgeFrames(gaps, rules);
    if (!verdict.decided) return;
    stop();
    if (verdict.level !== QUALITY.full) handheld.park();
    if (verdict.level === QUALITY.plain) view.dropBloom();
    onDecision?.(verdict);
  }

  function tick(now) {
    frame = requestAnimationFrame(tick);
    // A hidden tab or a stage off screen draws nothing: those gaps say nothing about the machine.
    if (!active || document.visibilityState !== 'visible') {
      last = null;
      return;
    }
    if (last !== null) {
      // A few frames to settle after the opening hands the stage back.
      if (warmed < warmUp) warmed += 1;
      else gaps.push(now - last);
    }
    last = now;
    if (gaps.length >= sample) settle();
  }

  // The opening is an animation of its own, and the heaviest moment of the page: judging the machine
  // by it would take the hand away from anyone whose engine start merely stutters.
  let stopped = false;
  Promise.resolve(after).then(() => {
    if (!stopped) frame = requestAnimationFrame(tick);
  });

  return {
    /** @param {boolean} next the 3D zone entering or leaving the viewport */
    setActive(next) {
      active = next;
      if (!active) last = null;
    },
    destroy() {
      stopped = true;
      stop();
    },
  };
}
