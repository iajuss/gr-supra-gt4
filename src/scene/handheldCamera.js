// The stage camera, alive between the chapters: the scroll decides the framing and this keeps a hand
// on it (lib/handheld.js). It sits between the camera rig and the stage, and while it runs it is the
// only thing writing to the camera, so a frame never lands half shaken.
//
// It is also the only thing on this page that draws while nothing changes, so it switches itself off
// whenever nobody is watching: the 3D zone off screen, or the tab in the background.
//
// `reducedMotion` is insurance, not a live rule: today it never gets this far, because it sends the
// whole page to lite mode (lib/capabilities.js). If that ever changes, this is the one thing on the
// page that would keep moving forever, so the guard stays.

import { applyHandheld, handheldAt } from '../lib/handheld.js';

/**
 * @param {object} options
 * @param {{ setShot: Function, setActive: Function, requestRender: Function }} options.view
 * @param {{ yaw: number, pitch: number }} options.amplitude degrees at the edge of the drift
 * @param {number} options.easeIn seconds the drift takes to reach its full size
 * @param {boolean} [options.reducedMotion] keeps the camera on its tripod
 */
export function createHandheldCamera({ view, amplitude, easeIn, reducedMotion = false }) {
  let tripod = reducedMotion || (!amplitude.yaw && !amplitude.pitch);
  let shot = null;
  let active = false;
  let frame = 0;
  let start = 0;

  function draw(now) {
    // A parked camera never draws, whatever the order of the frame's callbacks: the guard lives
    // here so the loop cannot outlive `park`, which is the only thing that stops it for good.
    if (tripod) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(draw);
    view.setShot(applyHandheld(shot, handheldAt((now - start) / 1000, easeIn), amplitude));
    view.requestRender();
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  /** The drift always starts from a standstill, so coming back cannot be seen either. */
  function run() {
    if (frame || tripod || !active || !shot || document.hidden) return;
    start = performance.now();
    frame = requestAnimationFrame(draw);
  }

  const onVisibility = () => (document.hidden ? stop() : run());
  if (!tripod) document.addEventListener('visibilitychange', onVisibility);

  return {
    /** @param {Parameters<typeof applyHandheld>[0]} next the chapter's own framing, before the hand */
    setShot(next) {
      shot = next;
      if (frame) return; // the running loop picks it up on its next frame, as the only writer
      view.setShot(next);
      view.requestRender();
      run();
    },
    /** @param {boolean} next the 3D zone entering or leaving the viewport */
    setActive(next) {
      active = next;
      view.setActive(next);
      if (active) run();
      else stop();
    },
    /**
     * Back on the tripod for good, when the frame budget cannot afford a camera that draws forever
     * (lib/quality.js). The framing returns to the chapter's own aim, so nothing is left leaning.
     */
    park() {
      if (tripod) return;
      tripod = true;
      stop();
      if (shot) {
        view.setShot(shot);
        view.requestRender();
      }
    },
    destroy() {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
