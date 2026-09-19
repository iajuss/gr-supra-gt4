import { describe, expect, it } from 'vitest';

import { dollyAt, lightsAt } from './ignition.js';

const ON = 0.7;

describe('lightsAt', () => {
  it('keeps every light off until the key turns', () => {
    expect(lightsAt(0, ON)).toEqual({ front: 0, rear: 0 });
    expect(lightsAt(ON - 0.01, ON)).toEqual({ front: 0, rear: 0 });
  });

  it('blinks the headlights twice, each state long enough to see, then holds them on', () => {
    // on, off, on for good: find the runs over time
    const runs = [];
    for (let t = ON; t < ON + 1.5; t += 0.01) {
      const on = lightsAt(t, ON).front > 0.5;
      if (!runs.length || runs.at(-1).on !== on) runs.push({ on, from: t, to: t });
      else runs.at(-1).to = t;
    }
    expect(runs.map((r) => r.on)).toEqual([true, false, true]);
    expect(runs[0].to - runs[0].from).toBeGreaterThanOrEqual(0.12);
    expect(runs[1].to - runs[1].from).toBeGreaterThanOrEqual(0.15);
    expect(lightsAt(ON + 5, ON).front).toBe(1);
  });

  it('brings the tail lights up after the headlights have settled, smoothly', () => {
    expect(lightsAt(ON + 0.3, ON).rear).toBe(0);
    const mid = lightsAt(ON + 0.7, ON).rear;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(lightsAt(ON + 1.5, ON).rear).toBe(1);
  });

  it('stays within 0–1', () => {
    for (let t = 0; t < 3; t += 0.01) {
      const { front, rear } = lightsAt(t, ON);
      expect(front).toBeGreaterThanOrEqual(0);
      expect(front).toBeLessThanOrEqual(1);
      expect(rear).toBeGreaterThanOrEqual(0);
      expect(rear).toBeLessThanOrEqual(1);
    }
  });
});

describe('dollyAt', () => {
  it('starts at 0 and reaches the full push by the end of the clip', () => {
    expect(dollyAt(0, 5, 0.4)).toBe(0);
    expect(dollyAt(5, 5, 0.4)).toBeCloseTo(0.4);
    expect(dollyAt(9, 5, 0.4)).toBeCloseTo(0.4);
  });

  it('only moves forward, and slows down towards the end', () => {
    let last = 0;
    for (let t = 0; t <= 5; t += 0.25) {
      const now = dollyAt(t, 5, 0.4);
      expect(now).toBeGreaterThanOrEqual(last);
      last = now;
    }
    const early = dollyAt(1, 5, 0.4) - dollyAt(0, 5, 0.4);
    const late = dollyAt(5, 5, 0.4) - dollyAt(4, 5, 0.4);
    expect(late).toBeLessThan(early);
  });
});
