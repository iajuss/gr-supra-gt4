// Lap playback clock: seconds on screen → simulated lap seconds. One lap, then it stops on the line.

// Frame times are summed as floats; without this, 720 frames of 1/60 s can land a hair short of 12 s.
const EPSILON = 1e-9;

/**
 * @param {{ lapTime: number, duration: number, maxStep?: number }} options
 *        lapTime: simulated seconds · duration: seconds on screen · maxStep: longest frame counted
 */
export function createLapClock({ lapTime, duration, maxStep = Infinity }) {
  let screenTime = 0;

  return {
    /**
     * @param {number} dt seconds since the previous frame
     * @returns {{ simTime: number, done: boolean }}
     */
    advance(dt) {
      screenTime = Math.min(duration, screenTime + Math.min(maxStep, Math.max(0, dt)));
      const done = screenTime >= duration - EPSILON;
      return { simTime: done ? lapTime : (screenTime / duration) * lapTime, done };
    },

    reset() {
      screenTime = 0;
    },
  };
}
