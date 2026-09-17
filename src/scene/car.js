// The car on the stage. Until Bloco 4 step 5 it is a proxy box in the Vulcan's dimensions;
// the real GLB will replace the body behind this same interface.

import {
  BoxGeometry,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
} from 'three';

import { fitToLength } from '../lib/fitModel.js';

// The proxy pretends to be authored in centimetres and off the ground, so the fit does real work.
const PROXY_UNITS_PER_METRE = 100;
const PROXY_LIFT = 60;

/**
 * @param {typeof import('../data/carStage.js').default} config
 * @returns {Promise<{
 *   object3D: import('three').Group,
 *   dimensions: { length: number, width: number, height: number },
 *   setVisible: (visible: boolean) => void,
 *   dispose: () => void,
 * }>}
 */
export async function createCar(config) {
  const { car, colors } = config;

  const geometry = new BoxGeometry(
    car.length * PROXY_UNITS_PER_METRE,
    car.height * PROXY_UNITS_PER_METRE,
    car.width * PROXY_UNITS_PER_METRE,
  );
  geometry.translate(0, car.height * PROXY_UNITS_PER_METRE / 2 + PROXY_LIFT, 0);

  const material = new MeshStandardMaterial({ color: colors.proxy, roughness: 0.4, metalness: 0.2 });
  const body = new Mesh(geometry, material);

  const edgesGeometry = new EdgesGeometry(geometry);
  const edgesMaterial = new LineBasicMaterial({ color: colors.proxyEdge });
  const edges = new LineSegments(edgesGeometry, edgesMaterial);

  const object3D = new Group();
  object3D.add(body, edges);

  // Same path the GLB will take: measure what the author gave us, then place it at real size.
  geometry.computeBoundingBox();
  const { scale, offset, size } = fitToLength(geometry.boundingBox, car.length);
  object3D.scale.setScalar(scale);
  object3D.position.set(offset.x, offset.y, offset.z);

  return {
    object3D,
    dimensions: size,
    /** @param {boolean} visible */
    setVisible(visible) {
      object3D.visible = visible;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      edgesGeometry.dispose();
      edgesMaterial.dispose();
    },
  };
}
