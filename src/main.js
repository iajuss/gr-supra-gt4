import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/jetbrains-mono';
import './styles/main.css';

import { decideMode, detectEnvironment } from './lib/capabilities.js';
import engineSound from './data/engineSound.js';
import opening from './data/opening.js';
import { initChapterShots } from './components/chapterShots.js';
import { createEngineSound } from './components/engineSound.js';
import { createHeroEntrance } from './components/heroEntrance.js';
import { createHeroMedia } from './components/heroMedia.js';
import { createIgnitionShow } from './components/ignitionShow.js';
import { initLapSection } from './components/lapSection.js';
import { createPreloader } from './components/preloader.js';
import { openSoundGate } from './components/soundGate.js';
import { initSpecCounters } from './components/specCounters.js';
import { startAtTop } from './components/startAtTop.js';
import { initTextReveal } from './components/textReveal.js';
import { whenNear } from './lib/whenNear.js';

startAtTop();

const env = detectEnvironment();
const { mode, reasons } = decideMode(env);
document.documentElement.dataset.mode = mode;

const motion = { reducedMotion: env.reducedMotion };

initTextReveal(document, motion);

// Both modes open through the sound screen, once there is nothing left to wait for.
const preloaderRoot = document.querySelector('.preloader');
const preloader = createPreloader(preloaderRoot, motion);
const engine = createEngineSound(engineSound);
const catchAt = engineSound.catchAt - engineSound.start;

// The hero comes in as the page opens, its title landing when the engine catches.
const entrance = createHeroEntrance(document.querySelector('.hero'), { reducedMotion: motion.reducedMotion, catchAt });

// Lite only: the hero's moving picture. It is a download, so it waits for the sound screen.
const heroMedia = createHeroMedia(document, { mode, reducedMotion: env.reducedMotion, saveData: env.saveData });
let ignition = null; // full mode, once the car is on stage: its lights, the rim and the camera

// Settles when the page has finished opening and the stage is still again: the frame budget waits
// for it, so it measures the machine and not the engine start (scene/qualityBudget.js).
let openingDone;
const openingOver = new Promise((resolve) => {
  openingDone = resolve;
});

preloader.ready.then(() => {
  engine.preload();
  // Opening the audio device blocks for a moment: do it on the visitor's first move towards the
  // buttons rather than while the page loads (or, with a key, inside the gesture itself).
  const warmUp = () => engine.warmUp();
  for (const type of ['pointermove', 'pointerdown', 'keydown']) {
    window.addEventListener(type, warmUp, { once: true, passive: true, capture: true });
  }
  openSoundGate(preloaderRoot.querySelector('.gate'), {
    surface: preloaderRoot,
    onChoice(choice) {
      // With the car on stage the page opens as a car starts (data/opening.js): the lights blink on,
      // then the engine. Without it (lite, or a car still loading) the engine starts at once.
      const gesture = performance.now();
      window.scrollTo(0, 0); // late layout (fonts, the lap's 3D layout) must not leave the page mid-way
      heroMedia.enter(); // the visitor is in: now the hero may weigh something
      const engineAt = ignition ? opening.engineAt : 0;
      const heard = choice === 'sound' ? engine.play({ delay: engineAt }) : Promise.resolve(null);
      preloader.close();
      heard.then((startAt) => {
        const clipStart = startAt ?? gesture + engineAt * 1000; // silent: the clip's would-be clock
        entrance.play(clipStart);
        const show = ignition?.play({ clipStart, lightsOn: gesture + opening.keyAt * 1000 });
        (show ?? Promise.resolve()).then(openingDone);
      });
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
    // The lamps' glow compiles on the visitor's first move, not while the page loads (scene/stage.js).
    const glowUp = () => view.activateBloom();
    for (const type of ['pointermove', 'pointerdown', 'keydown']) {
      window.addEventListener(type, glowUp, { once: true, passive: true, capture: true });
    }
    // Only if the page has not opened yet (a slow line lets the visitor in before the car arrives).
    if (!preloader.isOpen) {
      ignition = createIgnitionShow({
        view,
        car,
        duration: engineSound.end - engineSound.start,
        loudness: engine.loudness(),
      });
    }

    // The car is on stage: the sound screen can take over, and the car emerges once the page opens
    // (at once if the visitor is already in, after the slow-line timeout). Opening on it, the fog clears
    // quickly, so the car is in view before its lights blink on.
    const showCar = () => {
      preloader.finish();
      const fog = ignition ? { ms: opening.fogMs } : {};
      preloader.closed.then(() => view.reveal({ instant: motion.reducedMotion, ...fog }));
    };

    // ?shot=<id> holds one chapter's framing, to check it on its own, instead of following the scroll.
    const requested = new URLSearchParams(window.location.search).get('shot');
    const frozen = cameraShots.find((shot) => shot.id === requested);
    if (frozen) {
      view.setShot(frozen);
      showCar();
      return;
    }

    const [
      { createSmoothScroll },
      { createCameraRig },
      { createHandheldCamera },
      { createAirflow },
      { nearStop },
      { createQualityBudget },
      { createLapCurtain },
    ] = await Promise.all([
      import('./lib/scroll.js'),
      import('./scene/cameraRig.js'),
      import('./scene/handheldCamera.js'),
      import('./scene/airflow.js'),
      import('./lib/airflow.js'),
      import('./scene/qualityBudget.js'),
      import('./components/lapCurtain.js'),
    ]);
    createSmoothScroll();
    createLapCurtain(document.querySelector('.lap'));
    // The hand sits between the two: the rig says where the chapter looks, and it keeps that framing alive.
    const handheld = createHandheldCamera({
      view,
      ...carStage.handheld,
      reducedMotion: motion.reducedMotion,
    });
    // The air over the car, shown only while the aero chapter is on screen.
    const airflow = createAirflow(carStage.car, { view }, carStage.airflow);

    // If this machine cannot keep up, what goes is decided here: first the two things that draw
    // forever (the hand on the camera and the air), then the bloom, which is the car's signature.
    const budget = createQualityBudget({
      after: openingOver,
      settings: carStage.quality,
      onVerdict({ level, missed, vsync }) {
        if (level !== 'full') {
          handheld.park();
          airflow.park();
        }
        if (level === 'plain') view.dropBloom();
        console.info(`[supra] quality=${level}`, { missed: +missed.toFixed(3), vsync: +vsync.toFixed(1) });
      },
    });

    // The air belongs to the aero chapter and to no other: it comes up as the camera arrives there
    // and is gone before the next one (lib/airflow.js). The stop is read every time, because a
    // resize moves it; `rig` is still empty on the rig's own first call, which the guard covers.
    let rig = null;
    const blowAt = (progress) => {
      if (rig) airflow.setHere(nearStop(progress, rig.stopOf('aero'), carStage.airflow.reach));
    };

    rig = createCameraRig({
      shots: cameraShots,
      root: document,
      onShot(shot, progress) {
        handheld.setShot(shot);
        blowAt(progress);
      },
      onActive(active) {
        handheld.setActive(active);
        budget.setActive(active);
      },
    });
    blowAt(0);
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
