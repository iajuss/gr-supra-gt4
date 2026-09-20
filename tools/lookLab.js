// Look lab: renders the car under several paint/light variants, three camera shots each, side by side.
// Open http://localhost:5173/tools/lookLab.html?set=<name> with `npm run dev` running. Nothing is written.

import carStage from '../src/data/carStage.js';
import cameraShots from '../src/data/cameraShots.js';
import { createStage } from '../src/scene/stage.js';
import { createCar } from '../src/scene/car.js';
import { shotAt, smoothShotAt } from '../src/lib/math.js';
import { Color, MeshNormalMaterial, MeshPhysicalMaterial, SpotLight, Vector3 } from 'three';

// Close-ups for small parts (badges, lights, calipers), next to the page's chapter shots.
const CLOSE_UPS = [
  { id: 'headlight', position: { x: 3.6, y: 0.95, z: 1.6 }, target: { x: 1.95, y: 0.68, z: 0.62 }, fov: 26 },
  { id: 'nose', position: { x: 4.6, y: 0.9, z: 0.6 }, target: { x: 2.1, y: 0.55, z: 0 }, fov: 30 },
  { id: 'tail', position: { x: -4.6, y: 1.1, z: -0.6 }, target: { x: -2.1, y: 0.75, z: 0 }, fov: 30 },
  { id: 'wheel', position: { x: 1.5, y: 0.6, z: 3.2 }, target: { x: 1.35, y: 0.35, z: 0.9 }, fov: 30 },
];
const SHOTS = (new URLSearchParams(window.location.search).get('shots') ?? 'hero,aero,chassis').split(',');
const SIZE = { width: 960, height: 600 };

/** Deep-merges plain objects; arrays and values replace. */
function merge(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch ?? base;
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) out[key] = merge(base?.[key], value);
  return out;
}

/** Paints one material bright lime and everything else flat grey, to see which part it is. */
function highlight(name) {
  return (object) =>
    object.traverse((child) => {
      if (!child.isMesh) return;
      for (const material of [child.material].flat()) {
        const hit = material.name === name;
        material.color.set(hit ? 0xc6ff00 : 0x3a3d38);
        material.emissive?.set(hit ? 0x557700 : 0x000000);
        material.metalness = 0.2;
        material.roughness = 0.6;
        material.transparent = false;
        material.opacity = 1;
      }
    });
}

const BODY = 'WHEELARCH RUBBER - black';

/** Swaps the bodywork for a clear-coated paint: a second, sharp reflection layer that draws the volumes. */
function clearcoat({ color, metalness = 0.6, roughness = 0.4, stripe } = {}) {
  return (object) =>
    object.traverse((child) => {
      if (!child.isMesh || child.material.name !== BODY) return;
      const old = child.material;
      const paint = new MeshPhysicalMaterial({
        name: BODY,
        color: new Color(color ?? old.color),
        metalness,
        roughness,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        side: old.side,
      });
      if (stripe) livery(paint, stripe);
      child.material = paint;
    });
}

/**
 * Paints lime bands by position on the stage (metres, car centred at the origin, nose along +x, y up):
 * the bodywork is a single mesh, so there is no panel to repaint on its own.
 */
