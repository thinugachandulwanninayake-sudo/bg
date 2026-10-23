'use client';

import dynamic from 'next/dynamic';
import StageGate from './StageGate';

const CinematicBackdrop = dynamic(() => import('./CinematicBackdrop'), { ssr: false });

function BackdropFallback() {
  return (
    <div className="backdrop-fallback">
      <span className="bf-aurora bf-a" />
      <span className="bf-aurora bf-b" />
      <span className="bf-aurora bf-c" />
      <span className="bf-grid" />
    </div>
  );
}

/** Fixed ambient layer that gives every section cinematic depth. */
export default function BackdropStage() {
  return (
    <div className="page-backdrop" aria-hidden="true">
      <StageGate className="backdrop-stage" fallback={<BackdropFallback />} lazy={false} defer>
        {({ lowPower }) => <CinematicBackdrop lowPower={lowPower} />}
      </StageGate>
    </div>
  );
}
