import { describe, it, expect } from 'vitest';
import { lastIndexAtOrBefore } from './math.js';

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
