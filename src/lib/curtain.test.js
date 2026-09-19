import { describe, it, expect } from 'vitest';
import { curtainAt } from './curtain.js';

// The title's top-left corner on screen, in px: centred in the handoff → the stage's top-left corner.
const move = {
  from: { left: 400, top: 320 },
  to: { left: 72, top: 92 },
  scale: 0.5,
  distance: 720, // the stage rises one screen
};

describe('curtainAt', () => {
  it('leaves the title where it is at the start', () => {
    expect(curtainAt(0, move)).toEqual({ x: 0, y: 0, scale: 1 });
  });

  it('lands the title in the corner, at its final size, once the stage has risen', () => {
    const end = curtainAt(1, move);
    // On screen the title sits at from + (x, y − distance): the page itself moved up by `distance`.
    expect(move.from.left + end.x).toBe(move.to.left);
    expect(move.from.top + end.y - move.distance).toBe(move.to.top);
    expect(end.scale).toBe(0.5);
  });

  it('cancels the scroll on the way, so the title only travels by its own path', () => {
    const t = 0.5;
    const { y } = curtainAt(t, move);
    const onScreen = move.from.top + y - move.distance * t;
    // Halfway along an eased path from 320 to 92.
    expect(onScreen).toBeCloseTo(206);
  });

  it('eases the travel: slow at both ends, symmetric around the middle', () => {
    const early = curtainAt(0.1, move).scale;
    const late = curtainAt(0.9, move).scale;
    expect(1 - early).toBeLessThan(0.5 * 0.1); // less than linear at the start
    expect(1 - early).toBeCloseTo(late - 0.5);
  });

  it('clamps progress outside [0, 1]', () => {
    expect(curtainAt(-0.5, move)).toEqual(curtainAt(0, move));
    expect(curtainAt(1.5, move)).toEqual(curtainAt(1, move));
  });
});
