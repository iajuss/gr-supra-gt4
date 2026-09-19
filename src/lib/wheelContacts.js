// Where the tyres touch the floor, from the tyre mesh's vertices seen from above.
// The car sits centred on the origin, so each tyre is in its own quadrant of the floor.

/**
 * @param {Iterable<{ x: number, z: number }>} points tyre vertices, on the floor plane
 * @returns {Array<{ x: number, z: number }>} one centre per quadrant that has points (four for a car)
 */
export function wheelContacts(points) {
  const quadrants = new Map();
  for (const { x, z } of points) {
    const key = `${x >= 0 ? '+' : '-'}${z >= 0 ? '+' : '-'}`;
    const sum = quadrants.get(key) ?? { x: 0, z: 0, count: 0 };
    sum.x += x;
    sum.z += z;
    sum.count += 1;
    quadrants.set(key, sum);
  }
  return [...quadrants.values()].map(({ x, z, count }) => ({ x: x / count, z: z / count }));
}
