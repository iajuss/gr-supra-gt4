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
 * Blends two points along an arc around the vertical axis through the origin (the car's centre):
 * the angle in the ground plane takes the short way round, while the distance to the axis and the
 * height blend linearly. A straight line between shots on opposite sides of the car would cut
 * through it. `t` outside [0, 1] sticks to the ends, which come back exactly (as copies).
 * @param {{ x: number, y: number, z: number }} a
 * @param {typeof a} b
 * @param {number} t
 */
export function lerpOrbit(a, b, t) {
  const k = clamp(t, 0, 1);
  if (k === 0) return { ...a };
  if (k === 1) return { ...b };

  const from = Math.atan2(a.z, a.x);
  let turn = Math.atan2(b.z, b.x) - from;
  if (turn > Math.PI) turn -= 2 * Math.PI;
  if (turn < -Math.PI) turn += 2 * Math.PI;

  const angle = from + turn * k;
  const radius = lerp(Math.hypot(a.x, a.z), Math.hypot(b.x, b.z), k);
  return { x: Math.cos(angle) * radius, y: lerp(a.y, b.y, k), z: Math.sin(angle) * radius };
}

/**
 * Blends two camera shots: the position swings around the car (`lerpOrbit`), the rest is linear.
 * `t` outside [0, 1] sticks to the ends.
 * @param {{ position: { x: number, y: number, z: number }, target: { x: number, y: number, z: number }, fov: number }} a
 * @param {typeof a} b
 * @param {number} t
 */
export function lerpShot(a, b, t) {
  const k = clamp(t, 0, 1);
  const blend = (from, to) => ({ x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k), z: lerp(from.z, to.z, k) });
  return {
    position: lerpOrbit(a.position, b.position, k),
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

/** Angles along a path, each step taking the shortest way round, so a half-turn never jumps. */
function unwrapped(angles) {
  const out = [angles[0]];
  for (let i = 1; i < angles.length; i += 1) {
    let turn = angles[i] - angles[i - 1];
    if (turn > Math.PI) turn -= 2 * Math.PI;
    if (turn < -Math.PI) turn += 2 * Math.PI;
    out.push(out[i - 1] + turn);
  }
  return out;
}

/**
 * Slopes for a monotone cubic (Fritsch–Carlson): the curve keeps its speed through each knot, and no
 * segment ever leaves the range of its two ends. That last part is what keeps the camera from swinging
 * closer to the car in the middle of a move than it is at either end of it.
 */
function monotoneSlopes(knots, values) {
  const last = values.length - 1;
  const secants = values.slice(0, -1).map((value, i) => (values[i + 1] - value) / (knots[i + 1] - knots[i]));
  const slopes = values.map((_, i) => {
    if (i === 0) return secants[0];
    if (i === last) return secants[last - 1];
    return secants[i - 1] * secants[i] <= 0 ? 0 : (secants[i - 1] + secants[i]) / 2;
  });

  for (let i = 0; i < last; i += 1) {
    if (secants[i] === 0) {
      slopes[i] = 0;
      slopes[i + 1] = 0;
      continue;
    }
    const a = slopes[i] / secants[i];
    const b = slopes[i + 1] / secants[i];
    const size = Math.hypot(a, b);
    if (size > 3) {
      slopes[i] = ((3 * a) / size) * secants[i];
      slopes[i + 1] = ((3 * b) / size) * secants[i];
    }
  }
  return slopes;
}

/** One channel of the path, sampled inside segment `i`. */
function hermite(knots, values, slopes, i, at) {
  const span = knots[i + 1] - knots[i];
  const t = span > 0 ? (at - knots[i]) / span : 0;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * values[i] +
    (t3 - 2 * t2 + t) * span * slopes[i] +
    (-2 * t3 + 3 * t2) * values[i + 1] +
    (t3 - t2) * span * slopes[i + 1]
  );
}

/**
 * The camera along the whole list of shots as one curve, instead of one straight move per pair: it
 * passes exactly through every shot but no longer changes speed abruptly at it. The position travels
 * around the car (angle, distance from its vertical axis and height), as `lerpOrbit` does for a pair.
 * @param {Parameters<typeof shotAt>[0]} shots
 * @param {number} progress 0 is the first shot, 1 the last
 * @param {number[]} [stops] one ascending 0–1 value per shot (see normalizeStops)
 */
export function smoothShotAt(shots, progress, stops) {
  if (shots.length < 2) return lerpShot(shots[0], shots[0], 0);

  const knots = stops ?? shots.map((_, i) => i / (shots.length - 1));
  const channels = {
    angle: unwrapped(shots.map(({ position }) => Math.atan2(position.z, position.x))),
    radius: shots.map(({ position }) => Math.hypot(position.x, position.z)),
    height: shots.map(({ position }) => position.y),
    targetX: shots.map(({ target }) => target.x),
    targetY: shots.map(({ target }) => target.y),
    targetZ: shots.map(({ target }) => target.z),
    fov: shots.map(({ fov }) => fov),
    offset: shots.map(({ offset }) => offset ?? 0),
  };

  const at = clamp(progress, 0, 1);
  const index = lastIndexAtOrBefore(knots, at);
  const value = (name) => hermite(knots, channels[name], monotoneSlopes(knots, channels[name]), index, at);

  const angle = value('angle');
  const radius = value('radius');
  return {
    position: { x: Math.cos(angle) * radius, y: value('height'), z: Math.sin(angle) * radius },
    target: { x: value('targetX'), y: value('targetY'), z: value('targetZ') },
    fov: value('fov'),
    offset: value('offset'),
  };
}
