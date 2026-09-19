import { describe, expect, it } from 'vitest';

import { entranceSchedule } from './heroEntrance.js';

const CATCH = 0.4;

describe('entranceSchedule', () => {
  it('starts the title just before the engine catches, so it lands with it', () => {
    const s = entranceSchedule({ catchAt: CATCH });
    expect(s.title).toBeLessThan(CATCH);
    expect(s.title).toBeGreaterThanOrEqual(0);
  });

  it('never starts before the clip, even with a very early catch', () => {
    expect(entranceSchedule({ catchAt: 0.02 }).title).toBe(0);
  });

  it('brings the rest in after the title: kicker, then lead, then the scroll cue', () => {
    const s = entranceSchedule({ catchAt: CATCH });
    expect(s.kicker).toBeGreaterThan(s.title);
    expect(s.lead).toBeGreaterThan(s.kicker);
    expect(s.cue).toBeGreaterThan(s.lead);
  });

  it('moves everything with the catch', () => {
    const early = entranceSchedule({ catchAt: 0.4 });
    const late = entranceSchedule({ catchAt: 0.9 });
    expect(late.title - early.title).toBeCloseTo(0.5);
    expect(late.cue - early.cue).toBeCloseTo(0.5);
  });
});
