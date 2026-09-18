// Simulation parameters for the illustrative lap. Estimates, not official Toyota data.
// Units: metres, seconds, m/s, m/s². Gear thresholds in km/h. Window/radius values are in samples.
//
// Tuned on Silverstone for a GR Supra GT4 (2026-09-17): smoothing ±20 m (x2) + curvature window ±30 m
// yields exactly 18 braking zones (the circuit's 18 corners), a 2:10.2 lap, 78–226 km/h. A real GT4
// laps Silverstone GP in about 2:09–2:11. The grip and acceleration figures are calibrated to that
// result, not measured: the model's curvature is smoothed and its acceleration constant.

const G = 9.81;

export default {
  sampleStep: 5,
  smoothingRadius: 4,
  curvatureWindow: 6,
  lateralAcceleration: 1.95 * G,
  accelerationMax: 0.66 * G,
  braking: 2.2 * G,
  topSpeed: 250 / 3.6, // limited, as on the car
  gearTopSpeeds: [75, 105, 135, 165, 195, 225, Infinity], // 7-speed paddle-shift automatic
};
