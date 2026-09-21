# GR Supra GT4 — Unofficial Concept

[![CI](https://github.com/iajuss/gr-supra-gt4/actions/workflows/ci.yml/badge.svg)](https://github.com/iajuss/gr-supra-gt4/actions/workflows/ci.yml)

A fan-made landing page for the Toyota GR Supra GT4, the track-only Supra: a 3D car you scroll around,
an opening that starts the engine, and a simulated lap of Silverstone.

**Live:** https://gr-supra-gt4.vercel.app

> Unofficial fan-made concept. Not affiliated with, endorsed by or connected to Toyota Motor Corporation
> or Toyota Gazoo Racing.

## What's on the page

- **An opening that starts the car.** After loading, the page asks for sound. Enter, and the car is dark
  at first. Its headlights blink on, then the engine starts, and "SUPRA" rises as it catches. The studio
  light and the camera follow the engine's loudness, and the sequence runs the same without sound.
- **One camera, one scroll.** A fixed WebGL stage flies between framings (aero, chassis, engine) as the
  page scrolls. Nothing renders while nothing moves.
- **The lap.** Silverstone from real circuit data, driven in 12 seconds with simulated telemetry (speed
  from the corners' curvature, gear, sector, time). Three cameras, a minimap, pause and restart.
- **The numbers.** Specs from public sources, counted up as they come into view.

## Built with

Vite · plain JavaScript (ES modules) · Three.js · GSAP + ScrollTrigger · Lenis · Web Audio · Vitest

- **Two modes.** Desktop gets the full 3D page. Phones, reduced motion, save-data or no WebGL get a
  light version: stills of the same camera shots and a 2D lap, with no Three.js downloaded at all.
- **Fast on load.** Shaders are compiled ahead and off the main thread where the browser allows it. The
  3D lap is built only when it comes near. The audio device opens on the visitor's first move, not
  while the page loads. Lighthouse: 100 on mobile across the board; 97–100 performance on desktop.
- **Accessible.** Keyboard order and focus, contrast measured on the rendered 3D frames, a pause for the
  lap, and a still page for reduced motion.
- **Tested where it counts.** Pure logic (track geometry, telemetry, camera rigs, the lap clock, the
  opening's timing, loudness curves) lives in `src/lib/` with Vitest specs. The visuals were checked
  in the browser.

## Making of

Six things that went differently than planned, each settled by measuring rather than by taste. The
full record, in Portuguese, is in [docs/design.md](docs/design.md) and [docs/plan.md](docs/plan.md).

**The weight was the bodywork, not the format.** The car came in at 7.7 MB and 3.54M triangles, and
the GLB was already Draco-compressed with nothing but positions and normals in it. What had never
been simplified was the body shell, because the simplifier ignored normals and creased the varnish.
Weighting the normals instead took half the triangles out at an error of 0.001: **7.7 → 5.6 MB**, and
**61 → 74-79 FPS** on the same scroll. Shells at 30% and 20% were compared side by side too; at 20%
the bonnet and the boot lid start to ripple.

**The obvious way to make the lights glow cost half the frame rate.** A brightness threshold cannot
separate lights from paint here: the spot reflections on the varnish are brighter than the headlights,
and even at threshold 4 they turned into milky smears. Rendering everything through a multisampled
half-float composer instead ran at **34 FPS against 76** without it. What shipped sends the scene
straight to the canvas as before and builds the glow separately at a quarter resolution, from the
lamps alone, hidden behind a coarse silhouette of the body that is never drawn in frame: **69 FPS,
the same as with no bloom at all**. Compiling its shaders during load then cost ~60 ms of main thread
and pulled desktop Lighthouse down to 93-96, so the bloom now switches on at the visitor's first
move, like the audio device.

**A frame budget has to count missed frames, not milliseconds.** The plan said to drop effects when
p95 frame time went over 20 ms, which confuses work with vsync: 16.7 ms is a perfectly healthy 60 Hz,
and that rule would have punished exactly the ordinary monitors it was meant to protect. It became
frames missed against the screen's own rhythm, taken from the lower quartile of the intervals rather
than the median, which would rise along with a stutter and hide it. Two guards came out of measuring:
a ceiling on the estimated rhythm, or a machine that is slow all the time looks healthy, and a floor
on what counts as missed, or a 164 Hz screen fails its own budget over 12 ms frames that are still
80 per second.

**An effect that belongs to one chapter cannot ask whether the section is on screen.** The airflow
over the car was first tied to an observer on the aero section, which is 1008 px tall against a 720 px
screen and is therefore "visible" for nearly the whole 3D zone: the air showed up three chapters away.
It now follows the camera's own place along the scroll. Measuring it also caught the flow glowing
when it should not: the bloom pass hid meshes from itself, and a line is not a mesh.

**The phone's hero had no picture to use as a poster.** The plan called for the existing image; there
wasn't one, only type on black, which the DOM said plainly. It became a silent 6-second turntable —
a full 360°, so the loop closes by construction with no cut and no fade — at **769 KB**, downloaded
only after the visitor taps through the sound screen, so the light version still ships no Three.js and
Lighthouse never sees the video at all.

**The film grain and vignette were built, measured, and taken back out.** Neither could be seen at
1:1, and the numbers say why. The grain's noise was finer than a pixel (~1.2 px of detail on a 1.25×
screen), so it moved a mid-tone pixel by about **2 levels out of 255** and the display averaged the
rest away; more opacity only darkens the whole frame evenly. The vignette applies nothing across the
middle half of the frame and 45% at the corner — where this render already sits at an average of
**27 of 255**, because a dark studio vignettes itself. Both were planned for a photographic image
this page does not have.

### What the measuring taught

Most of the wrong turns above were found by instruments, and the instruments lied too. A single
forgotten tab with the page open drags desktop Lighthouse from 99 down to the 70s, because the stage
now draws continuously while it is on screen. `document.visibilityState` will report `visible` while
`requestAnimationFrame` has not fired for a full second, so the honest guard is to count frames. And
a composited layer does not re-rasterise when the CSS variable behind it changes, which quietly
invalidated a whole round of comparisons until a forced repaint gave the game away.

Where it ended up, measured in alternating runs against the commit that opened this round: desktop
**100** across three pairs with **22-36 ms** of total blocking time, against 36-126 ms before, and a
page **1.9 MB lighter**. On mobile the blocking time came down to **7-19 ms**. Mobile scores swing
between 95 and 100 on this machine — the pairs move together, so it is the machine, not the page —
and in every pair this build matched or beat the reference.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest
npm run build     # production build in dist/
```

## Layout

```
src/
  data/        numbers and settings: camera shots, lap scene, sound, opening timings
  lib/         pure logic, each file with its test
  components/  page behaviour: preloader, sound screen, hero entrance, lap, specs
  scene/       Three.js: the car stage, the car, the 3D lap
  styles/      tokens, base and one file per section
tools/         dev-only helpers: look lab, still captures, the model pipeline
docs/          design decisions and the build plan (in Portuguese)
```

## Credits

- 3D model: Supra MK5 by [mariobelmonte141](https://www.cgtrader.com/free-3d-models/vehicle/motorcycle/supra-mk5-personalized)
  (CGTrader, Custom License, no AI), repainted and re-split for this page.
- Circuit data: [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) (MIT).
- Engine sound: "car-start" by [Erdie](https://freesound.org/people/Erdie/sounds/21741/) (Freesound,
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)), trimmed.
- Type: Big Shoulders Display and JetBrains Mono (SIL Open Font License), self-hosted via Fontsource.
