import { describe, expect, it } from 'vitest';

import { reverbImpulse } from './impulse.js';

const options = { seconds: 1, decay: 3, sampleRate: 8000, seed: 7 };

const peak = (samples, from, to) => {
  let max = 0;
  for (let i = from; i < to; i++) max = Math.max(max, Math.abs(samples[i]));
  return max;
};

describe('reverbImpulse', () => {
  it('has two channels of the requested length', () => {
    const [left, right] = reverbImpulse(options);
    expect(left).toHaveLength(8000);
    expect(right).toHaveLength(8000);
  });

  it('dies away: loud at the start, near silent at the end', () => {
    const [left] = reverbImpulse(options);
    expect(peak(left, 0, 400)).toBeGreaterThan(0.5);
    expect(peak(left, 7600, 8000)).toBeLessThan(0.01);
  });

  it('is the same every time for one seed, and differs between the ears', () => {
    const a = reverbImpulse(options);
    const b = reverbImpulse(options);
    expect(a[0]).toEqual(b[0]);
    expect(a[0]).not.toEqual(a[1]);
  });

  it('stays within -1..1', () => {
    const [left, right] = reverbImpulse(options);
    expect(peak(left, 0, left.length)).toBeLessThanOrEqual(1);
    expect(peak(right, 0, right.length)).toBeLessThanOrEqual(1);
  });
});
