// The camera held in a hand, instead of bolted to a tripod: a slow, never-repeating drift of the
// framing. Pure maths on purpose — the shape of the movement is testable, and the scene only asks
// it for a value at a moment in time.

/**
 * Sines whose periods share no small ratio, so their sum never comes back round to where it was.
 * The weights add up to one, which is what keeps the drift inside [-1, 1] at any moment.
 * Two different sets, so the framing does not sway up and sideways together.
 */
const WAVES = {
  yaw: [
    { hz: 0.0703, weight: 0.5 },
    { hz: 0.1907, weight: 0.32 },
    { hz: 0.4409, weight: 0.18 },
  ],
  pitch: [
    { hz: 0.0911, weight: 0.5 },
    { hz: 0.2411, weight: 0.32 },
    { hz: 0.5303, weight: 0.18 },
  ],
};

const wave = (waves, seconds) =>
  waves.reduce((sum, { hz, weight }) => sum + weight * Math.sin(2 * Math.PI * hz * seconds), 0);

/** Smoothstep: 0 to 1 over `span`, leaving and arriving at a standstill. */
function easeOver(seconds, span) {
  if (!(span > 0)) return 1;
  if (seconds >= span) return 1;
  const t = Math.max(0, seconds) / span;
  return t * t * (3 - 2 * t);
}

/**
 * The hand's drift at a moment, as a share of the amplitude it is allowed: -1 to 1 on each axis,
 * never beyond. Every sine starts at zero, so the movement begins exactly where the tripod had it;
 * `easeIn` then takes the speed up from a standstill as well, so switching it on cannot be seen.
 * @param {number} seconds since the drift was switched on
 * @param {number} [easeIn] seconds the movement takes to reach its full size
 * @returns {{ yaw: number, pitch: number }}
 */
export function handheldAt(seconds, easeIn = 0) {
  const entrance = easeOver(seconds, easeIn);
  return { yaw: wave(WAVES.yaw, seconds) * entrance, pitch: wave(WAVES.pitch, seconds) * entrance };
}

/**
 * A shot re-aimed by the drift: the camera stays exactly where the chapter puts it and only the
 * framing turns, as a hand on a long lens does. The distance to the subject is untouched, so the
 * car neither grows nor shrinks — and `offsetTarget` still frames it against the page's text.
 * @param {{ position: { x: number, y: number, z: number }, target: { x: number, y: number, z: number } }} shot
 * @param {ReturnType<typeof handheldAt>} drift
 * @param {{ yaw: number, pitch: number }} amplitude degrees at the edge of the drift
 */
export function applyHandheld(shot, drift, amplitude) {
  const yaw = (drift.yaw * amplitude.yaw * Math.PI) / 180;
  const pitch = (drift.pitch * amplitude.pitch * Math.PI) / 180;
  if (!yaw && !pitch) return shot;

  const { position, target } = shot;
  const aim = { x: target.x - position.x, y: target.y - position.y, z: target.z - position.z };
  const flat = Math.hypot(aim.x, aim.z);
  const reach = Math.hypot(flat, aim.y);
  const azimuth = Math.atan2(aim.z, aim.x) + yaw;
  const elevation = Math.atan2(aim.y, flat) + pitch;
  const ground = Math.cos(elevation) * reach;

  return {
    ...shot,
    target: {
      x: position.x + Math.cos(azimuth) * ground,
      y: position.y + Math.sin(elevation) * reach,
      z: position.z + Math.sin(azimuth) * ground,
    },
  };
}
