import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/jetbrains-mono';
import './styles/tokens.css';
import './styles/base.css';

import { decideMode, detectEnvironment } from './lib/capabilities.js';

const { mode, reasons } = decideMode(detectEnvironment());
document.documentElement.dataset.mode = mode;

console.info(`[vulcan] mode=${mode}`, reasons);
