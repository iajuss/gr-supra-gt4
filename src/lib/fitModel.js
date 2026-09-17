// Puts an imported model at real-world size, wherever its author left it.
// Plain boxes of { x, y, z }, no Three.js: the proxy uses it now, the GLB will use it later.

/**
 * Uniform scale and translation that give a bounding box the target length along x,
 * centred on the origin in x and z and resting on the ground (y = 0).
 * Apply in this order: scale the object, then set its position to `offset`.
 *
 * @param {{ min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } }} box
 * @param {number} targetLength metres along x (the car's nose-to-tail axis)
 * @returns {{ scale: number, offset: { x: number, y: number, z: number }, size: { length: number, width: number, height: number } }}
 */
export function fitToLength(box, targetLength) {
  if (!(targetLength > 0)) throw new RangeError(`fitToLength: target length must be positive, got ${targetLength}`);

  const size = { x: box.max.x - box.min.x, y: box.max.y - box.min.y, z: box.max.z - box.min.z };
  if (!(size.x > 0)) throw new RangeError(`fitToLength: the box has no length along x (${size.x})`);

  const scale = targetLength / size.x;

  return {
    scale,
    offset: {
      x: -((box.min.x + box.max.x) / 2) * scale,
      y: -box.min.y * scale,
      z: -((box.min.z + box.max.z) / 2) * scale,
    },
    size: { length: targetLength, width: size.z * scale, height: size.y * scale },
  };
}
