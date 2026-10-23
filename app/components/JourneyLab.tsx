'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useMotionPreference } from './useMotionPreference';

const STEPS = [
  {
    name: 'Capture the offer',
    heading: 'START WITH THE DETAILS',
    body: 'Keep the role, compensation, working hours and key conditions together in one understandable place.',
    note: 'A single organized view',
  },
  {
    name: 'Find the questions',
    heading: 'MAKE THE UNCLEAR VISIBLE',
    body: 'Explore sample questions about payment, working time, notice periods and responsibilities.',
    note: 'Context before commitment',
  },
  {
    name: 'Build your record',
    heading: 'KEEP YOUR STORY MOVING',
    body: 'Organize milestones and documents in your Work Passport as your professional journey develops.',
    note: 'Your journey, your control',
  },
];

const KINDS = ['Full-time', 'Part-time', 'Freelance'];

/** Interactive product walkthrough. Purely illustrative — it performs no analysis. */
export default function JourneyLab() {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState('Full-time');
  const screenRef = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();
  const current = STEPS[step];

  const resetTilt = () => {
    const el = screenRef.current;
    if (!el) return;
    el.style.setProperty('--lab-rx', '0deg');
    el.style.setProperty('--lab-ry', '0deg');
  };

  return (
    <div className="lab">
      <div className="lab-head">
        <span>
          <span className="live-dot" /> INTERACTIVE PRODUCT WALKTHROUGH
        </span>
        <span>SIMULATION / NOT A LIVE ANALYSIS</span>
      </div>
      <div className="lab-body">
        <div className="lab-left">
          <span className="section-tag">CHOOSE YOUR PATH</span>
          <h3>
            YOUR OFFER.
            <br />
            <em>YOUR CALL.</em>
          </h3>
          <p>
            Explore how ORYQEN could guide a real-world decision. This is an illustrative preview, not
            a working offer evaluation.
          </p>
          <div className="lab-choice" role="group" aria-label="Example employment type">
            {KINDS.map((item) => (
              <button
                key={item}
                className={kind === item ? 'selected' : ''}
                onClick={() => setKind(item)}
                aria-pressed={kind === item}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="lab-stepnav">
            {STEPS.map((item, index) => (
              <button
                key={item.name}
                className={step === index ? 'selected' : ''}
                onClick={() => setStep(index)}
                aria-current={step === index ? 'step' : undefined}
              >
                <span>0{index + 1}</span>
                {item.name}
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </div>

        <div className="lab-right">
          <div
            className="lab-screen"
            ref={screenRef}
            onPointerMove={(event) => {
              if (reduced || event.pointerType === 'touch') return;
              const el = screenRef.current;
              if (!el) return;
              const rect = el.getBoundingClientRect();
              const px = (event.clientX - rect.left) / rect.width;
              const py = (event.clientY - rect.top) / rect.height;
              el.style.setProperty('--lab-rx', `${(0.5 - py) * 8}deg`);
              el.style.setProperty('--lab-ry', `${(px - 0.5) * 10}deg`);
            }}
            onPointerLeave={resetTilt}
          >
            <div className="lab-grid" aria-hidden="true" />
            <div className="lab-screen-top">
              <span>◈ ORYQEN / DEMO</span>
              <span>0{step + 1} — 03</span>
            </div>
            <div className="lab-bubble">{kind.toUpperCase()} / EXAMPLE</div>
            <div className="lab-graphic" aria-hidden="true">
              <div className="lab-circle c1" />
              <div className="lab-circle c2" />
              <div className="lab-ring c3" />
              <div className="lab-glyph">{step === 0 ? '◇' : step === 1 ? '✳' : '◈'}</div>
            </div>
            <div className="lab-screen-info" aria-live="polite">
              <span className="section-tag">STEP 0{step + 1}</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current.heading}
                  initial={reduced ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 1 } : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  <h4>{current.heading}</h4>
                  <p>{current.body}</p>
                  <div className="lab-result">
                    <CheckCircle2 size={17} />
                    {current.note}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="lab-progress" aria-hidden="true">
              <i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
          </div>
          <div className="lab-controls">
            <button onClick={() => setStep((step + 2) % 3)} aria-label="Previous demo step">
              ← PREVIOUS
            </button>
            <span>0{step + 1} / 03</span>
            <button onClick={() => setStep((step + 1) % 3)}>NEXT STEP →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
