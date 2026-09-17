// One camera shot per chapter, in the order the page scrolls through them.
// Metres, y up, the car's nose at +x, its body inside x ±2.36, z ±1.03, y 0–1.19.
// Framed against the proxy box; step 5 refines them with the real model.

export default [
  {
    id: 'hero',
    position: { x: 6.6, y: 1.7, z: 5.4 },
    target: { x: 0, y: 0.6, z: 0 },
    fov: 38,
  },
  {
    // 01 — Aero: rear wing and diffuser, from behind and slightly above.
    id: 'aero',
    position: { x: -5.6, y: 1.9, z: 3.4 },
    target: { x: -1.9, y: 0.85, z: 0 },
    fov: 34,
  },
  {
    // 02 — Chassis: front splitter, low and close.
    id: 'chassis',
    position: { x: 5.2, y: 0.5, z: 2.4 },
    target: { x: 1.9, y: 0.35, z: 0 },
    fov: 34,
  },
  {
    // 03 — V12: side exhaust, at hip height alongside the car.
    id: 'v12',
    position: { x: 1.8, y: 0.8, z: 6.2 },
    target: { x: 0.2, y: 0.55, z: 0 },
    fov: 40,
  },
  {
    // Transition: the camera pulls away before the page hands over to THE LAP.
    id: 'transition',
    position: { x: 11.5, y: 6.5, z: 10.5 },
    target: { x: 0, y: 0.7, z: 0 },
    fov: 45,
  },
];
