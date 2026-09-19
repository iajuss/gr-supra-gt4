import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/jetbrains-mono';
import './styles/main.css';

import { decideMode, detectEnvironment } from './lib/capabilities.js';
import engineSound from './data/engineSound.js';
import { initChapterShots } from './components/chapterShots.js';
import { createEngineSound } from './components/engineSound.js';
import { initLapSection } from './components/lapSection.js';
import { createPreloader } from './components/preloader.js';
import { openSoundGate } from './components/soundGate.js';
import { initSpecCounters } from './components/specCounters.js';
import { initTextReveal } from './components/textReveal.js';
import { whenNear } from './lib/whenNear.js';

const env = detectEnvironment();
const { mode, reasons } = decideMode(env);
document.documentElement.dataset.mode = mode;

const motion = { reducedMotion: env.reducedMotion };

initTextReveal(document, motion);

// Both modes open through the sound screen, once there is nothing left to wait for.
const preloaderRoot = document.querySelector('.preloader');
const preloader = createPreloader(preloaderRoot, motion);
const engine = createEngineSound(engineSound);
preloader.ready.then(() => {
  engine.preload();
  openSoundGate(preloaderRoot.querySelector('.gate'), {
    surface: preloaderRoot,
    onChoice(choice) {
      if (choice === 'sound') engine.play();
      preloader.close();
    },
  });
});

const stage = document.querySelector('.stage');
if (mode === 'full' && stage) initStage(stage);
else {
  initChapterShots(document);
  preloader.finish(); // lite loads nothing up front
}

const lap = document.querySelector('[data-lap]');
if (lap) initLap(lap);

const specs = document.querySelector('.specs');
if (specs) initSpecCounters(specs, motion);

console.info(`[supra] mode=${mode}`, reasons);

/** The fixed car stage, full mode only: Three.js is never fetched in lite. */
async function initStage(root) {
  try {
    const [{ createStage }, { createCar }, { default: carStage }, { default: cameraShots }] = await Promise.all([
      import('./scene/stage.js'),
      import('./scene/car.js'),
      import('./data/carStage.js'),
      import('./data/cameraShots.js'),
    ]);
    const view = await createStage(root.querySelector('.stage__canvas'), carStage);
    await view.prepare();
    view.veil();
    const car = await createCar(carStage, { onProgress: preloader.setProgress });
    await view.prepare(car.object3D);
    view.add(car.object3D);

    // The car is on stage: the sound screen can take over, and the car emerges once the page opens
    // (at once if the visitor is already in, after the slow-line timeout).
    const showCar = () => {
      preloader.finish();
      preloader.closed.then(() => view.reveal({ instant: motion.reducedMotion }));
    };

    // ?shot=<id> holds one chapter's framing, to check it on its own, instead of following the scroll.
    const requested = new URLSearchParams(window.location.search).get('shot');
    const frozen = cameraShots.find((shot) => shot.id === requested);
    if (frozen) {
      view.setShot(frozen);
      showCar();
      return;
    }

    const [{ createSmoothScroll }, { createCameraRig }, { createLapCurtain }] = await Promise.all([
      import('./lib/scroll.js'),
      import('./scene/cameraRig.js'),
      import('./components/lapCurtain.js'),
    ]);
    createSmoothScroll();
    createLapCurtain(document.querySelector('.lap'));
    createCameraRig({
      shots: cameraShots,
      root: document,
      onShot(shot) {
        view.setShot(shot);
        view.requestRender();
      },
      onActive: view.setActive,
    });
    showCar();
  } catch (error) {
    // The stage steps aside and the chapters show their stills, so the page is never left without the car.
    console.warn('[supra] 3D stage unavailable', error);
    preloader.fail();
    root.hidden = true;
    document.documentElement.dataset.mode = 'lite';
    initChapterShots(document);
  }
}

/**
 * Full mode loads the 3D lap on demand, once the section is a screen away: building it costs a few
 * hundred milliseconds of main thread that the first screen should not pay. Lite, or any failure
 * loading it, keeps the 2D lap.
 */
async function initLap(root) {
  if (mode === 'full') {
    // The 3D layout from the start, so the section does not jump when the stage arrives.
    root.dataset.lapView = '3d';
    try {
      await whenNear(root);
      const { initLapSection3d } = await import('./components/lapSection3d.js');
      initLapSection3d(root);
      return;
    } catch (error) {
      console.warn('[supra] 3D lap unavailable, using 2D', error);
      delete root.dataset.lapView;
    }
  }
  initLapSection(root, motion);
}
