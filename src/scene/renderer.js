// WebGL renderer factory shared by the 3D views (THE LAP now, the car stage in Bloco 4).

import { WebGLRenderer, ACESFilmicToneMapping } from 'three';

export const MAX_PIXEL_RATIO = 1.5;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {(width: number, height: number) => void} onResize called with the canvas CSS size (never 0)
 */
export function createRenderer(canvas, onResize) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.toneMapping = ACESFilmicToneMapping;

  const observer = new ResizeObserver(() => {
    const { width, height } = canvas.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    renderer.setSize(width, height, false);
    onResize(width, height);
  });
  observer.observe(canvas);

  return {
    renderer,
    dispose() {
      observer.disconnect();
      renderer.dispose();
    },
  };
}
