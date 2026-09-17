import { describe, it, expect } from 'vitest';
import { smoothClosed, circumradius } from './geometry.js';

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
