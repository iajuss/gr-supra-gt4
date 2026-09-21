// Renders each chapter's camera shot and posts it to the dev server, which writes public/shots/*.webp.
// Open http://localhost:5173/tools/capture.html with `npm run dev` running.

import carStage from '../src/data/carStage.js';
import cameraShots from '../src/data/cameraShots.js';
import { createStage } from '../src/scene/stage.js';
import { createCar } from '../src/scene/car.js';
import { createAirflow } from '../src/scene/airflow.js';

const SHOTS = ['aero', 'chassis', 'engine']; // the chapters with a figure in index.html
const SIZE = { width: 1440, height: 900 }; // 16:10, the aspect ratio of .chapter__shot
const QUALITY = 0.82;

const canvas = document.querySelector('#stage');
const log = document.querySelector('#log');
const say = (line) => (log.textContent += `\n${line}`);

/** Waits until the drawing buffer follows the canvas's CSS width. */
function sized(element, cssWidth, tries = 60) {
  return new Promise((resolve, reject) => {
    const check = (left) => {
      if (element.width >= cssWidth) return resolve(element.width);
      if (left <= 0) return reject(new Error(`canvas never resized (still ${element.width}px)`));
      requestAnimationFrame(() => check(left - 1));
    };
    check(tries);
  });
}

const view = await createStage(canvas, carStage);
const car = await createCar(carStage);
view.add(car.object3D);
// The aero chapter is about the air, so its still shows it too. On the page the flow follows the
// camera's place along the scroll; here it is simply turned on for that one shot.
//
// On the page the flow is a mark chasing along each line, so any single frame catches only dashes.
// A still wants the whole streamline, which is what makes the shape readable standing still: with no
// marks along the line every point shares one phase, and holding that phase at the mark's own peak
// (0.06 in scene/airflow.js's shader) lights each line end to end. The ends still fade out.
const LIT_LINE = { marks: 0, speed: 1 };
const LIT_PHASE = -0.06;
const airflow = createAirflow(carStage.car, { view }, { ...carStage.airflow, ...LIT_LINE });
await view.activateBloom(); // the page turns the lamps' glow on at the first move: stills show it

// createStage sizes the renderer from a ResizeObserver, which fires after this tick: capturing
// before it lands would frame the shot against the canvas's default 300x150.
await sized(canvas, SIZE.width);

const target = document.createElement('canvas');
target.width = SIZE.width;
target.height = SIZE.height;
const context = target.getContext('2d');

for (const id of SHOTS) {
  const shot = cameraShots.find((entry) => entry.id === id);
  // One drawn frame, not the flow's own loop: that loop stays parked while the document reports
  // itself hidden, which is how this tool runs inside an app's browser pane.
  airflow.still(LIT_PHASE, id === 'aero' ? 1 : 0);

  // Centred: the offset makes room for the page's text, and the lite figure stands on its own.
  view.setShot({ ...shot, offset: 0 });
  view.render();

  // Read the drawing buffer in the same tick as the render, before the compositor clears it.
  context.drawImage(canvas, 0, 0, SIZE.width, SIZE.height);
  const blob = await new Promise((resolve) => target.toBlob(resolve, 'image/webp', QUALITY));

  const response = await fetch(`/__shot/${id}`, { method: 'POST', body: blob });
  say(`${id}: ${Math.round(blob.size / 1024)} KB → ${await response.text()}`);
}

say('done');
