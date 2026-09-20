// Car stage presentation values: a dark studio with the car at real-world size.
// Units: metres, y up, x along the car (nose at +x). Internal scene values, never shown on the page.

export default {
  // Toyota Supra MK5 (A90) body dimensions; the loaded model is scaled to this length.
  car: {
    length: 4.38,
    width: 1.87,
    height: 1.29,
  },

  // The lights when the car is switched off (components/ignitionShow.js): the lamps' own colours are
  // near white and red, and lit by the studio they read as on even with no glow, so off they darken.
  // (A glare sprite over each headlight was tried and dropped at the user's request, 2026-09-19.)
  lightsOff: { front: 0x111214, rear: 0x1a0606 },

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
      // Aimed at the tail: on the middle of the car the sheen pooled in the roof's double bubble and read
      // as a dent (2026-09-18).
      target: { x: -1.6, y: 0.9, z: 0 },
      angle: 0.38,
      penumbra: 0.9,
      distance: 11,
      decay: 2,
    },
    // Cool white from behind and to the right: it outlines the car against the dark studio, which the
    // black paint alone lost (look lab, 2026-09-18).
    edge: {
      color: 0xdfe8ff,
      intensity: 90,
      position: { x: 4.5, y: 3.2, z: -4.5 },
      target: { x: 0, y: 0.6, z: 0 },
      angle: 0.5,
      penumbra: 0.8,
      distance: 14,
      decay: 2,
    },
    // Procedural room environment (no HDR download). It is a white room: much more and the black paint
    // reads as silver (0.8 and 0.3 compared in the look lab, 2026-09-18).
    environmentIntensity: 0.5,
  },

  // Light that spills around the car's lamps, and only them (scene/bloom.js): discreet and physical,
  // not a halo (glare sprites were dropped, 2026-09-19). The softer of three strengths compared in the
  // look lab (?set=bloom), chosen by the user. The threshold is on the lamps' own brightness, linear.
  // Set to null to draw without it.
  bloom: { strength: 0.4, radius: 0.25, threshold: 0 },

  // The car comes out of the fog once it is on stage: `veiled` hides it, the reveal eases back to `density`.
  fog: { density: 0.022, veiled: 0.45, revealMs: 1400 },

  // The framing itself lives in data/cameraShots.js; fov here is only the value the camera starts with.
  camera: {
    fov: 38,
    near: 0.1,
    far: 500,
  },

  // Air over the car in the aero chapter (lib/airflow.js, scene/airflow.js). `mode` picks how the
  // same streamlines are drawn: 'lines' (a mark running along each) or 'dots' (points travelling
  // the same routes). Lime and added light, so the air reads against the dark studio without
  // competing with the car's own lamps; `speed` is routes per second.
  airflow: {
    mode: 'lines',
    color: 0xc6ff00,
    opacity: 0.55,
    marks: 3,
    speed: 0.22,
    dots: 26,
    size: 0.045,
    // How far either side of the aero stop the air is still drawn, along the 0-1 scroll path. The
    // chapters sit about 0.25 apart, so this fades it in and out well inside its own chapter.
    reach: 0.11,
  },

  // The frame budget (lib/quality.js, scene/qualityBudget.js): how many frames it watches before it
  // decides, and how many of the first ones it throws away — the opening is an animation of its own,
  // and judging the machine by it would punish every machine. Thresholds live with the rule.
  quality: { warmUp: 30, sample: 90 },

  // A hand on the camera instead of a tripod (lib/handheld.js, scene/handheldCamera.js): the framing
  // drifts, the camera never moves, so the distance to the car is the chapter's own. Degrees at the
  // very edge of the drift, which it rarely reaches; `easeIn` is how long it takes to get there from
  // a standstill. Set both amplitudes to 0 to bolt the camera back down.
  handheld: { amplitude: { yaw: 0.35, pitch: 0.2 }, easeIn: 1.2 },

  // How the loaded model is repainted, by material name. The GLB arrives almost entirely off-white,
  // so every part is dressed in the page's own palette instead.
  paint: {
    // Each part gets its own finish, so the car reads in depth instead of as one black mass
    // (look lab, 2026-09-18). Double-sided where panels are single surfaces facing inwards (the rear
    // wing's endplates vanished when seen from outside, 2026-09-17).
    // The paint: black under a clear coat, whose sharp second reflection draws the volumes.
    body: {
      color: 0x0e100f,
      metalness: 0.2,
      roughness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      doubleSided: true,
    },
    // Satin black: grilles, wheel spokes, lower trim. Duller than the paint, so the two separate.
    blackout: { color: 0x0b0c0b, metalness: 0.3, roughness: 0.62, doubleSided: true },
    // Carbon aero (splitter, skirts, diffuser, wing): glossy, a shade lighter than the paint.
    carbon: {
      color: 0x171a18,
      metalness: 0.5,
      roughness: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      doubleSided: true,
    },
    // Dark tinted glass: see-through enough to hint at the cabin, mirror-like enough to catch the room.
    glass: { color: 0x0a0d0e, metalness: 0.9, roughness: 0.04, opacity: 0.4, depthWrite: false },
    rim: { color: 0x141614, metalness: 0.9, roughness: 0.35 },
    tyre: { color: 0x090a09, metalness: 0, roughness: 0.95 },
    chrome: { color: 0x9aa39a, metalness: 1, roughness: 0.15 },
    // The headlights' LED strips, cool white; the tail lights red, the one colour off the palette,
    // because a car's tail lights read as red or not at all (2026-09-18).
    headlight: { color: 0xf4f8ff, emissive: 0xeaf2ff, emissiveIntensity: 4, overGlass: true },
    tailLight: { color: 0xff1a1a, emissive: 0xff1a1a, emissiveIntensity: 3 },
    tailBar: { color: 0xd01010, emissive: 0xff1a1a, emissiveIntensity: 1.2 },
    tailGlass: { color: 0x7a0c0c, metalness: 0.3, roughness: 0.05, opacity: 0.3 },
    reflector: { color: 0xa01010, emissive: 0xff1a1a, emissiveIntensity: 0.3, metalness: 0.2, roughness: 0.3 },
    // Details, so the car reads rich up close (2026-09-18): the "Supra" script in polished chrome, lime
    // calipers and wheel centres, the bumper lamps lit white and the diffuser's rain light lit lime.
    // The lime stays small and barely glowing: a lime sill line was tried and taken out as too loud.
    badge: { color: 0xd8dcd6, metalness: 1, roughness: 0.12 },
    caliper: { color: 0xc6ff00, emissive: 0xc6ff00, emissiveIntensity: 0.1, metalness: 0.2, roughness: 0.4 },
    hub: { color: 0xc6ff00, emissive: 0xc6ff00, emissiveIntensity: 0.1, metalness: 0.4, roughness: 0.35 },
    // Double-sided: one of the two lamps is a single surface facing inwards, and vanished from outside.
    lamp: { color: 0xf2f2ee, emissive: 0xf2f2ee, emissiveIntensity: 1.6, doubleSided: true },
    rainLight: { color: 0xc6ff00, emissive: 0xc6ff00, emissiveIntensity: 1.2 },
    // The page's line is "No number plate": the model's plate is not drawn.
    plate: { hidden: true },
    // A coarse copy of the shell, never drawn in the frame: the bloom uses it to hide the lamps behind
    // the body (scene/bloom.js; made by tools/model/optimize.mjs).
    occluder: { hidden: true },
  },

  // Contact shadows, so the car stands on the floor instead of floating over it (2026-09-18). The body's
  // pool is a share of the car's footprint; each tyre gets a tight, dark one where it touches down.
  shadows: {
    body: { length: 1.12, width: 1.24, strength: 0.95 },
    wheel: { material: 'neumático', length: 0.95, width: 0.6, strength: 1 },
  },

  // A pit box painted on the studio floor around the car: it gives the car a place to stand, and its
  // lines draw the floor's perspective (look lab, 2026-09-18). Metres, centred on the car.
  pitBox: {
    length: 5.8,
    width: 3.2,
    stroke: 0.08,
    lineColor: 0x8c918b,
    // Share of each side line that fades out at either end, so the lines never run under the text.
    fade: 0.38,
    // The stop mark ahead of the nose, in the page's lime.
    stop: { width: 0.14, share: 0.55, inset: 0.55, color: 0xc6ff00, glow: 0.35 },
  },

  // Which material names of the GLB map to which paint above; anything unlisted is paint
  // ('METALLIC CARPAINT - black.001'). Until 2026-09-18 the pipeline fused paint, blackout, carbon and
  // glass into 'WHEELARCH RUBBER - black' (tools/model/README.md), so the car could only be one colour.
  materialRoles: {
    glass: ['GLASS - windshield', 'Mirror'],
    rim: ['Llanta'],
    tyre: ['neumático'],
    carbon: ['CARBON FIBER 1x1 - default'],
    badge: ['Material.001'],
    caliper: ['DETAIL caliper'],
    reflector: ['Material.002'], // what is left of it once the calipers are split out: the rear reflectors
    // Split out of 'Material.003' by the model pipeline (tools/model/optimize.mjs, DETAILS).
    hub: ['DETAIL hub'],
    lamp: ['DETAIL fog light'],
    rainLight: ['DETAIL rain light'],
    plate: ['DETAIL plate'],
    occluder: ['OCCLUDER'],
    // Trim, wheel arches, and the parts only seen from below or inside the cabin.
    blackout: [
      'BLACKOUT',
      'WHEELARCH RUBBER - black',
      'Material.003',
      'Material.005',
      'a0000000-0000-0000-0000-000000000000',
      'DefaultMaterial',
    ],
    headlight: ['Luz blanca1'],
    tailBar: ['Material.004'],
    tailLight: ['DETAIL tail light'],
    tailGlass: ['DETAIL tail glass'],
    chrome: ['Cromado1'],
  },

  // Scene colours (hex), following the CSS tokens.
  colors: {
    background: 0x0a0b0a,
    ground: 0x0c0e0c,
    edge: 0xc6ff00, // the lit edges of the car
  },
};
