// Records the promo video: one pass through the page, from the sound screen to the numbers.
//
// Playwright is not a dependency of this project (like the model pipeline, tools/model/README.md):
// install it in a temporary folder and run this from there, so that it resolves from that folder.
//
//   npm run build && npm run preview          # in this repo, serves dist on 4173
//   mkdir /tmp/pw && cd /tmp/pw
//   npm install playwright && npx playwright install chromium
//   node <repo>/tools/promoClip.mjs <repo> [out.mp4]
//
// ffmpeg has to be on PATH. Intermediate frames go to .frames/ (gitignored), never to public/.
//
// Frames come from a CDP screencast rather than Playwright's own recording, which is low rate and
// low quality, and each frame keeps its timestamp: the video is assembled at a constant 60 fps from
// those, so where the page dropped a frame the video holds instead of speeding up. The sound is
// added afterwards from public/audio, placed by the page's own opening times.
//
// Two things were learned the hard way and are load-bearing here:
//   - The opening runs on real time from the page's load, so the pass cannot warm anything up first:
//     six seconds spent scrolling beforehand spent the ignition (measured: the title landed 0.5 s
//     after the gesture instead of 1.9 s). Only the sound screen's own hold comes before the gesture.
//   - The page stutters on the way into the lap, in two phases, and it is the page and not the
//     capture (docs/plan.md, "o engasgo da volta 3D"). Neither can be fixed from here, so the pass
//     stands still while each one happens: a dropped frame on a still picture does not show.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = path.resolve(process.argv[2] ?? '.');
const output = path.resolve(process.argv[3] ?? 'promo.mp4');
const PAGE_URL = process.env.PROMO_URL ?? 'http://localhost:4173/';
const WIDTH = 1920;
const HEIGHT = 1080;
const GATE_HOLD = 4.0; // the sound screen, before the visitor's gesture

const requireHere = createRequire(path.join(process.cwd(), 'resolve-from-here.js'));
let chromium;
try {
  ({ chromium } = requireHere('playwright'));
} catch {
  throw new Error('playwright is not installed here - see the header of this file');
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

await page.goto(PAGE_URL, { waitUntil: 'load' });
await page.waitForSelector('.gate button');

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
// visible it starts playing (components/lapPlayer.js). The pass holds still at both.
marks.build = Math.max(0, marks.lap - HEIGHT * 1.9);
marks.start = Math.max(0, marks.lap - HEIGHT * 0.5);

// Seconds from the first recorded frame. Each chapter gets a beat of its own; the aero one has the
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

const client = await page.context().newCDPSession(page);
let count = 0;
const shot = [];
const keep = (buffer, at, hold) => {
  const file = `f${String(count).padStart(5, '0')}.jpg`;
  count += 1;
  shot.push({ file, at, hold });
  createWriteStream(path.join(frames, file)).end(buffer);
};

client.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
  keep(Buffer.from(data, 'base64'), metadata.timestamp);
  try {
    await client.send('Page.screencastFrameAck', { sessionId });
  } catch {
    // the session is shutting down
  }
});

await client.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 92,
  maxWidth: WIDTH,
  maxHeight: HEIGHT,
  everyNthFrame: 1,
});

const started = Date.now();
const now = () => (Date.now() - started) / 1000;

while (now() < GATE_HOLD) await page.waitForTimeout(50);
await page.getByRole('button', { name: /without sound/i }).click();

const smooth = (k) => k * k * (3 - 2 * k);
let from = 0;
let previous = GATE_HOLD;
for (const leg of plan) {
  const target = marks[leg.to];
  const legStart = previous;
  while (now() < leg.until) {
    const k = leg.ease ? smooth(Math.min(1, (now() - legStart) / (leg.until - legStart))) : 1;
    const y = leg.ease ? from + (target - from) * k : target;
    await page.evaluate((to) => window.scrollTo(0, to), Math.round(y));
    await page.waitForTimeout(16);
  }
  from = target;
  previous = leg.until;
}

// The screencast only sends a frame when something changed, so a page that has come to rest stops
// feeding it - and the last counter tick is the frame that goes missing. Close on a still instead.
await client.send('Page.stopScreencast');
await page.waitForTimeout(500);
keep(await page.screenshot({ type: 'jpeg', quality: 92 }), shot.at(-1).at + 0.05, 1.6);
await browser.close();

if (errors.length) console.warn('console errors:', errors.slice(0, 3));

// Real timestamps become per-frame durations, so the pacing on screen is the page's own.
let list = '';
for (let i = 0; i < shot.length; i += 1) {
  const seconds = shot[i].hold ?? (i < shot.length - 1 ? shot[i + 1].at - shot[i].at : 1 / 60);
  list += `file '${shot[i].file}'\nduration ${Math.max(0.001, seconds).toFixed(6)}\n`;
}
list += `file '${shot.at(-1).file}'\n`;
await writeFile(path.join(frames, 'list.txt'), list);

const silent = path.join(frames, 'silent.mp4');
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'concat', '-safe', '0', '-i', 'list.txt',
  '-fps_mode', 'cfr', '-r', '60',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
  silent,
], { cwd: frames, stdio: 'inherit' });

// The page starts the engine opening.engineAt after the gesture, and the clip fades out over its
// last engineSound.fadeOut seconds. Checked against the picture, where the hero's title lands on the
// engine catching: the two agreed to within 80 ms.
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
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest',
  output,
], { stdio: 'inherit' });

console.log(`${output} - ${count} frames`);
