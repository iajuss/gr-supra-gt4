import { describe, expect, it } from 'vitest';

import { loudnessAt, loudnessCurve } from './loudness.js';

const RATE = 1000;

/** A tone whose amplitude is `level` for each 0.1 s block. */
function blocks(levels) {
  const out = new Float32Array(levels.length * 100);
  levels.forEach((level, b) => {
    for (let i = 0; i < 100; i++) out[b * 100 + i] = level * Math.sin((i / 100) * Math.PI * 8);
  });
  return out;
}

describe('loudnessCurve', () => {
  it('gives one value per window, the loudest at 1', () => {
    const curve = loudnessCurve(blocks([0.1, 0.5, 1, 0.5]), RATE, 0.1);
    expect(curve).toHaveLength(4);
    expect(Math.max(...curve)).toBeCloseTo(1);
    expect(curve[0]).toBeLessThan(curve[1]);
    expect(curve[1]).toBeLessThan(curve[2]);
  });

  it('is all zeros for silence, not NaN', () => {
    const curve = loudnessCurve(new Float32Array(300), RATE, 0.1);
    expect([...curve]).toEqual([0, 0, 0]);
  });
});

describe('loudnessAt', () => {
  const curve = Float32Array.from([0, 1, 0.5]);

  it('interpolates between window centres', () => {
    expect(loudnessAt(curve, 0.1, 0.05)).toBeCloseTo(0);
    expect(loudnessAt(curve, 0.1, 0.15)).toBeCloseTo(1);
    expect(loudnessAt(curve, 0.1, 0.1)).toBeCloseTo(0.5);
  });

  it('is silent before and after the clip', () => {
    expect(loudnessAt(curve, 0.1, -1)).toBe(0);
    expect(loudnessAt(curve, 0.1, 5)).toBe(0);
  });
});
