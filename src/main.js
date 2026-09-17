import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/jetbrains-mono';
import './styles/main.css';

import { decideMode, detectEnvironment } from './lib/capabilities.js';
import { initLapSection } from './components/lapSection.js';

const env = detectEnvironment();
const { mode, reasons } = decideMode(env);
document.documentElement.dataset.mode = mode;

const lap = document.querySelector('[data-lap]');
if (lap) initLapSection(lap, { reducedMotion: env.reducedMotion });

console.info(`[vulcan] mode=${mode}`, reasons);
