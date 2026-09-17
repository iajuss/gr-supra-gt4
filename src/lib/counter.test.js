import { describe, it, expect } from 'vitest';
import { easeOutCubic, decimalsOf, countAt, formatCount } from './counter.js';

describe('easeOutCubic', () => {
  it('starts at 0, ends at 1 and front-loads the motion', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
  });

  it('clamps progress outside [0, 1]', () => {
    expect(easeOutCubic(-0.2)).toBe(0);
    expect(easeOutCubic(1.4)).toBe(1);
  });
});

describe('decimalsOf', () => {
  it.each([
    ['820', 0],
    ['1350', 0],
    ['7.0', 1],
    ['3.25', 2],
  ])('"%s" has %s decimals', (text, decimals) => {
    expect(decimalsOf(text)).toBe(decimals);
  });
});

describe('countAt', () => {
  it('eases from 0 to the target and lands exactly on it', () => {
    expect(countAt(820, 0)).toBe(0);
    expect(countAt(820, 0.5)).toBe(718); // 820 × 0.875 = 717.5 → 718
    expect(countAt(820, 1)).toBe(820);
  });

  it('keeps the requested precision', () => {
    expect(countAt(7, 0.5, 1)).toBe(6.1); // 7 × 0.875 = 6.125 → 6.1
  });
});

describe('formatCount', () => {
  it.each([
    [0, 0, '0'],
    [1350, 0, '1,350'],
    [7, 1, '7.0'],
    [96, 0, '96'],
  ])('%s with %s decimals → "%s"', (value, decimals, text) => {
    expect(formatCount(value, decimals)).toBe(text);
  });
});
