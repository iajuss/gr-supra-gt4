// Smoothed centreline of the lap on the 3D ground plane: samples, tangents, normals and corner radii.
// Track points are planar { x, y } (canvas convention); here they become { x, z } (y is up in the scene).

import { smoothClosed, circumradius } from './geometry.js';
import { pointAt } from './track.js';

/**
 * @param {ReturnType<import('./track.js').measurePath>} path closed path in metres
 * @param {{ sampleStep: number, smoothingRadius: number, curvatureWindow: number }} options
 */
export function createCentreline(path, { sampleStep, smoothingRadius, curvatureWindow }) {
  const n = Math.round(path.total / sampleStep);
  const raw = Array.from({ length: n }, (_, i) => pointAt(path, i / n));
  // Same double box filter as the telemetry, so the car follows the lap the speeds were computed on.
  const smoothed = smoothClosed(smoothClosed(raw, smoothingRadius), smoothingRadius);

  const points = smoothed.map(({ x, y }) => ({ x, z: y }));
  const tangents = points.map((_, i) => unit(sub(points[(i + 1) % n], points[(i - 1 + n) % n])));
  const normals = tangents.map((t) => ({ x: -t.z, z: t.x }));
  const radii = smoothed.map((p, i) =>
    circumradius(smoothed[(i - curvatureWindow + n) % n], p, smoothed[(i + curvatureWindow) % n]),
  );

  /**
   * Position and direction at a lap progress (wraps). `index` is the sample just behind the position.
   * @returns {{ position: { x: number, z: number }, direction: { x: number, z: number }, index: number }}
   */
  function frameAt(progress) {
    const exact = (((progress % 1) + 1) % 1) * n;
    const index = Math.floor(exact) % n;
    const local = exact - Math.floor(exact);
    const next = (index + 1) % n;

    return {
      position: lerp(points[index], points[next], local),
      direction: unit(lerp(tangents[index], tangents[next], local)),
      index,
    };
  }

  return { count: n, points, tangents, normals, radii, frameAt };
}

/** Samples tight enough to get kerbs (corner radius at or below maxRadius). */
export function kerbSamples({ radii }, maxRadius) {
  return radii.map((r) => r <= maxRadius);
}

function sub(a, b) {
  return { x: a.x - b.x, z: a.z - b.z };
}

function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
}

function unit(v) {
  const length = Math.hypot(v.x, v.z);
  return { x: v.x / length, z: v.z / length };
}
