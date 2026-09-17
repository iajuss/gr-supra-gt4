// Simulated lap telemetry derived from track geometry.
// Pipeline: resample path → smooth → corner radius → corner speed limit → accel/brake passes → time integration.

import { lastIndexAtOrBefore } from './math.js';
import { pointAt } from './track.js';

const MS_TO_KMH = 3.6;

/**
 * Moving average over a closed loop of points (±radius samples, wrapping).
 * Removes the kinks between raw GeoJSON vertices that would otherwise read as fake corners.
 */
export function smoothClosed(points, radius) {
  const n = points.length;
  const span = radius * 2 + 1;
  return points.map((_, i) => {
    let x = 0;
    let y = 0;
    for (let j = -radius; j <= radius; j++) {
      const p = points[(i + j + n) % n];
      x += p.x;
      y += p.y;
    }
    return { x: x / span, y: y / span };
  });
}

/** Radius of the circle through three points; Infinity when they are collinear. */
export function circumradius(a, b, c) {
  const ab = Math.hypot(b.x - a.x, b.y - a.y);
  const bc = Math.hypot(c.x - b.x, c.y - b.y);
  const ca = Math.hypot(a.x - c.x, a.y - c.y);
  const doubleArea = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
  return doubleArea < 1e-9 ? Infinity : (ab * bc * ca) / (2 * doubleArea);
}

/** Maximum speed (m/s) a corner of radius r allows. */
export function cornerSpeedLimit(radius, { lateralAcceleration, topSpeed }) {
  return Math.min(topSpeed, Math.sqrt(lateralAcceleration * radius));
}

/**
 * Applies traction (forward) and braking (backward) limits on a closed loop of speed limits.
 * Both passes start at the slowest point, which is guaranteed to stay at its own limit.
 * @param {number[]} limits speed limit per sample (m/s)
 * @param {number} ds distance between samples (m)
 */
export function limitAcceleration(limits, ds, { accelerationMax, braking, topSpeed }) {
  const n = limits.length;
  const speeds = [...limits];
  const start = limits.indexOf(Math.min(...limits));

  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    const next = (i + 1) % n;
    const traction = accelerationMax * Math.max(0, 1 - speeds[i] / topSpeed);
    speeds[next] = Math.min(speeds[next], Math.sqrt(speeds[i] ** 2 + 2 * traction * ds));
  }

  for (let k = 0; k < n; k++) {
    const i = (start - k + n) % n;
    const prev = (i - 1 + n) % n;
    speeds[prev] = Math.min(speeds[prev], Math.sqrt(speeds[i] ** 2 + 2 * braking * ds));
  }

  return speeds;
}

/**
 * @param {ReturnType<import('./track.js').measurePath>} path path in metres
 * @param {typeof import('../data/vulcanDynamics.js').default} params
 */
export function createLapModel(path, params) {
  const n = Math.max(3, Math.round(path.total / params.sampleStep));
  const step = path.total / n;
  const w = params.curvatureWindow;

  const resampled = Array.from({ length: n }, (_, i) => pointAt(path, i / n));
  // Two passes of a box filter ≈ a triangular filter: smoother without over-flattening corners.
  const points = smoothClosed(smoothClosed(resampled, params.smoothingRadius), params.smoothingRadius);
  const limits = points.map((p, i) => {
    const radius = circumradius(points[(i - w + n) % n], p, points[(i + w) % n]);
    return cornerSpeedLimit(radius, params);
  });
  const speeds = limitAcceleration(limits, step, params);

  const times = [0];
  for (let i = 0; i < n; i++) {
    const average = (speeds[i] + speeds[(i + 1) % n]) / 2;
    times.push(times[i] + step / average);
  }

  return { total: path.total, step, speeds, times, lapTime: times[n], params };
}

/**
 * Telemetry at a simulated time. Time wraps, so the lap can loop.
 * @returns {{ progress: number, speed: number, gear: number, sector: number, elapsed: number }}
 *          speed in km/h, elapsed in seconds
 */
export function sampleAtTime({ total, step, speeds, times, lapTime, params }, seconds) {
  const elapsed = ((seconds % lapTime) + lapTime) % lapTime;
  const i = lastIndexAtOrBefore(times, elapsed);
  const local = (elapsed - times[i]) / (times[i + 1] - times[i]);

  const n = speeds.length;
  const speed = (speeds[i] + (speeds[(i + 1) % n] - speeds[i]) * local) * MS_TO_KMH;
  const progress = ((i + local) * step) / total;

  return {
    progress,
    speed,
    gear: gearFor(speed, params.gearTopSpeeds),
    sector: sectorFor(progress, params.sectorSplits),
    elapsed,
  };
}

/** Gear number (1-based) for a speed in km/h, given each gear's top speed. */
export function gearFor(speedKmh, gearTopSpeeds) {
  const index = gearTopSpeeds.findIndex((top) => speedKmh <= top);
  return (index === -1 ? gearTopSpeeds.length - 1 : index) + 1;
}

/** Sector number (1-based) for a lap progress, given the split points. */
export function sectorFor(progress, splits) {
  return splits.filter((split) => progress >= split).length + 1;
}
