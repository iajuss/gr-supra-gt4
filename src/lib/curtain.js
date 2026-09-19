// The curtain into THE LAP: while the lap stage rises one screen, the handoff's title leaves the centre
// for the stage's top-left corner and becomes the stage's title (components/lapCurtain.js).
// The title is not pinned: its y also takes the distance scrolled, so on screen it only follows its path
// (the rest of the handoff, its label included, scrolls away as usual).

import { clamp, lerp } from './math.js';

/** @param {number} t 0–1 */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * @param {number} progress 0 (stage just below the screen) → 1 (stage at the top)
 * @param {object} move
 * @param {{ left: number, top: number }} move.from the title's top-left corner on screen at the start, px
 * @param {{ left: number, top: number }} move.to where that corner rests on the stage, px from the viewport
 * @param {number} move.scale the title's final size (transform-origin at its top-left corner)
 * @param {number} move.distance px scrolled between progress 0 and 1
 * @returns {{ x: number, y: number, scale: number }} transform for the title
 */
export function curtainAt(progress, { from, to, scale, distance }) {
  const t = clamp(progress, 0, 1);
  const eased = easeInOutCubic(t);
  return {
    x: lerp(0, to.left - from.left, eased),
    y: lerp(0, to.top - from.top, eased) + distance * t,
    scale: lerp(1, scale, eased),
  };
}
