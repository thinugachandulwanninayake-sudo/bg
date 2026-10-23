'use client';

import {
  Component,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { createRobotInput, type RobotFailureReason, type RobotRig } from './robot-types';
import { probeWebGL2, type WebGLProbeResult } from './webgl';

// three / R3F touch `window` and WebGL, so they are only ever loaded in the browser.
const RobotCanvas = dynamic(() => import('./RobotCanvas'), { ssr: false });

const FAILURE_COPY: Record<RobotFailureReason, string> = {
  'webgl2-unsupported': 'This browser does not expose WebGL 2, which the 3D robot needs.',
  'context-creation-failed': 'The browser could not create a WebGL 2 context for the 3D robot.',
  'context-lost': 'The graphics context was lost and could not be restored.',
  runtime: 'The 3D scene stopped unexpectedly.',
};

/* -------------------------------------------------------------------------- */
/* Error boundary: catches renderer-creation errors thrown by the R3F Canvas   */
/* -------------------------------------------------------------------------- */

class RobotErrorBoundary extends Component<
  { children: ReactNode; onError(error: unknown): void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/* -------------------------------------------------------------------------- */
/* Static fallback (the previous artwork, honestly labelled)                   */
/* -------------------------------------------------------------------------- */

function RobotFallback({ message, onRetry }: { message: string; onRetry(): void }) {
  return (
    <div className="guardian-fallback">
      <Image
        src="/oryqen-guardian.webp"
        alt="ORYQEN Intelligence Guardian: an original chrome and electric-blue futuristic humanoid concept (static preview)"
        fill
        sizes="(max-width: 700px) 100vw, 65vw"
        priority={false}
        className="guardian-robot-image"
      />
      <div className="guardian-fallback__note" role="status">
        <span>3D view unavailable. Showing a static preview. {message}</span>
        <button type="button" onClick={onRetry}>
          Try 3D again
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stage                                                                       */
/* -------------------------------------------------------------------------- */

export interface RobotStageProps {
  mode: number;
  paused: boolean;
  reducedMotion: boolean;
  /** Increment to smoothly return the camera (and head) to the default view. */
  resetToken: number;
}

type Phase = 'idle' | 'ready' | 'fallback';

export default function RobotStage({ mode, paused, reducedMotion, resetToken }: RobotStageProps) {
  const descId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef(createRobotInput());
  const rigRef = useRef<RobotRig | null>(null);
  const probeRef = useRef<Extract<WebGLProbeResult, { ok: true }> | null>(null);
  const restoreAttempts = useRef(0);
  const lostTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [failure, setFailure] = useState<RobotFailureReason | null>(null);
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  const animate = !paused && !reducedMotion;

  const fail = useCallback((reason: RobotFailureReason, error?: unknown) => {
    // eslint-disable-next-line no-console
    console.warn(`[ORYQEN] 3D robot unavailable (${reason}); showing static preview.`, error ?? '');
    if (lostTimer.current) clearTimeout(lostTimer.current);
    setFailure(reason);
    setContextLost(false);
    setSceneReady(false);
    setPhase('fallback');
  }, []);

  /* Lazy start: only touch WebGL once the section is close to the viewport. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* WebGL 2 preflight. Runs once the section is near, and again after "Try 3D again". */
  useEffect(() => {
    if (!near || phase !== 'idle') return;
    const result = probeWebGL2();
    if (result.ok) {
      probeRef.current = result;
      setPhase('ready');
    } else {
      fail(result.reason);
    }
  }, [near, phase, fail]);

  /* Cursor tracking (mouse / pen only; touch is used for dragging instead). */
  useEffect(() => {
    if (phase !== 'ready') return;
    const el = rootRef.current;
    if (!el) return;
    const input = inputRef.current;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        input.hasPointer = false;
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      input.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      input.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      input.hasPointer = true;
    };
    const onLeave = () => {
      input.hasPointer = false;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('blur', onLeave);
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('blur', onLeave);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      input.hasPointer = false;
      input.dragging = false;
    };
  }, [phase]);

  /* RESET button: camera eases home, head recentres. */
  const firstReset = useRef(resetToken);
  useEffect(() => {
    if (resetToken === firstReset.current) return;
    firstReset.current = resetToken;
    inputRef.current.hasPointer = false;
    rigRef.current?.reset();
  }, [resetToken]);

  useEffect(
    () => () => {
      if (lostTimer.current) clearTimeout(lostTimer.current);
    },
    [],
  );

  /*
   * Context loss: unmount the canvas straight away (freeing GPU handles on a lost
   * context is a silent no-op, so no console spam), show the fallback, then mount a
   * brand-new renderer after a short pause. Three automatic attempts, then the
   * visitor gets a manual "Try 3D again" button.
   */
  const handleLost = useCallback(() => {
    setContextLost(true);
    setSceneReady(false);
    if (lostTimer.current) clearTimeout(lostTimer.current);
    lostTimer.current = setTimeout(() => {
      if (restoreAttempts.current >= 3) {
        fail('context-lost');
        return;
      }
      restoreAttempts.current += 1;
      setContextLost(false);
      setCanvasKey((k) => k + 1);
    }, 900);
  }, [fail]);

  const retry = useCallback(() => {
    restoreAttempts.current = 0;
    setFailure(null);
    setContextLost(false);
    setSceneReady(false);
    setCanvasKey((k) => k + 1);
    setPhase('idle');
  }, []);

  /* Keyboard alternative to dragging. */
  const onKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const rig = rigRef.current;
    if (!rig) return;
    switch (e.key) {
      case 'ArrowLeft':
        rig.nudge(0.35);
        break;
      case 'ArrowRight':
        rig.nudge(-0.35);
        break;
      case 'ArrowUp':
        rig.nudge(0, -0.1);
        break;
      case 'ArrowDown':
        rig.nudge(0, 0.1);
        break;
      case 'Home':
      case 'Escape':
        rig.reset();
        break;
      default:
        return;
    }
    e.preventDefault();
  }, []);

  const showCanvas = phase === 'ready' && !contextLost;
  const showFallback = phase === 'fallback' || (phase === 'ready' && contextLost);
  const showLoading = showCanvas && !sceneReady;
  const probe = probeRef.current;

  return (
    <div
      ref={rootRef}
      className="guardian-visual guardian-visual--3d"
      data-phase={phase}
      data-ready={sceneReady ? 'true' : 'false'}
    >
      <div
        className="guardian-robot3d"
        role="group"
        tabIndex={showCanvas ? 0 : -1}
        aria-roledescription="3D viewer"
        aria-label="Interactive 3D ORYQEN Intelligence Guardian robot"
        aria-describedby={descId}
        onKeyDown={onKeyDown}
      >
        {showCanvas && probe && (
          <RobotErrorBoundary key={canvasKey} onError={(error) => fail('runtime', error)}>
            <RobotCanvas
              key={canvasKey}
              mode={mode}
              animate={animate}
              reducedMotion={reducedMotion}
              visible={inView}
              antialias={probe.antialias && !probe.software}
              lowPower={probe.software}
              input={inputRef}
              rigRef={rigRef}
              onReady={() => setSceneReady(true)}
              onContextLost={handleLost}
            />
          </RobotErrorBoundary>
        )}

        {showLoading && (
          <div className="guardian-robot3d__loading" aria-hidden="true">
            <i />
            <span>PREPARING 3D</span>
          </div>
        )}

        {showFallback && (
          <RobotFallback
            message={contextLost ? 'Recovering the graphics context…' : failure ? FAILURE_COPY[failure] : ''}
            onRetry={retry}
          />
        )}
      </div>

      <p id={descId} className="guardian-sr">
        {showCanvas
          ? 'Interactive 3D robot. Drag, or use the left and right arrow keys, to rotate it. Up and down arrows tilt the view. Press Home to reset. On devices with a mouse, the robot’s head follows your cursor.'
          : 'Static preview of the ORYQEN Intelligence Guardian robot.'}
      </p>
      <div className="guardian-sr" role="status" aria-live="polite">
        {phase === 'fallback' ? '3D view unavailable. Showing a static preview.' : ''}
      </div>
    </div>
  );
}
