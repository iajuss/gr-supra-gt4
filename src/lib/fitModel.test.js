import { describe, it, expect } from 'vitest';
import { fitToLength } from './fitModel.js';

/** The real Vulcan, in metres (see data/carStage.js). */
const VULCAN = { length: 4.72, width: 2.05, height: 1.19 };

/** Applies a fit the way the scene does: scale the box uniformly, then translate it. */
function apply({ scale, offset }, box) {
  const move = (p) => ({ x: p.x * scale + offset.x, y: p.y * scale + offset.y, z: p.z * scale + offset.z });
  return { min: move(box.min), max: move(box.max) };
}

describe('fitToLength', () => {
  it('scales a unit box up to the target length', () => {
    const box = { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } };
    const fit = fitToLength(box, VULCAN.length);

    expect(fit.scale).toBeCloseTo(4.72);
    expect(fit.size.length).toBeCloseTo(4.72);
    expect(fit.size.width).toBeCloseTo(4.72);
    expect(fit.size.height).toBeCloseTo(4.72);
  });

  it('leaves a box already at the target length untouched in scale', () => {
    const box = {
      min: { x: 10, y: 5, z: -3 },
      max: { x: 10 + VULCAN.length, y: 5 + VULCAN.height, z: -3 + VULCAN.width },
    };
    const fit = fitToLength(box, VULCAN.length);

    expect(fit.scale).toBeCloseTo(1);
    expect(fit.size.width).toBeCloseTo(VULCAN.width);
    expect(fit.size.height).toBeCloseTo(VULCAN.height);
  });

  it('centres the box on the origin in x and z and rests it on the ground', () => {
    const box = { min: { x: 100, y: 7, z: -40 }, max: { x: 140, y: 17, z: -20 } };
    const fitted = apply(fitToLength(box, VULCAN.length), box);

    expect((fitted.min.x + fitted.max.x) / 2).toBeCloseTo(0);
    expect((fitted.min.z + fitted.max.z) / 2).toBeCloseTo(0);
    expect(fitted.min.y).toBeCloseTo(0);
  });

  it('works for a box that straddles the origin below the ground', () => {
    const box = { min: { x: -8, y: -3, z: -2 }, max: { x: 2, y: 1, z: 2 } };
    const fitted = apply(fitToLength(box, VULCAN.length), box);

    expect((fitted.min.x + fitted.max.x) / 2).toBeCloseTo(0);
    expect(fitted.min.y).toBeCloseTo(0);
    expect(fitted.max.x - fitted.min.x).toBeCloseTo(VULCAN.length);
  });

  it('keeps the proportions of the box (uniform scale)', () => {
    const box = { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 2, z: 4 } };
    const fit = fitToLength(box, VULCAN.length);

    expect(fit.size.height / fit.size.length).toBeCloseTo(2 / 10);
    expect(fit.size.width / fit.size.length).toBeCloseTo(4 / 10);
  });

  it('rejects a box with no length and a target that is not positive', () => {
    const flat = { min: { x: 1, y: 0, z: 0 }, max: { x: 1, y: 2, z: 2 } };
    expect(() => fitToLength(flat, VULCAN.length)).toThrow(/length/i);

    const box = { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } };
    expect(() => fitToLength(box, 0)).toThrow(/target/i);
  });
});
