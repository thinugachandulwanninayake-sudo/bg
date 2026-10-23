'use client';

import type { ReactNode } from 'react';
import { motion, } from 'framer-motion';
import { useMotionPreference } from './useMotionPreference';

/**
 * Cinematic reveal used across the site. Content is always present in the DOM;
 * only opacity / offset / blur are animated, so nothing depends on JS for the copy
 * to exist. Reduced motion renders the content immediately.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 40,
  amount = 0.14,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  amount?: number;
}) {
  const reduced = useMotionPreference();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y, filter: 'blur(12px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.85, delay, ease: [0.16, 0.72, 0.24, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Shared section header row: left index label + right context label. */
export function SectionTop({ tag, right }: { tag: string; right: string }) {
  return (
    <div className="section-top">
      <span className="section-tag">{tag}</span>
      <span className="section-tag right">{right}</span>
    </div>
  );
}
