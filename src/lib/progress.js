// Loading progress for the preloader: download bytes in, the percent on screen out.

/**
 * Share of a download already received, from a ProgressEvent-like object.
 * @param {{ loaded: number, total?: number }} event
 * @returns {number | null} 0–1, or null when the server did not send the size
 */
export function byteRatio({ loaded, total }) {
  if (!(total > 0)) return null;
  return Math.min(1, loaded / total);
}

/**
 * The percent to show next. It never goes backwards and holds at 99: the last step (decoding the
 * model and putting it on stage) is only marked by the caller, with 100.
 * @param {number} shown the percent currently on screen
 * @param {number | null} ratio from byteRatio
 */
export function percentShown(shown, ratio) {
  if (ratio === null) return shown;
  return Math.max(shown, Math.min(99, Math.floor(ratio * 100)));
}
