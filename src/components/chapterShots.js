// Lite mode only: loads the chapter stills. Full mode draws the same shots live, and the CSS hides
// the figures there, so the images stay in data-src and are never downloaded.

/** @param {ParentNode} root */
export function initChapterShots(root) {
  for (const image of root.querySelectorAll('.chapter__shot-image[data-src]')) {
    image.src = image.dataset.src;
    image.removeAttribute('data-src');
  }
}
