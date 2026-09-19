// A room for the engine to sound in: the impulse response a ConvolverNode needs, made of decaying noise
// instead of a recorded room, so there is nothing to download. Seeded, so it sounds the same every visit.

/** Small deterministic PRNG (mulberry32), -1..1. */
function noise(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2147483648 - 1;
  };
}

/**
 * @param {{ seconds: number, decay: number, sampleRate: number, seed: number }} options
 *   decay: how steeply it dies away (higher is a deader room)
 * @returns {[Float32Array, Float32Array]} left and right
 */
export function reverbImpulse({ seconds, decay, sampleRate, seed }) {
  const length = Math.round(seconds * sampleRate);
  return [seed, seed + 1].map((channelSeed) => {
    const random = noise(channelSeed);
    const samples = new Float32Array(length);
    for (let i = 0; i < length; i++) samples[i] = random() * (1 - i / length) ** decay;
    return samples;
  });
}
