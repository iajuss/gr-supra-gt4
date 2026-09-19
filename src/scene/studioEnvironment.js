// The studio's reflections: a procedural room (RoomEnvironment) prefiltered by PMREM, nothing to download.
// PMREM's own shaders (the GGX filter above all) take ~0.5 s to compile, which used to block the main
// thread in one long task at load. They are compiled asynchronously first, so fromScene() only reuses them.

import { Mesh, NoToneMapping, OrthographicCamera, PerspectiveCamera, PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const SIGMA = 0.04;
// fromScene's defaults: the room is compiled against the same camera setup and target it renders into.
const SIZE = 256;
const NEAR = 0.1;
const FAR = 100;

/**
 * Compiles every shader fromScene() will use without blocking (KHR_parallel_shader_compile).
 * Relies on PMREMGenerator internals (three r186); if they change, it skips and fromScene() compiles
 * them itself, blocking but still correct.
 * @param {import('three').WebGLRenderer} renderer
 * @param {PMREMGenerator} pmrem
 * @param {import('three').Scene} room
 */
async function precompile(renderer, pmrem, room) {
  if (typeof pmrem._setSize !== 'function' || typeof pmrem._allocateTargets !== 'function') return;

  pmrem._setSize(SIZE);
  const target = pmrem._allocateTargets(); // also creates the blur and GGX materials fromScene reuses
  const filters = [pmrem._blurMaterial, pmrem._ggxMaterial].filter(Boolean);
  const lodGeometry = pmrem._lodMeshes?.[0]?.geometry;
  if (filters.length < 2 || !lodGeometry) {
    target.dispose();
    return;
  }

  // The filters are compiled on the geometry they draw with: ANGLE (D3D11) builds the final shader for
  // the vertex layout, so an empty geometry would compile a variant that the first draw throws away.
  const filterMeshes = filters.map((material) => new Mesh(lodGeometry, material));

  // Programs depend on the render target (colour space, tone mapping): compile against the one
  // fromScene renders into, with tone mapping off as it has while drawing the room.
  const previousTarget = renderer.getRenderTarget();
  const previousToneMapping = renderer.toneMapping;
  renderer.setRenderTarget(target);
  renderer.toneMapping = NoToneMapping;
  const pending = [
    renderer.compileAsync(room, new PerspectiveCamera(90, 1, NEAR, FAR)),
    ...filterMeshes.map((mesh) => renderer.compileAsync(mesh, new OrthographicCamera())),
  ];
  renderer.toneMapping = previousToneMapping;
  renderer.setRenderTarget(previousTarget);

  await Promise.all(pending);
  target.dispose();
}

/**
 * @param {import('three').WebGLRenderer} renderer
 * @returns {Promise<import('three').WebGLRenderTarget>} its .texture goes to scene.environment
 */
export async function createStudioEnvironment(renderer) {
  const room = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  await precompile(renderer, pmrem, room);
  const environment = pmrem.fromScene(room, SIGMA, NEAR, FAR, { size: SIZE });
  pmrem.dispose();
  room.dispose();
  return environment;
}
