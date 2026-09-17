import { describe, it, expect } from 'vitest';
import silverstone from '../data/silverstone.json';
import {
  projectCoordinates,
  fitToBox,
  measurePath,
  pointAt,
  rotateQuarter,
  orientToBox,
  sliceUntil,
  rotateStart,
} from './track.js';

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

describe('rotateQuarter', () => {
  it('rotates 90° clockwise on screen (east → south, north → east)', () => {
    const [east, north] = rotateQuarter([
      { x: 1, y: 0 },
      { x: 0, y: -1 },
    ]);
    expect(east.x).toBeCloseTo(0);
    expect(east.y).toBeCloseTo(1);
    expect(north.x).toBeCloseTo(1);
    expect(north.y).toBeCloseTo(0);
  });
});

describe('orientToBox', () => {
  const portraitTrack = [
    { x: 0, y: 0 },
    { x: 10, y: 30 },
  ];

  it('rotates a portrait track to fill a landscape box', () => {
    const { points, rotated } = orientToBox(portraitTrack, { width: 400, height: 300 });
    expect(rotated).toBe(true);
    const width = Math.abs(points[1].x - points[0].x);
    const height = Math.abs(points[1].y - points[0].y);
    expect(width).toBeGreaterThan(height);
  });

  it('keeps a portrait track as is in a portrait box', () => {
    expect(orientToBox(portraitTrack, { width: 300, height: 400 })).toEqual({
      points: portraitTrack,
      rotated: false,
    });
  });
});

describe('sliceUntil', () => {
  it('returns the travelled polyline ending at the interpolated position', () => {
    expect(sliceUntil(measurePath(square), 0.375)).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
  });

  it('returns only the start point at progress 0 and the full loop at progress 1', () => {
    const path = measurePath(square);
    expect(sliceUntil(path, 0)).toEqual([{ x: 0, y: 0 }]);
    expect(sliceUntil(path, 1)).toEqual(square);
  });
});

describe('rotateStart', () => {
  it('starts the closed loop at a point inside a segment', () => {
    expect(rotateStart(square, 0.125)).toEqual([
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 0, y: 0 },
      { x: 5, y: 0 },
    ]);
  });

  it('starts at an existing vertex without duplicating it', () => {
    expect(rotateStart(square, 0.25)).toEqual([
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
  });

  it('keeps the loop unchanged at progress 0 and preserves its length', () => {
    expect(rotateStart(square, 0)).toEqual(square);
    expect(measurePath(rotateStart(square, 0.6)).total).toBeCloseTo(40);
  });
});
