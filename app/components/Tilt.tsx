'use client';

import { useRef, type ReactNode } from 'react';
import { useMotionPreference } from './useMotionPreference';

/**
 * Pointer-driven 3D tilt. Uses CSS custom properties written straight to the node,
 * so moving the cursor never triggers a React re-render.
 */
export default function Tilt({
  children,
  className = '',
  max = 7,
  scale = 1.015,
  spotlight = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  scale?: number;
  spotlight?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '50%');
    el.style.setProperty('--tilt-scale', '1');
  };

  return (
    <div
      ref={ref}
      className={`tilt ${spotlight ? 'tilt--spotlight' : ''} ${className}`}
      onPointerMove={(event) => {
        if (reduced || event.pointerType === 'touch') return;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        el.style.setProperty('--rx', `${(0.5 - py) * max * 2}deg`);
        el.style.setProperty('--ry', `${(px - 0.5) * max * 2}deg`);
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        el.style.setProperty('--tilt-scale', String(scale));
      }}
      onPointerLeave={reset}
      onBlur={reset}
    >
      <div className="tilt__inner">{children}</div>
    </div>
  );
}
