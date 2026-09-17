// THE LAP presentation values, tuned in the approved prototype (sandbox/track3d, 2026-09-17).
// Units: metres and seconds (on screen). Camera offsets are relative to the car: back, up, side, ahead.

export default {
  // Playback, shared by the 2D (lite) and 3D (full) laps.
  duration: 12,
  maxStep: 0.05, // longest frame counted, so a background tab does not skip the lap

  track: {
    sampleStep: 4,
    smoothingRadius: 4,
    width: 16,
    edgeWidth: 0.5,
    kerbWidth: 2,
    kerbRadius: 140, // kerbs only where the corner radius is tighter than this
    kerbStripe: 2, // samples per lime/white stripe
    curvatureWindow: 6,
    trailWidth: 0.7,
  },

  look: {
    fogDensity: 0.0011,
    // The top camera sits ~1 km away, where the fog eats ~70% of the colour: it fades to no fog,
    // a bigger car block and a wide full-lime trail.
    topCarScale: 6,
    topTrailWidth: 6,
  },

  // Scene colours (hex). Lime, white and green follow the CSS tokens.
  colors: {
    background: 0x0a0b0a,
    ground: 0x0c0d0c,
    grid: 0x1f3d2b,
    asphalt: 0x111311,
    edge: 0x5c5f59,
    lime: 0xc6ff00,
    white: 0xe8e9e3,
    trail: 0x5f7a00, // dim lime, below the bloom threshold so it does not glare under the chase camera
  },

  cameras: {
    chase: { back: 24, up: 7.5, ahead: 30, targetUp: 1.5 },
    heli: { back: 90, up: 70, side: 40, ahead: 60 },
    initial: 'heli',
    top: { offset: { x: -150, y: 950, z: 250 } },
    fov: 50,
    chaseFovBoost: 18, // extra degrees at chaseFovSpeed
    chaseFovSpeed: 300, // km/h
    followRate: 4, // exponential smoothing rate (1/s)
  },
};
