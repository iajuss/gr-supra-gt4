// Plane geometry helpers for closed loops of { x, y } points.

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
