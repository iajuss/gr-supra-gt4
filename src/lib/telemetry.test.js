import { describe, it, expect } from 'vitest';
import silverstone from '../data/silverstone.json';
import dynamics from '../data/vulcanDynamics.js';
import { projectCoordinates, measurePath } from './track.js';
import {
  smoothClosed,
  circumradius,
  cornerSpeedLimit,
  limitAcceleration,
  createLapModel,
  sampleAtTime,
  gearFor,
  sectorFor,
} from './telemetry.js';

const KMH = 3.6;

function circlePath(radius, segments = 720) {
  const points = Array.from({ length: segments + 1 }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
  });
  return measurePath(points);
}

const testParams = {
  sampleStep: 5,
  smoothingRadius: 4,
  curvatureWindow: 6,
  lateralAcceleration: 20,
  accelerationMax: 10,
  braking: 30,
  topSpeed: 80,
  gearTopSpeeds: [70, 110, 150, 195, 245, Infinity],
  sectorSplits: [1 / 3, 2 / 3],
};

describe('circumradius', () => {
  it('returns the radius of the circle through three points', () => {
    expect(circumradius({ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 4 })).toBeCloseTo(2.5);
  });

  it('returns Infinity for collinear points (a straight)', () => {
    expect(circumradius({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 })).toBe(Infinity);
  });
});

describe('smoothClosed', () => {
  const zigzag = Array.from({ length: 40 }, (_, i) => ({ x: i, y: i % 2 === 0 ? 1 : -1 }));

  it('returns equal points when the radius is 0', () => {
    expect(smoothClosed(zigzag, 0)).toEqual(zigzag);
  });

  it('flattens vertex noise with a moving average that wraps around the loop', () => {
    const smoothed = smoothClosed(zigzag, 1);
    // point 1 (y = -1) between two +1 neighbours → +1/3
    expect(smoothed[1].y).toBeCloseTo(1 / 3);
    // first point wraps to the last one: average of (-1, +1, -1)
    expect(smoothed[0].y).toBeCloseTo(-1 / 3);
    expect(smoothed[0].x).toBeCloseTo((39 + 0 + 1) / 3);
  });

  it('preserves the centroid', () => {
    const mean = (pts, key) => pts.reduce((s, p) => s + p[key], 0) / pts.length;
    const smoothed = smoothClosed(zigzag, 3);
    expect(mean(smoothed, 'x')).toBeCloseTo(mean(zigzag, 'x'));
    expect(mean(smoothed, 'y')).toBeCloseTo(mean(zigzag, 'y'));
  });
});

describe('cornerSpeedLimit', () => {
  it('uses v = sqrt(a * r)', () => {
    expect(cornerSpeedLimit(80, { lateralAcceleration: 20, topSpeed: 100 })).toBeCloseTo(40);
  });

  it('caps straights and fast corners at top speed', () => {
    expect(cornerSpeedLimit(Infinity, { lateralAcceleration: 20, topSpeed: 90 })).toBe(90);
    expect(cornerSpeedLimit(10_000, { lateralAcceleration: 20, topSpeed: 90 })).toBe(90);
  });
});

describe('limitAcceleration', () => {
  const params = { accelerationMax: 10, braking: 30, topSpeed: 80 };
  const ds = 5;
  // Closed loop with one slow hairpin in the middle.
  const limits = Array.from({ length: 200 }, (_, i) => (i === 100 ? 15 : 80));

  it('never exceeds the per-sample limit', () => {
    const speeds = limitAcceleration(limits, ds, params);
    speeds.forEach((v, i) => expect(v).toBeLessThanOrEqual(limits[i] + 1e-9));
  });

  it('respects acceleration and braking between consecutive samples, including across the start line', () => {
    const speeds = limitAcceleration(limits, ds, params);
    const n = speeds.length;
    for (let i = 0; i < n; i++) {
      const v0 = speeds[i];
      const v1 = speeds[(i + 1) % n];
      expect(v1 ** 2 - v0 ** 2).toBeLessThanOrEqual(2 * params.accelerationMax * ds + 1e-6);
      expect(v0 ** 2 - v1 ** 2).toBeLessThanOrEqual(2 * params.braking * ds + 1e-6);
    }
  });

  it('brakes before the hairpin and accelerates after it', () => {
    const speeds = limitAcceleration(limits, ds, params);
    expect(speeds[100]).toBeCloseTo(15);
    expect(speeds[99]).toBeGreaterThan(15);
    expect(speeds[99]).toBeLessThan(80);
    expect(speeds[101]).toBeGreaterThan(15);
    expect(speeds[101] - 15).toBeLessThan(speeds[99] - 15); // braking is stronger than accelerating
  });
});

