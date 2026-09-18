// Car stage presentation values: a dark studio with the car at real-world size.
// Units: metres, y up, x along the car (nose at +x). Internal scene values, never shown on the page.

export default {
  // Toyota Supra MK5 (A90) body dimensions; the loaded model is scaled to this length.
  car: {
    length: 4.38,
    width: 1.87,
    height: 1.29,
  },

  ground: {
    size: 400, // the fog swallows the edge long before this
    // Nearly metal, so the floor mirrors the dark room instead of catching a diffuse pool of light.
    roughness: 0.5,
    metalness: 0.85,
  },

  // A soft studio: bright key, cool fill and a lime spot that paints a sheen over the roof.
  // The rim is a spot, not a directional: as a directional its specular lobe turned the whole
  // metallic floor into a green pool (seen in the browser, 2026-09-17). It comes from above and
  // behind and is aimed at the middle of the car, so what reaches the floor lands underneath it.
  lights: {
    key: { color: 0xfff6e8, intensity: 2.2, position: { x: 6, y: 8, z: 6 } },
    fill: { color: 0x9fb0a0, intensity: 0.4, position: { x: -8, y: 4, z: -2 } },
    rim: {
      color: 0xc6ff00,
      intensity: 110,
      position: { x: -3.2, y: 5.6, z: -3.4 },
      target: { x: 0, y: 0.6, z: 0 },
      angle: 0.38,
      penumbra: 0.9,
      distance: 11,
      decay: 2,
    },
    environmentIntensity: 0.6, // procedural room environment (no HDR download)
  },

  fog: { density: 0.022 },

  // The framing itself lives in data/cameraShots.js; fov here is only the value the camera starts with.
  camera: {
    fov: 38,
    near: 0.1,
    far: 500,
  },

  // How the loaded model is repainted, by material name. The GLB arrives almost entirely off-white,
  // so every part is dressed in the page's own palette instead.
  paint: {
    body: { color: 0x101210, metalness: 0.85, roughness: 0.28 }, // carbon, with a controlled sheen
    glass: { color: 0x050705, metalness: 1, roughness: 0.06, opacity: 0.62 },
    rim: { color: 0x141614, metalness: 0.9, roughness: 0.35 },
    tyre: { color: 0x090a09, metalness: 0, roughness: 0.95 },
    chrome: { color: 0x9aa39a, metalness: 1, roughness: 0.15 },
    accent: { color: 0xc6ff00, emissive: 0xc6ff00, emissiveIntensity: 2.4 }, // tail light bar, calipers
    headlight: { color: 0xe8f0e0, emissive: 0xdfeacd, emissiveIntensity: 1.8 },
  },

  // Which material names of the GLB map to which paint above.
  materialRoles: {
    glass: ['GLASS - windshield', 'Mirror'],
    rim: ['Llanta', 'Cromado1'],
    // 'WHEELARCH RUBBER - black' is not listed on purpose: despite the name it is most of the
    // bodywork (852k of the 1.47M triangles), and painting it as tyre made the car flat and matte.
    tyre: ['neumático'],
    accent: ['Material.004', 'azul'],
    headlight: ['Luz blanca1'],
  },

  // Scene colours (hex), following the CSS tokens.
  colors: {
    background: 0x0a0b0a,
    ground: 0x0c0e0c,
    edge: 0xc6ff00, // the lit edges of the car
  },
};
