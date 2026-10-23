'use client';

import dynamic from 'next/dynamic';
import StageGate from './StageGate';

const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });

/** Static composition shown before the canvas is ready, without WebGL, or on reduced motion. */
export function HeroFallback() {
  return (
    <div className="hero-fallback">
      <span className="hf-ring hf-ring-a" />
      <span className="hf-ring hf-ring-b" />
      <span className="hf-ring hf-ring-c" />
      <span className="hf-core" />
      <span className="hf-glow" />
      <span className="hf-particle hf-p1" />
      <span className="hf-particle hf-p2" />
      <span className="hf-particle hf-p3" />
      <span className="hf-particle hf-p4" />
      <span className="hf-particle hf-p5" />
    </div>
  );
}

export default function HeroStage() {
  return (
    <StageGate
      className="hero-stage-3d"
      fallback={<HeroFallback />}
      description="Decorative 3D scene: orbital rings, holographic panels and glowing particles around the ORYQEN product screen."
    >
      {({ lowPower }) => <HeroScene lowPower={lowPower} />}
    </StageGate>
  );
}
