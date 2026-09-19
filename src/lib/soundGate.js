// The sound screen's keyboard: which key starts the engine, which enters in silence, which is left alone.

/** Keys that move focus or build shortcuts: pressing them is not a choice. */
const IGNORED = new Set(['Tab', 'Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock', 'NumLock', 'Fn']);

/** Keys that activate a focused button: the button's own click decides then. */
const ACTIVATING = new Set(['Enter', ' ']);

/**
 * @param {string} key KeyboardEvent.key
 * @param {{ onButton?: boolean }} [context] whether focus is on one of the screen's buttons
 * @returns {'sound' | 'silent' | null}
 */
export function choiceFromKey(key, { onButton = false } = {}) {
  if (key === 'Escape') return 'silent';
  if (IGNORED.has(key)) return null;
  if (onButton && ACTIVATING.has(key)) return null;
  return 'sound';
}
