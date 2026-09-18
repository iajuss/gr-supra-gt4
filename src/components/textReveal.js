// Editorial reveal: headings rise line by line from behind a mask; labels fade up.
// Markup: [data-reveal="lines"] on headings, [data-reveal="fade"] on small labels.

import { gsap } from 'gsap';
import { groupByLine } from '../lib/lines.js';

const START_VISIBILITY = 0.35;

/**
 * @param {ParentNode} scope
 * @param {{ reducedMotion: boolean }} options
 */
export async function initTextReveal(scope, { reducedMotion }) {
  if (reducedMotion) return;
  await document.fonts.ready; // line breaks depend on the display font metrics

  const observer = new IntersectionObserver(
    (entries) => {
      entries.filter((e) => e.isIntersecting).forEach(({ target }) => {
        observer.unobserve(target);
        reveal(target);
      });
    },
    { threshold: START_VISIBILITY },
  );

  scope.querySelectorAll('[data-reveal]').forEach((element) => {
    if (element.dataset.reveal === 'lines') splitLines(element);
    gsap.set(targetsOf(element), hiddenState(element));
    observer.observe(element);
  });
}

function reveal(element) {
  const isLines = element.dataset.reveal === 'lines';
  gsap.to(targetsOf(element), {
    ...(isLines ? { yPercent: 0 } : { y: 0, opacity: 1 }),
    duration: isLines ? 0.9 : 0.6,
    ease: 'expo.out',
    stagger: 0.08,
    // Restore plain text once visible, so later resizes reflow naturally.
    onComplete: () => isLines && unsplit(element),
  });
}

function targetsOf(element) {
  return element.dataset.reveal === 'lines'
    ? element.querySelectorAll('.reveal-line__inner')
    : element;
}

function hiddenState(element) {
  return element.dataset.reveal === 'lines' ? { yPercent: 110 } : { y: 16, opacity: 0 };
}

/** Wraps each visual line of a plain-text element in a masked span. */
function splitLines(element) {
  const text = element.textContent.trim().replace(/\s+/g, ' ');
  element.dataset.revealText = text;

  const words = text.split(' ').map((word) => {
    const span = document.createElement('span');
    span.textContent = word;
    return span;
  });
  element.replaceChildren(...words.flatMap((span, i) => (i ? [' ', span] : [span])));

  const lines = groupByLine(words.map((span) => span.offsetTop)).map((indices) => {
    const line = document.createElement('span');
    const inner = document.createElement('span');
    line.className = 'reveal-line';
    line.setAttribute('aria-hidden', 'true');
    inner.className = 'reveal-line__inner';
    inner.textContent = indices.map((i) => words[i].textContent).join(' ');
    line.append(inner);
    return line;
  });
  // Screen readers get the sentence once, from a hidden copy (aria-label is not allowed on every
  // element, e.g. a <p>). Spaces between the block-level lines keep them readable for search.
  const spoken = document.createElement('span');
  spoken.className = 'visually-hidden';
  spoken.textContent = text;
  element.replaceChildren(spoken, ...lines.flatMap((line) => [' ', line]));
}

function unsplit(element) {
  element.textContent = element.dataset.revealText;
}
