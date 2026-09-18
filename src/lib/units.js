// Unit helpers for figures quoted on the page.

const HP_PER_KW = 1.341022; // mechanical horsepower in one kilowatt

/**
 * Power-to-weight in mechanical hp per metric tonne. Taking kW keeps it free of the hp/PS ambiguity
 * in published figures.
 * @param {number} kilowatts
 * @param {number} kilograms
 */
export function hpPerTonne(kilowatts, kilograms) {
  if (!(kilograms > 0)) throw new RangeError(`hpPerTonne: weight must be positive, got ${kilograms}`);
  return (kilowatts * HP_PER_KW) / (kilograms / 1000);
}

/** How much larger `value` is than `reference`, in percent (150 vs 100 → 50). */
export function percentMore(value, reference) {
  return (value / reference - 1) * 100;
}
