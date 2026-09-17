// Asphalt ribbon, grey edges, lime/white kerbs on tight corners only, and the start/finish line.

import { BoxGeometry, Color, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { kerbSamples } from '../../lib/centreline.js';
import { stripeAt } from '../../lib/ribbon.js';
import { createRibbonMesh } from './ribbonMesh.js';

const START_LINE_DEPTH = 2.5;

/**
 * @param {ReturnType<import('../../lib/centreline.js').createCentreline>} line
 * @param {typeof import('../../data/lapScene.js').default} lapScene
 */
export function createTrack(line, { track, colors }) {
  const half = track.width / 2;
  const group = new Group();

  group.add(
    createRibbonMesh(
      line,
      { offsetA: -half, offsetB: half, height: 0 },
      new MeshStandardMaterial({ color: colors.asphalt, roughness: 0.85 }),
    ),
  );

  for (const [offsetA, offsetB] of [
    [-half, -half + track.edgeWidth],
    [half - track.edgeWidth, half],
  ]) {
    group.add(createRibbonMesh(line, { offsetA, offsetB, height: 0.02 }, new MeshBasicMaterial({ color: colors.edge })));
  }

  const segments = kerbSamples(line, track.kerbRadius);
  const stripes = [new Color(colors.white).toArray(), new Color(colors.lime).toArray()];
  const colorAt = (sample) => stripes[stripeAt(sample, track.kerbStripe)];
  for (const [offsetA, offsetB] of [
    [-half - track.kerbWidth, -half],
    [half, half + track.kerbWidth],
  ]) {
    group.add(
      createRibbonMesh(
        line,
        { offsetA, offsetB, height: 0.03, segments, colorAt },
        new MeshBasicMaterial({ vertexColors: true }),
      ),
    );
  }

  const start = line.frameAt(0);
  const startLine = new Mesh(
    new BoxGeometry(START_LINE_DEPTH, 0.05, track.width),
    new MeshBasicMaterial({ color: colors.white }),
  );
  startLine.rotation.y = -Math.atan2(start.direction.z, start.direction.x);
  startLine.position.set(start.position.x, 0.04, start.position.z);
  group.add(startLine);

  return group;
}
