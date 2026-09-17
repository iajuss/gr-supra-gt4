import { describe, it, expect } from 'vitest';
import { createLapClock } from './lapClock.js';

const LAP_TIME = 105.364;

describe('createLapClock', () => {
  it('starts at the line', () => {
    const clock = createLapClock({ lapTime: LAP_TIME, duration: 12 });
    expect(clock.advance(0)).toEqual({ simTime: 0, done: false });
  });

  it('converts screen seconds into simulated seconds', () => {
    const clock = createLapClock({ lapTime: LAP_TIME, duration: 12, maxStep: Infinity });
    expect(clock.advance(3).simTime).toBeCloseTo(LAP_TIME / 4);
    expect(clock.advance(3).simTime).toBeCloseTo(LAP_TIME / 2);
  });

  it('finishes exactly on the lap time and stays there', () => {
    const clock = createLapClock({ lapTime: LAP_TIME, duration: 12, maxStep: Infinity });
    clock.advance(11.9);
    expect(clock.advance(0.1)).toEqual({ simTime: LAP_TIME, done: true });
    expect(clock.advance(5)).toEqual({ simTime: LAP_TIME, done: true });
  });

  it('counts at most maxStep per frame, so a long pause does not skip the lap', () => {
    const clock = createLapClock({ lapTime: LAP_TIME, duration: 12, maxStep: 0.05 });
    expect(clock.advance(30).simTime).toBeCloseTo((0.05 * LAP_TIME) / 12);
  });

  it('ignores negative frame times', () => {
    const clock = createLapClock({ lapTime: LAP_TIME, duration: 12 });
    expect(clock.advance(-1).simTime).toBe(0);
  });

  it('adds up small frames until the end of the lap', () => {
    const clock = createLapClock({ lapTime: LAP_TIME, duration: 12, maxStep: 0.05 });
    let state;
    let frames = 0;
    do {
      state = clock.advance(1 / 60);
      frames++;
    } while (!state.done);
    expect(frames).toBe(720);
    expect(state.simTime).toBe(LAP_TIME);
  });

  it('reset returns to the line', () => {
    const clock = createLapClock({ lapTime: LAP_TIME, duration: 12, maxStep: Infinity });
    clock.advance(20);
    clock.reset();
    expect(clock.advance(0)).toEqual({ simTime: 0, done: false });
  });
});
