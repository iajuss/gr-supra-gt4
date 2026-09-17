import { describe, it, expect } from 'vitest';
import lapScene from '../data/lapScene.js';
import { cameraRig, cameraFov, followFactor, topCameraLook } from './cameraRigs.js';

const { cameras, look } = lapScene;
const alongX = { position: { x: 0, z: 0 }, direction: { x: 1, z: 0 } };
const alongZ = { position: { x: 100, z: 50 }, direction: { x: 0, z: 1 } };

describe('cameraRig', () => {
  it('chase: behind and above the car, looking ahead', () => {
    expect(cameraRig('chase', alongX, cameras)).toEqual({
      position: { x: -24, y: 7.5, z: 0 },
      target: { x: 30, y: 1.5, z: 0 },
    });
  });

  it('heli: far behind, high and to the side, looking further ahead', () => {
    expect(cameraRig('heli', alongX, cameras)).toEqual({
      position: { x: -90, y: 70, z: 40 },
      target: { x: 60, y: 0, z: 0 },
    });
  });

  it('follows the car heading (side = heading turned like the track normals)', () => {
    expect(cameraRig('chase', alongZ, cameras).position).toEqual({ x: 100, y: 7.5, z: 26 });
    expect(cameraRig('heli', alongZ, cameras)).toEqual({
      position: { x: 60, y: 70, z: -40 },
      target: { x: 100, y: 0, z: 110 },
    });
  });

  it('top: fixed offset whatever the heading, looking at the car', () => {
    const rig = { position: { x: -50, y: 950, z: 300 }, target: { x: 100, y: 0, z: 50 } };
    expect(cameraRig('top', alongZ, cameras)).toEqual(rig);
    expect(cameraRig('top', { ...alongZ, direction: { x: -1, z: 0 } }, cameras)).toEqual(rig);
  });

  it('rejects an unknown camera', () => {
    expect(() => cameraRig('onboard', alongX, cameras)).toThrow('onboard');
  });
});

describe('cameraFov', () => {
  it.each([
    ['chase', 0, 50],
    ['chase', 150, 59],
    ['chase', 300, 68],
    ['heli', 300, 50],
    ['top', 300, 50],
  ])('%s at %s km/h → %s°', (mode, speed, fov) => {
    expect(cameraFov(mode, speed, cameras)).toBeCloseTo(fov);
  });
});

describe('followFactor', () => {
  it('is frame-rate independent exponential smoothing', () => {
    expect(followFactor(0, 4)).toBe(0);
    expect(followFactor(0.25, 4)).toBeCloseTo(1 - Math.exp(-1));
    // two half frames close the same gap as one full frame
    const half = followFactor(0.125, 4);
    expect(1 - (1 - half) ** 2).toBeCloseTo(followFactor(0.25, 4));
  });
});

describe('topCameraLook', () => {
  it('keeps the approved chase/heli look at 0', () => {
    expect(topCameraLook(0, look)).toEqual({ fogDensity: look.fogDensity, carScale: 1, topTrailOpacity: 0 });
  });

  it('removes the fog, enlarges the car and shows the wide trail at 1 (top camera)', () => {
    expect(topCameraLook(1, look)).toEqual({ fogDensity: 0, carScale: look.topCarScale, topTrailOpacity: 1 });
  });

  it('blends in between', () => {
    const half = topCameraLook(0.5, look);
    expect(half.fogDensity).toBeCloseTo(look.fogDensity / 2);
    expect(half.carScale).toBeCloseTo((1 + look.topCarScale) / 2);
    expect(half.topTrailOpacity).toBeCloseTo(0.5);
  });
});
