// How loud the engine clip is over time, so the picture can move with the sound whether or not the
// visitor hears it (the curve comes from the decoded file, not from the speakers).

/**
 * RMS per window, scaled so the loudest window is 1.
 * @param {Float32Array} samples one channel
 * @param {number} sampleRate
 * @param {number} window seconds per value
 * @returns {Float32Array}
 */
export function loudnessCurve(samples, sampleRate, window) {
  const size = Math.max(1, Math.round(sampleRate * window));
  const curve = new Float32Array(Math.floor(samples.length / size));
  let top = 0;
  for (let w = 0; w < curve.length; w++) {
    let sum = 0;
    for (let i = w * size; i < (w + 1) * size; i++) sum += samples[i] * samples[i];
    curve[w] = Math.sqrt(sum / size);
    top = Math.max(top, curve[w]);
  }
  if (top > 0) for (let w = 0; w < curve.length; w++) curve[w] /= top;
  return curve;
}

/**
 * The loudness at t seconds, interpolated between window centres; 0 outside the clip.
 * @param {Float32Array} curve from loudnessCurve
 * @param {number} window seconds per value
 * @param {number} t
 */
export function loudnessAt(curve, window, t) {
  if (!curve.length || t < 0 || t > curve.length * window) return 0;
  const position = t / window - 0.5; // in windows, from the first centre
  const i = Math.floor(position);
  if (i < 0) return curve[0];
  if (i >= curve.length - 1) return curve[curve.length - 1];
  const f = position - i;
  return curve[i] * (1 - f) + curve[i + 1] * f;
}
