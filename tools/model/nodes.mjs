import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(process.argv[2]);

const walk = (node, depth = 0) => {
  const s = node.getScale().map((v) => +v.toFixed(3));
  const t = node.getTranslation().map((v) => +v.toFixed(2));
  const mesh = node.getMesh();
  console.log(`${'  '.repeat(depth)}${node.getName() || '(sem nome)'} scale=${s.join(',')} pos=${t.join(',')}${mesh ? '  mesh: ' + (mesh.getName() || '?') : ''}`);
  for (const child of node.listChildren()) walk(child, depth + 1);
};

for (const scene of doc.getRoot().listScenes()) {
  console.log('cena:', scene.getName() || '(sem nome)');
  for (const node of scene.listChildren()) walk(node, 1);
}
