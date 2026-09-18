// The car: a GLB loaded at runtime, placed at real-world size and dressed in the page's own palette.
// The model arrives Z-up, in its own units and painted blue; everything here is about fixing that.

import { Box3, CanvasTexture, Color, DoubleSide, Group, LoadingManager, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import { fitToLength } from '../lib/fitModel.js';

const MODEL_URL = '/models/supra.glb';
const DRACO_PATH = '/draco/';

/** Which paint a material name gets; anything unlisted is bodywork. */
function roleOf(name, roles) {
  for (const [role, names] of Object.entries(roles)) {
    if (names.includes(name)) return role;
  }
  return 'body';
}

/** Repaints the loaded model in the page's palette: it arrives almost entirely off-white. */
function paintCar(model, { paint, materialRoles }) {
  const seen = new Set();

  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!material || seen.has(material.uuid)) continue;
      seen.add(material.uuid);

      const recipe = paint[roleOf(material.name, materialRoles)];
      material.color = new Color(recipe.color);
      if (recipe.metalness !== undefined) material.metalness = recipe.metalness;
      if (recipe.roughness !== undefined) material.roughness = recipe.roughness;
      if (recipe.emissive !== undefined) {
        material.emissive = new Color(recipe.emissive);
        material.emissiveIntensity = recipe.emissiveIntensity ?? 1;
      }
      if (recipe.opacity !== undefined && recipe.opacity < 1) {
        material.transparent = true;
        material.opacity = recipe.opacity;
      }
      material.needsUpdate = true;
    }
  });
}

/** A soft dark ellipse under the car: without it the car reads as floating over the studio floor. */
function buildContactShadow({ length, width }) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const geometry = new PlaneGeometry(length * 1.25, width * 1.5);
  geometry.rotateX(-Math.PI / 2);

  const material = new MeshBasicMaterial({
    map: new CanvasTexture(canvas),
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });

  return new Mesh(geometry, material);
}

/**
 * @param {typeof import('../data/carStage.js').default} config
 * @param {{ onProgress?: (ratio: number) => void, url?: string }} [options] url swaps the model (tools compare variants with it)
 * @returns {Promise<{
 *   object3D: import('three').Group,
 *   dimensions: { length: number, width: number, height: number },
 *   setVisible: (visible: boolean) => void,
 *   dispose: () => void,
 * }>}
 */
export async function createCar(config, { onProgress, url = MODEL_URL } = {}) {
  const { car } = config;

  const manager = new LoadingManager();
  if (onProgress) {
    manager.onProgress = (_url, loaded, total) => onProgress(total > 0 ? loaded / total : 0);
  }

  const draco = new DRACOLoader(manager).setDecoderPath(DRACO_PATH);
  const loader = new GLTFLoader(manager).setDRACOLoader(draco);

  const gltf = await loader.loadAsync(url);
  const model = gltf.scene;

  // FBX2glTF already rotates the Blender scene from Z-up to Y-up, so the car arrives upright with
  // its length along z. One quarter turn puts the nose along +x, which is what the camera shots assume.
  model.rotation.y = Math.PI / 2;
  paintCar(model, config);

  const object3D = new Group();
  object3D.add(model);

  const bounds = new Box3().setFromObject(object3D);
  const { scale, offset, size } = fitToLength({ min: bounds.min, max: bounds.max }, car.length);
  object3D.scale.setScalar(scale);
  object3D.position.set(offset.x, offset.y, offset.z);

  // The shadow is added after the fit and sized in metres, so the pool never drags the measurement.
  const shadow = buildContactShadow(size);
  shadow.position.y = 0.01 / scale;
  shadow.scale.setScalar(1 / scale);
  object3D.add(shadow);

  draco.dispose();

  return {
    object3D,
    dimensions: size,
    /** @param {boolean} visible */
    setVisible(visible) {
      object3D.visible = visible;
    },
    dispose() {
      shadow.material.map.dispose();
      object3D.traverse((child) => {
        if (!child.isMesh) return;
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) material.dispose();
      });
    },
  };
}
