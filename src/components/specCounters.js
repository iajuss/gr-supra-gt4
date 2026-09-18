// SPECS: numbers count up from zero and the power-to-weight bar fills, once, when the section comes into view.
// Final values are written in the HTML ([data-count]); without JS or with reduced motion they stay as is.

import { countAt, decimalsOf, formatCount } from '../lib/counter.js';

const COUNT_DURATION_MS = 1400;
const STAGGER_MS = 120;
const START_VISIBILITY = 0.35;

/**
 * @param {HTMLElement} root .specs section
 * @param {{ reducedMotion: boolean }} options
 */
export function initSpecCounters(root, { reducedMotion }) {
  if (reducedMotion) return;

  const counters = [...root.querySelectorAll('[data-count]')].map((element) => ({
    element,
    target: Number(element.dataset.count),
    decimals: decimalsOf(element.dataset.count),
  }));
  const bar = root.querySelector('[data-bar]');

  counters.forEach(({ element, decimals }) => (element.textContent = formatCount(0, decimals)));
  bar?.setAttribute('data-bar-state', 'empty');

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      play(counters, bar);
    },
    { threshold: START_VISIBILITY },
  );
  observer.observe(root.querySelector('.specs__grid'));
}

function play(counters, bar) {
  const startedAt = performance.now();
  const barDelay = (counters.length - 1) * STAGGER_MS;

  setTimeout(() => bar?.setAttribute('data-bar-state', 'filled'), barDelay);

  const tick = (now) => {
    let running = false;

    counters.forEach(({ element, target, decimals }, index) => {
      const delay = element.closest('[data-bar]') ? barDelay : index * STAGGER_MS;
      const progress = (now - startedAt - delay) / COUNT_DURATION_MS;
      running ||= progress < 1;
      const text = formatCount(countAt(target, progress, decimals), decimals);
      if (element.textContent !== text) element.textContent = text;
    });

    if (running) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
