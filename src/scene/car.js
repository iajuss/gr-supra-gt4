// The car: a GLB loaded at runtime, placed at real-world size and dressed in the page's own palette.
// The model arrives Z-up, in its own units and painted blue; everything here is about fixing that.

import {
  Box3,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import { fitToLength } from '../lib/fitModel.js';
import { byteRatio } from '../lib/progress.js';
import { wheelContacts } from '../lib/wheelContacts.js';

const MODEL_URL = '/models/supra.glb';
const DRACO_PATH = '/draco/';

// The lights the ignition switches on (components/ignitionShow.js), by material role.
const FRONT_LIGHTS = ['headlight', 'lamp'];
const REAR_LIGHTS = ['tailLight', 'tailBar', 'reflector', 'rainLight'];

/** Which paint a material name gets; anything unlisted is bodywork. */
function roleOf(name, roles) {
  for (const [role, names] of Object.entries(roles)) {
    if (names.includes(name)) return role;
  }
  return 'body';
}

/**
 * The material a recipe paints: the loaded one, or a clear-coated replacement when the recipe asks for a
 * clear coat (the GLB's materials are standard, and only a physical material carries the coat).
 */
function paintMaterial(material, recipe) {
  if (recipe.hidden) {
    material.userData.hidden = true;
    return material;
  }

  const painted = recipe.clearcoat
    ? new MeshPhysicalMaterial({ name: material.name, clearcoat: recipe.clearcoat, clearcoatRoughness: recipe.clearcoatRoughness })
    : material;

  painted.color = new Color(recipe.color);
  if (recipe.metalness !== undefined) painted.metalness = recipe.metalness;
  if (recipe.roughness !== undefined) painted.roughness = recipe.roughness;
  if (recipe.emissive !== undefined) {
    painted.emissive = new Color(recipe.emissive);
    painted.emissiveIntensity = recipe.emissiveIntensity ?? 1;
  }
  if (recipe.doubleSided) painted.side = DoubleSide;
  if (recipe.opacity !== undefined && recipe.opacity < 1) {
    painted.transparent = true;
    painted.opacity = recipe.opacity;
  }
  // Glass that writes no depth, and lights drawn after it: the headlights' LEDs sit behind their lens
  // (fused with the windows' tinted glass) and read dim through it otherwise.
  if (recipe.depthWrite === false) painted.depthWrite = false;
  if (recipe.overGlass) {
    painted.transparent = true; // drawn in the transparent pass, after the glass
    painted.userData.renderOrder = 1;
  }
  painted.needsUpdate = true;

  if (painted !== material) material.dispose();
  return painted;
}

/** Repaints the loaded model in the page's palette: it arrives almost entirely off-white. */
function paintCar(model, { paint, materialRoles }) {
  const painted = new Map(); // shared materials are painted once, then reused by every mesh

  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;

    const dress = (material) => {
      if (!material) return material;
      if (!painted.has(material.uuid)) {
        const role = roleOf(material.name, materialRoles);
        const dressed = paintMaterial(material, paint[role]);
        dressed.userData.role = role;
        painted.set(material.uuid, dressed);
      }
      return painted.get(material.uuid);
    };
    child.material = Array.isArray(child.material) ? child.material.map(dress) : dress(child.material);
    // A part the page leaves out (the number plate) stays in the model but is never drawn.
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    if (materials.every((material) => material.userData.hidden)) child.visible = false;
    child.renderOrder = Math.max(0, ...materials.map((material) => material.userData.renderOrder ?? 0));
  });
}

/**
 * A soft dark ellipse on the floor, in metres. The car keeps a wide one under its body and a tight, dark
 * one under each tyre: without them it reads as floating over the studio floor.
 */
