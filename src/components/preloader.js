// Full-mode loading screen: "Loading_telemetry — NN%" with the real download progress of the car.
// It blocks the page while the model loads, but never for longer than OPEN_AFTER_MS: on a slow line
// the page opens anyway and the car emerges when it arrives.

import { percentShown } from '../lib/progress.js';

const OPEN_AFTER_MS = 8000;
const LEAVE_MS = 600; // matches the opacity transition in stage.css

/**
 * @param {HTMLElement} root .preloader
 * @param {{ reducedMotion: boolean }} options
 */
export function createPreloader(root, { reducedMotion }) {
  const value = root.querySelector('.preloader__value');
  const html = document.documentElement;
  let shown = 0;
  let open = false;

  // While the screen covers the page, what is behind it can be neither focused nor read.
  const page = [...document.body.children].filter((element) => element !== root && element.tagName !== 'SCRIPT');
  const setPageInert = (inert) => page.forEach((element) => (element.inert = inert));

  root.hidden = false;
  html.classList.add('is-loading');
  setPageInert(true);
  const timeout = setTimeout(close, OPEN_AFTER_MS);

  function write(percent) {
    shown = percent;
    if (value) value.textContent = String(percent);
  }

  /** Lifts the screen off the page; safe to call more than once. */
  function close() {
    if (open) return;
    open = true;
    clearTimeout(timeout);
    html.classList.remove('is-loading');
    setPageInert(false);

    if (reducedMotion) {
      root.hidden = true;
      return;
    }
    root.classList.add('preloader--leaving');
    setTimeout(() => (root.hidden = true), LEAVE_MS);
  }

  return {
    /** @param {number | null} ratio share of the model downloaded, null if unknown */
    setProgress(ratio) {
      const next = percentShown(shown, ratio);
      if (next !== shown) write(next);
    },
    /** The car is decoded and on stage. */
    finish() {
      write(100);
      close();
    },
    /** Loading failed: step aside so the lite fallback shows. */
    fail: close,
    get isOpen() {
      return open;
    },
  };
}
