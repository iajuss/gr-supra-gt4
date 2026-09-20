// Scroll → camera: one scrubbed timeline over the 3D zone, read through smoothShotAt.
// GSAP only moves a 0–1 progress; where the camera goes is the tested maths in lib/math.js.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { normalizeStops, smoothShotAt } from '../lib/math.js';

gsap.registerPlugin(ScrollTrigger);

/** Scroll position at which a section sits in the middle of the viewport. */
function centreScroll(section) {
  return section.offsetTop + section.offsetHeight / 2 - window.innerHeight / 2;
}

/**
 * @param {object} options
 * @param {Array<{ id: string }>} options.shots in page order; a shot without its [data-shot] section is skipped
 * @param {ParentNode} options.root
 * @param {(shot: ReturnType<typeof smoothShotAt>, progress: number) => void} options.onShot
 * @param {(active: boolean) => void} [options.onActive] the 3D zone entering or leaving the viewport
 */
export function createCameraRig({ shots, root, onShot, onActive }) {
  const paired = shots
    .map((shot) => ({ shot, section: root.querySelector(`[data-shot="${shot.id}"]`) }))
    .filter(({ section }) => section);

  if (paired.length < 2) throw new Error('createCameraRig: needs at least two shots with a section');

  const sections = paired.map(({ section }) => section);
  const framed = paired.map(({ shot }) => shot);
  let stops = normalizeStops(sections.map(centreScroll));

  const progress = { value: 0 };
  const timeline = gsap.to(progress, {
    value: 1,
    ease: 'none',
    onUpdate: () => onShot(smoothShotAt(framed, progress.value, stops), progress.value),
    scrollTrigger: {
      trigger: sections[0],
      start: 'center center',
      endTrigger: sections[sections.length - 1],
      end: 'center center',
      scrub: 0.6,
      invalidateOnRefresh: true,
      onRefresh: () => {
        stops = normalizeStops(sections.map(centreScroll));
      },
    },
  });

  // The stage is only worth drawing while the 3D zone is on screen.
  const zone = ScrollTrigger.create({
    trigger: sections[0],
    start: 'top bottom',
    endTrigger: sections[sections.length - 1],
    end: 'bottom top',
    onToggle: ({ isActive }) => onActive?.(isActive),
  });

  onShot(smoothShotAt(framed, 0, stops), 0);
  onActive?.(zone.isActive);

  return {
    get stops() {
      return stops;
    },
    /** Where a shot sits along the scroll, 0-1; -1 if the page has no section for it. */
    stopOf(id) {
      const index = framed.findIndex((shot) => shot.id === id);
      return index < 0 ? -1 : stops[index];
    },
    destroy() {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      zone.kill();
    },
  };
}
