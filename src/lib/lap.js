// Builds THE LAP once: circuit outline in metres (from the start line) and its simulated lap.
// Shared by the 2D (lite) and 3D (full) views.

import { projectCoordinates, measurePath, rotateStart } from './track.js';
import { createLapModel } from './telemetry.js';

/**
 * @param {typeof import('../data/circuit.js').default} circuit
 * @param {typeof import('../data/supraDynamics.js').default} dynamics
 */
export function buildLap(circuit, dynamics) {
  const metres = rotateStart(projectCoordinates(circuit.coordinates), circuit.startProgress);
  const model = createLapModel(measurePath(metres), { ...dynamics, sectorSplits: circuit.sectorSplits });
  return { metres, model };
}
