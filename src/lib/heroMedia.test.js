import { describe, it, expect } from 'vitest';
import { decideHeroMedia } from './heroMedia.js';

/** A phone that has just come through the sound screen: the one case that earns the video. */
const phone = { mode: 'lite', reducedMotion: false, saveData: false, entered: true };

describe('decideHeroMedia', () => {
  it('gives the video to a visitor who is in, on the light page', () => {
    expect(decideHeroMedia(phone)).toEqual({ media: 'video', reasons: [] });
  });

  it.each([
    ['full-mode', { mode: 'full' }],
    ['reduced-motion', { reducedMotion: true }],
    ['save-data', { saveData: true }],
    ['not-entered', { entered: false }],
  ])('keeps the still picture because of %s', (reason, override) => {
    expect(decideHeroMedia({ ...phone, ...override })).toEqual({ media: 'image', reasons: [reason] });
  });

  it('names every reason it has, not just the first', () => {
    const { media, reasons } = decideHeroMedia({ mode: 'full', reducedMotion: true, saveData: true, entered: false });
    expect(media).toBe('image');
    expect(reasons).toEqual(['full-mode', 'reduced-motion', 'save-data', 'not-entered']);
  });

  it('never loads the video before the visitor is in, whatever else is true', () => {
    expect(decideHeroMedia({ ...phone, entered: false }).media).toBe('image');
    expect(decideHeroMedia({ ...phone, entered: undefined }).media).toBe('image');
  });

  it('takes a missing flag as not set, so a partial reading cannot ask for the video by accident', () => {
    expect(decideHeroMedia({ mode: 'lite', entered: true })).toEqual({ media: 'video', reasons: [] });
    expect(decideHeroMedia({}).media).toBe('image');
  });

  it('leaves what it was given alone', () => {
    const given = { ...phone };
    const copy = { ...given };
    decideHeroMedia(given);
    expect(given).toEqual(copy);
  });
});
