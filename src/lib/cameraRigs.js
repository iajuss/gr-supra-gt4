// The three lap cameras (Chase, Heli, Top): where each one sits and looks for a car frame.
// Car frames come from the centreline: position and unit direction on the ground plane { x, z }, y up.

import { lerp } from './math.js';

/**
 * @param {'chase' | 'heli' | 'top'} mode
 * @param {{ position: { x: number, z: number }, direction: { x: number, z: number } }} frame
 * @param {typeof import('../data/lapScene.js').default.cameras} cameras
 * @returns {{ position: { x: number, y: number, z: number }, target: { x: number, y: number, z: number } }}
 */
export function cameraRig(mode, { position: car, direction: dir }, cameras) {
  // Same turn as the track normals, so "side" matches the ribbon's positive offsets.
  const side = { x: -dir.z, z: dir.x };
  // Point relative to the car: along the heading, up, and to the side.
  const at = (ahead, up = 0, sideways = 0) => ({
    x: car.x + dir.x * ahead + side.x * sideways,
    y: up,
    z: car.z + dir.z * ahead + side.z * sideways,
  });

  if (mode === 'chase') {
    const { back, up, ahead, targetUp } = cameras.chase;
    return { position: at(-back, up), target: at(ahead, targetUp) };
  }
  if (mode === 'heli') {
    const { back, up, side: sideways, ahead } = cameras.heli;
    return { position: at(-back, up, sideways), target: at(ahead) };
  }
  if (mode === 'top') {
    const { offset } = cameras.top;
    return {
      position: { x: car.x + offset.x, y: offset.y, z: car.z + offset.z },
      target: { x: car.x, y: 0, z: car.z },
    };
  }
  throw new Error(`Unknown lap camera: ${mode}`);
}

/** Field of view in degrees: the chase camera widens with speed (km/h), the others stay fixed. */
export function cameraFov(mode, speedKmh, { fov, chaseFovBoost, chaseFovSpeed }) {
  return mode === 'chase' ? fov + (speedKmh / chaseFovSpeed) * chaseFovBoost : fov;
}

/** Share of the remaining gap to close this frame (exponential smoothing, independent of frame rate). */
export function followFactor(dt, rate) {
  return 1 - Math.exp(-dt * rate);
}

/**
 * Scene look for a blend between the chase/heli look (0) and the top camera look (1).
 * @param {number} blend
 * @param {typeof import('../data/lapScene.js').default.look} look
 */
export function topCameraLook(blend, { fogDensity, topCarScale }) {
  return {
    fogDensity: lerp(fogDensity, 0, blend),
    carScale: lerp(1, topCarScale, blend),
    topTrailOpacity: blend,
  };
}
