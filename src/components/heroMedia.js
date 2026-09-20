// The light page's hero picture: the phone's stand-in for the 3D stage, a muted six-second turn
// around the car behind the title. See lib/heroMedia.js for who gets it and docs/design.md.
//
// Nothing is fetched until the visitor comes through the sound screen. Until then the hero weighs
// exactly what it weighed before, which is what keeps the phone's Lighthouse untouched.

import { decideHeroMedia } from '../lib/heroMedia.js';

const CLIP = '/video/hero.mp4';
const POSTER = '/video/hero-poster.webp';
const SIZE = { width: 720, height: 1280 };

/** The still frame, for a visitor who asked for less movement or less data. */
function still() {
  const image = document.createElement('img');
  image.className = 'hero__media-frame';
  image.src = POSTER;
  image.alt = ''; // decorative: the hero's own words carry the meaning
  image.width = SIZE.width;
  image.height = SIZE.height;
  return image;
}

/** The loop. It carries no sound track at all, so nothing can play out loud by accident. */
function loop() {
  const video = document.createElement('video');
  video.className = 'hero__media-frame';
  video.src = CLIP;
  video.poster = POSTER;
  video.width = SIZE.width;
  video.height = SIZE.height;
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true; // iOS plays inline rather than taking over the screen
  video.setAttribute('aria-hidden', 'true');
  video.play().catch(() => {}); // a refused autoplay leaves the poster, which is the fallback anyway
  return video;
}

/**
 * @param {ParentNode} root
 * @param {{ mode?: string, reducedMotion?: boolean, saveData?: boolean }} env
 */
export function createHeroMedia(root, env) {
  const slot = root.querySelector('.hero__media');

  return {
    /** The visitor is in: now, and only now, the hero may weigh something. */
    enter() {
      if (!slot || slot.childElementCount) return;
      const { media, reasons } = decideHeroMedia({ ...env, entered: true });
      if (media === 'image' && reasons.includes('full-mode')) return; // the 3D stage is the picture
      slot.append(media === 'video' ? loop() : still());
      // The hero now has a picture behind its words, and the softest grey needs a lift (hero.css).
      slot.closest('.hero')?.classList.add('hero--lit');
      console.info(`[supra] hero=${media}`, reasons);
    },
  };
}
