import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/jetbrains-mono';
import './styles/main.css';

import { decideMode, detectEnvironment } from './lib/capabilities.js';
import { initLapSection } from './components/lapSection.js';
import { initSpecCounters } from './components/specCounters.js';
import { initTextReveal } from './components/textReveal.js';

const env = detectEnvironment();
const { mode, reasons } = decideMode(env);
document.documentElement.dataset.mode = mode;

const motion = { reducedMotion: env.reducedMotion };

initTextReveal(document, motion);

const lap = document.querySelector('[data-lap]');
if (lap) initLap(lap);

const specs = document.querySelector('.specs');
if (specs) initSpecCounters(specs, motion);

console.info(`[vulcan] mode=${mode}`, reasons);

/** Full mode loads the 3D lap on demand; lite, or any failure loading it, keeps the 2D lap. */
async function initLap(root) {
  if (mode === 'full') {
    try {
      const { initLapSection3d } = await import('./components/lapSection3d.js');
      initLapSection3d(root);
      return;
    } catch (error) {
      console.warn('[vulcan] 3D lap unavailable, using 2D', error);
      delete root.dataset.lapView;
    }
  }
  initLapSection(root, motion);
}