describe('createLapModel', () => {
  it('drives a constant-radius circle at the constant cornering speed', () => {
    const radius = 100;
    const model = createLapModel(circlePath(radius), testParams);
    const expectedSpeed = Math.sqrt(testParams.lateralAcceleration * radius); // ≈ 44.7 m/s

    model.speeds.forEach((v) => expect(v).toBeCloseTo(expectedSpeed, 0));
    expect(model.lapTime).toBeCloseTo(model.total / expectedSpeed, 0);
  });

  it('produces a plausible lap of the real Silverstone outline', () => {
    const path = measurePath(projectCoordinates(silverstone.geometry.coordinates));
    const model = createLapModel(path, dynamics);
    const speedsKmh = model.speeds.map((v) => v * KMH);

    expect(model.lapTime).toBeGreaterThan(100); // 1:40
    expect(model.lapTime).toBeLessThan(110); // 1:50
    expect(Math.min(...speedsKmh)).toBeGreaterThan(80);
    expect(Math.max(...speedsKmh)).toBeGreaterThan(270);
    expect(Math.max(...speedsKmh)).toBeLessThanOrEqual(dynamics.topSpeed * KMH + 1e-6);
  });
});

describe('sampleAtTime', () => {
  const circleModel = () => createLapModel(circlePath(100), testParams);

  it('starts at the line and reaches half distance at half time on a constant-speed lap', () => {
    const model = circleModel();
    expect(sampleAtTime(model, 0).progress).toBeCloseTo(0);
    expect(sampleAtTime(model, model.lapTime / 2).progress).toBeCloseTo(0.5, 2);
  });

  it('reports speed in km/h, gear, sector and elapsed time', () => {
    const model = circleModel();
    const sample = sampleAtTime(model, model.lapTime * 0.75);
    // Constant-speed lap; smoothing shrinks the circle slightly, so compare with the model itself.
    expect(sample.speed).toBeCloseTo(model.speeds[0] * KMH, 1);
    expect(sample.gear).toBe(gearFor(sample.speed, testParams.gearTopSpeeds));
    expect(sample.sector).toBe(3);
    expect(sample.elapsed).toBeCloseTo(model.lapTime * 0.75);
  });

  it('wraps time beyond one lap', () => {
    const model = circleModel();
    const later = sampleAtTime(model, model.lapTime + 1);
    const early = sampleAtTime(model, 1);
    expect(later.progress).toBeCloseTo(early.progress);
    expect(later.elapsed).toBeCloseTo(1);
  });
});

describe('gearFor', () => {
  const tops = [70, 110, 150, 195, 245, Infinity];

  it.each([
    [0, 1],
    [70, 1],
    [70.1, 2],
    [150, 3],
    [200, 5],
    [330, 6],
  ])('%s km/h → gear %s', (speed, gear) => {
    expect(gearFor(speed, tops)).toBe(gear);
  });
});

describe('sectorFor', () => {
  it.each([
    [0, 1],
    [0.33, 1],
    [1 / 3, 2],
    [0.5, 2],
    [0.99, 3],
  ])('progress %s → sector %s', (progress, sector) => {
    expect(sectorFor(progress, [1 / 3, 2 / 3])).toBe(sector);
  });
});
