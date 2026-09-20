// Who gets the hero's moving picture and who keeps the still one.
// See docs/design.md → "Rodada de upgrades" (celular: vídeo curto no hero do lite).
//
// The light page has no 3D, so a short muted loop is the only way the phone sees the car move. It is
// a download, though, so it waits for the visitor to come through the sound screen: until then the
// page weighs exactly what it weighed before, which is what keeps the phone's Lighthouse at 100.

const RULES = [
  ['full-mode', (env) => env.mode !== 'lite'], // the 3D stage already moves
  ['reduced-motion', (env) => Boolean(env.reducedMotion)],
  ['save-data', (env) => Boolean(env.saveData)],
  ['not-entered', (env) => !env.entered], // nothing is fetched before the visitor asks to come in
];

/**
 * @param {{ mode?: 'full' | 'lite', reducedMotion?: boolean, saveData?: boolean, entered?: boolean }} env
 * @returns {{ media: 'video' | 'image', reasons: string[] }}
 */
export function decideHeroMedia(env) {
  const reasons = RULES.filter(([, applies]) => applies(env)).map(([reason]) => reason);
  return { media: reasons.length ? 'image' : 'video', reasons };
}
