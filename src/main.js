import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/jetbrains-mono';
import './styles/main.css';

import { decideMode, detectEnvironment } from './lib/capabilities.js';
import { initChapterShots } from './components/chapterShots.js';
import { initLapSection } from './components/lapSection.js';
import { initSpecCounters } from './components/specCounters.js';
import { initTextReveal } from './components/textReveal.js';

const env = detectEnvironment();
const { mode, reasons } = decideMode(env);
document.documentElement.dataset.mode = mode;

const motion = { reducedMotion: env.reducedMotion };

initTextReveal(document, motion);

const stage = document.querySelector('.stage');
if (mode === 'full' && stage) initStage(stage);
else initChapterShots(document);

const lap = document.querySelector('[data-lap]');
if (lap) initLap(lap);

const specs = document.querySelector('.specs');
if (specs) initSpecCounters(specs, motion);

console.info(`[vulcan] mode=${mode}`, reasons);

/** The fixed car stage, full mode only: Three.js is never fetched in lite. */
async function initStage(root) {
  try {
    const [{ createStage }, { createCar }, { default: carStage }, { default: cameraShots }] = await Promise.all([
      import('./scene/stage.js'),
      import('./scene/car.js'),
      import('./data/carStage.js'),
      import('./data/cameraShots.js'),
    ]);
    const view = createStage(root.querySelector('.stage__canvas'), carStage);
    const car = await createCar(carStage);
    view.add(car.object3D);

    // ?shot=<id> holds one chapter's framing, to check it on its own, instead of following the scroll.
    const requested = new URLSearchParams(window.location.search).get('shot');
    const frozen = cameraShots.find((shot) => shot.id === requested);
    if (frozen) {
      view.setShot(frozen);
      view.render();
      return;
    }

    const [{ createSmoothScroll }, { createCameraRig }] = await Promise.all([
      import('./lib/scroll.js'),
      import('./scene/cameraRig.js'),
    ]);
    createSmoothScroll();
    createCameraRig({
      shots: cameraShots,
      root: document,
      onShot(shot) {
        view.setShot(shot);
        view.requestRender();
      },
      onActive: view.setActive,
    });
  } catch (error) {
    // Bloco 4 step 4 turns this into the full lite fallback; for now the stage steps aside and the
    // chapters show their stills, so the page is never left without the car.
    console.warn('[vulcan] 3D stage unavailable', error);
    root.hidden = true;
    document.documentElement.dataset.mode = 'lite';
    initChapterShots(document);
  }
}

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
