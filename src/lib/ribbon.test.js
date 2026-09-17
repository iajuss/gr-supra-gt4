import { describe, it, expect } from 'vitest';
import { buildRibbon, indexCountUntil, stripeAt } from './ribbon.js';

// A 10 m square loop with every normal pointing +z keeps the expected vertices easy to read.
const square = {
  count: 4,
  points: [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
    { x: 10, z: 10 },
    { x: 0, z: 10 },
  ],
  normals: Array.from({ length: 4 }, () => ({ x: 0, z: 1 })),
};

const row = (positions, i) => Array.from(positions.slice(i * 6, i * 6 + 6));

describe('buildRibbon', () => {
  it('places two vertices per sample at both lateral offsets and the given height, closing the loop', () => {
    const { positions } = buildRibbon(square, { offsetA: -2, offsetB: 3, height: 0.5 });

    expect(positions).toBeInstanceOf(Float32Array);
    expect(positions).toHaveLength((4 + 1) * 2 * 3);
    expect(row(positions, 1)).toEqual([10, 0.5, -2, 10, 0.5, 3]);
    expect(row(positions, 3)).toEqual([0, 0.5, 8, 0, 0.5, 13]);
    expect(row(positions, 4)).toEqual(row(positions, 0));
  });

  it('joins consecutive samples with two triangles per segment', () => {
    const { indices } = buildRibbon(square, { offsetA: -1, offsetB: 1, height: 0 });

    expect(indices).toHaveLength(4 * 6);
    expect(Array.from(indices.slice(0, 6))).toEqual([0, 2, 1, 1, 2, 3]);
    expect(Array.from(indices.slice(18))).toEqual([6, 8, 7, 7, 8, 9]); // last segment reaches the closing row
    expect(Math.max(...indices)).toBe((4 + 1) * 2 - 1);
  });

  it('leaves out skipped segments instead of sinking them (no ramps)', () => {
    const { indices } = buildRibbon(square, {
      offsetA: -1,
      offsetB: 1,
      height: 0,
      segments: [true, false, true, false],
    });

    expect(Array.from(indices)).toEqual([0, 2, 1, 1, 2, 3, 4, 6, 5, 5, 6, 7]);
  });

  it('adds one colour per vertex only when colorAt is given', () => {
    expect(buildRibbon(square, { offsetA: -1, offsetB: 1, height: 0 }).colors).toBeUndefined();

    const { colors } = buildRibbon(square, {
      offsetA: -1,
      offsetB: 1,
      height: 0,
      colorAt: (i) => [i / 4, 0, 1],
    });
    expect(colors).toHaveLength((4 + 1) * 2 * 3);
    expect(row(colors, 2)).toEqual([0.5, 0, 1, 0.5, 0, 1]);
    expect(row(colors, 4)).toEqual(row(colors, 0));
  });
});

describe('indexCountUntil', () => {
  it('counts the indices of an unskipped ribbon up to a sample (trail draw range)', () => {
    expect(indexCountUntil(0)).toBe(0);
    expect(indexCountUntil(5)).toBe(30);
  });
});

describe('stripeAt', () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 1],
    [4, 0],
  ])('sample %s → stripe %s (2 samples per stripe)', (index, stripe) => {
    expect(stripeAt(index, 2)).toBe(stripe);
  });
});
