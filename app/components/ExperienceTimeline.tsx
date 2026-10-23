'use client';

import { useRef } from 'react';
import {
  motion,
  useScroll,
 useSpring,
 useTransform,
} from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import AppScreen from './AppScreen';
import { useMotionPreference } from './useMotionPreference';

const STEPS = [
  ['01', 'ADD AN OPPORTUNITY', 'Bring your offer details together in one place.'],
  ['02', 'EXPLORE THE DETAILS', 'Review useful context and important terms.'],
  ['03', 'ASK BETTER QUESTIONS', 'Identify what needs clarification before committing.'],
  ['04', 'KEEP MOVING', 'Build your work record as your journey grows.'],
] as const;

/**
 * The four original experience steps, arranged as a spatial timeline with a
 * scroll-linked rail. Numbers, titles and descriptions are unchanged.
 */
export default function ExperienceTimeline() {
  const stepsRef = useRef<HTMLDivElement>(null);
  const reduced = useMotionPreference();
  const { scrollYProgress } = useScroll({
    target: stepsRef,
    offset: ['start 78%', 'end 62%'],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });
  const railScale = useTransform(smooth, [0, 1], [0.04, 1]);
  const phoneRotate = useTransform(smooth, [0, 1], reduced ? [0, 0] : [-7, 7]);
  const phoneY = useTransform(smooth, [0, 1], reduced ? [0, 0] : [14, -22]);

  return (
    <div className="experience-grid">
      <motion.div className="experience-visual" style={{ rotate: phoneRotate, y: phoneY }}>
        <div className="experience-rings" aria-hidden="true">
          <i className="ering ering-a" />
          <i className="ering ering-b" />
          <i className="ering ering-c" />
          <span className="ering-core" />
        </div>
        <div className="experience-phone">
          <AppScreen small />
        </div>
        <div className="experience-label">A CLEARER WAY FORWARD ↗</div>
      </motion.div>

      <div className="steps" ref={stepsRef}>
        <p className="steps-intro">A more confident decision starts with a few simple steps.</p>
        <div className="steps-rail" aria-hidden="true">
          <motion.span className="steps-rail-fill" style={{ scaleY: railScale }} />
        </div>
        {STEPS.map(([number, title, description], index) => (
          <div className="step" key={number}>
            <span className="step-node">{number}</span>
            <div className="step-copy">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <ArrowUpRight size={19} className="step-arrow" />
            <span className="step-depth" aria-hidden="true">
              {String(index + 1).padStart(2, '0')} / 04
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
