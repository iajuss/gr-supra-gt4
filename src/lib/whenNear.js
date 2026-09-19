// Resolves once an element comes within reach of the viewport, so heavy work can wait until it is needed.

/**
 * @param {Element} element
 * @param {string} [rootMargin] how far ahead of the viewport counts as near (default: one screen)
 * @returns {Promise<void>}
 */
export function whenNear(element, rootMargin = '100% 0px') {
  if (typeof IntersectionObserver === 'undefined') return Promise.resolve();

  return new Promise((resolve) => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        resolve();
      },
      { rootMargin },
    );
    observer.observe(element);
  });
}
