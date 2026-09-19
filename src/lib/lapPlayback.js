// When the lap should be moving: pure state, so the rules live apart from the frame loop (lapPlayer).
// The lap starts on its own once half its view is visible, stops off screen and on the line, and the
// visitor can pause it at any time (WCAG 2.2.2: moving content that lasts over 5 s must be pausable).

/**
 * @typedef {{ started: boolean, finished: boolean, visible: boolean, paused: boolean }} Playback
 */

/** @type {Playback} */
export const initialPlayback = Object.freeze({ started: false, finished: false, visible: false, paused: false });

/**
 * @param {Playback} state
 * @param {number} ratio share of the view on screen (0 = off screen)
 * @param {number} startAt share that starts the lap
 * @returns {Playback}
 */
export function see(state, ratio, startAt) {
  return { ...state, visible: ratio > 0, started: state.started || ratio >= startAt };
}

/** @param {Playback} state @returns {Playback} */
export function togglePause(state) {
  return { ...state, paused: !state.paused };
}

/** @param {Playback} state @returns {Playback} */
export function finish(state) {
  return { ...state, finished: true };
}

/** A new lap from the line, playing: restart is also how a paused lap is told to go. */
export function restart(state) {
  return { ...state, started: true, finished: false, paused: false };
}

/** @param {Playback} state */
export function shouldRun({ started, finished, visible, paused }) {
  return started && !finished && visible && !paused;
}