function buildShadow(length, width, strength) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgba(0, 0, 0, ${strength})`);
  gradient.addColorStop(0.55, `rgba(0, 0, 0, ${strength * 0.55})`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const geometry = new PlaneGeometry(length, width);
  geometry.rotateX(-Math.PI / 2);

  const material = new MeshBasicMaterial({
    map: new CanvasTexture(canvas),
    transparent: true,
    depthWrite: false,
  });

  return new Mesh(geometry, material);
}

/** The tyre vertices on the floor plane, in stage metres (a sample is plenty to find their centres). */
function tyrePoints(model, tyreMaterial) {
  const points = [];
  const vertex = new Vector3();
  model.traverse((child) => {
    if (!child.isMesh || child.material.name !== tyreMaterial) return;
    const position = child.geometry.attributes.position;
    const step = Math.max(1, Math.floor(position.count / 4000));
    for (let i = 0; i < position.count; i += step) {
      vertex.fromBufferAttribute(position, i).applyMatrix4(child.matrixWorld);
      points.push({ x: vertex.x, z: vertex.z });
    }
  });
  return points;
}

/**
 * @param {typeof import('../data/carStage.js').default} config
 * @param {{ onProgress?: (ratio: number | null) => void, url?: string }} [options]
 *   onProgress: share of the model's bytes downloaded (null if the size is unknown);
 *   url swaps the model (tools compare variants with it)
 * @returns {Promise<{
 *   object3D: import('three').Group,
 *   dimensions: { length: number, width: number, height: number },
 *   setVisible: (visible: boolean) => void,
 *   dispose: () => void,
 * }>}
 */
export async function createCar(config, { onProgress, url = MODEL_URL } = {}) {
  const { car } = config;

  const draco = new DRACOLoader().setDecoderPath(DRACO_PATH);
  const loader = new GLTFLoader().setDRACOLoader(draco);

  // Progress in bytes of the GLB itself: it is almost the whole download, while a LoadingManager
  // would only count files (GLB, Draco wrapper, Draco wasm) and jump in thirds.
  const gltf = await loader.loadAsync(url, onProgress && ((event) => onProgress(byteRatio(event))));
  const model = gltf.scene;

  // FBX2glTF already rotates the Blender scene from Z-up to Y-up, so the car arrives upright with
  // its length along z. One quarter turn puts the nose along +x, which is what the camera shots assume.
  model.rotation.y = Math.PI / 2;
  paintCar(model, config);

  // The model is fitted inside its own group; the shadows sit beside it in plain metres, so they never
  // drag the measurement and need no scale of their own.
  const fitted = new Group();
  fitted.add(model);
  const bounds = new Box3().setFromObject(fitted);
  const { scale, offset, size } = fitToLength({ min: bounds.min, max: bounds.max }, car.length);
  fitted.scale.setScalar(scale);
  fitted.position.set(offset.x, offset.y, offset.z);

  const object3D = new Group();
  object3D.add(fitted);
  object3D.updateMatrixWorld(true);

  const { body, wheel } = config.shadows;
  const shadows = [buildShadow(size.length * body.length, size.width * body.width, body.strength)];
  shadows[0].position.y = 0.012;
  for (const { x, z } of wheelContacts(tyrePoints(model, wheel.material))) {
    const pool = buildShadow(wheel.length, wheel.width, wheel.strength);
    pool.position.set(x, 0.014, z); // just above the body's pool, so the two never flicker
    shadows.push(pool);
  }
  object3D.add(...shadows);

  draco.dispose();

  // Each light as dressed (its glow and colour), to dim from.
  const lamps = new Map();
  object3D.traverse((child) => {
    if (!child.isMesh) return;
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      const { role } = material.userData;
      const front = FRONT_LIGHTS.includes(role);
      if (!front && !REAR_LIGHTS.includes(role)) continue;
      lamps.set(material, {
        front,
        glow: material.emissiveIntensity,
        on: material.color.clone(),
        off: new Color(front ? config.lightsOff.front : config.lightsOff.rear),
      });
    }
  });

  return {
    object3D,
    dimensions: size,
    /** @param {boolean} visible */
    setVisible(visible) {
      object3D.visible = visible;
    },
    /**
     * Dims the lights: 0 is off, 1 as dressed.
     * @param {{ front: number, rear: number }} levels
     */
    setLights({ front, rear }) {
      for (const [material, lamp] of lamps) {
        const level = lamp.front ? front : rear;
        material.emissiveIntensity = lamp.glow * level;
        material.color.lerpColors(lamp.off, lamp.on, level);
      }
    },
    dispose() {
      for (const shadow of shadows) shadow.material.map.dispose();
      object3D.traverse((child) => {
        if (!child.isMesh) return;
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) material.dispose();
      });
    },
  };
}
