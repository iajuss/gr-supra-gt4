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
    offset: lerp(a.offset ?? 0, b.offset ?? 0, k),
  };
}

/**
 * Where the camera should look so the shot's subject (its `target`) sits `offset` of the frame
 * width right (+) or left (-) of centre, leaving room for the page's text on the other side.
 * The move is horizontal, along the camera's own right, so the height of the framing is kept.
 * @param {{ position: { x: number, y: number, z: number }, target: { x: number, y: number, z: number }, fov: number, offset?: number }} shot
 * @param {number} aspect the camera's width / height
 */
export function offsetTarget({ position, target, fov, offset = 0 }, aspect) {
  const forward = { x: target.x - position.x, z: target.z - position.z };
  const flat = Math.hypot(forward.x, forward.z);
  if (!offset || flat === 0) return { ...target };

  const distance = Math.hypot(forward.x, target.y - position.y, forward.z);
  const halfWidth = distance * Math.tan((fov * Math.PI) / 360) * aspect;
  const move = -offset * 2 * halfWidth; // looking left pushes the subject right
  const right = { x: -forward.z / flat, z: forward.x / flat };
  return { x: target.x + right.x * move, y: target.y, z: target.z + right.z * move };
}

/**
 * Ascending values (a section's place along the scroll, say) rescaled to 0–1.
 * All-equal values fall back to even spacing.
 * @param {number[]} values
 */
export function normalizeStops(values) {
  const span = values[values.length - 1] - values[0];
  if (span <= 0) return values.map((_, i) => i / (values.length - 1));
  return values.map((value) => (value - values[0]) / span);
}

/**
 * The camera along a list of shots. Without `stops` the shots are evenly spaced;
 * with them, each shot is reached at its own stop (see normalizeStops).
 * @param {Array<Parameters<typeof lerpShot>[0] & { id: string }>} shots
 * @param {number} progress 0 is the first shot, 1 the last
 * @param {number[]} [stops] one ascending 0–1 value per shot
 */
export function shotAt(shots, progress, stops) {
  if (shots.length < 2) return lerpShot(shots[0], shots[0], 0);

  const segments = shots.length - 1;
  if (!stops) {
    const scaled = clamp(progress, 0, 1) * segments;
    const index = Math.min(Math.floor(scaled), segments - 1);
    return lerpShot(shots[index], shots[index + 1], scaled - index);
  }

  const index = lastIndexAtOrBefore(stops, clamp(progress, 0, 1));
  const stretch = stops[index + 1] - stops[index];
  return lerpShot(shots[index], shots[index + 1], stretch > 0 ? (progress - stops[index]) / stretch : 1);
}
