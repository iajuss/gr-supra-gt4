import { describe, expect, it } from 'vitest';
import { byteRatio, percentShown } from './progress.js';

describe('byteRatio', () => {
  it('turns a download progress event into a 0–1 ratio', () => {
    expect(byteRatio({ loaded: 0, total: 200 })).toBe(0);
    expect(byteRatio({ loaded: 50, total: 200 })).toBe(0.25);
    expect(byteRatio({ loaded: 200, total: 200 })).toBe(1);
  });

  it('returns null when the total size is unknown (no Content-Length)', () => {
    expect(byteRatio({ loaded: 500, total: 0 })).toBeNull();
    expect(byteRatio({ loaded: 500 })).toBeNull();
  });

  it('clamps a loaded count past the total', () => {
    expect(byteRatio({ loaded: 300, total: 200 })).toBe(1);
  });
});

describe('percentShown', () => {
  it('shows whole percents of the ratio', () => {
    expect(percentShown(0, 0.256)).toBe(25);
  });

  it('never goes backwards', () => {
    expect(percentShown(40, 0.1)).toBe(40);
  });

  it('keeps an unknown ratio where it was', () => {
    expect(percentShown(12, null)).toBe(12);
  });

  it('stops at 99: 100 waits until the car is decoded and on stage', () => {
    expect(percentShown(0, 1)).toBe(99);
    expect(percentShown(99, 1)).toBe(99);
  });
});
