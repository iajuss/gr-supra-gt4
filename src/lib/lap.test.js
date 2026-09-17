import { describe, it, expect } from 'vitest';
import circuit from '../data/circuit.js';
import dynamics from '../data/vulcanDynamics.js';
import { formatLapTime } from './format.js';
import { buildLap } from './lap.js';

describe('buildLap', () => {
  const { metres, model } = buildLap(circuit, dynamics);

  it('returns the closed outline in metres, starting on Hamilton Straight', () => {
    expect(metres[0]).toEqual(metres.at(-1));
    expect(model.total).toBeCloseTo(5878, 0);
  });

  it('builds the simulated lap shown on the page (1:45.364), with the circuit sectors', () => {
    expect(formatLapTime(model.lapTime)).toBe('1:45.364');
    expect(model.params.sectorSplits).toEqual(circuit.sectorSplits);
  });
});
