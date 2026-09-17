/**
 * Binary search over an ascending array: index of the last segment start at or before `value`.
 * Capped at length - 2, so `sorted[index + 1]` always exists.
 * @param {number[]} sorted
 * @param {number} value
 */
export function lastIndexAtOrBefore(sorted, value) {
  let low = 0;
  let high = sorted.length - 2;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (sorted[mid] <= value) low = mid;
    else high = mid - 1;
  }
  return low;
}

/** Linear interpolation from a (t = 0) to b (t = 1). */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
