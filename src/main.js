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
if (lap) initLapSection(lap, motion);

const specs = document.querySelector('.specs');
if (specs) initSpecCounters(specs, motion);

console.info(`[vulcan] mode=${mode}`, reasons);
