// THE LAP's curtain, full mode: as the lap stage rises one screen, "The circuit." shrinks from the centre
// of the handoff into the stage's top-left corner, above the lap's label and data. ScrollTrigger only
// reports the progress; the path is lib/curtain.js.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { curtainAt } from '../lib/curtain.js';

gsap.registerPlugin(ScrollTrigger);

/** The title's size in the corner. lap.css leaves room for it above .lap__head at this scale. */
const CORNER_SCALE = 0.5;

/**
 * @param {ParentNode | null} root the lap section
 * @returns {{ destroy(): void } | null} null without the markup: the title then simply scrolls by
 */
export function createLapCurtain(root) {
  const title = root?.querySelector('[data-curtain-title]');
  const stage = root?.querySelector('[data-lap]');
  const head = stage?.querySelector('.lap__head');
  if (!title || !stage || !head) return null;

  let move = null;

  /** Page coordinates, without the curtain's own transform. */
  function pageBox(element) {
    const rect = element.getBoundingClientRect();
    return { left: rect.left + window.scrollX, top: rect.top + window.scrollY, height: rect.height };
  }

  // Screen positions at both ends: progress 0 has the stage's top at the bottom of the screen,
  // progress 1 at the top. The title lands on the head's top edge, one head gap above it.
  function measure() {
    const transform = title.style.transform;
    title.style.transform = 'none';
    const from = pageBox(title);
    title.style.transform = transform;

    const rise = window.innerHeight;
    const startScroll = pageBox(stage).top - rise;
    const endScroll = startScroll + rise;
    const landing = pageBox(head);
    const gap = parseFloat(getComputedStyle(head).rowGap) || 0;

    move = {
      from: { left: from.left, top: from.top - startScroll },
      to: { left: landing.left, top: landing.top - endScroll - gap - from.height * CORNER_SCALE },
      scale: CORNER_SCALE,
      distance: rise,
    };
  }

  function render(progress) {
    if (!move) measure(); // a scroll can arrive before ScrollTrigger's first refresh
    const { x, y, scale } = curtainAt(progress, move);
    title.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }

  const trigger = ScrollTrigger.create({
    trigger: stage,
    start: 'top bottom',
    end: 'top top',
    onRefresh: (self) => {
      measure();
      render(self.progress);
    },
    onUpdate: (self) => render(self.progress),
  });

  // The title is centred, so its left edge moves when its width does: the reveal splits it into lines
  // and joins it back after ScrollTrigger has already measured.
  const resize = new ResizeObserver(() => {
    measure();
    render(trigger.progress);
  });
  resize.observe(title);

  return {
    destroy() {
      resize.disconnect();
      trigger.kill();
      title.style.transform = '';
    },
  };
}
