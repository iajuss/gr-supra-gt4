// Renders the light page's hero clip frame by frame and posts each one to the dev server, which
// writes .frames/hero/. From there tools/heroClip.md turns them into public/video/hero.mp4.
// Open http://localhost:5173/tools/heroClip.html with `npm run dev` running.
//
// A full turn, so the loop closes on itself: the last frame is the one before the first comes round
// again, and the video needs no cut or fade to repeat for ever.

import carStage from '../src/data/carStage.js';
import { createStage } from '../src/scene/stage.js';
import { createCar } from '../src/scene/car.js';

const SIZE = { width: 720, height: 1280 }; // 9:16, so a phone can use it full-bleed behind the title
const FRAMES = 180; // 6 s at 30 fps
const QUALITY = 0.92;

// The turntable: far enough back that the car stays inside a narrow portrait frame all the way
// round (it is 4.38 m broadside and 1.87 m head-on), and about as low as the page's own hero shot.
const ORBIT = { radius: 13, height: 2.2, fov: 42, target: { x: 0, y: 0.6, z: 0 }, from: Math.PI / 4 };

const canvas = document.querySelector('#stage');
const log = document.querySelector('#log');
const say = (line) => (log.textContent += `\n${line}`);

/** Waits until the drawing buffer follows the canvas's CSS width (a ResizeObserver sets it). */
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
await view.activateBloom(); // the lamps glow on the real page, so they glow here
await sized(canvas, SIZE.width);

const target = document.createElement('canvas');
target.width = SIZE.width;
target.height = SIZE.height;
const context = target.getContext('2d');

for (let frame = 0; frame < FRAMES; frame += 1) {
  const angle = ORBIT.from + (frame / FRAMES) * Math.PI * 2;
  view.setShot({
    position: { x: Math.cos(angle) * ORBIT.radius, y: ORBIT.height, z: Math.sin(angle) * ORBIT.radius },
    target: ORBIT.target,
    fov: ORBIT.fov,
    offset: 0, // centred: the title sits over it, not beside it
  });
  view.render();

  // Read the drawing buffer in the same tick as the render, before the compositor clears it.
  context.drawImage(canvas, 0, 0, SIZE.width, SIZE.height);
  const blob = await new Promise((resolve) => target.toBlob(resolve, 'image/jpeg', QUALITY));
  const number = String(frame).padStart(4, '0');
  await fetch(`/__frames/hero/${number}.jpg`, { method: 'POST', body: blob });
  if (frame % 30 === 0) say(`${number} … ${Math.round(blob.size / 1024)} KB`);
}

say(`done: ${FRAMES} frames in .frames/hero/`);
