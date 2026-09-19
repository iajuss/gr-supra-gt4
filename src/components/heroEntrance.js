// The hero comes in as the page opens: "Supra" rises from behind a mask as the engine catches
// (lib/heroEntrance.js), then the kicker, the lead and the scroll cue follow. Everything starts hidden
// behind the preloader; reduced motion shows it still.

import { gsap } from 'gsap';

import { entranceSchedule } from '../lib/heroEntrance.js';

/**
 * @param {HTMLElement} hero .hero
 * @param {{ reducedMotion: boolean, catchAt: number }} options catchAt: seconds into the engine clip
 *   when it catches
 */
export function createHeroEntrance(hero, { reducedMotion, catchAt }) {
  if (reducedMotion) return { play() {} };

  const title = hero.querySelector('.hero__title');
  const followers = ['.hero__kicker', '.hero__lead', '.hero__cue'].map((s) => hero.querySelector(s));
  const text = title.textContent.trim();
  const schedule = entranceSchedule({ catchAt });

  // The word in a mask, hidden from screen readers, which read a plain copy instead.
  const spoken = document.createElement('span');
  spoken.className = 'visually-hidden';
  spoken.textContent = text;
  const mask = document.createElement('span');
  mask.className = 'hero__title-mask';
  mask.setAttribute('aria-hidden', 'true');
  const word = document.createElement('span');
  word.className = 'hero__title-part';
  word.textContent = text;
  mask.append(word);
  title.replaceChildren(spoken, mask);

  gsap.set(word, { yPercent: 110 });
  gsap.set(followers, { y: 16, opacity: 0 });

  const timeline = gsap.timeline({ paused: true, onComplete: restore });
  timeline.to(word, { yPercent: 0, duration: 0.8, ease: 'expo.out' }, schedule.title);
  followers.forEach((element, i) => {
    const at = [schedule.kicker, schedule.lead, schedule.cue][i];
    timeline.to(element, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out' }, at);
  });

  // Back to plain markup once in, so later resizes reflow normally.
  function restore() {
    gsap.set([word, ...followers], { clearProps: 'all' });
    title.textContent = text;
  }

  return {
    /**
     * @param {number} startAt when the engine clip starts on the performance.now() clock (heard, or
     *   would be without sound). May be in the past or the future.
     */
    play(startAt) {
      const elapsed = (performance.now() - startAt) / 1000;
      if (elapsed >= 0) timeline.play(elapsed);
      else gsap.delayedCall(-elapsed, () => timeline.play(0));
    },
  };
}
