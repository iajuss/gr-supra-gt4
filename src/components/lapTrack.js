// Canvas 2D drawing of the circuit: ghost outline, sector ticks, start line, lime trail and car dot.

import {
  orientToBox,
  fitToBox,
  measurePath,
  sliceUntil,
  pointAt,
} from '../lib/track.js';

const MAX_DPR = 2;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ x: number, y: number }[]} metres closed loop in metres, starting at the start/finish line
 * @param {{ sectorSplits?: number[] }} [options]
 */
export function createLapTrack(canvas, metres, { sectorSplits = [] } = {}) {
  const ctx = canvas.getContext('2d');
  const colors = readColors();
  let path = null;
  let dpr = 1;
  let lastProgress = 0;

  function layout() {
    const { width, height } = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));

    const box = {
      width: canvas.width,
      height: canvas.height,
      padding: Math.min(canvas.width, canvas.height) * 0.08,
    };
    const { points } = orientToBox(metres, box);
    path = measurePath(fitToBox(points, box));
  }

  /** @param {number} progress lap progress in [0, 1] */
  function render(progress) {
    lastProgress = progress;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    strokePolyline(path.points, colors.ghost, 2 * dpr);
    sectorSplits.forEach((split) => drawTick(split, colors.muted, 1.5 * dpr, 10 * dpr));
    drawTick(0, colors.text, 3 * dpr, 18 * dpr);

    strokePolyline(sliceUntil(path, progress), colors.accent, 3 * dpr);
    drawDot(progress >= 1 ? 0 : progress);
  }

  function strokePolyline(points, color, width) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  /** Short line perpendicular to the track at a given progress. */
  function drawTick(progress, color, width, length) {
    const { x, y, angle } = pointAt(path, progress);
    const nx = Math.cos(angle + Math.PI / 2) * (length / 2);
    const ny = Math.sin(angle + Math.PI / 2) * (length / 2);
    ctx.beginPath();
    ctx.moveTo(x - nx, y - ny);
    ctx.lineTo(x + nx, y + ny);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function drawDot(progress) {
    const { x, y } = pointAt(path, progress);
    ctx.save();
    ctx.shadowColor = colors.accent;
    ctx.shadowBlur = 18 * dpr;
    ctx.beginPath();
    ctx.arc(x, y, 5 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = colors.accent;
    ctx.fill();
    ctx.restore();
  }

  const observer = new ResizeObserver(() => {
    layout();
    render(lastProgress);
  });
  observer.observe(canvas);
  layout();

  return {
    render,
    destroy: () => observer.disconnect(),
  };
}

function readColors() {
  const styles = getComputedStyle(document.documentElement);
  const token = (name) => styles.getPropertyValue(name).trim();
  return {
    accent: token('--color-accent'),
    text: token('--color-text'),
    muted: token('--color-muted'),
    ghost: token('--color-track-ghost'),
  };
}
