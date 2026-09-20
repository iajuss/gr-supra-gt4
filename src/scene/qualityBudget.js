// An explicit budget for the stage: it watches the first frames the visitor actually gets and says,
// once, how much of the stage this machine can afford (lib/quality.js holds the rule).
//
// It only reports. What a verdict costs — the handheld camera first, the bloom after it — is decided
// where the pieces are wired together, so adding another thing to give up is one line there.
//
// This sampler is itself a loop that runs every frame, so it stops the moment it has decided.

import { judgeFrames } from '../lib/quality.js';

/**
 * @param {object} options
 * @param {{ warmUp?: number, sample?: number }} [options.settings] plus any lib/quality.js threshold
 * @param {Promise<unknown>} [options.after] the opening; nothing is watched until it is over
 * @param {(verdict: ReturnType<typeof judgeFrames>) => void} options.onVerdict said once
 */
export function createQualityBudget({ settings = {}, after, onVerdict }) {
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
    onVerdict(verdict);
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
