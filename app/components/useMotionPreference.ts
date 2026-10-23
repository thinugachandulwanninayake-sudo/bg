'use client';

import { useEffect, useState } from 'react';

/**
 * Reduced-motion preference with a stable server render.
 *
 * `useReducedMotion` from framer-motion can already read the media query during
 * the first client render, which makes the server and client markup disagree.
 * This hook always starts at `false` (matching SSR) and updates after mount, so
 * hydration stays clean and the transitions simply become instant.
 */
export function useMotionPreference() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return reduced;
}
