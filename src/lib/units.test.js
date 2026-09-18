import { describe, expect, it } from 'vitest';
import { hpPerTonne, percentMore } from './units.js';

describe('hpPerTonne', () => {
  it('turns kW and kg into mechanical hp per tonne', () => {
    expect(hpPerTonne(1000 / 1.341022, 1000)).toBeCloseTo(1000, 6);
  });

  it('gives the GR Supra GT4 and the road GR Supra 3.0 their official ratios', () => {
    expect(Math.round(hpPerTonne(320, 1350))).toBe(318); // GT4: 320 kW, 1,350 kg
    expect(Math.round(hpPerTonne(250, 1495))).toBe(224); // road 3.0: 250 kW, 1,495 kg without driver
  });

  it('rejects a weight that is not positive', () => {
    expect(() => hpPerTonne(320, 0)).toThrow(RangeError);
  });
});

describe('percentMore', () => {
  it('says how much larger a value is than a reference, in percent', () => {
    expect(percentMore(150, 100)).toBe(50);
    expect(Math.round(percentMore(hpPerTonne(320, 1350), hpPerTonne(250, 1495)))).toBe(42);
  });
});
