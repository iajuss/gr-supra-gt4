import { describe, it, expect } from 'vitest';
import { clamp, lastIndexAtOrBefore, lerp, lerpShot, normalizeStops, shotAt } from './math.js';

describe('lastIndexAtOrBefore', () => {
  const cumulative = [0, 10, 20, 20, 35];

  it.each([
    [0, 0],
    [9.99, 0],
    [10, 1],
    [19, 1],
    [20, 3], // skips zero-length segments
    [34, 3],
  ])('value %s → segment %s', (value, index) => {
    expect(lastIndexAtOrBefore(cumulative, value)).toBe(index);
  });

  it('never returns the last index, so index + 1 is always valid', () => {
    expect(lastIndexAtOrBefore(cumulative, 35)).toBe(3);
    expect(lastIndexAtOrBefore(cumulative, 999)).toBe(3);
  });
});

describe('lerp', () => {
  it.each([
    [0, 10, 0, 0],
    [0, 10, 0.25, 2.5],
    [4, -4, 0.5, 0],
    [2, 6, 1, 6],
  ])('lerp(%s, %s, %s) → %s', (a, b, t, value) => {
    expect(lerp(a, b, t)).toBe(value);
  });
});

describe('clamp', () => {
  it.each([
    [-1, 0],
    [0.4, 0.4],
    [2, 1],
  ])('%s → %s', (value, expected) => {
    expect(clamp(value, 0, 1)).toBe(expected);
  });
});

describe('lerpShot', () => {
  const a = { id: 'hero', position: { x: 0, y: 2, z: 10 }, target: { x: 0, y: 1, z: 0 }, fov: 40 };
  const b = { id: 'aero', position: { x: -10, y: 4, z: 0 }, target: { x: -2, y: 2, z: 4 }, fov: 30 };

  it('returns each end exactly', () => {
    expect(lerpShot(a, b, 0)).toEqual({ position: a.position, target: a.target, fov: a.fov });
    expect(lerpShot(a, b, 1)).toEqual({ position: b.position, target: b.target, fov: b.fov });
  });

  it('interpolates position, target and fov halfway', () => {
    const half = lerpShot(a, b, 0.5);
    expect(half.position).toEqual({ x: -5, y: 3, z: 5 });
    expect(half.target).toEqual({ x: -1, y: 1.5, z: 2 });
    expect(half.fov).toBe(35);
  });

  it('clamps t to the ends instead of overshooting', () => {
    expect(lerpShot(a, b, -3)).toEqual(lerpShot(a, b, 0));
    expect(lerpShot(a, b, 7)).toEqual(lerpShot(a, b, 1));
  });

  it('does not reuse the input objects, so the caller cannot mutate a shot', () => {
    const result = lerpShot(a, b, 0);
    result.position.x = 999;
    expect(a.position.x).toBe(0);
  });
});

describe('shotAt', () => {
  const shots = [
    { id: 'one', position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 30 },
    { id: 'two', position: { x: 10, y: 0, z: 0 }, target: { x: 2, y: 0, z: 0 }, fov: 40 },
    { id: 'three', position: { x: 10, y: 20, z: 0 }, target: { x: 2, y: 4, z: 0 }, fov: 50 },
  ];

  it('lands on each shot at its own stop', () => {
    expect(shotAt(shots, 0).fov).toBe(30);
    expect(shotAt(shots, 0.5).fov).toBe(40);
    expect(shotAt(shots, 1).fov).toBe(50);
  });

  it('interpolates inside a segment', () => {
    expect(shotAt(shots, 0.25).position).toEqual({ x: 5, y: 0, z: 0 });
    expect(shotAt(shots, 0.75).position).toEqual({ x: 10, y: 10, z: 0 });
  });

  it('clamps progress outside [0, 1]', () => {
    expect(shotAt(shots, -1)).toEqual(shotAt(shots, 0));
    expect(shotAt(shots, 5)).toEqual(shotAt(shots, 1));
  });

  it('works with a single shot', () => {
    expect(shotAt([shots[0]], 0.7).fov).toBe(30);
  });
});

describe('normalizeStops', () => {
  it('maps the first value to 0 and the last to 1', () => {
    expect(normalizeStops([100, 300, 400])).toEqual([0, 2 / 3, 1]);
  });

  it('keeps the spacing between values, not their count', () => {
    // the middle section sits close to the end: its stop is late
    expect(normalizeStops([0, 900, 1000])).toEqual([0, 0.9, 1]);
  });

  it('falls back to even spacing when every value is the same', () => {
    expect(normalizeStops([7, 7, 7])).toEqual([0, 0.5, 1]);
  });

  it('works with two values', () => {
    expect(normalizeStops([-40, 60])).toEqual([0, 1]);
  });
});

describe('shotAt with uneven stops', () => {
  const shots = [
    { id: 'one', position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 30 },
    { id: 'two', position: { x: 10, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 40 },
    { id: 'three', position: { x: 10, y: 10, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 50 },
  ];
  const stops = [0, 0.8, 1]; // a long hero section, then a short transition

  it('lands on each shot at its own stop', () => {
    expect(shotAt(shots, 0, stops).fov).toBe(30);
    expect(shotAt(shots, 0.8, stops).fov).toBe(40);
    expect(shotAt(shots, 1, stops).fov).toBe(50);
  });

  it('spreads the first segment over its whole stretch', () => {
    expect(shotAt(shots, 0.4, stops).position).toEqual({ x: 5, y: 0, z: 0 });
    expect(shotAt(shots, 0.9, stops).position).toEqual({ x: 10, y: 5, z: 0 });
  });

  it('clamps outside the range', () => {
    expect(shotAt(shots, -2, stops)).toEqual(shotAt(shots, 0, stops));
    expect(shotAt(shots, 9, stops)).toEqual(shotAt(shots, 1, stops));
  });

  it('matches the even spacing when the stops are even', () => {
    expect(shotAt(shots, 0.25, [0, 0.5, 1])).toEqual(shotAt(shots, 0.25));
  });
});
