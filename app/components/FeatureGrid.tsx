'use client';

import {
  BriefcaseBusiness,
  FileCheck2,
  ScanSearch,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { Reveal } from './Reveal';
import Tilt from './Tilt';

const FEATURES = [
  {
    id: '01',
    icon: ScanSearch,
    title: 'Offer intelligence',
    desc: 'Turn complex offer details into clear, understandable information before you decide.',
    label: 'UNDERSTAND',
  },
  {
    id: '02',
    icon: FileCheck2,
    title: 'Agreement clarity',
    desc: 'Review important terms and spot questions worth asking before you sign.',
    label: 'REVIEW',
  },
  {
    id: '03',
    icon: BriefcaseBusiness,
    title: 'Work Passport',
    desc: 'Keep a structured record of your work journey and important employment milestones.',
    label: 'DOCUMENT',
  },
  {
    id: '04',
    icon: ShieldCheck,
    title: 'Fairness by design',
    desc: 'A thoughtful workflow built around transparency, context, and informed decisions.',
    label: 'EMPOWER',
  },
] as const;

export default function FeatureGrid() {
  return (
    <div className="feature-grid">
      {FEATURES.map((feature, index) => (
        <Reveal key={feature.id} delay={index * 0.08} amount={0.1}>
          <Tilt className={`feature-card feature-${index}`} max={6}>
            <article className="feature-inner">
              <div className="feature-glow" aria-hidden="true" />
              <div className="feature-top">
                <span>
                  {feature.id} / {feature.label}
                </span>
                <ArrowUpRight size={18} />
              </div>
              <div className="feature-art" aria-hidden="true">
                <div className="feature-orbit" />
                <div className="feature-orbit feature-orbit--b" />
                <div className="feature-icon">
                  <feature.icon size={43} strokeWidth={1.3} />
                </div>
                <div className="feature-scan" />
              </div>
              <div className="feature-bottom">
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
              <div className="feature-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </div>
            </article>
          </Tilt>
        </Reveal>
      ))}
    </div>
  );
}
