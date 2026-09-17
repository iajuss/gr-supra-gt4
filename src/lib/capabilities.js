// Decides between the full 3D experience and the lightweight fallback.
// See docs/design.md → "Estratégia de dispositivos".

export const MIN_FULL_WIDTH = 1024;

const RULES = [
  ['no-webgl', (env) => !env.webgl],
  ['reduced-motion', (env) => env.reducedMotion],
  ['coarse-pointer', (env) => env.coarsePointer],
  ['narrow-viewport', (env) => env.viewportWidth < MIN_FULL_WIDTH],
  ['save-data', (env) => env.saveData],
];

/**
 * @param {{ webgl: boolean, reducedMotion: boolean, coarsePointer: boolean,
 *           viewportWidth: number, saveData: boolean }} env
 * @returns {{ mode: 'full' | 'lite', reasons: string[] }}
 */
export function decideMode(env) {
  const reasons = RULES.filter(([, applies]) => applies(env)).map(([reason]) => reason);
  return { mode: reasons.length ? 'lite' : 'full', reasons };
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Reads the current browser environment. Thin wrapper, verified in the browser. */
export function detectEnvironment(win = window) {
  return {
    webgl: hasWebGL(),
    reducedMotion: win.matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer: win.matchMedia('(pointer: coarse)').matches,
    viewportWidth: win.innerWidth,
    saveData: Boolean(win.navigator.connection?.saveData),
  };
}
