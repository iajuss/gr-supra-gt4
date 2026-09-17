// THE LAP, full mode: the 3D stage with HUD, minimap, camera buttons and Restart over it.
// Loaded on demand (dynamic import) so Three.js never reaches lite devices.

import circuit from '../data/circuit.js';
import dynamics from '../data/vulcanDynamics.js';
import lapScene from '../data/lapScene.js';
import { buildLap } from '../lib/lap.js';
import { createCentreline } from '../lib/centreline.js';
import { measurePath } from '../lib/track.js';
import { sampleAtTime } from '../lib/telemetry.js';
import { createLapStage } from '../scene/lap/lapStage.js';
import { createLapTrack } from './lapTrack.js';
import { createTelemetryHud } from './telemetryHud.js';
import { createLapPlayer } from './lapPlayer.js';

// After a camera change on a stopped lap, keep rendering while the camera glides to its new rig.
const SETTLE_SECONDS = 1.5;

/** @param {HTMLElement} root [data-lap] element */
export function initLapSection3d(root) {
  const { metres, model } = buildLap(circuit, dynamics);
  const line = createCentreline(measurePath(metres), lapScene.track);

  const stage = createLapStage(root.querySelector('[data-lap-stage]'), line, lapScene);
  root.dataset.lapView = '3d';

  const minimap = createLapTrack(root.querySelector('[data-lap-canvas]'), metres, {
    sectorSplits: circuit.sectorSplits,
  });
  const hud = createTelemetryHud(root);
  const cameraButtons = [...root.querySelectorAll('[data-lap-camera]')];

  let current = { ...sampleAtTime(model, 0), progress: 0 };
  let settleFrame = 0;

  function show(sample, dt) {
    current = sample;
    stage.update(sample, dt);
    stage.render();
    hud.update(sample);
    minimap.render(sample.progress);
  }

  function showFinish() {
    show({ ...sampleAtTime(model, 0), progress: 1, elapsed: model.lapTime }, lapScene.maxStep);
    hud.announce(model.lapTime);
  }

  const player = createLapPlayer(root, {
    model,
    onFrame: show,
    onFinish: showFinish,
    onRestart() {
      hud.clear();
      stage.snapCamera();
    },
  });

  function settle() {
    cancelAnimationFrame(settleFrame);
    let last = performance.now();
    const until = last + SETTLE_SECONDS * 1000;
    const step = (now) => {
      if (player.running) return;
      const dt = Math.min(lapScene.maxStep, Math.max(0, (now - last) / 1000));
      last = now;
      show(current, dt);
      if (now < until) settleFrame = requestAnimationFrame(step);
    };
    settleFrame = requestAnimationFrame(step);
  }

  function setCamera(mode) {
    stage.setCamera(mode);
    cameraButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lapCamera === mode)));
    if (!player.running) settle();
  }

  cameraButtons.forEach((button) => button.addEventListener('click', () => setCamera(button.dataset.lapCamera)));
  root.querySelector('[data-lap-restart]').addEventListener('click', player.restart);

  setCamera(lapScene.cameras.initial);
  show(current, 0);
}
