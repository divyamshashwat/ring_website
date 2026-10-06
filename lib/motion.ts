export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** House easing curves. Never linear. */
export const EASE = {
  /** the signature: a long, decelerating settle */
  settle: 'expo.out',
  inOut: 'expo.inOut',
  soft: 'power3.out',
  page: 'power4.inOut',
  css: 'cubic-bezier(0.22, 1, 0.36, 1)',
};
