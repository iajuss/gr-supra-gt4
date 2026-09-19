// The page always opens at the top, where the opening plays out: the browser neither restores the
// previous scroll position on a reload nor jumps to a #section from the address.

/** Call as early as possible, before anything measures the scroll. */
export function startAtTop() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (window.location.hash) {
    history.replaceState(history.state, '', window.location.pathname + window.location.search);
  }
  window.scrollTo(0, 0);
}
