import { describe, it, expect } from 'vitest';
import circuit from './circuit.js';
import dynamics from './vulcanDynamics.js';
import { projectCoordinates, measurePath, rotateStart } from '../lib/track.js';
import { createLapModel } from '../lib/telemetry.js';

function brakingZones(model) {
  const kmh = model.speeds.map((v) => v * 3.6);
  const n = kmh.length;
  const zones = [];
  for (let i = 0; i < n; i++) {
    if (kmh[i] < kmh[(i - 1 + n) % n] && kmh[i] <= kmh[(i + 1) % n] && kmh[i] < 260) {
      zones.push(i * model.step);
    }
  }
  return zones;
}

describe('circuit data (Silverstone)', () => {
  const buildModel = () => {
    const metres = rotateStart(projectCoordinates(circuit.coordinates), circuit.startProgress);
    return createLapModel(measurePath(metres), { ...dynamics, sectorSplits: circuit.sectorSplits });
  };

  it('places the start line on Hamilton Straight: Abbey ahead, Club behind, both 200–400 m away', () => {
    const model = buildModel();
    const zones = brakingZones(model);
    const toAbbey = zones[0];
    const fromClub = model.total - zones.at(-1);

    expect(zones).toHaveLength(18);
    expect(toAbbey).toBeGreaterThan(200);
    expect(toAbbey).toBeLessThan(400);
    expect(fromClub).toBeGreaterThan(200);
    expect(fromClub).toBeLessThan(400);
  });

  it('crosses the line at straight-line speed', () => {
    const model = buildModel();
    expect(model.speeds[0] * 3.6).toBeGreaterThan(200);
  });

  it('keeps three ordered sectors', () => {
    expect(circuit.sectorSplits).toHaveLength(2);
    expect(circuit.sectorSplits[0]).toBeLessThan(circuit.sectorSplits[1]);
  });
});
