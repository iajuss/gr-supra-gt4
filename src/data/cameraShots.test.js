import { describe, it, expect } from 'vitest';
import shots from './cameraShots.js';
import { shotAt, smoothShotAt } from '../lib/math.js';

/** Horizontal distance from a point to the car's footprint (a box centred on the origin). */
function distanceToCar({ x, z }, { length, width }) {
  const dx = Math.max(Math.abs(x) - length / 2, 0);
  const dz = Math.max(Math.abs(z) - width / 2, 0);
  return Math.hypot(dx, dz);
}

describe('camera path through the real shots', () => {
  // The fitted model's footprint (see the header of cameraShots.js): wider than the stock A90 in
  // carStage.js, because of the widebody kit.
  const car = { length: 4.38, width: 2.02 };
  const segments = shots.slice(0, -1).map((from, i) => [from, shots[i + 1], i]);

  it.each(segments)('never gets closer to the car than its ends (%# → next)', (from, to, i) => {
    const ends = Math.min(distanceToCar(from.position, car), distanceToCar(to.position, car));
    for (let step = 0; step <= 100; step += 1) {
      const progress = (i + step / 100) / (shots.length - 1);
      const { position } = shotAt(shots, progress);
      expect(distanceToCar(position, car)).toBeGreaterThanOrEqual(ends - 0.05);
    }
  });

  // The page follows the whole list as one curve (smoothShotAt); the same has to hold for it.
  it.each(segments)('the curve keeps the same clearance (%# → next)', (from, to, i) => {
    const ends = Math.min(distanceToCar(from.position, car), distanceToCar(to.position, car));
    for (let step = 0; step <= 100; step += 1) {
      const progress = (i + step / 100) / (shots.length - 1);
      const { position } = smoothShotAt(shots, progress);
      expect(distanceToCar(position, car)).toBeGreaterThanOrEqual(ends - 0.05);
    }
  });

  it('reaches each shot exactly, so the chapters frame as designed', () => {
    for (const [i, shot] of shots.entries()) {
      const { position, fov, offset } = smoothShotAt(shots, i / (shots.length - 1));
      expect(position.x).toBeCloseTo(shot.position.x, 6);
      expect(position.z).toBeCloseTo(shot.position.z, 6);
      expect(fov).toBeCloseTo(shot.fov, 6);
      expect(offset).toBeCloseTo(shot.offset ?? 0, 6);
    }
  });
});
