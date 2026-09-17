import { describe, it, expect } from 'vitest';
import { clamp, lastIndexAtOrBefore, lerp, lerpShot, shotAt } from './math.js';

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
