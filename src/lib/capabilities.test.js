import { describe, it, expect } from 'vitest';
import { decideMode, MIN_FULL_WIDTH } from './capabilities.js';

const desktop = {
  webgl: true,
  reducedMotion: false,
  coarsePointer: false,
  viewportWidth: 1440,
  saveData: false,
};

describe('decideMode', () => {
  it('returns full with no reasons on a capable desktop', () => {
    expect(decideMode(desktop)).toEqual({ mode: 'full', reasons: [] });
  });

  it.each([
    ['no-webgl', { webgl: false }],
    ['reduced-motion', { reducedMotion: true }],
    ['coarse-pointer', { coarsePointer: true }],
    ['narrow-viewport', { viewportWidth: 390 }],
    ['save-data', { saveData: true }],
  ])('returns lite because of %s', (reason, override) => {
    expect(decideMode({ ...desktop, ...override })).toEqual({
      mode: 'lite',
      reasons: [reason],
    });
  });

  it('treats the width threshold as the first full width', () => {
    expect(decideMode({ ...desktop, viewportWidth: MIN_FULL_WIDTH }).mode).toBe('full');
    expect(decideMode({ ...desktop, viewportWidth: MIN_FULL_WIDTH - 1 }).mode).toBe('lite');
  });

  it('sends a wide touch tablet to lite', () => {
    const tabletLandscape = { ...desktop, coarsePointer: true, viewportWidth: 1180 };
    expect(decideMode(tabletLandscape)).toEqual({ mode: 'lite', reasons: ['coarse-pointer'] });
  });

  it('collects every reason that applies', () => {
    const phone = { ...desktop, coarsePointer: true, viewportWidth: 375, saveData: true };
    expect(decideMode(phone).reasons).toEqual(['coarse-pointer', 'narrow-viewport', 'save-data']);
  });
});
