// Lenis and ScrollTrigger on the same clock, so a scrubbed timeline follows the smoothed scroll.
// Full mode only: touch devices keep the native scroll (see design.md).

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/** @param {{ duration?: number }} [options] */
export function createSmoothScroll({ duration = 1.1 } = {}) {
  const lenis = new Lenis({ duration, smoothWheel: true });

  lenis.on('scroll', ScrollTrigger.update);

  const tick = (time) => lenis.raf(time * 1000); // gsap counts seconds, Lenis milliseconds
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return {
    lenis,
    destroy() {
      gsap.ticker.remove(tick);
      lenis.destroy();
    },
  };
}
