import { describe, it, expect } from 'vitest';
import { formatLapTime, formatSpeed } from './format.js';

describe('formatLapTime', () => {
  it.each([
    [0, '0:00.000'],
    [7.5, '0:07.500'],
    [65.0421, '1:05.042'],
    [105.3704, '1:45.370'],
    [59.9996, '1:00.000'], // rounding carries into the minutes
  ])('%s s → %s', (seconds, text) => {
    expect(formatLapTime(seconds)).toBe(text);
  });
});

describe('formatSpeed', () => {
  it.each([
    [0, '000'],
    [94.4, '094'],
    [287.6, '288'],
  ])('%s km/h → %s', (speed, text) => {
    expect(formatSpeed(speed)).toBe(text);
  });
});