function livery(material, stripe) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.stripeColor = { value: new Color(0xc6ff00) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
varying vec3 vStage;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
vStage = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vStage;
uniform vec3 stripeColor;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
float stripeMask = (${stripe}) ? 1.0 : 0.0;
diffuseColor.rgb = mix(diffuseColor.rgb, stripeColor, stripeMask);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += stripeColor * stripeMask * 0.25;`);
  };
}

/** A cool white light from behind and to the side, to cut the car's outline out of the dark. */
function edgeLight(view) {
  const light = new SpotLight(0xdfe8ff, 90, 14, 0.5, 0.8, 2);
  light.position.set(4.5, 3.2, -4.5);
  light.target.position.set(0, 0.6, 0);
  view.scene.add(light, light.target);
}

const LIGHT = { lights: { environmentIntensity: 0.8 } };
const BLACK = { color: 0x0e100f, metalness: 0.2, roughness: 0.5 };
const GRAPHITE = { color: 0x272b2d, metalness: 0.5, roughness: 0.35 };
// Conditions in stage metres (car centred, nose +x, y up). Twin 10 cm bands over hood, roof and tail;
// a 6 cm line along the sills, between the wheel arches.
const CENTRE_STRIPE = 'abs(abs(vStage.z) - 0.13) < 0.05 && vStage.y > 0.6';
const SILL_STRIPE = 'abs(vStage.y - 0.3) < 0.03 && abs(vStage.x) < 0.8 && abs(vStage.z) > 0.7';

const SETS = {
  parts: [
    'METALLIC CARPAINT - black.001',
    'BLACKOUT',
    'CARBON FIBER 1x1 - default',
    'GLASS - windshield',
    'WHEELARCH RUBBER - black',
    'Material.002',
    'Material.005',
    'a0000000-0000-0000-0000-000000000000',
  ].map((name) => ({
    label: name.slice(0, 14),
    after: highlight(name),
  })),
  details: ['Cromado1', 'Material.001', 'azul', 'Material.004', 'Material.003', 'Mirror', 'Luz blanca1'].map((name) => ({
    label: name,
    after: highlight(name),
  })),
  page: [{ label: 'Página' }],
  led: [{ label: 'Página' }, { label: 'LED', after: highlight('Luz blanca1') }],
  lime: ['DETAIL rain light', 'DETAIL hub', 'Material.002', 'DETAIL fog light'].map((name) => ({ label: name, after: highlight(name) })),
  // The surface normals as colour: waves in the paint show up as blotches.
  normals: [
    { label: 'normais', after: (car) => car.traverse((child) => { if (child.isMesh && !child.material.isMeshBasicMaterial) child.material = new MeshNormalMaterial(); }) },
  ],
  // The page's own look (data/carStage.js), and the lime rim moved off the roof.
  // The page's own look (data/carStage.js) against a dimmer studio: the white procedural room is what
  // turns black paint grey. The lime rim is aimed at the tail, off the roof's double bubble.
  finish: [
    { label: 'Página hoje' },
    ...[0.8, 0.5, 0.3].map((environmentIntensity) => ({
      label: `ambiente ${environmentIntensity}`,
      config: { lights: { environmentIntensity, rim: { target: { x: -1.6, y: 0.9, z: 0 } } } },
    })),
  ],
  // Bloom on the car stage (Bloco 6): off, and three strengths. Best with ?shots=hero,headlight,tail.
  bloom: [
    // Selective (only the lamps feed it): a brightness threshold alone bloomed the clear coat's
    // highlights into milky blotches, even at 4.
    // 1.4 / 0.5 fogged the close-ups (a close headlight fills the frame) and was dropped.
    { label: 'Sem bloom', config: { bloom: false } },
    { label: 'A. mínimo', config: { bloom: { strength: 0.2, radius: 0.15, threshold: 0 } } },
    { label: 'B. suave', config: { bloom: { strength: 0.4, radius: 0.25, threshold: 0 } } },
    { label: 'C. médio', config: { bloom: { strength: 0.8, radius: 0.35, threshold: 0 } } },
  ],
  // The camera's path between the chapters, sampled where the two differ most: mid-move.
  // Use with ?shots=p:0.125,p:0.375,p:0.625,p:0.875 (progress along the whole list).
  path: [
    { label: 'Arco', path: shotAt },
    { label: 'Spline', path: smoothShotAt },
  ],
  look: [
    { label: 'Atual' },
    { label: 'A. Luz', config: LIGHT, after: (car, view) => { clearcoat(BLACK)(car); edgeLight(view); } },
    { label: 'B. Grafite', config: LIGHT, after: (car, view) => { clearcoat(GRAPHITE)(car); edgeLight(view); } },
    { label: 'C. + faixa', config: LIGHT, after: (car, view) => { clearcoat({ ...GRAPHITE, stripe: CENTRE_STRIPE })(car); edgeLight(view); } },
    { label: 'D. + soleira', config: LIGHT, after: (car, view) => { clearcoat({ ...GRAPHITE, stripe: SILL_STRIPE })(car); edgeLight(view); } },
  ],
};

/**
 * ?set=frame: where the car falls in each chapter's frame, as the page shows it (offset applied, 16:10),
 * in fractions of the frame width and height. Samples the car's vertices through the shot's camera.
 */
async function measureFraming() {
  const canvas = document.querySelector('#stage');
  const view = await createStage(canvas, carStage);
  const car = await createCar(carStage, { url: modelUrl });
  view.add(car.object3D);
  await sized(canvas, SIZE.width);
  car.object3D.updateMatrixWorld(true);

  const points = [];
  const vertex = new Vector3();
  car.object3D.traverse((child) => {
    if (!child.isMesh || child.material.isMeshBasicMaterial) return; // skip the contact shadow
    const position = child.geometry.attributes.position;
    const step = Math.max(1, Math.floor(position.count / 20000));
    for (let i = 0; i < position.count; i += step) {
      points.push(vertex.fromBufferAttribute(position, i).applyMatrix4(child.matrixWorld).clone());
    }
  });

  const ids = params.get('shots')?.split(',') ?? cameraShots.map((shot) => shot.id);
  for (const id of ids) {
    const shot = cameraShots.find((entry) => entry.id === id);
    view.setShot(shot);
    view.camera.updateMatrixWorld(true);
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    for (const point of points) {
      const ndc = point.clone().project(view.camera);
      left = Math.min(left, ndc.x); right = Math.max(right, ndc.x);
      top = Math.min(top, -ndc.y); bottom = Math.max(bottom, -ndc.y);
    }
    const fraction = (value) => ((value + 1) / 2).toFixed(3);
    say(`${id}: x ${fraction(left)}–${fraction(right)}, y ${fraction(top)}–${fraction(bottom)}`);
  }
  say('done');
}

const params = new URLSearchParams(window.location.search);
// ?model=<file in public/models> tries a candidate GLB without replacing the page's model.
const modelUrl = params.get('model') ? `/models/${params.get('model')}` : undefined;
// ?models=<a.glb,b.glb,…> compares candidate GLBs instead: one row each, dressed as on the page.
const models = params.get('models')?.split(',');
const variants = models
  ? models.map((file) => ({ label: file, model: `/models/${file}` }))
  : params.get('set') === 'frame'
    ? []
    : SETS[params.get('set') ?? 'parts'];
const grid = document.querySelector('#grid');
const log = document.querySelector('#log');
const say = (line) => (log.textContent += `\n${line}`);

function sized(element, cssWidth, tries = 120) {
  return new Promise((resolve, reject) => {
    const check = (left) => {
      if (element.width >= cssWidth) return resolve();
      if (left <= 0) return reject(new Error(`canvas never resized (still ${element.width}px)`));
      requestAnimationFrame(() => check(left - 1));
    };
    check(tries);
  });
}

const target = document.createElement('canvas');
target.width = SIZE.width;
target.height = SIZE.height;
const context = target.getContext('2d');

for (const variant of variants) {
  const config = merge(carStage, variant.config ?? {});
  const canvas = document.querySelector('#stage');
  const view = await createStage(canvas, config);
  const car = await createCar(config, { url: variant.model ?? modelUrl });
  variant.after?.(car.object3D, view);
  view.add(car.object3D);
  await view.activateBloom(); // as the page looks once open (a variant can turn it off: bloom false)
  await sized(canvas, SIZE.width);

  const row = document.createElement('div');
  row.className = 'row';
  row.style.gridTemplateColumns = `110px repeat(${SHOTS.length}, 1fr)`;
  row.innerHTML = `<b>${variant.label}</b>`;
  for (const id of SHOTS) {
    // `p:<0–1>` samples the camera's path itself, through the variant's own way of reading it.
    const shot = id.startsWith('p:')
      ? (variant.path ?? shotAt)(cameraShots, Number(id.slice(2)))
      : [...cameraShots, ...CLOSE_UPS].find((entry) => entry.id === id);
    view.setShot({ ...shot, offset: 0 });
    view.render();
    context.drawImage(canvas, 0, 0, SIZE.width, SIZE.height); // same tick as the render
    const image = new Image();
    image.src = target.toDataURL('image/jpeg', 0.85);
    row.append(image);
  }
  grid.append(row);
  say(`${variant.label}: ok`);

  car.dispose();
  view.dispose();
  // A fresh canvas for the next variant: a canvas keeps the WebGL context it was first given.
  const fresh = document.createElement('canvas');
  fresh.id = 'stage';
  canvas.replaceWith(fresh);
}

if (params.get('set') === 'frame') await measureFraming();
else say('done');
