/** Seconds → "m:ss.mmm" (rounded to the millisecond). */
export function formatLapTime(seconds) {
  const totalMs = Math.round(seconds * 1000);
  const minutes = Math.floor(totalMs / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${minutes}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/** km/h → three-digit display, e.g. "094". */
export function formatSpeed(speedKmh) {
  return String(Math.round(speedKmh)).padStart(3, '0');
}
