import { describe, it, expect } from 'vitest';
import { QUALITY, judgeFrames } from './quality.js';

/** `count` frames at `ms` apart, with every `every`-th one taking `slow` instead. */
function frames(count, ms, { every = 0, slow = 0 } = {}) {
  return Array.from({ length: count }, (_, i) => (every && i % every === every - 1 ? slow : ms));
}

const VSYNC_164 = 6.1;
const VSYNC_60 = 16.7;

describe('judgeFrames', () => {
  it('reads the screen s own rhythm from the frames, not from a fixed millisecond', () => {
    expect(judgeFrames(frames(120, VSYNC_164)).vsync).toBeCloseTo(VSYNC_164, 5);
    expect(judgeFrames(frames(120, VSYNC_60)).vsync).toBeCloseTo(VSYNC_60, 5);
  });

  it('leaves a healthy 60 Hz screen alone, though its frames take 16,7 ms', () => {
    const verdict = judgeFrames(frames(120, VSYNC_60));
    expect(verdict.level).toBe(QUALITY.full);
    expect(verdict.missed).toBe(0);
  });

  it('leaves a healthy 164 Hz screen alone too', () => {
    expect(judgeFrames(frames(120, VSYNC_164)).level).toBe(QUALITY.full);
  });

  it('puts up with the odd stutter', () => {
    // one frame in twenty missed: a hiccup, not a machine that cannot keep up
    expect(judgeFrames(frames(120, VSYNC_60, { every: 20, slow: 33.4 })).level).toBe(QUALITY.full);
  });

  it('drops the hand first when a fifth of the frames are missed', () => {
    const verdict = judgeFrames(frames(120, VSYNC_60, { every: 5, slow: 33.4 }));
    expect(verdict.level).toBe(QUALITY.still);
    expect(verdict.missed).toBeCloseTo(0.2, 2);
  });

  it('drops the bloom as well when a third of the frames are missed', () => {
    expect(judgeFrames(frames(120, VSYNC_60, { every: 3, slow: 50 })).level).toBe(QUALITY.plain);
  });

  it('counts a missed frame as clearly over the rhythm, not a hair over it', () => {
    // 1,4x the vsync is the compositor breathing; 1,6x means a frame did not make it
    expect(judgeFrames(frames(120, VSYNC_60, { every: 2, slow: VSYNC_60 * 1.4 })).missed).toBe(0);
    expect(judgeFrames(frames(120, VSYNC_60, { every: 2, slow: VSYNC_60 * 1.6 })).missed).toBeGreaterThan(0.4);
  });

  it('ignores a pause: a tab left behind is not a slow machine', () => {
    const withPause = [...frames(120, VSYNC_60), 1500, 2400];
    const verdict = judgeFrames(withPause);
    expect(verdict.level).toBe(QUALITY.full);
    expect(verdict.frames).toBe(120);
  });

  it('does not punish a fast screen for missing its own beat: 12 ms is still 80 per second', () => {
    // a third of the frames take two vsyncs on a 164 Hz screen - smooth by any human measure
    expect(judgeFrames(frames(120, VSYNC_164, { every: 3, slow: 12.2 })).level).toBe(QUALITY.full);
  });

  it('still catches real stalls on that same fast screen', () => {
    expect(judgeFrames(frames(120, VSYNC_164, { every: 3, slow: 40 })).level).toBe(QUALITY.plain);
  });

  it('catches a machine that is slow all the time, hitting no screen rhythm at all', () => {
    // every frame 33 ms: nothing stands out as missed, but no real display runs at 30 Hz
    expect(judgeFrames(frames(120, 33)).level).toBe(QUALITY.plain);
  });

  it('still trusts a slow but believable screen', () => {
    expect(judgeFrames(frames(120, 20)).level).toBe(QUALITY.full); // 50 Hz
  });

  it('says nothing until it has seen enough frames', () => {
    expect(judgeFrames(frames(10, 50)).level).toBe(QUALITY.full);
    expect(judgeFrames([]).level).toBe(QUALITY.full);
    expect(judgeFrames(frames(10, 50)).decided).toBe(false);
    expect(judgeFrames(frames(120, VSYNC_60)).decided).toBe(true);
  });

  it('is not fooled by a handful of wild frames when it reads the rhythm', () => {
    const noisy = [...frames(100, VSYNC_60), 90, 120, 80];
    expect(judgeFrames(noisy).vsync).toBeCloseTo(VSYNC_60, 5);
  });

  it('takes its thresholds from the caller', () => {
    const strict = judgeFrames(frames(120, VSYNC_60, { every: 20, slow: 33.4 }), { still: 0.01 });
    expect(strict.level).toBe(QUALITY.still);
  });

  it('never changes what it was given', () => {
    const given = frames(120, VSYNC_60);
    const copy = [...given];
    judgeFrames(given);
    expect(given).toEqual(copy);
  });
});
