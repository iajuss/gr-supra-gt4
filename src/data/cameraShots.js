// One camera shot per chapter, in the order the page scrolls through them.
// Metres, y up, the car's nose at +x, its body inside x ±2.19, z ±1.01, y 0–1.21 (Toyota Supra MK5).
// `target` is the point of the car the shot is about; `offset` then slides the frame sideways so the
// car sits clear of the section's text (a fraction of the frame width, + puts the car right of
// centre). The lite capture ignores it and keeps the car centred.

export default [
  {
    // Hero: front three-quarter, the car right of the title.
    id: 'hero',
    position: { x: 6.4, y: 1.6, z: 5.2 },
    target: { x: 0, y: 0.55, z: 0 },
    fov: 36,
    offset: 0.22,
  },
  {
    // 01 — Aero: rear wing and diffuser, from behind and above. Text on the right.
    id: 'aero',
    position: { x: -5.8, y: 2.35, z: 3.3 },
    target: { x: -1.6, y: 0.8, z: 0 },
    fov: 34,
    offset: -0.22,
  },
  {
    // 02 — Chassis: front splitter, low and close. Text on the left.
    id: 'chassis',
    position: { x: 5.5, y: 0.6, z: 2.9 },
    target: { x: 1.8, y: 0.4, z: 0 },
    fov: 34,
    offset: 0.25,
  },
  {
    // 03 — Engine: side profile at hip height, the whole car in view. Text on the right.
    id: 'engine',
    position: { x: 0.9, y: 0.9, z: 7.6 },
    target: { x: 0, y: 0.55, z: 0 },
    fov: 38,
    offset: -0.15,
  },
  {
    // Transition: the camera pulls away before the page hands over to THE LAP.
    id: 'transition',
    position: { x: 11.5, y: 6.5, z: 10.5 },
    target: { x: 0, y: 0.7, z: 0 },
    fov: 45,
  },
];
