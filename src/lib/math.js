/**
 * Binary search over an ascending array: index of the last segment start at or before `value`.
 * Capped at length - 2, so `sorted[index + 1]` always exists.
 * @param {number[]} sorted
 * @param {number} value
 */
export function lastIndexAtOrBefore(sorted, value) {
  let low = 0;
  let high = sorted.length - 2;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (sorted[mid] <= value) low = mid;
    else high = mid - 1;
  }
  return low;
}

/** Linear interpolation from a (t = 0) to b (t = 1). */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Keeps a value inside [min, max]. */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Blends two camera shots. `t` outside [0, 1] sticks to the ends.
 * @param {{ position: { x: number, y: number, z: number }, target: { x: number, y: number, z: number }, fov: number }} a
 * @param {typeof a} b
 * @param {number} t
 */
export function lerpShot(a, b, t) {
  const k = clamp(t, 0, 1);
  const blend = (from, to) => ({ x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k), z: lerp(from.z, to.z, k) });
  return {
    position: blend(a.position, b.position),
    target: blend(a.target, b.target),
    fov: lerp(a.fov, b.fov, k),
  };
}

/**
 * The camera along a list of shots, evenly spaced: 0 is the first shot, 1 the last.
 * @param {Array<Parameters<typeof lerpShot>[0] & { id: string }>} shots
 * @param {number} progress
 */
export function shotAt(shots, progress) {
  if (shots.length < 2) return lerpShot(shots[0], shots[0], 0);

  const segments = shots.length - 1;
  const scaled = clamp(progress, 0, 1) * segments;
  const index = Math.min(Math.floor(scaled), segments - 1);
  return lerpShot(shots[index], shots[index + 1], scaled - index);
}
