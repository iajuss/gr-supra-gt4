// Volume curve for playing a stretch of a recording: a quick fade in against clicks, a hold, and a fade
// to silence at the end, so a clip cut out of a longer take never stops dead.

/**
 * @param {{ start: number, end: number, volume: number, fadeIn: number, fadeOut: number }} clip seconds
 * @returns {{ offset: number, duration: number, gain: Array<{ time: number, value: number }> }}
 *   where to start in the recording, how long to play, and gain points in seconds from the start
 */
export function clipEnvelope({ start, end, volume, fadeIn, fadeOut }) {
  const duration = end - start;
  if (!(duration > 0)) throw new Error(`clipEnvelope: end (${end}) must come after start (${start})`);

  // A clip shorter than both fades gets proportionally shorter fades.
  const squeeze = Math.min(1, duration / (fadeIn + fadeOut));
  const rampIn = fadeIn * squeeze;
  const rampOut = fadeOut * squeeze;

  return {
    offset: start,
    duration,
    gain: [
      { time: 0, value: 0 },
      { time: rampIn, value: volume },
      { time: duration - rampOut, value: volume },
      { time: duration, value: 0 },
    ],
  };
}
