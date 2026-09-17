// Trail behind the car: a thin dim line for chase/heli and a wide full-lime one that fades in for the top camera.

import { MeshBasicMaterial } from 'three';
import { indexCountUntil } from '../../lib/ribbon.js';
import { createRibbonMesh } from './ribbonMesh.js';

/**
 * @param {ReturnType<import('../../lib/centreline.js').createCentreline>} line
 * @param {typeof import('../../data/lapScene.js').default} lapScene
 */
export function createTrail(line, { track, look, colors }) {
  const thin = createRibbonMesh(
    line,
    { offsetA: -track.trailWidth / 2, offsetB: track.trailWidth / 2, height: 0.06 },
    new MeshBasicMaterial({ color: colors.trail }),
  );
  const wide = createRibbonMesh(
    line,
    { offsetA: -look.topTrailWidth / 2, offsetB: look.topTrailWidth / 2, height: 0.08 },
    new MeshBasicMaterial({ color: colors.lime, transparent: true, opacity: 0, depthWrite: false }),
  );
  wide.visible = false;

  return {
    meshes: [thin, wide],

    /**
     * @param {number} sample last sample reached (use line.count for the full lap)
     * @param {number} topOpacity 0–1
     */
    update(sample, topOpacity) {
      const count = indexCountUntil(sample);
      thin.geometry.setDrawRange(0, count);
      wide.geometry.setDrawRange(0, count);
      wide.material.opacity = topOpacity;
      wide.visible = topOpacity > 0.01;
    },
  };
}
