// The link preview image (og:image, 1200x630): the car rendered from the stage, with the page's
// title and kicker composed over it in the page's fonts.
// Open http://localhost:<port>/tools/shareCard.html with `npm run dev` running: it shows every
// variant side by side. ?save=<id> also writes that one to public/shots/og.jpg.

import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/jetbrains-mono';

import carStage from '../src/data/carStage.js';
import cameraShots from '../src/data/cameraShots.js';
import { createStage } from '../src/scene/stage.js';
import { createCar } from '../src/scene/car.js';

const SIZE = { width: 1200, height: 630 };
const QUALITY = 0.9;
const MARGIN = 64; // feeds crop the edges a little: keep the text well inside
const COLORS = { bg: '#0a0b0a', text: '#f2f2ee', soft: '#c9cbc4', accent: '#c6ff00' };
const DISPLAY = '"Big Shoulders Display Variable"';
const MONO = '"JetBrains Mono Variable"';

const shot = (id, changes = {}) => ({ ...cameraShots.find((entry) => entry.id === id), ...changes });

// Each variant: a camera shot, which corner the text sits in, and how big the title is. A higher
// target lowers the car in the frame: the card is wider than the page, and the top was left empty.
const VARIANTS = [
  {
    id: 'a',
    name: 'A — hero, as on the page',
    shot: shot('hero', { target: { x: 0, y: 0.85, z: 0 }, fov: 37, offset: 0.2 }),
    align: 'left',
    valign: 'bottom',
    title: 250,
  },
  {
    id: 'b',
    name: 'B — low front, text right',
    shot: shot('chassis', { position: { x: 6.4, y: 0.75, z: 3.7 }, target: { x: 1.2, y: 0.6, z: 0 }, offset: -0.2 }),
    align: 'right',
    valign: 'bottom',
    title: 240,
  },
  {
    id: 'c',
    name: 'C — profile, title on top',
    shot: shot('engine', { target: { x: 0, y: 1.05, z: 0 }, fov: 32, offset: 0.1 }),
    align: 'left',
    valign: 'top',
    title: 170,
  },
];

const canvas = document.querySelector('#stage');
const cards = document.querySelector('#cards');
const log = document.querySelector('#log');
const say = (line) => (log.textContent += `\n${line}`);

/** Waits until the drawing buffer follows the canvas's CSS width (the stage sizes itself later). */
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

/** Draws text with the page's label tracking; returns its width. */
function spaced(context, text, x, y, tracking) {
  context.letterSpacing = `${tracking}px`;
  context.fillText(text, x, y);
  const width = context.measureText(text).width;
  context.letterSpacing = '0px';
  return width;
}

function compose(context, variant) {
  const { width, height } = SIZE;
  const right = variant.align === 'right';

  // A soft scrim on the text's side, so the words never sit on a bright reflection.
  const scrim = context.createLinearGradient(right ? width : 0, 0, right ? width * 0.35 : width * 0.65, 0);
  scrim.addColorStop(0, 'rgba(10, 11, 10, 0.75)');
  scrim.addColorStop(1, 'rgba(10, 11, 10, 0)');
  context.fillStyle = scrim;
  context.fillRect(0, 0, width, height);

  context.textBaseline = 'alphabetic';
  context.textAlign = 'left';

  // Kicker, the start of the page's ("// Unofficial concept · Track only · …"): the rest would run
  // into the car at this size.
  const kickerSize = 17;
  const tracking = kickerSize * 0.14;
  context.font = `500 ${kickerSize}px ${MONO}`;
  const parts = [
    ['// ', COLORS.accent],
    ['UNOFFICIAL CONCEPT · ', COLORS.text],
    ['TRACK ONLY', COLORS.accent],
  ];
  context.letterSpacing = `${tracking}px`;
  const kickerWidth = parts.reduce((sum, [text]) => sum + context.measureText(text).width, 0);
  context.letterSpacing = '0px';

  // The block, top down: kicker, title (caps are ~0.8 of the font size), address.
  const capHeight = variant.title * 0.8;
  const blockHeight = kickerSize + 22 + capHeight + 40;
  const top = variant.valign === 'top' ? MARGIN : height - MARGIN - blockHeight;
  const kickerY = top + kickerSize;
  const titleY = kickerY + 22 + capHeight;
  const urlY = titleY + 40;
  let x = right ? width - MARGIN - kickerWidth : MARGIN;
  for (const [text, color] of parts) {
    context.fillStyle = color;
    x += spaced(context, text, x, kickerY, tracking);
  }

  // The title: "SUPRA", weight 900, tight like the hero's.
  context.font = `900 ${variant.title}px ${DISPLAY}`;
  context.fillStyle = COLORS.text;
  const title = 'SUPRA';
  const titleWidth = context.measureText(title).width;
  context.fillText(title, right ? width - MARGIN - titleWidth : MARGIN - variant.title * 0.04, titleY);

  // Where it lives, small, under the title.
  context.font = `500 15px ${MONO}`;
  context.fillStyle = COLORS.soft;
  const url = 'GR-SUPRA-GT4.VERCEL.APP';
  context.letterSpacing = `${15 * 0.14}px`;
  const urlWidth = context.measureText(url).width;
  context.fillText(url, right ? width - MARGIN - urlWidth : MARGIN, urlY);
  context.letterSpacing = '0px';
}

await Promise.all([
  document.fonts.load(`900 100px ${DISPLAY}`),
  document.fonts.load(`500 16px ${MONO}`),
]);

const view = await createStage(canvas, carStage);
const car = await createCar(carStage);
view.add(car.object3D);
await sized(canvas, SIZE.width);

const save = new URLSearchParams(location.search).get('save');

for (const variant of VARIANTS) {
  view.setShot(variant.shot);
  view.render();

  const card = document.createElement('canvas');
  card.width = SIZE.width;
  card.height = SIZE.height;
  const context = card.getContext('2d');
  // Read the drawing buffer in the same tick as the render, before the compositor clears it.
  context.drawImage(canvas, 0, 0, SIZE.width, SIZE.height);
  compose(context, variant);

  const blob = await new Promise((resolve) => card.toBlob(resolve, 'image/jpeg', QUALITY));
  const figure = document.createElement('figure');
  const img = document.createElement('img');
  img.src = URL.createObjectURL(blob);
  img.alt = variant.name;
  const caption = document.createElement('figcaption');
  caption.textContent = `${variant.name} · ${Math.round(blob.size / 1024)} KB`;
  figure.append(img, caption);
  cards.append(figure);

  if (save === variant.id) {
    const response = await fetch('/__shot/og.jpg', { method: 'POST', body: blob });
    say(`saved ${variant.id} → ${await response.text()}`);
  }
}

say('done');
