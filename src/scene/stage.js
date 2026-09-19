// The car stage: dark studio floor, lights, procedural environment and a still camera.
// Renders on demand (no loop yet); the scroll timeline takes over in Bloco 4 step 3.

import {
  Color,
  DirectionalLight,
  FogExp2,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SpotLight,
  Vector3,
} from 'three';

import { easeOutCubic } from '../lib/counter.js';
import { lerp, offsetTarget } from '../lib/math.js';
import { createRenderer } from './renderer.js';
import { createStudioEnvironment } from './studioEnvironment.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {typeof import('../data/carStage.js').default} config
 */
export async function createStage(canvas, config) {
  const { colors, lights, ground: groundConfig, camera: cameraConfig, fog } = config;

  const scene = new Scene();
  scene.background = new Color(colors.background);
  scene.fog = new FogExp2(colors.background, fog.density);

  const camera = new PerspectiveCamera(cameraConfig.fov, 1, cameraConfig.near, cameraConfig.far);
  const target = new Vector3();
  let currentShot = null; // re-applied on resize: the sideways offset depends on the aspect ratio

  const { renderer, dispose: disposeRenderer } = createRenderer(canvas, (width, height) => {
    camera.aspect = width / height;
    if (currentShot) setShot(currentShot);
    else camera.updateProjectionMatrix();
    requestRender();
  });

  const rig = new Group();
  for (const key of ['key', 'fill']) {
    const { color, intensity, position } = lights[key];
    const light = new DirectionalLight(color, intensity);
    light.position.set(position.x, position.y, position.z);
    rig.add(light);
  }

  const rimConfig = lights.rim;
  const rim = new SpotLight(
    rimConfig.color,
    rimConfig.intensity,
    rimConfig.distance,
    rimConfig.angle,
    rimConfig.penumbra,
    rimConfig.decay,
  );
  rim.position.set(rimConfig.position.x, rimConfig.position.y, rimConfig.position.z);
  rim.target.position.set(rimConfig.target.x, rimConfig.target.y, rimConfig.target.z);
  rig.add(rim, rim.target);

  const groundGeometry = new PlaneGeometry(groundConfig.size, groundConfig.size);
  const groundMaterial = new MeshStandardMaterial({
    color: colors.ground,
    roughness: groundConfig.roughness,
    metalness: groundConfig.metalness,
  });
  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  rig.add(ground);

  scene.add(rig);

  function render() {
    renderer.render(scene, camera);
  }

  // Nothing here animates on its own: a frame is drawn only after something changes, and only
  // while the stage is active (the 3D zone on screen) and the tab in the foreground.
  let active = true;
  let ready = false; // no frame before the environment exists: it would compile shaders only to discard them
  let frame = 0;

  function requestRender() {
    if (frame || !ready || !active || document.hidden) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      render();
    });
  }

  function cancelFrame() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  /** @param {boolean} next */
  function setActive(next) {
    active = next;
    if (active) requestRender();
    else cancelFrame();
  }

  const onVisibility = () => (document.hidden ? cancelFrame() : requestRender());
  document.addEventListener('visibilitychange', onVisibility);

  /**
   * Points the camera at a shot (or anything lerpShot returns).
   * @param {Parameters<typeof offsetTarget>[0]} shot
   */
  function setShot(shot) {
    currentShot = shot;
    const look = offsetTarget(shot, camera.aspect);
    camera.position.set(shot.position.x, shot.position.y, shot.position.z);
    target.set(look.x, look.y, look.z);
    camera.lookAt(target);
    camera.fov = shot.fov;
    camera.updateProjectionMatrix();
  }

  /**
   * Compiles the shaders an object needs (the whole scene by default) before its first frame, off the
   * main thread where the browser supports parallel compilation, so that frame does not block on them.
   * @param {import('three').Object3D} [object]
   */
  function prepare(object = scene) {
    return renderer.compileAsync(object, camera, scene);
  }

  let revealFrame = 0;

  /** Thickens the fog until the car disappears into it (before it is ready to be seen). */
  function veil() {
    cancelAnimationFrame(revealFrame);
    scene.fog.density = fog.veiled;
    requestRender();
  }

  /**
   * Thins the fog back to normal, so the car emerges from the dark.
   * @param {{ instant?: boolean }} [options] instant for reduced motion
   */
  function reveal({ instant = false } = {}) {
    cancelAnimationFrame(revealFrame);
    const from = scene.fog.density;
    const startedAt = performance.now();
    const step = (now) => {
      const progress = instant ? 1 : (now - startedAt) / fog.revealMs;
      scene.fog.density = lerp(from, fog.density, easeOutCubic(progress));
      requestRender();
      if (progress < 1) revealFrame = requestAnimationFrame(step);
    };
    revealFrame = requestAnimationFrame(step);
  }

  // A procedural room stands in for an HDRI: soft reflections with nothing to download. Built last, as it
  // is the one step that waits: everything the resize callback touches is in place by then.
  const environment = await createStudioEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = lights.environmentIntensity;
  ready = true;

  return {
    scene,
    camera,
    prepare,
    setShot,
    veil,
    reveal,
    /** @param {import('three').Object3D} object */
    add(object) {
      scene.add(object);
    },
    render,
    requestRender,
    setActive,
    dispose() {
      cancelFrame();
      cancelAnimationFrame(revealFrame);
      document.removeEventListener('visibilitychange', onVisibility);
      disposeRenderer();
      environment.dispose();
      groundGeometry.dispose();
      groundMaterial.dispose();
    },
  };
}
