// Simulation parameters for the illustrative lap. Estimates, not official Aston Martin data.
// Units: metres, seconds, m/s, m/s². Gear thresholds in km/h. Window/radius values are in samples.
//
// Tuned on Silverstone (2026-09-17): smoothing ±20 m (x2) + curvature window ±30 m yields exactly
// 18 braking zones (the circuit's 18 corners), a 1:45.4 lap, 94–288 km/h.

const G = 9.81;

export default {
  sampleStep: 5,
  smoothingRadius: 4,
  curvatureWindow: 6,
  lateralAcceleration: 2.8 * G,
  accelerationMax: 1.1 * G,
  braking: 3.2 * G,
  topSpeed: 320 / 3.6,
  gearTopSpeeds: [85, 125, 165, 205, 250, Infinity],
  sectorSplits: [1 / 3, 2 / 3],
};
