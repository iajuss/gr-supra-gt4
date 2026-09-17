// Flat ribbons along the centreline (asphalt, edges, kerbs, trail) as raw buffers, ready for a BufferGeometry.

const INDICES_PER_SEGMENT = 6;

/**
 * Closed ribbon between two lateral offsets from the centreline. The first sample row is repeated at the
 * end, so the last segment closes the loop.
 * @param {{ count: number, points: { x: number, z: number }[], normals: { x: number, z: number }[] }} line
 * @param {{
 *   offsetA: number, offsetB: number, height: number,
 *   segments?: boolean[],                        // segment i (sample i → i + 1) is drawn when true
 *   colorAt?: (sample: number) => [number, number, number],
 * }} options
 * @returns {{ positions: Float32Array, indices: Uint32Array, colors?: Float32Array }}
 */
export function buildRibbon({ count: n, points, normals }, { offsetA, offsetB, height, segments, colorAt }) {
  const positions = new Float32Array((n + 1) * 6);
  const colors = colorAt ? new Float32Array((n + 1) * 6) : undefined;
  const indices = [];

  for (let i = 0; i <= n; i++) {
    const j = i % n;
    const p = points[j];
    const nrm = normals[j];
    positions.set(
      [p.x + nrm.x * offsetA, height, p.z + nrm.z * offsetA, p.x + nrm.x * offsetB, height, p.z + nrm.z * offsetB],
      i * 6,
    );
    if (colors) {
      const c = colorAt(j);
      colors.set([...c, ...c], i * 6);
    }
    if (i < n && (!segments || segments[i])) {
      const k = i * 2;
      indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }

  return { positions, indices: Uint32Array.from(indices), colors };
}

/** Index count that draws an unskipped ribbon from the start line up to a sample (the trail). */
export function indexCountUntil(sample) {
  return sample * INDICES_PER_SEGMENT;
}

/** Alternating stripe (0 or 1) for a sample, with `length` samples per stripe. */
export function stripeAt(sample, length) {
  return Math.floor(sample / length) % 2;
}
