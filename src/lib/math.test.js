import { describe, it, expect } from 'vitest';
import { clamp, lastIndexAtOrBefore, lerp, lerpOrbit, lerpShot, normalizeStops, offsetTarget, shotAt, smoothShotAt } from './math.js';

describe('lastIndexAtOrBefore', () => {
  const cumulative = [0, 10, 20, 20, 35];

  it.each([
    [0, 0],
    [9.99, 0],
    [10, 1],
    [19, 1],
    [20, 3], // skips zero-length segments
    [34, 3],
  ])('value %s → segment %s', (value, index) => {
    expect(lastIndexAtOrBefore(cumulative, value)).toBe(index);
  });

  it('never returns the last index, so index + 1 is always valid', () => {
    expect(lastIndexAtOrBefore(cumulative, 35)).toBe(3);
    expect(lastIndexAtOrBefore(cumulative, 999)).toBe(3);
  });
});

describe('lerp', () => {
  it.each([
    [0, 10, 0, 0],
    [0, 10, 0.25, 2.5],
    [4, -4, 0.5, 0],
    [2, 6, 1, 6],
  ])('lerp(%s, %s, %s) → %s', (a, b, t, value) => {
    expect(lerp(a, b, t)).toBe(value);
  });
});

describe('clamp', () => {
  it.each([
    [-1, 0],
    [0.4, 0.4],
    [2, 1],
  ])('%s → %s', (value, expected) => {
    expect(clamp(value, 0, 1)).toBe(expected);
  });
});

describe('lerpOrbit', () => {
  // Azimuth is measured in the ground plane (x, z) around the car's vertical axis at the origin.
  const at = (degrees, radius, y) => {
    const a = (degrees * Math.PI) / 180;
    return { x: Math.cos(a) * radius, y, z: Math.sin(a) * radius };
  };
  const expectPoint = (actual, expected) => {
    expect(actual.x).toBeCloseTo(expected.x);
    expect(actual.y).toBeCloseTo(expected.y);
    expect(actual.z).toBeCloseTo(expected.z);
  };

  it('returns each end exactly, as copies', () => {
    const a = at(30, 8, 1.6);
    const b = at(150, 6, 2.2);
    expect(lerpOrbit(a, b, 0)).toEqual(a);
    expect(lerpOrbit(a, b, 1)).toEqual(b);
    expect(lerpOrbit(a, b, 0)).not.toBe(a);
  });

  it('moves along an arc around the car instead of cutting across it', () => {
    const half = lerpOrbit(at(0, 10, 2), at(180 - 1e-9, 10, 2), 0.5);
    expectPoint(half, at(90, 10, 2));
  });

  it('blends the distance to the axis and the height linearly', () => {
    expectPoint(lerpOrbit(at(0, 8, 1), at(90, 4, 3), 0.25), at(22.5, 7, 1.5));
  });

  it('takes the short way round across ±180°', () => {
    expectPoint(lerpOrbit(at(170, 5, 0), at(-170, 5, 0), 0.5), at(180, 5, 0));
    expectPoint(lerpOrbit(at(-170, 5, 0), at(170, 5, 0), 0.5), at(180, 5, 0));
  });

  it('clamps t to the ends', () => {
    const a = at(10, 5, 1);
    const b = at(80, 7, 2);
    expect(lerpOrbit(a, b, -1)).toEqual(a);
    expect(lerpOrbit(a, b, 4)).toEqual(b);
  });
});

