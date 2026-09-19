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
