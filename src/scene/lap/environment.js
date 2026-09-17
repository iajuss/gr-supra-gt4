// Dark ground with a racing-green grid, lights and fog.

import {
  Color,
  DirectionalLight,
  FogExp2,
  GridHelper,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';

const GROUND_SIZE = 8000;
const GRID_DIVISIONS = 160;

/**
 * @param {import('three').Scene} scene
 * @param {typeof import('../../data/lapScene.js').default} lapScene
 */
export function addEnvironment(scene, { colors, look }) {
  scene.background = new Color(colors.background);
  scene.fog = new FogExp2(colors.background, look.fogDensity);

  const group = new Group();
  group.add(new HemisphereLight(0x9aa39a, 0x050605, 0.6));

  const sun = new DirectionalLight(0xffffff, 1.2);
  sun.position.set(-400, 600, 300);
  group.add(sun);

  const ground = new Mesh(
    new PlaneGeometry(GROUND_SIZE, GROUND_SIZE),
    new MeshStandardMaterial({ color: colors.ground, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.2;
  group.add(ground);

  const grid = new GridHelper(GROUND_SIZE, GRID_DIVISIONS, colors.grid, colors.grid);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  grid.position.y = -0.1;
  group.add(grid);

  scene.add(group);
}
