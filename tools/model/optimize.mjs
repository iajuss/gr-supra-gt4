// FBX → GLB straight from the converter is 9450 meshes and 5.3M triangles.
// Merge by material, weld, simplify and compress, so the browser gets something it can draw.
// The bodywork is simplified gently and with its normals weighted in: simplified on positions alone,
// even gently, the glossy paint wrinkled.

import { NodeIO, PropertyType } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, flatten, join, weld, simplifyPrimitive, compactPrimitive, prune, draco } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';

// The bodywork materials, kept out of the general simplify: it ignores the normals, so collapsing glossy
// panels left shading dents all over the paint. They used to be one material (see the dedup step below).
const BODYWORK = [
  'METALLIC CARPAINT - black.001',
  'BLACKOUT',
  'CARBON FIBER 1x1 - default',
  'WHEELARCH RUBBER - black',
  'GLASS - windshield',
].join(',');

// The bodywork's own pass: half the triangles, with the normals weighing as much as the positions, so
// the reflections stay smooth. Chosen side by side in tools/lookLab.html?models= (2026-09-19): at 30%
// it looked the same, at 20% the hood and the boot lid wrinkled; the user kept this, the safest.
const BODYWORK_SIMPLIFY = { ratio: 0.5, error: 0.001, normalWeight: 1 };

const [input, output, ratio = '0.05', error = '0.001', keep = BODYWORK] = process.argv.slice(2);
// Materials kept out of the general simplify (they get the bodywork's pass instead), comma-separated.
const keepIntact = keep.split(',').map((name) => name.trim()).filter(Boolean);

/** Simplifies one primitive weighing its normals as well as its positions, then drops unused vertices. */
function simplifyKeepingNormals(prim, { ratio, error, normalWeight }) {
  const positions = prim.getAttribute('POSITION').getArray();
  const normals = prim.getAttribute('NORMAL').getArray();
  const accessor = prim.getIndices();
  const indices = new Uint32Array(accessor.getArray());
  const target = Math.floor((indices.length * ratio) / 3) * 3;
  const weights = [normalWeight, normalWeight, normalWeight];
  const [kept] = MeshoptSimplifier.simplifyWithAttributes(indices, positions, 3, normals, 3, weights, null, target, error);
  accessor.setArray(kept);
  compactPrimitive(prim);
}

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule(),
  });

const count = (doc) => {
  let tris = 0;
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      const pos = prim.getAttribute('POSITION');
      tris += (idx ? idx.getCount() : pos ? pos.getCount() : 0) / 3;
    }
  return { tris: Math.round(tris), meshes: doc.getRoot().listMeshes().length };
};

const step = async (doc, label, fn) => {
  const started = Date.now();
  await doc.transform(fn);
  const { tris, meshes } = count(doc);
  console.log(`${label.padEnd(10)} ${meshes.toString().padStart(6)} malhas  ${tris.toLocaleString('pt-BR').padStart(11)} tris  ${((Date.now() - started) / 1000).toFixed(1)}s`);
};

const doc = await io.read(input);
console.log('início    ', JSON.stringify(count(doc)));

// The FBX carries the author's whole render scene: a studio backdrop ("Cylinder", scaled ~7400x)
// and a camera. Anything that huge is scenery, not car, and it wrecks the bounding box.
// The converter nests everything under a root node, so this walks every node, not just the top level.
let dropped = 0;
for (const node of doc.getRoot().listNodes()) {
  const scale = node.getScale();
  const huge = Math.max(...scale) > 1000;
  const isCamera = !!node.getCamera() || /^camera/i.test(node.getName());
  if (!huge && !isCamera) continue;
  console.log(`removido   ${node.getName() || '(sem nome)'} scale=${scale.map((v) => v.toFixed(0)).join(',')}`);
  node.getMesh()?.dispose();
  node.dispose();
  dropped++;
}
console.log(`cenário    ${dropped} nós removidos`);

// Small parts that share a catch-all material in the FBX ('Material.003') but get a finish of their own on
// the page: each gets its own material here, before the meshes are joined by material. Node names from
// the author's FBX (found with parts listed by position, 2026-09-18).
const DETAILS = {
  'DETAIL plate': ['Plane.1303'], // rear number plate: the page's car has none ("No number plate")
  'DETAIL rain light': ['Plane.6072'], // the light at the centre of the diffuser
  'DETAIL fog light': ['Plane.1747', 'Plane.1762'], // the lamps in the front bumper
  'DETAIL hub': [
    'Exported_from_Blender-3.5.284',
    'Exported_from_Blender-3.5.610',
    'Exported_from_Blender-3.5.788',
    'Exported_from_Blender-3.5.1114',
  ], // wheel centre caps
  // The tail light clusters: the left one sits in 'a0000…', the right one in 'Llanta' (the rims' material).
  'DETAIL tail light': [
    'Plane.2056',
    'Plane.2058',
    'Plane.2060',
    'Plane.2061',
    'Plane.2057',
    'Plane.2059',
    'Plane.2062',
    'Plane.2063',
  ],
  'DETAIL tail glass': ['Plane.1314'], // the tail lights' lens, fused with the windscreen's glass
  // The brake calipers; the rest of their material ('Material.002') is the rear bumper's reflectors.
  'DETAIL caliper': [
    'Exported_from_Blender-3.5.308',
    'Exported_from_Blender-3.5.634',
    'Exported_from_Blender-3.5.764',
    'Exported_from_Blender-3.5.1090',
  ],
};

const detailOf = new Map(Object.entries(DETAILS).flatMap(([material, nodes]) => nodes.map((node) => [node, material])));
const detailMaterials = new Map();
let detailed = 0;
for (const node of doc.getRoot().listNodes()) {
  const name = detailOf.get(node.getName());
  const mesh = node.getMesh();
  if (!name || !mesh) continue;
  for (const prim of mesh.listPrimitives()) {
    if (!detailMaterials.has(name)) detailMaterials.set(name, prim.getMaterial().clone().setName(name));
    prim.setMaterial(detailMaterials.get(name));
  }
  detailed++;
}
console.log(`detalhes  ${detailed} nós com material próprio`);

// Materials are left out of dedup on purpose: the converter gives every material the same values, so
// deduplicating them fused paint, blackout trim, carbon and glass into one ("WHEELARCH RUBBER"), and the
// page could only paint the car in a single colour (found 2026-09-18).
await step(doc, 'dedup', dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }));
await step(doc, 'flatten', flatten());
await step(doc, 'join', join({ keepNamed: false }));
await step(doc, 'weld', weld({ tolerance: 0.0001 }));
await MeshoptSimplifier.ready;
await step(doc, 'simplify', (document) => {
  for (const mesh of document.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) {
      if (keepIntact.includes(prim.getMaterial()?.getName())) {
        simplifyKeepingNormals(prim, BODYWORK_SIMPLIFY);
        continue;
      }
      simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: Number(ratio), error: Number(error) });
    }
});
await step(doc, 'prune', prune());
await step(doc, 'draco', draco());

await io.write(output, doc);
console.log('escrito   ', output);
