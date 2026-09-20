// Air over the car, for the aero chapter: a fan of streamlines that rise at the nose, ride the roof
// and settle again behind the tail. Pure maths, so the one rule that matters can be tested without a
// scene: no point of any line is ever inside the car.

import { clamp, lerp } from './math.js';

export const FLOW = {
  lanes: 9, // streamlines across the car, from one side to the other
  spread: 2.6, // half the width of the fan, metres
  clearance: 0.12, // how far above the roof the air passes
  lead: 2.2, // how far ahead of the nose a line starts, and over which it rises
  trail: 3, // how far behind the tail it ends, and over which it settles
  samples: 60, // points per line
  sideSpread: 0.35, // how far out the air is pushed going around the body
  base: 0.35, // the height the air arrives at, well ahead of the car
  falloff: 0.9, // over how many metres the lift dies away beside the car
};

const smooth = (t) => t * t * (3 - 2 * t);

/** 1 over the car, easing to 0 ahead of the nose and behind the tail. */
function bulge(x, halfLength, lead, trail) {
  if (Math.abs(x) <= halfLength) return 1;
  const past = x > 0 ? (x - halfLength) / lead : (-x - halfLength) / trail;
  return smooth(1 - clamp(past, 0, 1));
}

/**
 * The fan of streamlines, nose (+x) to tail, one array of points each.
 * @param {{ length: number, width: number, height: number }} car metres, centred on the origin
 * @param {Partial<typeof FLOW>} [options]
 * @returns {Array<Array<{ x: number, y: number, z: number }>>}
 */
export function streamlines(car, options = {}) {
  const { lanes, spread, clearance, lead, trail, samples, sideSpread, base, falloff } = { ...FLOW, ...options };
  const halfLength = car.length / 2;
  const halfWidth = car.width / 2;
  const from = halfLength + lead;
  const to = -halfLength - trail;

  return Array.from({ length: lanes }, (_, lane) => {
    const z0 = lanes > 1 ? lerp(-spread, spread, lane / (lanes - 1)) : 0;
    // Over the body the air has to clear the roof; beside it the lift dies away with distance.
    const fade = clamp(1 - Math.max(0, Math.abs(z0) - halfWidth) / falloff, 0, 1);
    const peak = base + (car.height + clearance - base) * fade;
    const out = Math.sign(z0) * sideSpread;

    return Array.from({ length: samples }, (_, i) => {
      const x = lerp(from, to, i / (samples - 1));
      const rise = bulge(x, halfLength, lead, trail);
      return { x, y: lerp(base, peak, rise), z: z0 + out * rise };
    });
  });
}

/**
 * How much of the flow belongs on screen at this point of the scroll: 1 at the chapter's own stop,
 * fading to nothing `reach` either side of it. A fade, not a switch, so the air arrives and leaves
 * with the camera instead of appearing all at once somewhere in the middle of a move.
 * @param {number} progress 0-1 along the whole camera path
 * @param {number} stop the chapter's place along it (see normalizeStops)
 * @param {number} reach how far either side the flow is still worth drawing
 */
export function nearStop(progress, stop, reach) {
  if (!(reach > 0)) return 0;
  const away = Math.abs(progress - stop) / reach;
  if (away >= 1) return 0;
  return smooth(1 - away);
}

/**
 * Where a travelling mark sits along a line. `p` is a phase that loops, so a mark leaving the tail
 * comes back in at the nose without a seam. The step is even along the line's own samples, which are
 * evenly spaced in x: the air keeps its horizontal pace and appears to hurry over the roof.
 * @param {Array<{ x: number, y: number, z: number }>} line
 * @param {number} p
 */
export function pointAt(line, p) {
  const last = line.length - 1;
  const at = (((p % 1) + 1) % 1) * last;
  const i = Math.min(last - 1, Math.floor(at));
  const t = at - i;
  const a = line[i];
  const b = line[i + 1];
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) };
}
