/**
 * Smoothly scrolls to a target element
 * @param {HTMLElement} element - The target element to scroll to
 * @param {number} duration - Duration of the scroll animation in milliseconds
 * @param {Function} onComplete - Callback function to execute when scrolling is complete
 * @param {number} offset - Offset from the target element in pixels
 */
export const smoothScrollTo = (element, duration = 1500, onComplete = () => {}, offset = 0) => {
  const start = window.pageYOffset;
  const target = element.getBoundingClientRect().top + window.pageYOffset - offset;
  const distance = target - start;
  let startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = ease(timeElapsed, start, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    } else {
      onComplete();
    }
  }

  function ease(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

  requestAnimationFrame(animation);
};