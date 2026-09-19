import { describe, it, expect } from 'vitest';
import { finish, initialPlayback, restart, see, shouldRun, togglePause } from './lapPlayback.js';

const HALF = 0.5;

describe('lap playback', () => {
  it('waits off screen', () => {
    expect(shouldRun(initialPlayback)).toBe(false);
  });

  it('does not start on a glimpse, only once half the view is visible', () => {
    expect(shouldRun(see(initialPlayback, 0.2, HALF))).toBe(false);
    expect(shouldRun(see(initialPlayback, 0.5, HALF))).toBe(true);
  });

  it('stops off screen and resumes when back in view', () => {
    const playing = see(initialPlayback, 1, HALF);
    const away = see(playing, 0, HALF);
    expect(shouldRun(away)).toBe(false);
    expect(shouldRun(see(away, 0.1, HALF))).toBe(true);
  });

  it('pauses and resumes on demand', () => {
    const paused = togglePause(see(initialPlayback, 1, HALF));
    expect(paused.paused).toBe(true);
    expect(shouldRun(paused)).toBe(false);
    expect(shouldRun(togglePause(paused))).toBe(true);
  });

  it('stays paused when the view scrolls away and back', () => {
    const paused = togglePause(see(initialPlayback, 1, HALF));
    expect(shouldRun(see(see(paused, 0, HALF), 1, HALF))).toBe(false);
  });

  it('pausing before the start keeps the lap from starting on its own', () => {
    const paused = togglePause(initialPlayback);
    expect(shouldRun(see(paused, 1, HALF))).toBe(false);
  });

  it('stops on the line', () => {
    expect(shouldRun(finish(see(initialPlayback, 1, HALF)))).toBe(false);
  });

  it('restart plays again from a finished or paused lap', () => {
    const finished = finish(see(initialPlayback, 1, HALF));
    expect(shouldRun(restart(finished))).toBe(true);
    const paused = togglePause(see(initialPlayback, 1, HALF));
    expect(restart(paused).paused).toBe(false);
    expect(shouldRun(restart(paused))).toBe(true);
  });

  it('restart off screen waits for the view to come back', () => {
    const away = see(see(initialPlayback, 1, HALF), 0, HALF);
    expect(shouldRun(restart(away))).toBe(false);
  });
});
