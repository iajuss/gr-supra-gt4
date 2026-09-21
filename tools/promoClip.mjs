// Renders the promo video: one pass through the page, from the sound screen to the numbers.
//
// Rendered, not recorded. The page's timing - performance.now, Date, requestAnimationFrame,
// setTimeout - is replaced inside the page (timeweb) so time only moves when this script says so.
// Each frame is drawn at exactly 1/60 s of page time and captured before the clock moves again, so
// the speed of the capture stops mattering and the result cannot judder.
//
// Neither Playwright nor timeweb is a dependency of this project (like the model pipeline,
// tools/model/README.md): install them in a temporary folder and run this from there, so that they
// resolve from that folder.
//
//   npm run build && npm run preview          # in this repo, serves dist on 4173
//   mkdir /tmp/pw && cd /tmp/pw
//   npm install playwright timeweb && npx playwright install chromium
//   node <repo>/tools/promoClip.mjs <repo> [out.mp4]
//
// ffmpeg has to be on PATH. Intermediate frames go to .frames/ (gitignored), never to public/.
//
// Three things were learned the hard way here and are load-bearing:
//   - Recording in real time cannot work: a CDP screencast tops out around 40 fps while the page
//     runs at 60, and a 40 fps source laid on a 60 fps grid holds a third of its frames for two
//     slots and the rest for one. That reads as a shake from end to end (docs/plan.md).
//   - CDP's own virtual time is not the answer either: with the clock frozen there the compositor
//     stops issuing frames, and the render died at 16.0 s - the page's scroll and clock kept
//     advancing while requestAnimationFrame never fired again.
//   - Playwright's evaluate waits for the page to settle, and settling needs time; with the clock
//     under our control that wait can never end, so the page is driven straight over CDP.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = path.resolve(process.argv[2] ?? '.');
const output = path.resolve(process.argv[3] ?? 'promo.mp4');
const limit = Number(process.argv[4] ?? 0);
const PAGE_URL = process.env.PROMO_URL ?? 'http://localhost:4173/';
const FPS = 60;
const STEP = 1000 / FPS;
const WIDTH = 1920;
const HEIGHT = 1080;
const GATE_HOLD = 4.0; // the sound screen, before the visitor's gesture

const requireHere = createRequire(path.join(process.cwd(), 'resolve-from-here.js'));
let chromium;
let timeweb;
try {
  ({ chromium } = requireHere('playwright'));
  timeweb = await readFile(requireHere.resolve('timeweb/dist/timeweb.js'), 'utf8');
} catch {
  throw new Error('playwright and timeweb are not installed here - see the header of this file');
}

const opening = (await import(pathToFileURL(path.join(repo, 'src/data/opening.js')))).default;
const engineSound = (await import(pathToFileURL(path.join(repo, 'src/data/engineSound.js')))).default;

const frames = path.join(repo, '.frames/promo');
await rm(frames, { recursive: true, force: true });
await mkdir(frames, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'],
});
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

// Installed before a line of the page runs, so it never sees the real clock.
await page.addInitScript({ content: timeweb });
await page.goto(PAGE_URL, { waitUntil: 'load' });

const goTo = (ms) => page.evaluate((t) => window.timeweb.goTo(t), ms);
const visible = (selector) => page.evaluate((s) => {
  const element = document.querySelector(s);
  if (!element) return false;
  const box = element.getBoundingClientRect();
  return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden';
}, selector);

// Nothing has moved yet: the page's clock is standing at zero. Walk it forward until the sound
// screen is up, however long the loading takes, then a beat more so its entrance has settled.
let clock = 0;
let ready = false;
for (let i = 0; i < 2400 && !ready; i += 1) {
  clock += STEP;
  await goTo(clock);
  if (i % 15 === 14) ready = await visible('.gate [data-gate-silent]');
}
if (!ready) throw new Error('the sound screen never came up');
for (let i = 0; i < 30; i += 1) {
  clock += STEP;
  await goTo(clock);
}

const mode = await page.evaluate(() => document.documentElement.dataset.mode);
if (mode !== 'full') throw new Error(`expected the full page, got ${mode}`);

const marks = await page.evaluate(() => {
  const at = (selector) => document.querySelector(selector)?.offsetTop ?? null;
  return {
    hero: 0,
    aero: at('#aero'),
    chassis: at('#chassis'),
    engine: at('#engine'),
    lap: at('#lap'),
    specs: at('#specs'),
  };
});

// Where each of the lap's two stutters fires: one screen away it is built (lib/whenNear.js), half
// visible it starts playing (components/lapPlayer.js). The pass holds still at both, so the page has
// room to do that work between beats rather than in the middle of a move.
marks.build = Math.max(0, marks.lap - HEIGHT * 1.9);
marks.start = Math.max(0, marks.lap - HEIGHT * 0.5);

