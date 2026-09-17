// Number count-up helpers for the SPECS section.

const formatters = new Map();

/** Cubic ease-out on a clamped progress: fast start, gentle landing. */
export function easeOutCubic(progress) {
  const t = Math.min(1, Math.max(0, progress));
  return 1 - (1 - t) ** 3;
}

/** Decimal places written in a numeric string, e.g. "7.0" → 1. */
export function decimalsOf(text) {
  const [, fraction = ''] = String(text).split('.');
  return fraction.length;
}

/** Value shown at an animation progress, rounded to the target's precision. */
export function countAt(target, progress, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(target * easeOutCubic(progress) * factor) / factor;
}

/** English number formatting with grouping, e.g. 1350 → "1,350". */
export function formatCount(value, decimals = 0) {
  if (!formatters.has(decimals)) {
    formatters.set(
      decimals,
      new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    );
  }
  return formatters.get(decimals).format(value);
}
