'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionPreference } from './useMotionPreference';

const LABELS = ['CLARITY', 'TRUST', 'CONTROL'];
const COPY = [
  'Turn complex decisions into understandable next steps.',
  'Review what matters with transparency and context.',
  'Stay in charge of your own working journey.',
];

/**
 * Holographic core explorer. The three CLARITY / TRUST / CONTROL tabs and their copy
 * are unchanged; the tilt is written to CSS variables so pointer movement stays at
 * 60fps without re-rendering the React tree.
 */
export default function HoloCore() {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();

  const reset = () => {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty('--holo-rx', '0deg');
    el.style.setProperty('--holo-ry', '0deg');
  };

  return (
    <div className="holo-wrap">
      <div className="holo-caption">
        <span className="live-dot" /> INTERACTIVE / ORYQEN INTELLIGENCE
      </div>
      <div
        className="holo-stage"
        ref={stageRef}
        onPointerMove={(event) => {
          if (reduced || event.pointerType === 'touch') return;
          const el = stageRef.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;
          el.style.setProperty('--holo-rx', `${(0.5 - py) * -18}deg`);
          el.style.setProperty('--holo-ry', `${(px - 0.5) * 24}deg`);
        }}
        onPointerLeave={reset}
      >
        <div className="holo-grid" aria-hidden="true" />
        <div className="holo-scan" aria-hidden="true" />
        <div className="holo-glow" aria-hidden="true" />
        <div className="holo-assembly" aria-hidden="true">
          <div className="holo-ring ring-a" />
          <div className="holo-ring ring-b" />
          <div className="holo-ring ring-c" />
          <div className="holo-ring ring-d" />
          <div className="holo-core">
            <div className="holo-core-inner">◈</div>
          </div>
          <div className="holo-satellite sat-a" />
          <div className="holo-satellite sat-b" />
          <div className="holo-satellite sat-c" />
        </div>
        <span className="holo-cross cross-a" aria-hidden="true">
          +
        </span>
        <span className="holo-cross cross-b" aria-hidden="true">
          +
        </span>
        <span className="holo-coord">
          OQ / CORE 001
          <br />
          SYSTEM ONLINE
        </span>
        <div className="holo-hud" aria-hidden="true">
          <span>MODE / 0{active + 1}</span>
          <span className="holo-hud-bar">
            <i style={{ width: `${((active + 1) / LABELS.length) * 100}%` }} />
          </span>
          <span>{LABELS[active]}</span>
        </div>
      </div>
      <div className="holo-bottom">
        <div className="holo-copy">
          <span className="section-tag">EXPLORE THE CORE</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={LABELS[active]}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <h3>
                {LABELS[active]} <em>BY DESIGN.</em>
              </h3>
              <p>{COPY[active]}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="holo-tabs" role="group" aria-label="Explore core values">
          {LABELS.map((label, index) => (
            <button
              key={label}
              className={active === index ? 'active' : ''}
              onClick={() => setActive(index)}
              aria-pressed={active === index}
            >
              {String(index + 1).padStart(2, '0')} / {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
