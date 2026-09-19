// The car waking up: the key turns and its lights come on (a double blink, slow enough to see), then
// the engine starts and the camera leans in while it revs. Times in seconds.

// Headlights: on, off, then on for good.
const BLINK = 0.15;
const GAP = 0.2;
// Tail lights: they fade up once the headlights have settled.
const REAR_DELAY = 0.45;
const REAR_FADE = 0.6;

const clamp01 = (x) => Math.min(1, Math.max(0, x));

/**
 * Brightness of the front and rear lights, 0 (off) to 1 (as the car is dressed).
 * @param {number} t
 * @param {number} onAt when the key turns and the headlights first light
 */
export function lightsAt(t, onAt) {
  const since = t - onAt;
  if (since < 0) return { front: 0, rear: 0 };

  const front = since >= BLINK && since < BLINK + GAP ? 0 : 1;
  const r = clamp01((since - REAR_DELAY) / REAR_FADE);
  const rear = r * r * (3 - 2 * r); // smoothstep
  return { front, rear };
}

/**
 * How far the camera has leaned in, easing out over the clip.
 * @param {number} t
 * @param {number} duration the clip's length
 * @param {number} distance the full push, in metres
 */
export function dollyAt(t, duration, distance) {
  const p = clamp01(t / duration);
  return distance * (1 - (1 - p) ** 3);
}
