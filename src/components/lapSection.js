// THE LAP: builds the simulated lap and plays it on the canvas + HUD when the section comes into view.

import circuit from '../data/circuit.js';
import dynamics from '../data/vulcanDynamics.js';
import { projectCoordinates, measurePath, rotateStart } from '../lib/track.js';
import { createLapModel, sampleAtTime } from '../lib/telemetry.js';
import { createLapTrack } from './lapTrack.js';
import { createTelemetryHud } from './telemetryHud.js';

const LAP_DURATION_MS = 12_000;
const START_VISIBILITY = 0.5;

/**
 * @param {HTMLElement} root [data-lap] element
 * @param {{ reducedMotion: boolean }} options
 */
export function initLapSection(root, { reducedMotion }) {
  const metres = rotateStart(projectCoordinates(circuit.coordinates), circuit.startProgress);
  const model = createLapModel(measurePath(metres), { ...dynamics, sectorSplits: circuit.sectorSplits });
  const track = createLapTrack(root.querySelector('[data-lap-canvas]'), metres, {
    sectorSplits: circuit.sectorSplits,
  });
  const hud = createTelemetryHud(root);
  const replay = root.querySelector('[data-lap-replay]');
  let frame = 0;

  function showStart() {
    track.render(0);
    hud.update(sampleAtTime(model, 0));
  }

  function showFinish() {
    track.render(1);
    hud.update({ ...sampleAtTime(model, 0), elapsed: model.lapTime });
    hud.announce(model.lapTime);
  }

  function play() {
    cancelAnimationFrame(frame);
    const startedAt = performance.now();

    const tick = (now) => {
      const ratio = (now - startedAt) / LAP_DURATION_MS;
      if (ratio >= 1) {
        showFinish();
        return;
      }
      const sample = sampleAtTime(model, ratio * model.lapTime);
      track.render(sample.progress);
      hud.update(sample);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  if (reducedMotion) {
    replay.hidden = true;
    showFinish();
    return;
  }

  showStart();
  replay.addEventListener('click', play);

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      play();
    },
    { threshold: START_VISIBILITY },
  );
  observer.observe(root);
}
