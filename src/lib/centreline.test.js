import { describe, it, expect } from 'vitest';
import circuit from '../data/circuit.js';
import lapScene from '../data/lapScene.js';
import { projectCoordinates, measurePath, rotateStart } from './track.js';
import { createCentreline, kerbSamples } from './centreline.js';

const options = { sampleStep: 4, smoothingRadius: 4, curvatureWindow: 6 };

function circlePath(radius, segments = 720) {
  const points = Array.from({ length: segments + 1 }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
  });
  return measurePath(points);
}

const dot = (a, b) => a.x * b.x + a.z * b.z;
const length = (v) => Math.hypot(v.x, v.z);

describe('createCentreline', () => {
  const radius = 200;
  const line = createCentreline(circlePath(radius), options);

  it('samples the loop every sampleStep metres, on the ground plane (track y → z)', () => {
    expect(line.count).toBe(Math.round((2 * Math.PI * radius) / 4));
    expect(line.points).toHaveLength(line.count);
    expect(line.points[0].x).toBeCloseTo(radius, -1);
    expect(line.points[0].z).toBeCloseTo(0, 0);
    line.points.forEach((p) => expect(length(p)).toBeCloseTo(radius, -1));
  });

  it('has unit tangents along the loop and unit normals across it, always on the same side', () => {
    const sides = new Set();
    line.points.forEach((p, i) => {
      const t = line.tangents[i];
      const nrm = line.normals[i];
      expect(length(t)).toBeCloseTo(1);
      expect(length(nrm)).toBeCloseTo(1);
      expect(dot(t, p) / length(p)).toBeCloseTo(0, 2); // tangent ⟂ radius
      expect(dot(t, nrm)).toBeCloseTo(0);
      sides.add(Math.sign(dot(nrm, p)));
    });
    expect([...sides]).toHaveLength(1);
  });

  it('measures the corner radius at each sample', () => {
    line.radii.forEach((r) => expect(r).toBeCloseTo(radius, -1));
  });
});

describe('frameAt', () => {
  const line = createCentreline(circlePath(200), options);
  const n = line.count;

  it('returns the sample itself on a sample', () => {
    // 10 / n * n can land a hair below 10 (index 9, local ≈ 1): same position, so only that is checked.
    const frame = line.frameAt(10 / n);
    expect(frame.position.x).toBeCloseTo(line.points[10].x);
    expect(frame.position.z).toBeCloseTo(line.points[10].z);
  });

  it('interpolates position and keeps a unit direction between samples', () => {
    const frame = line.frameAt(10.5 / n);
    expect(frame.index).toBe(10);
    expect(frame.position.x).toBeCloseTo((line.points[10].x + line.points[11].x) / 2);
    expect(frame.position.z).toBeCloseTo((line.points[10].z + line.points[11].z) / 2);
    expect(length(frame.direction)).toBeCloseTo(1);
  });

  it('wraps progress and interpolates across the start line', () => {
    expect(line.frameAt(1.25)).toEqual(line.frameAt(0.25));
    expect(line.frameAt(-0.25)).toEqual(line.frameAt(0.75));

    const frame = line.frameAt((n - 0.5) / n);
    expect(frame.index).toBe(n - 1);
    expect(frame.position.x).toBeCloseTo((line.points[n - 1].x + line.points[0].x) / 2);
  });
});

describe('kerbSamples', () => {
  it('marks every sample of a tight circle and none of a wide one', () => {
    expect(kerbSamples(createCentreline(circlePath(100), options), 140).every(Boolean)).toBe(true);
    expect(kerbSamples(createCentreline(circlePath(500), options), 140).some(Boolean)).toBe(false);
  });

  it('matches the approved prototype on Silverstone: 17 kerb zones, none on the start line', () => {
    const metres = rotateStart(projectCoordinates(circuit.coordinates), circuit.startProgress);
    const line = createCentreline(measurePath(metres), lapScene.track);
    const kerbs = kerbSamples(line, lapScene.track.kerbRadius);
    const n = kerbs.length;
    const zones = kerbs.filter((on, i) => on && !kerbs[(i - 1 + n) % n]).length;
    const share = kerbs.filter(Boolean).length / n;

    expect(n).toBe(1469);
    expect(zones).toBe(17);
    expect(share).toBeGreaterThan(0.2);
    expect(share).toBeLessThan(0.3);
    expect(kerbs[0]).toBe(false);
  });
});
