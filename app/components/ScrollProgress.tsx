'use client';

import { useEffect, useRef, useState } from 'react';

/** Thin progress rail pinned to the top of the viewport. */
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const update = () => {
      frame.current = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div className="scroll-meter" aria-hidden="true">
      <div className="scroll-meter__fill" style={{ width: `${progress}%` }} />
      <div className="scroll-meter__glow" style={{ left: `${progress}%` }} />
    </div>
  );
}
