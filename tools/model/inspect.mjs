import { NodeIO } from '@gltf-transform/core';

const io = new NodeIO();
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();

let tris = 0, verts = 0;
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION');
    verts += pos ? pos.getCount() : 0;
    const idx = prim.getIndices();
    tris += (idx ? idx.getCount() : pos ? pos.getCount() : 0) / 3;
  }
}

const textures = root.listTextures().map((t) => `${t.getName() || '?'} ${t.getMimeType()} ${(t.getImage()?.byteLength / 1048576).toFixed(1)}MB`);

console.log('meshes    ', root.listMeshes().length);
console.log('nodes     ', root.listNodes().length);
console.log('materials ', root.listMaterials().map((m) => m.getName()).join(', '));
console.log('textures  ', textures.length ? textures.join('\n           ') : 'nenhuma');
console.log('triangles ', Math.round(tris).toLocaleString('pt-BR'));
console.log('vertices  ', verts.toLocaleString('pt-BR'));
