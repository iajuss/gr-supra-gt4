// Track geometry: GeoJSON [lon, lat] → planar metres → canvas box → position along the lap.

import { lastIndexAtOrBefore } from './math.js';

const METRES_PER_DEGREE = (6_371_000 * Math.PI) / 180;

/**
 * Equirectangular projection around the centroid. Accurate enough at circuit scale (a few km).
 * Canvas convention: east is +x, north is -y.
 * @param {[number, number][]} coordinates [lon, lat] pairs
 * @returns {{ x: number, y: number }[]}
 */
export function projectCoordinates(coordinates) {
  const lon0 = mean(coordinates.map(([lon]) => lon));
  const lat0 = mean(coordinates.map(([, lat]) => lat));
  const lonScale = METRES_PER_DEGREE * Math.cos((lat0 * Math.PI) / 180);

  return coordinates.map(([lon, lat]) => ({
    x: (lon - lon0) * lonScale,
    y: -(lat - lat0) * METRES_PER_DEGREE,
  }));
}

/**
 * Uniformly scales and centres points inside a padded box.
 * @param {{ x: number, y: number }[]} points
 * @param {{ width: number, height: number, padding?: number }} box
 */
export function fitToBox(points, { width, height, padding = 0 }) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = Math.max(...ys) - minY;

  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  const safeScale = Number.isFinite(scale) ? scale : 1;
  const offsetX = (width - spanX * safeScale) / 2;
  const offsetY = (height - spanY * safeScale) / 2;

  return points.map((p) => ({
    x: (p.x - minX) * safeScale + offsetX,
    y: (p.y - minY) * safeScale + offsetY,
  }));
}

/**
 * @param {{ x: number, y: number }[]} points
 * @returns {{ points: { x: number, y: number }[], cumulative: number[], total: number }}
 */
export function measurePath(points) {
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    cumulative.push(cumulative[i - 1] + Math.hypot(curr.x - prev.x, curr.y - prev.y));
  }
  return { points, cumulative, total: cumulative.at(-1) };
}

/**
 * Position and heading at a lap progress. Progress wraps, so 1.25 equals 0.25.
 * @param {ReturnType<typeof measurePath>} path
 * @param {number} progress
 * @returns {{ x: number, y: number, angle: number }}
 */
export function pointAt({ points, cumulative, total }, progress) {
  const t = ((progress % 1) + 1) % 1;
  const distance = t * total;
  const i = lastIndexAtOrBefore(cumulative, distance);

  const a = points[i];
  const b = points[i + 1];
  const segmentLength = cumulative[i + 1] - cumulative[i];
  const local = segmentLength > 0 ? (distance - cumulative[i]) / segmentLength : 0;

  return {
    x: a.x + (b.x - a.x) * local,
    y: a.y + (b.y - a.y) * local,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  };
}

/** Rotates points 90° clockwise on screen (canvas y-down): (x, y) → (-y, x). */
export function rotateQuarter(points) {
  return points.map(({ x, y }) => ({ x: -y, y: x }));
}

/**
 * Rotates the track a quarter turn when its aspect disagrees with the box (portrait track in a
 * landscape box or vice versa), so it fills the available space.
 */
export function orientToBox(points, { width, height }) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const trackIsLandscape = Math.max(...xs) - Math.min(...xs) >= Math.max(...ys) - Math.min(...ys);
  const boxIsLandscape = width >= height;

  return trackIsLandscape === boxIsLandscape
    ? { points, rotated: false }
    : { points: rotateQuarter(points), rotated: true };
}

/**
 * Polyline travelled from the start up to a progress in [0, 1] (no wrapping: 1 is the full loop).
 * @returns {{ x: number, y: number }[]}
 */
export function sliceUntil({ points, cumulative, total }, progress) {
  if (progress >= 1) return points;

  const distance = Math.max(0, progress) * total;
  const i = lastIndexAtOrBefore(cumulative, distance);
  const travelled = points.slice(0, i + 1);

  if (distance > cumulative[i]) {
    const { x, y } = pointAt({ points, cumulative, total }, progress);
    travelled.push({ x, y });
  }
  return travelled;
}

function mean(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
