// The car marker: a glowing lime block with its own light (a procedural car was tested and rejected).

import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PointLight } from 'three';

/** @param {typeof import('../../data/lapScene.js').default.colors} colors */
export function createCar(colors) {
  const car = new Group();

  const body = new Mesh(new BoxGeometry(4.6, 1.1, 2.1), new MeshBasicMaterial({ color: colors.lime }));
  body.position.y = 0.8;
  car.add(body);

  const glow = new PointLight(colors.lime, 60, 40, 2);
  glow.position.y = 3;
  car.add(glow);

  return car;
}
