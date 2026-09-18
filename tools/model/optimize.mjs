// FBX → GLB straight from the converter is 9450 meshes and 5.3M triangles.
// Merge by material, weld, simplify and compress, so the browser gets something it can draw.

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, flatten, join, weld, simplify, prune, draco } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';

const [input, output, ratio = '0.05', error = '0.001'] = process.argv.slice(2);

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

await step(doc, 'dedup', dedup());
await step(doc, 'flatten', flatten());
await step(doc, 'join', join({ keepNamed: false }));
await step(doc, 'weld', weld({ tolerance: 0.0001 }));
await step(doc, 'simplify', simplify({ simplifier: MeshoptSimplifier, ratio: Number(ratio), error: Number(error) }));
await step(doc, 'prune', prune());
await step(doc, 'draco', draco());

await io.write(output, doc);
console.log('escrito   ', output);
