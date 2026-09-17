// Displays telemetry samples. Holds no simulation logic.

import { formatLapTime, formatSpeed } from '../lib/format.js';

/** @param {HTMLElement} root element containing the [data-hud] fields */
export function createTelemetryHud(root) {
  const field = (name) => root.querySelector(`[data-hud="${name}"]`);
  const speed = field('speed');
  const gear = field('gear');
  const sector = field('sector');
  const time = field('time');
  const summary = field('summary');

  /** @param {{ speed: number, gear: number, sector: number, elapsed: number }} sample */
  function update(sample) {
    setText(speed, formatSpeed(sample.speed));
    setText(gear, String(sample.gear));
    setText(sector, `S${sample.sector}`);
    setText(time, formatLapTime(sample.elapsed));
  }

  /** Screen-reader summary; the live digits themselves are aria-hidden. */
  function announce(lapTime) {
    summary.textContent = `Simulated lap completed in ${formatLapTime(lapTime)}.`;
  }

  return { update, announce };
}

function setText(node, text) {
  if (node.textContent !== text) node.textContent = text;
}
