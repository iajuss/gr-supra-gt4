// The screen over the page before it opens, in two phases:
// 1. loading (full mode): "Loading_telemetry — NN%" and a lime line, with the real download progress
//    of the car. It is
//    ready when the car is on stage, when loading fails, or after READY_AFTER_MS on a slow line (the car
//    then emerges when it arrives);
// 2. once ready, the sound screen takes over (components/soundGate.js) and the page opens on the
//    visitor's choice. Lite has no loading phase: it is ready at once.

import { percentShown } from '../lib/progress.js';

const READY_AFTER_MS = 8000;
const LEAVE_MS = 600; // matches the opacity transition in stage.css
const LOADED_MS = 400; // the loading phase steps out (stage.css, --dur-base) before the sound screen

/**
 * @param {HTMLElement} root .preloader
 * @param {{ reducedMotion: boolean }} options
 */
export function createPreloader(root, { reducedMotion }) {
  const loading = root.querySelector('.preloader__loading');
  const value = root.querySelector('.preloader__value');
  const html = document.documentElement;
  let shown = 0;
  let isReady = false;
  let open = false;

  let markReady;
  const ready = new Promise((resolve) => (markReady = resolve));
  let markClosed;
  const closed = new Promise((resolve) => (markClosed = resolve));

  // While the screen covers the page, what is behind it can be neither focused nor read.
  const page = [...document.body.children].filter((element) => element !== root && element.tagName !== 'SCRIPT');
  const setPageInert = (inert) => page.forEach((element) => (element.inert = inert));

  root.hidden = false;
  html.classList.add('is-loading');
  setPageInert(true);
  const timeout = setTimeout(becomeReady, READY_AFTER_MS);

  function write(percent) {
    shown = percent;
    if (value) value.textContent = String(percent);
    root.style.setProperty('--progress', String(percent / 100)); // the lime line (stage.css)
  }

  function becomeReady() {
    if (isReady) return;
    isReady = true;
    clearTimeout(timeout);
    const handOver = () => {
      if (loading) loading.hidden = true;
      markReady();
    };
    if (reducedMotion || !loading) return handOver();
    root.classList.add('preloader--loaded');
    setTimeout(handOver, LOADED_MS);
  }

  /** Lifts the screen off the page; safe to call more than once. */
  function close() {
    if (open) return;
    open = true;
    becomeReady();
    html.classList.remove('is-loading');
    setPageInert(false);
    markClosed();

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
    /** The car is decoded and on stage (or, in lite, there is nothing to load). */
    finish() {
      write(100);
      becomeReady();
    },
    /** Loading failed: the lite fallback takes over behind the screen, which moves on. */
    fail: becomeReady,
    close,
    /** Resolves when loading is over and the sound screen can take over. */
    ready,
    /** Resolves when the page opens. */
    closed,
    get isOpen() {
      return open;
    },
  };
}