describe('lerpShot', () => {
  const a = { id: 'hero', position: { x: 0, y: 2, z: 10 }, target: { x: 0, y: 1, z: 0 }, fov: 40 };
  const b = { id: 'aero', position: { x: -10, y: 4, z: 0 }, target: { x: -2, y: 2, z: 4 }, fov: 30 };

  it('returns each end exactly', () => {
    expect(lerpShot(a, b, 0)).toEqual({ position: a.position, target: a.target, fov: a.fov, offset: 0 });
    expect(lerpShot(a, b, 1)).toEqual({ position: b.position, target: b.target, fov: b.fov, offset: 0 });
  });

  it('swings the position around the car and blends target and fov straight', () => {
    const half = lerpShot(a, b, 0.5);
    expect(half.position.x).toBeCloseTo(-10 * Math.SQRT1_2);
    expect(half.position.y).toBeCloseTo(3);
    expect(half.position.z).toBeCloseTo(10 * Math.SQRT1_2);
    expect(half.target).toEqual({ x: -1, y: 1.5, z: 2 });
    expect(half.fov).toBe(35);
  });

  it('interpolates the sideways offset, treating a missing one as 0', () => {
    expect(lerpShot({ ...a, offset: 0.2 }, b, 0.5).offset).toBeCloseTo(0.1);
    expect(lerpShot({ ...a, offset: 0.2 }, { ...b, offset: -0.2 }, 0.25).offset).toBeCloseTo(0.1);
  });

  it('clamps t to the ends instead of overshooting', () => {
    expect(lerpShot(a, b, -3)).toEqual(lerpShot(a, b, 0));
    expect(lerpShot(a, b, 7)).toEqual(lerpShot(a, b, 1));
  });

  it('does not reuse the input objects, so the caller cannot mutate a shot', () => {
    const result = lerpShot(a, b, 0);
    result.position.x = 999;
    expect(a.position.x).toBe(0);
  });
});

