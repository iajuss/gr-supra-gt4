// How much of the stage this machine can afford. Pure: it is handed the gaps between drawn frames
// and answers with a level, so the rule can be tested without a GPU.
//
// The budget is relative to the screen, not to a fixed millisecond. A frame gap is capped by the
// display's own refresh, so 16,7 ms is a perfectly healthy 60 Hz screen and 6,1 ms a 164 Hz one: a
// plain "p95 over 20 ms" would punish the ordinary monitors it is meant to protect.

/** In the order things are given up: the hand first, because it is what draws forever. */
export const QUALITY = { full: 'full', still: 'still', plain: 'plain' };

export const BUDGET = {
  minFrames: 60, // fewer than this and it keeps quiet
  tolerance: 1.5, // over this much of the screen's rhythm, a frame did not make it
  still: 0.1, // missed share that costs the handheld camera
  plain: 0.3, // and the bloom on top
  pause: 200, // a gap this long is a tab left behind, not a slow frame
  slowest: 21, // no real display is slower than ~50 Hz, so a "rhythm" beyond this is the machine
  floor: 20, // and a frame quicker than this is fine however fast the screen is: still 50 per second
};

const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];

/**
 * @param {number[]} deltas milliseconds between drawn frames, in any order
 * @param {Partial<typeof BUDGET>} [options]
 * @returns {{ level: string, decided: boolean, frames: number, vsync: number, missed: number }}
 */
export function judgeFrames(deltas, options = {}) {
  const { minFrames, tolerance, still, plain, pause, slowest, floor } = { ...BUDGET, ...options };
  const frames = deltas.filter((delta) => delta > 0 && delta < pause);
  if (frames.length < minFrames) {
    return { level: QUALITY.full, decided: false, frames: frames.length, vsync: 0, missed: 0 };
  }

  // The screen's rhythm is the floor of the gaps, not their middle: half the frames can be late
  // without moving a low quantile, while the median would drift up and hide the jank.
  // Capped, because a machine that never reaches any plausible refresh is simply slow all the time.
  const vsync = Math.min(quantile([...frames].sort((a, b) => a - b), 0.25), slowest);
  // Late for the screen is not the same as late for a person. On a 164 Hz screen one missed beat is
  // 12 ms - still 80 frames a second - so the budget would take the hand away from the best machines.
  const late = Math.max(vsync * tolerance, floor);
  const missed = frames.filter((delta) => delta > late).length / frames.length;
  const level = missed > plain ? QUALITY.plain : missed > still ? QUALITY.still : QUALITY.full;
  return { level, decided: true, frames: frames.length, vsync, missed };
}
