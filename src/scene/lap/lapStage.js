// THE LAP in 3D: scene, cameras and bloom. Receives telemetry samples; owns no timing (see lapPlayer).

import { PerspectiveCamera, Scene, Vector2, Vector3 } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { cameraFov, cameraRig, followFactor, topCameraLook } from '../../lib/cameraRigs.js';
import { lerp } from '../../lib/math.js';
import { createRenderer } from '../renderer.js';
import { addEnvironment } from './environment.js';
import { createTrack } from './track.js';
import { createTrail } from './trail.js';
import { createCar } from './car.js';

const BLOOM = { strength: 0.9, radius: 0.45, threshold: 0.72 };

/**
 * @param {HTMLCanvasElement} canvas
 * @param {ReturnType<import('../../lib/centreline.js').createCentreline>} line
 * @param {typeof import('../../data/lapScene.js').default} lapScene
 */
export function createLapStage(canvas, line, lapScene) {
  const { cameras } = lapScene;
  const scene = new Scene();
  const camera = new PerspectiveCamera(cameras.fov, 1, 0.5, 8000);

  addEnvironment(scene, lapScene);
  scene.add(createTrack(line, lapScene));
  const trail = createTrail(line, lapScene);
  scene.add(...trail.meshes);
  const car = createCar(lapScene.colors);
  scene.add(car);

  let composer = null;
  let bloom = null;
  const { renderer, dispose } = createRenderer(canvas, (width, height) => {
    composer.setSize(width, height);
    bloom.resolution.set(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  });
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new Vector2(1, 1), BLOOM.strength, BLOOM.radius, BLOOM.threshold);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let mode = cameras.initial;
  let topBlend = mode === 'top' ? 1 : 0;
  let snap = true;
  const cameraPosition = new Vector3();
  const cameraTarget = new Vector3();

  /**
   * @param {{ progress: number, speed: number }} sample progress 1 = lap complete (full trail, car on the line)
   * @param {number} dt seconds since the previous update
   */
  function update({ progress, speed }, dt) {
    const frame = line.frameAt(progress);
    car.position.set(frame.position.x, 0, frame.position.z);
    car.rotation.y = -Math.atan2(frame.direction.z, frame.direction.x);

    const k = snap ? 1 : followFactor(dt, cameras.followRate);
    topBlend = lerp(topBlend, mode === 'top' ? 1 : 0, k);
    const look = topCameraLook(topBlend, lapScene.look);
    scene.fog.density = look.fogDensity;
    car.scale.setScalar(look.carScale);
    trail.update(progress >= 1 ? line.count : frame.index, look.topTrailOpacity);

    const rig = cameraRig(mode, frame, cameras);
    cameraPosition.lerp(rig.position, k);
    cameraTarget.lerp(rig.target, k);
    camera.position.copy(cameraPosition);
    camera.lookAt(cameraTarget);
    camera.fov = lerp(camera.fov, cameraFov(mode, speed, cameras), k);
    camera.updateProjectionMatrix();
    snap = false;
  }

  function render() {
    composer.render();
  }

  return {
    update,
    render,
    get mode() {
      return mode;
    },
    /** @param {'chase' | 'heli' | 'top'} next */
    setCamera(next) {
      mode = next;
    },
    /** Jump the camera to its rig on the next update instead of gliding (restart). */
    snapCamera() {
      snap = true;
    },
    dispose,
  };
}
