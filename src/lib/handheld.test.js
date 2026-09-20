import { describe, it, expect } from 'vitest';
import { applyHandheld, handheldAt } from './handheld.js';

/** The camera's aim, as the page's shots describe it: where it stands and what it looks at. */
const SHOT = {
  position: { x: 5.2, y: 1.4, z: 3.1 },
  target: { x: 0, y: 0.7, z: 0 },
  fov: 38,
  offset: 0.18,
};

const aim = ({ position, target }) => ({
  x: target.x - position.x,
  y: target.y - position.y,
  z: target.z - position.z,
});
const azimuth = (shot) => Math.atan2(aim(shot).z, aim(shot).x);
const elevation = (shot) => Math.atan2(aim(shot).y, Math.hypot(aim(shot).x, aim(shot).z));
const reach = (shot) => Math.hypot(aim(shot).x, aim(shot).y, aim(shot).z);
const degrees = (radians) => (radians * 180) / Math.PI;

/** Every hundredth of a second up to `until`, the rate the stage draws at. */
function sweep(until, easeIn = 0) {
  const samples = [];
  for (let t = 0; t <= until; t += 0.01) samples.push(handheldAt(t, easeIn));
  return samples;
}

describe('handheldAt', () => {
  it('starts perfectly still, so switching it on never jumps', () => {
    expect(handheldAt(0)).toEqual({ yaw: 0, pitch: 0 });
  });

  it('gives the same drift for the same moment', () => {
    expect(handheldAt(12.34)).toEqual(handheldAt(12.34));
    expect(handheldAt(0.07)).toEqual(handheldAt(0.07));
  });

  it('never leaves the unit range, whatever the moment', () => {
    for (const { yaw, pitch } of sweep(600)) {
      expect(Math.abs(yaw)).toBeLessThanOrEqual(1);
      expect(Math.abs(pitch)).toBeLessThanOrEqual(1);
    }
  });

  it('uses most of the range it is given', () => {
    const samples = sweep(600);
    expect(Math.max(...samples.map(({ yaw }) => Math.abs(yaw)))).toBeGreaterThan(0.7);
    expect(Math.max(...samples.map(({ pitch }) => Math.abs(pitch)))).toBeGreaterThan(0.7);
  });

  it('never falls into a loop: no lag brings the same movement back', () => {
    for (const lag of [3, 7, 13, 29, 61]) {
      let apart = 0;
      for (let t = 0; t < 60; t += 0.1) {
        const now = handheldAt(t);
        const later = handheldAt(t + lag);
        apart = Math.max(apart, Math.abs(now.yaw - later.yaw), Math.abs(now.pitch - later.pitch));
      }
      expect(apart).toBeGreaterThan(0.2);
    }
  });

  it('does not sway both ways at once, which would read as a diagonal wobble', () => {
    const samples = sweep(600);
    const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const yaws = samples.map(({ yaw }) => yaw);
    const pitches = samples.map(({ pitch }) => pitch);
    const [yawMean, pitchMean] = [mean(yaws), mean(pitches)];
    const covariance = mean(yaws.map((yaw, i) => (yaw - yawMean) * (pitches[i] - pitchMean)));
    const spread = (values, average) => Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
    expect(Math.abs(covariance / (spread(yaws, yawMean) * spread(pitches, pitchMean)))).toBeLessThan(0.3);
  });

  it('eases in: the first moments are a fraction of the movement', () => {
    const early = sweep(0.25, 1);
    const full = sweep(0.25, 0);
    for (const [i, { yaw, pitch }] of early.entries()) {
      expect(Math.abs(yaw)).toBeLessThan(Math.abs(full[i].yaw) * 0.25 + 1e-12);
      expect(Math.abs(pitch)).toBeLessThan(Math.abs(full[i].pitch) * 0.25 + 1e-12);
    }
  });

  it('is at full movement once the entry is over, with no step at the end of it', () => {
    expect(handheldAt(4, 1.5)).toEqual(handheldAt(4, 0));
    const before = handheldAt(1.49, 1.5);
    const after = handheldAt(1.51, 1.5);
    expect(Math.abs(before.yaw - after.yaw)).toBeLessThan(0.02);
    expect(Math.abs(before.pitch - after.pitch)).toBeLessThan(0.02);
  });
});

describe('applyHandheld', () => {
  const still = { yaw: 0, pitch: 0 };
  const amplitude = { yaw: 0.35, pitch: 0.2 }; // degrees

  it('leaves the shot alone when there is no amplitude to give', () => {
    expect(applyHandheld(SHOT, { yaw: 1, pitch: -1 }, { yaw: 0, pitch: 0 })).toEqual(SHOT);
    expect(applyHandheld(SHOT, still, amplitude)).toEqual(SHOT);
  });

  it('moves the aim, never the camera', () => {
    const shaken = applyHandheld(SHOT, { yaw: 1, pitch: -0.5 }, amplitude);
    expect(shaken.position).toEqual(SHOT.position);
    expect(shaken.target).not.toEqual(SHOT.target);
  });

  it('keeps the distance to the subject, so the framing only turns', () => {
    const shaken = applyHandheld(SHOT, { yaw: -0.8, pitch: 0.6 }, amplitude);
    expect(reach(shaken)).toBeCloseTo(reach(SHOT), 10);
  });

  it('turns by the full amplitude at the edge of the drift', () => {
    const right = applyHandheld(SHOT, { yaw: 1, pitch: 0 }, amplitude);
    expect(degrees(azimuth(right) - azimuth(SHOT))).toBeCloseTo(amplitude.yaw, 10);
    expect(degrees(elevation(right) - elevation(SHOT))).toBeCloseTo(0, 10);

    const up = applyHandheld(SHOT, { yaw: 0, pitch: 1 }, amplitude);
    expect(degrees(elevation(up) - elevation(SHOT))).toBeCloseTo(amplitude.pitch, 10);
    expect(degrees(azimuth(up) - azimuth(SHOT))).toBeCloseTo(0, 10);
  });

  it('turns the other way for the other half of the drift', () => {
    const left = applyHandheld(SHOT, { yaw: -1, pitch: 0 }, amplitude);
    expect(degrees(azimuth(left) - azimuth(SHOT))).toBeCloseTo(-amplitude.yaw, 10);
  });

  it('carries the rest of the shot through untouched', () => {
    const shaken = applyHandheld(SHOT, { yaw: 0.4, pitch: 0.9 }, amplitude);
    expect(shaken.fov).toBe(SHOT.fov);
    expect(shaken.offset).toBe(SHOT.offset);
  });
});
