// Car stage presentation values: a dark studio with the car at real-world size.
// Units: metres, y up, x along the car (nose at +x). Internal scene values, never shown on the page.

export default {
  // Approximate Vulcan body dimensions, used to size the proxy and later to fit the GLB.
  car: {
    length: 4.72,
    width: 2.05,
    height: 1.19,
  },

  ground: {
    size: 400, // the fog swallows the edge long before this
    // Nearly metal, so the floor mirrors the dark room instead of catching a diffuse pool of light.
    roughness: 0.5,
    metalness: 0.85,
  },

  // A soft studio: bright key, cool fill and a lime rim that draws the AMR edge.
  // The rim is a spot, not a directional: as a directional its specular lobe turned the whole
  // metallic floor into a green pool (seen in the browser, 2026-09-17).
  lights: {
    key: { color: 0xfff6e8, intensity: 1.6, position: { x: 6, y: 8, z: 6 } },
    fill: { color: 0x9fb0a0, intensity: 0.4, position: { x: -8, y: 4, z: -2 } },
    rim: {
      color: 0xc6ff00,
      intensity: 110,
      position: { x: -6.5, y: 2.6, z: -6 },
      target: { x: 0, y: 0.7, z: 0 },
      angle: 0.42,
      penumbra: 0.85,
      distance: 18,
      decay: 2,
    },
    environmentIntensity: 0.35, // procedural room environment (no HDR download)
  },

  fog: { density: 0.022 },

  // The framing itself lives in data/cameraShots.js; fov here is only the value the camera starts with.
  camera: {
    fov: 38,
    near: 0.1,
    far: 500,
  },

  // Scene colours (hex), following the CSS tokens.
  colors: {
    background: 0x0a0b0a,
    ground: 0x0c0e0c,
    proxy: 0x1a1d1a,
    proxyEdge: 0xc6ff00,
  },
};
