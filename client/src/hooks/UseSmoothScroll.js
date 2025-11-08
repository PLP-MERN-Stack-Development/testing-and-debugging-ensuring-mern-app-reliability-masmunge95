import { useCallback } from 'react';
import { smoothScrollTo } from './animation.js';

/**
 * A custom hook that provides a function to smoothly scroll to an element.
 * @returns {function} A function to trigger the scroll.
 */
export const useSmoothScroll = () => {
  const scrollTo = useCallback((element, duration = 1500, onComplete, offset = 0) => {
    if (!element) return;
    smoothScrollTo(element, duration, onComplete, offset);
  }, []);

  return scrollTo;
};