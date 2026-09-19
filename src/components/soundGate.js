// "Turn your sound up": shown over the page once it has loaded. Any key, click or tap starts the engine
// and opens the page; "Enter without sound" (or Escape) opens it in silence. The choice is reported
// synchronously, inside the gesture, which is what lets the browser play the sound.

import { choiceFromKey } from '../lib/soundGate.js';

/**
 * @param {HTMLElement} root .gate
 * @param {object} options
 * @param {(choice: 'sound' | 'silent') => void} options.onChoice
 * @param {HTMLElement} [options.surface] what a click anywhere lands on (the full-screen preloader)
 */
export function openSoundGate(root, { onChoice, surface = root }) {
  const start = root.querySelector('[data-gate-sound]');
  const silent = root.querySelector('[data-gate-silent]');
  let chosen = false;

  function choose(choice) {
    if (chosen) return;
    chosen = true;
    document.removeEventListener('keydown', onKey, true);
    surface.removeEventListener('click', onClick);
    onChoice(choice);
  }

  function onKey(event) {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    const choice = choiceFromKey(event.key, { onButton: event.target === start || event.target === silent });
    if (!choice) return;
    event.preventDefault();
    choose(choice);
  }

  // A click anywhere on the screen starts the engine, except on the silent button.
  function onClick(event) {
    choose(silent.contains(event.target) ? 'silent' : 'sound');
  }

  root.hidden = false;
  document.addEventListener('keydown', onKey, true);
  surface.addEventListener('click', onClick);
  start.focus({ preventScroll: true });
}
