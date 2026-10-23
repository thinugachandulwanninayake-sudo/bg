'use client';

import {
  Component,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { probeWebGL2 } from '../robot/webgl';
import { useMotionPreference } from '../components/useMotionPreference';

type Phase = 'waiting' | 'ready' | 'fallback';

class SceneBoundary extends Component<
  { children: ReactNode; onError: (error: unknown) => void },
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

export interface SceneInfo {
  lowPower: boolean;
}

/**
 * Progressive-enhancement wrapper for every WebGL scene on the site.
 *
 * - The CSS fallback is always rendered first, so the section is complete even when
 *   JavaScript, WebGL or motion is unavailable.
 * - The canvas is mounted lazily, only near the viewport (or after idle).
 * - Reduced-motion visitors keep the static composition: no continuous rendering.
 * - WebGL2 probe, render errors and context loss all downgrade to the fallback.
 */
export default function StageGate({
  children,
  fallback,
  className = '',
  lazy = true,
  defer = false,
  description,
}: {
  children: (info: SceneInfo) => ReactNode;
  fallback: ReactNode;
  className?: string;
  lazy?: boolean;
  defer?: boolean;
  description?: string;
}) {
  const reduced = useMotionPreference();
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(!lazy);
  const [phase, setPhase] = useState<Phase>('waiting');
  const [lowPower, setLowPower] = useState(false);

  /* Start only when the scene is close to the viewport. */
  useEffect(() => {
    if (!lazy) return;
    const node = host.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '350px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [lazy]);

  /* Probe after idle so the first paint is never blocked. */
  useEffect(() => {
    if (!near || reduced) return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const result = probeWebGL2();
      if (result.ok) {
        setLowPower(result.software);
        setPhase('ready');
      } else {
        setPhase('fallback');
      }
    };
    let cancel = () => {};
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(run, { timeout: 1200 });
      cancel = () => window.cancelIdleCallback(handle);
    } else {
      const handle = window.setTimeout(run, defer ? 600 : 120);
      cancel = () => window.clearTimeout(handle);
    }
    return () => {
      cancelled = true;
      cancel();
    };
  }, [near, reduced, defer]);

  /* A lost context downgrades permanently to the static composition. */
  useEffect(() => {
    const node = host.current;
    if (!node || phase !== 'ready') return;
    const onLost = (event: Event) => {
      event.preventDefault();
      setPhase('fallback');
    };
    node.addEventListener('webglcontextlost', onLost, true);
    return () => node.removeEventListener('webglcontextlost', onLost, true);
  }, [phase]);

  const showCanvas = phase === 'ready' && !reduced;

  return (
    <div
      ref={host}
      className={`stage-gate ${className}`}
      data-scene={showCanvas ? '3d' : 'static'}
    >
      <div className="stage-gate__fallback" aria-hidden="true">
        {fallback}
      </div>
      {showCanvas && (
        <div className="stage-gate__canvas">
          <SceneBoundary onError={() => setPhase('fallback')}>
            {children({ lowPower })}
          </SceneBoundary>
        </div>
      )}
      {description ? <span className="scene-sr">{description}</span> : null}
    </div>
  );
}
