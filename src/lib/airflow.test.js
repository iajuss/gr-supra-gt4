import { describe, it, expect } from 'vitest';
import { nearStop, pointAt, streamlines } from './airflow.js';

const CAR = { length: 4.38, width: 1.87, height: 1.29 };
const OPTIONS = { lanes: 9, spread: 2.6, clearance: 0.12, lead: 2.2, trail: 3, samples: 60 };

const lines = streamlines(CAR, OPTIONS);
const every = (test) => lines.every((line) => line.every(test));

/** Inside the box the car occupies: the one place air must never be. */
function insideCar({ x, y, z }, { length, width, height }) {
  return Math.abs(x) < length / 2 && Math.abs(z) < width / 2 && y < height;
}

describe('streamlines', () => {
  it('gives one line per lane, each with the asked number of points', () => {
    expect(lines).toHaveLength(OPTIONS.lanes);
    expect(lines.every((line) => line.length === OPTIONS.samples)).toBe(true);
  });

  it('never puts a single point inside the car', () => {
    expect(every((point) => !insideCar(point, CAR))).toBe(true);
  });

  it('clears the roof by the clearance it was given, right over the car', () => {
    const overTheBody = lines.filter((line) => Math.abs(line[0].z) < CAR.width / 2);
    expect(overTheBody.length).toBeGreaterThan(0);
    for (const line of overTheBody) {
      const middle = line.filter(({ x }) => Math.abs(x) < CAR.length / 2 - 0.1);
      expect(middle.length).toBeGreaterThan(0);
      for (const point of middle) expect(point.y).toBeCloseTo(CAR.height + OPTIONS.clearance, 6);
    }
  });

  it('runs from ahead of the nose to behind the tail, in that order', () => {
    for (const line of lines) {
      expect(line[0].x).toBeCloseTo(CAR.length / 2 + OPTIONS.lead, 6);
      expect(line[line.length - 1].x).toBeCloseTo(-CAR.length / 2 - OPTIONS.trail, 6);
      for (let i = 1; i < line.length; i += 1) expect(line[i].x).toBeLessThan(line[i - 1].x);
    }
  });

  it('comes in flat and leaves flat, far from the car', () => {
    for (const line of lines) {
      expect(line[0].y).toBeCloseTo(line[0].y, 6);
      expect(line[0].y).toBeLessThan(CAR.height);
      expect(line[line.length - 1].y).toBeCloseTo(line[0].y, 6);
      expect(line[line.length - 1].z).toBeCloseTo(line[0].z, 6);
    }
  });

  it('pushes the air out around the car, never in towards it', () => {
    for (const line of lines) {
      const start = Math.abs(line[0].z);
      for (const point of line) expect(Math.abs(point.z)).toBeGreaterThanOrEqual(start - 1e-9);
    }
  });

  it('is symmetric: the lane on one side mirrors the lane on the other', () => {
    const left = lines[0];
    const right = lines[lines.length - 1];
    for (let i = 0; i < left.length; i += 1) {
      expect(left[i].z).toBeCloseTo(-right[i].z, 6);
      expect(left[i].y).toBeCloseTo(right[i].y, 6);
      expect(left[i].x).toBeCloseTo(right[i].x, 6);
    }
  });

  it('lifts the air less the further out the lane is', () => {
    const peak = (line) => Math.max(...line.map(({ y }) => y));
    const side = lines.filter((line) => line[0].z > CAR.width / 2).sort((a, b) => a[0].z - b[0].z);
    expect(side.length).toBeGreaterThan(1);
    for (let i = 1; i < side.length; i += 1) expect(peak(side[i])).toBeLessThanOrEqual(peak(side[i - 1]));
  });

  it('gives the same lines for the same asking', () => {
    expect(streamlines(CAR, OPTIONS)).toEqual(lines);
  });
});

describe('pointAt', () => {
  const line = lines[Math.floor(lines.length / 2)];

  it('starts at the start and loops back to it', () => {
    expect(pointAt(line, 0)).toEqual(line[0]);
    expect(pointAt(line, 1)).toEqual(line[0]);
    expect(pointAt(line, 2.5)).toEqual(pointAt(line, 0.5));
  });

  it('travels along the line, never leaving it', () => {
    for (let p = 0; p < 1; p += 0.01) {
      const point = pointAt(line, p);
      expect(point.x).toBeLessThanOrEqual(line[0].x + 1e-9);
      expect(point.x).toBeGreaterThanOrEqual(line[line.length - 1].x - 1e-9);
      expect(insideCar(point, CAR)).toBe(false);
    }
  });

  it('moves forward as time passes', () => {
    expect(pointAt(line, 0.4).x).toBeLessThan(pointAt(line, 0.2).x);
  });

  it('sits between the two samples it falls among', () => {
    const half = 0.5 / (line.length - 1); // halfway along the first segment
    const point = pointAt(line, half);
    expect(point.x).toBeCloseTo((line[0].x + line[1].x) / 2, 9);
    expect(point.y).toBeCloseTo((line[0].y + line[1].y) / 2, 9);
  });
});

describe('nearStop', () => {
  it('is full at the stop and nothing beyond its reach', () => {
    expect(nearStop(0.25, 0.25, 0.18)).toBe(1);
    expect(nearStop(0.25 + 0.18, 0.25, 0.18)).toBe(0);
    expect(nearStop(0, 0.25, 0.18)).toBe(0);
    expect(nearStop(1, 0.25, 0.18)).toBe(0);
  });

  it('fades either side of the stop, the same on both', () => {
    for (const away of [0.03, 0.09, 0.15]) {
      const before = nearStop(0.25 - away, 0.25, 0.18);
      const after = nearStop(0.25 + away, 0.25, 0.18);
      expect(before).toBeCloseTo(after, 10);
      expect(before).toBeGreaterThan(0);
      expect(before).toBeLessThan(1);
    }
  });

  it('only ever fades away as the camera leaves', () => {
    let last = 1;
    for (let away = 0; away <= 0.18; away += 0.005) {
      const now = nearStop(0.25 + away, 0.25, 0.18);
      expect(now).toBeLessThanOrEqual(last + 1e-12);
      last = now;
    }
  });

  it('arrives and leaves without a kink, so nothing pops on', () => {
    const step = 0.001;
    const slope = (at) => (nearStop(at + step, 0.25, 0.18) - nearStop(at, 0.25, 0.18)) / step;
    expect(Math.abs(slope(0.25 - 0.18))).toBeLessThan(0.2);
    expect(Math.abs(slope(0.25 + 0.18 - step))).toBeLessThan(0.2);
  });

  it('never leaves 0 to 1, whatever it is given', () => {
    for (let p = -0.5; p <= 1.5; p += 0.01) {
      const value = nearStop(p, 0.25, 0.18);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(nearStop(0.3, 0.25, 0)).toBe(0);
  });
});
