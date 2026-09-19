// The car waking up (full mode): its lights blink on when the key turns, and while the engine revs
// the lime rim swells with the sound's loudness and the camera leans in, easing back once the clip
// ends. Driven by the clip's clock, from the decoded file, so it runs the same without sound.

import { LOUDNESS_WINDOW } from './engineSound.js';
import { dollyAt, lightsAt } from '../lib/ignition.js';
import { loudnessAt } from '../lib/loudness.js';

// How much the rim swells at the loudest point, against its normal intensity.
const RIM_SWELL = 0.9;
// How far the camera leans in over the clip, in metres, and how long it takes to settle back.
const DOLLY = 0.35;
const SETTLE_S = 1.5;
// Long enough for the headlights' blink and the tail lights' fade (lib/ignition.js).
const LIGHTS_MS = 1500;

const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

/**
 * @param {object} options
 * @param {{ setRim: (s: number) => void, setDolly: (m: number) => void, requestRender: () => void }} options.view
 *   the car stage
 * @param {{ setLights: (levels: { front: number, rear: number }) => void }} options.car
 * @param {number} options.duration the clip's length in seconds
 * @param {Promise<Float32Array>} options.loudness the clip's loudness curve
 */
export function createIgnitionShow({ view, car, duration, loudness }) {
  car.setLights({ front: 0, rear: 0 }); // dark until the key turns
  view.requestRender();
  let curve = null;
  loudness.then((c) => (curve = c)).catch(() => {});

  return {
    /**
     * @param {{ clipStart: number, lightsOn: number }} times on the performance.now() clock: when the
     *   engine clip starts, and when the headlights first light
     */
    play({ clipStart, lightsOn }) {
      const end = duration + SETTLE_S;
      const step = () => {
        const now = performance.now();
        const t = (now - clipStart) / 1000;
        car.setLights(lightsAt((now - lightsOn) / 1000, 0));
        const loud = curve ? loudnessAt(curve, LOUDNESS_WINDOW, t) : 0;
        view.setRim(1 + RIM_SWELL * loud);
        const back = t > duration ? easeInOut(Math.min(1, (t - duration) / SETTLE_S)) : 0;
        view.setDolly(dollyAt(t, duration, DOLLY) * (1 - back)); // also requests the frame
        if (t < end || now < lightsOn + LIGHTS_MS) requestAnimationFrame(step);
        else {
          view.setRim(1);
          view.setDolly(0);
        }
      };
      requestAnimationFrame(step);
    },
  };
}
