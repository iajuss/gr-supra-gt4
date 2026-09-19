// The page opening, as a car starting: the screen lifts off a dark car, the key turns and the lights
// blink on, then the engine starts (and the hero's title lands when it catches). Seconds from the
// visitor's gesture on the sound screen. components/ignitionShow.js and main.js.

export default {
  // The fog clears as the screen lifts (its fade is LEAVE_MS in components/preloader.js).
  fogMs: 700,
  // The key turns: the headlights' double blink starts (lib/ignition.js).
  keyAt: 0.7,
  // The engine clip starts; it catches engineSound.catchAt later.
  engineAt: 1.5,
};
