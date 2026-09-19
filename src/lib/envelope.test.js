import { describe, it, expect } from 'vitest';
import { clipEnvelope } from './envelope.js';

const clip = { start: 12, end: 16.5, volume: 0.8, fadeIn: 0.05, fadeOut: 0.8 };

describe('clipEnvelope', () => {
  it('plays the stretch between start and end', () => {
    const { offset, duration } = clipEnvelope(clip);
    expect(offset).toBe(12);
    expect(duration).toBeCloseTo(4.5);
  });

  it('ramps in, holds at the volume and fades to silence at the end', () => {
    const { gain } = clipEnvelope(clip);
    expect(gain).toEqual([
      { time: 0, value: 0 },
      { time: 0.05, value: 0.8 },
      { time: expect.closeTo(3.7), value: 0.8 },
      { time: expect.closeTo(4.5), value: 0 },
    ]);
  });

  it('squeezes the fades into a clip shorter than both of them', () => {
    const { gain, duration } = clipEnvelope({ ...clip, end: 12.5 });
    expect(duration).toBeCloseTo(0.5);
    const times = gain.map((point) => point.time);
    expect(times).toEqual([...times].sort((a, b) => a - b)); // never goes back in time
    expect(gain.at(-1)).toEqual({ time: expect.closeTo(0.5), value: 0 });
  });

  it('rejects an end before the start', () => {
    expect(() => clipEnvelope({ ...clip, end: 10 })).toThrow();
  });
});
