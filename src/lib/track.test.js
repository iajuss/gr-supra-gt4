import { describe, it, expect } from 'vitest';
import silverstone from '../data/silverstone.json';
import { projectCoordinates, fitToBox, measurePath, pointAt } from './track.js';

const square = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
  { x: 0, y: 0 },
];

describe('projectCoordinates', () => {
  it('maps [lon, lat] pairs to metres with east = +x and north = -y (canvas space)', () => {
    const [origin, east, north] = projectCoordinates([
      [0, 0],
      [0.001, 0],
      [0, 0.001],
    ]);

    expect(east.x - origin.x).toBeGreaterThan(0);
    expect(east.y - origin.y).toBeCloseTo(0, 6);
    expect(north.y - origin.y).toBeLessThan(0);
    expect(north.x - origin.x).toBeCloseTo(0, 6);
  });

  it('uses about 111.2 km per degree of latitude', () => {
    const [a, b] = projectCoordinates([
      [0, 0],
      [0, 1],
    ]);
    expect(Math.abs(b.y - a.y)).toBeCloseTo(111_195, -2);
  });

  it('shrinks longitude distances by cos(latitude)', () => {
    const [a, b] = projectCoordinates([
      [0, 60],
      [1, 60],
    ]);
    expect(b.x - a.x).toBeCloseTo(111_195 * 0.5, -2);
  });

  it('keeps the real Silverstone outline close to its official 5891 m length', () => {
    const points = projectCoordinates(silverstone.geometry.coordinates);
    const { total } = measurePath(points);
    expect(Math.abs(total - silverstone.properties.length) / silverstone.properties.length).toBeLessThan(0.05);
  });
});

describe('fitToBox', () => {
  const wide = [
    { x: -100, y: 0 },
    { x: 100, y: 50 },
  ];

  it('scales uniformly to fit inside the padded box and centres the result', () => {
    const [a, b] = fitToBox(wide, { width: 400, height: 400, padding: 20 });

    // 200 x 50 shape into a 360 x 360 area → scale 1.8 → 360 x 90
    expect(a).toEqual({ x: 20, y: 155 });
    expect(b).toEqual({ x: 380, y: 245 });
  });

  it('preserves the aspect ratio when height is the limiting side', () => {
    const tall = [
      { x: 0, y: 0 },
      { x: 10, y: 100 },
    ];
    const [a, b] = fitToBox(tall, { width: 300, height: 100, padding: 0 });

    expect(b.y - a.y).toBeCloseTo(100);
    expect(b.x - a.x).toBeCloseTo(10);
    expect((a.x + b.x) / 2).toBeCloseTo(150);
  });
});

describe('measurePath', () => {
  it('returns cumulative distances and the total length', () => {
    expect(measurePath(square)).toEqual({
      points: square,
      cumulative: [0, 10, 20, 30, 40],
      total: 40,
    });
  });
});

describe('pointAt', () => {
  it.each([
    [0, { x: 0, y: 0 }],
    [0.125, { x: 5, y: 0 }],
    [0.5, { x: 10, y: 10 }],
    [0.875, { x: 0, y: 5 }],
  ])('at progress %s returns the interpolated position', (t, expected) => {
    const p = pointAt(measurePath(square), t);
    expect(p.x).toBeCloseTo(expected.x);
    expect(p.y).toBeCloseTo(expected.y);
  });

  it('includes the heading angle of the current segment', () => {
    const path = measurePath(square);
    expect(pointAt(path, 0.125).angle).toBeCloseTo(0); // moving +x
    expect(pointAt(path, 0.375).angle).toBeCloseTo(Math.PI / 2); // moving +y
  });

  it('wraps progress outside [0, 1) so laps can loop', () => {
    const path = measurePath(square);
    expect(pointAt(path, 1.125)).toEqual(pointAt(path, 0.125));
    expect(pointAt(path, -0.875)).toEqual(pointAt(path, 0.125));
    expect(pointAt(path, 1)).toEqual(pointAt(path, 0));
  });
});