describe('offsetTarget', () => {
  // Camera on +z looking at the origin: its right is +x. fov 90 and distance 10 make the frame
  // half as wide as tall times the aspect, 10 m at aspect 1.
  const shot = { position: { x: 0, y: 0, z: 10 }, target: { x: 0, y: 0, z: 0 }, fov: 90 };

  it('returns the target unchanged (as a copy) without an offset', () => {
    const result = offsetTarget(shot, 1);
    expect(result).toEqual({ x: 0, y: 0, z: 0 });
    expect(result).not.toBe(shot.target);
    expect(offsetTarget({ ...shot, offset: 0 }, 1)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('moves the target left so the subject lands right of centre', () => {
    const result = offsetTarget({ ...shot, offset: 0.25 }, 1);
    expect(result.x).toBeCloseTo(-5);
    expect(result.y).toBe(0);
    expect(result.z).toBeCloseTo(0);
  });

  it('moves it right for a negative offset', () => {
    expect(offsetTarget({ ...shot, offset: -0.25 }, 1).x).toBeCloseTo(5);
  });

  it('scales with the aspect ratio: a wider frame needs a longer move', () => {
    expect(offsetTarget({ ...shot, offset: 0.25 }, 2).x).toBeCloseTo(-10);
  });

  it('follows the camera heading, not the world axes', () => {
    // Camera on +x looking back at the origin: its right is -z.
    const side = { position: { x: 10, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 90, offset: 0.25 };
    const result = offsetTarget(side, 1);
    expect(result.x).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(5);
  });

  it('leaves the target alone when the camera looks straight down', () => {
    const top = { position: { x: 0, y: 10, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 90, offset: 0.25 };
    expect(offsetTarget(top, 1)).toEqual({ x: 0, y: 0, z: 0 });
  });
});

describe('shotAt', () => {
  const shots = [
    { id: 'one', position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 30 },
    { id: 'two', position: { x: 10, y: 0, z: 0 }, target: { x: 2, y: 0, z: 0 }, fov: 40 },
    { id: 'three', position: { x: 10, y: 20, z: 0 }, target: { x: 2, y: 4, z: 0 }, fov: 50 },
  ];

  it('lands on each shot at its own stop', () => {
    expect(shotAt(shots, 0).fov).toBe(30);
    expect(shotAt(shots, 0.5).fov).toBe(40);
    expect(shotAt(shots, 1).fov).toBe(50);
  });

  it('interpolates inside a segment', () => {
    expect(shotAt(shots, 0.25).position).toEqual({ x: 5, y: 0, z: 0 });
    expect(shotAt(shots, 0.75).position).toEqual({ x: 10, y: 10, z: 0 });
  });

  it('clamps progress outside [0, 1]', () => {
    expect(shotAt(shots, -1)).toEqual(shotAt(shots, 0));
    expect(shotAt(shots, 5)).toEqual(shotAt(shots, 1));
  });

  it('works with a single shot', () => {
    expect(shotAt([shots[0]], 0.7).fov).toBe(30);
  });
});

describe('normalizeStops', () => {
  it('maps the first value to 0 and the last to 1', () => {
    expect(normalizeStops([100, 300, 400])).toEqual([0, 2 / 3, 1]);
  });

  it('keeps the spacing between values, not their count', () => {
    // the middle section sits close to the end: its stop is late
    expect(normalizeStops([0, 900, 1000])).toEqual([0, 0.9, 1]);
  });

  it('falls back to even spacing when every value is the same', () => {
    expect(normalizeStops([7, 7, 7])).toEqual([0, 0.5, 1]);
  });

  it('works with two values', () => {
    expect(normalizeStops([-40, 60])).toEqual([0, 1]);
  });
});

describe('shotAt with uneven stops', () => {
  const shots = [
    { id: 'one', position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 30 },
    { id: 'two', position: { x: 10, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 40 },
    { id: 'three', position: { x: 10, y: 10, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 50 },
  ];
  const stops = [0, 0.8, 1]; // a long hero section, then a short transition

  it('lands on each shot at its own stop', () => {
    expect(shotAt(shots, 0, stops).fov).toBe(30);
    expect(shotAt(shots, 0.8, stops).fov).toBe(40);
    expect(shotAt(shots, 1, stops).fov).toBe(50);
  });

  it('spreads the first segment over its whole stretch', () => {
    expect(shotAt(shots, 0.4, stops).position).toEqual({ x: 5, y: 0, z: 0 });
    expect(shotAt(shots, 0.9, stops).position).toEqual({ x: 10, y: 5, z: 0 });
  });

  it('clamps outside the range', () => {
    expect(shotAt(shots, -2, stops)).toEqual(shotAt(shots, 0, stops));
    expect(shotAt(shots, 9, stops)).toEqual(shotAt(shots, 1, stops));
  });

  it('matches the even spacing when the stops are even', () => {
    expect(shotAt(shots, 0.25, [0, 0.5, 1])).toEqual(shotAt(shots, 0.25));
  });
});

describe('smoothShotAt', () => {
  // Four shots half a turn apart, so the path both swings around and doubles back.
  const at = (deg, radius, y, fov) => ({
    position: { x: Math.cos((deg * Math.PI) / 180) * radius, y, z: Math.sin((deg * Math.PI) / 180) * radius },
    target: { x: 0, y: 0.5, z: 0 },
    fov,
  });
  const shots = [at(0, 6, 1.5, 36), at(150, 5, 2.4, 34), at(20, 5.5, 0.6, 34), at(80, 7, 1, 38)];
  const sample = (progress, stops) => smoothShotAt(shots, progress, stops);
  const radiusAt = (progress, stops) => {
    const { position } = sample(progress, stops);
    return Math.hypot(position.x, position.z);
  };

  it('passes exactly through every shot', () => {
    for (const [i, shot] of shots.entries()) {
      const { position, fov } = sample(i / (shots.length - 1));
      expect(position.x).toBeCloseTo(shot.position.x, 6);
      expect(position.z).toBeCloseTo(shot.position.z, 6);
      expect(position.y).toBeCloseTo(shot.position.y, 6);
      expect(fov).toBeCloseTo(shot.fov, 6);
    }
  });

  it('has no kink at a stop: the speed is the same on both sides', () => {
    const stop = 1 / 3;
    const step = 1e-4;
    const speed = (from, to) => {
      const a = sample(from).position;
      const b = sample(to).position;
      return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / step;
    };
    const before = speed(stop - step, stop);
    const after = speed(stop, stop + step);
    expect(after).toBeCloseTo(before, 1);
  });

  it('never swings wider or closer than the stops around it', () => {
    for (let i = 0; i < shots.length - 1; i += 1) {
      const ends = [radiusAt(i / 3), radiusAt((i + 1) / 3)];
      for (let step = 1; step < 20; step += 1) {
        const radius = radiusAt((i + step / 20) / 3);
        expect(radius).toBeGreaterThanOrEqual(Math.min(...ends) - 1e-6);
        expect(radius).toBeLessThanOrEqual(Math.max(...ends) + 1e-6);
      }
    }
  });

  it('follows uneven stops', () => {
    const stops = [0, 0.1, 0.9, 1];
    expect(sample(0.1, stops).fov).toBeCloseTo(34, 6);
    expect(sample(0.9, stops).fov).toBeCloseTo(34, 6);
    expect(sample(1, stops).fov).toBeCloseTo(38, 6);
  });

  it('clamps outside the range', () => {
    expect(sample(-2)).toEqual(sample(0));
    expect(sample(5)).toEqual(sample(1));
  });
});
