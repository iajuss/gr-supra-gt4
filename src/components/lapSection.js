// THE LAP, lite mode: the simulated lap played on the 2D canvas + HUD when the section comes into view.

import circuit from '../data/circuit.js';
import dynamics from '../data/vulcanDynamics.js';
import { buildLap } from '../lib/lap.js';
import { sampleAtTime } from '../lib/telemetry.js';
import { createLapTrack } from './lapTrack.js';
import { createTelemetryHud } from './telemetryHud.js';
import { createLapPlayer } from './lapPlayer.js';

/**
 * @param {HTMLElement} root [data-lap] element
 * @param {{ reducedMotion: boolean }} options
 */
export function initLapSection(root, { reducedMotion }) {
  const { metres, model } = buildLap(circuit, dynamics);
  const track = createLapTrack(root.querySelector('[data-lap-canvas]'), metres, {
    sectorSplits: circuit.sectorSplits,
  });
  const hud = createTelemetryHud(root);
  const restart = root.querySelector('[data-lap-restart]');

  function showFinish() {
    track.render(1);
    hud.update({ ...sampleAtTime(model, 0), elapsed: model.lapTime });
    hud.announce(model.lapTime);
  }

  if (reducedMotion) {
    restart.hidden = true;
    showFinish();
    return;
  }

  track.render(0);
  hud.update(sampleAtTime(model, 0));

  const player = createLapPlayer(root, {
    model,
    onFrame(sample) {
      track.render(sample.progress);
      hud.update(sample);
    },
    onFinish: showFinish,
    onRestart: hud.clear,
  });
  restart.addEventListener('click', player.restart);
}
