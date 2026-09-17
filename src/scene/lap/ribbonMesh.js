// Turns the raw ribbon buffers (lib/ribbon.js) into a Three.js mesh.

import { BufferAttribute, BufferGeometry, DoubleSide, Mesh } from 'three';
import { buildRibbon } from '../../lib/ribbon.js';

/**
 * @param {Parameters<typeof buildRibbon>[0]} line
 * @param {Parameters<typeof buildRibbon>[1]} options
 * @param {import('three').Material} material
 */
export function createRibbonMesh(line, options, material) {
  const { positions, indices, colors } = buildRibbon(line, options);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  if (colors) geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  material.side = DoubleSide;
  return new Mesh(geometry, material);
}