// Seconds from the first rendered frame. Each chapter gets a beat of its own; the aero one has the
// airflow to show, and the lap is held long enough to read the telemetry.
const plan = [
  { until: GATE_HOLD + 8.0, to: 'hero' },
  { until: GATE_HOLD + 10.5, to: 'aero', ease: true },
  { until: GATE_HOLD + 12.0, to: 'aero' },
  { until: GATE_HOLD + 14.5, to: 'chassis', ease: true },
  { until: GATE_HOLD + 16.0, to: 'chassis' },
  { until: GATE_HOLD + 18.5, to: 'engine', ease: true },
  { until: GATE_HOLD + 20.0, to: 'engine' },
  { until: GATE_HOLD + 20.6, to: 'build', ease: true },
  { until: GATE_HOLD + 23.6, to: 'build' },
  { until: GATE_HOLD + 24.4, to: 'start', ease: true },
  { until: GATE_HOLD + 26.4, to: 'start' },
  { until: GATE_HOLD + 27.9, to: 'lap', ease: true },
  { until: GATE_HOLD + 32.4, to: 'lap' },
  { until: GATE_HOLD + 34.4, to: 'specs', ease: true },
  { until: GATE_HOLD + 36.4, to: 'specs' },
];
const TOTAL = limit || Math.round(plan.at(-1).until * FPS);

const smooth = (k) => k * k * (3 - 2 * k);
const scrollAt = (seconds) => {
  let from = 0;
  let previous = GATE_HOLD;
  for (const leg of plan) {
    const target = marks[leg.to];
    if (seconds < leg.until) {
      if (!leg.ease) return target;
      const k = smooth(Math.min(1, Math.max(0, (seconds - previous) / (leg.until - previous))));
      return from + (target - from) * k;
    }
    from = target;
    previous = leg.until;
  }
  return marks.specs;
};

const client = await page.context().newCDPSession(page);
const shot = async () => Buffer.from(
  (await client.send('Page.captureScreenshot', { format: 'jpeg', quality: 95 })).data,
  'base64',
);

const clickAt = Math.round(GATE_HOLD * FPS);
const base = clock;
let lastSize = '';
let unchanged = 0;
const started = Date.now();

for (let i = 0; i < TOTAL; i += 1) {
  const seconds = i / FPS;
  if (i === clickAt) await page.click('.gate [data-gate-silent]');
  if (i > clickAt) await page.evaluate((y) => window.scrollTo(0, y), Math.round(scrollAt(seconds)));

  await goTo(base + i * STEP);
  const buffer = await shot();
  writeFileSync(path.join(frames, `f${String(i).padStart(5, '0')}.jpg`), buffer);

  // A render that has died looks like the same picture over and over. Say so early rather than
  // spend the whole pass writing it out.
  const size = String(buffer.length);
  unchanged = size === lastSize ? unchanged + 1 : 0;
  lastSize = size;
  if (i > clickAt + 30 && unchanged > 150) throw new Error(`the page stopped changing at ${seconds.toFixed(1)}s`);

  if (i % 120 === 0) {
    const rate = (i + 1) / ((Date.now() - started) / 1000);
    process.stdout.write(`  ${i}/${TOTAL} - ${rate.toFixed(1)}/s, ${(((TOTAL - i) / rate) / 60).toFixed(1)} min left\n`);
  }
}

const wall = (Date.now() - started) / 1000;
await browser.close();

if (errors.length) console.warn('console errors:', errors.slice(0, 3));
console.log(`${TOTAL} frames in ${(wall / 60).toFixed(1)} min`);

// Every frame is one slot of the grid: the pacing is exact by construction.
let list = '';
for (let i = 0; i < TOTAL; i += 1) list += `file 'f${String(i).padStart(5, '0')}.jpg'\nduration ${(1 / FPS).toFixed(6)}\n`;
list += `file 'f${String(TOTAL - 1).padStart(5, '0')}.jpg'\n`;
await writeFile(path.join(frames, 'list.txt'), list);

const silent = path.join(frames, 'silent.mp4');
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'concat', '-safe', '0', '-i', 'list.txt',
  '-fps_mode', 'cfr', '-r', String(FPS),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
  silent,
], { cwd: frames, stdio: 'inherit' });

// The page starts the engine opening.engineAt after the gesture, and the clip fades out over its
// last engineSound.fadeOut seconds. Checked against the picture, where the hero's title lands on the
// engine catching: it landed 1.98 s after the click, against the 1.9 s the data asks for.
const audioAt = GATE_HOLD + opening.engineAt;
const delay = Math.round(audioAt * 1000);
const fadeAt = (audioAt + engineSound.end - engineSound.fadeOut).toFixed(2);
const clip = path.join(repo, 'public', engineSound.src.replace(/^\//, ''));
const audio = `[1:a]atrim=${engineSound.start}:${engineSound.end},`
  + `adelay=${delay}|${delay},volume=${engineSound.volume},`
  + `afade=t=out:st=${fadeAt}:d=${engineSound.fadeOut},apad[a]`;

execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-i', silent, '-i', clip,
  '-filter_complex', audio,
  '-map', '0:v', '-map', '[a]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest',
  output,
], { stdio: 'inherit' });

console.log(output);
