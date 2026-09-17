import { describe, it, expect } from 'vitest';
import { lastIndexAtOrBefore, lerp } from './math.js';

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
