'use client';

import { useEffect, useMemo, useRef, type ComponentRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { DoubleSide, MathUtils, Spherical, Vector3, type PerspectiveCamera } from 'three';
import GuardianGLB from './GuardianGLB';
import Dust from '../scene/Dust';
import OrbitalRings from '../scene/OrbitalRings';
import { Suspense } from 'react';
import type { RobotInput, RobotRig } from './robot-types';

/* -------------------------------------------------------------------------- */
/* Camera constants                                                            */
/* -------------------------------------------------------------------------- */

const FOV = 27;
const HALF_TAN = Math.tan(MathUtils.degToRad(FOV / 2));
/** World-space box that must always fit in view (robot is ~4.9 tall, ~3.7 wide with arms). */
const FIT_HEIGHT = 7.4;
const FIT_WIDTH = 5.2;
const TARGET: [number, number, number] = [0, 0, 0];
/** Default polar angle: camera a few degrees above the horizon. */
const DEFAULT_POLAR = Math.PI / 2 - 0.1;
const MIN_POLAR = Math.PI / 2 - 0.42;
const MAX_POLAR = Math.PI / 2 + 0.18;

function fitDistance(aspect: number): number {
  const byHeight = FIT_HEIGHT / 2 / HALF_TAN;
  const byWidth = FIT_WIDTH / 2 / (HALF_TAN * Math.max(aspect, 0.2));
  return Math.max(byHeight, byWidth);
}

/* -------------------------------------------------------------------------- */
/* Props                                                                       */
/* -------------------------------------------------------------------------- */

export interface RobotCanvasProps {
  mode: number;
  animate: boolean;
  reducedMotion: boolean;
  /** Section is on screen: render continuously only then. */
  visible: boolean;
  antialias: boolean;
  /** Software rasteriser detected: use a lower pixel ratio. */
  lowPower: boolean;
  input: MutableRefObject<RobotInput>;
  rigRef: MutableRefObject<RobotRig | null>;
  onReady(): void;
  onContextLost(): void;
}

/* -------------------------------------------------------------------------- */
/* Camera rig: responsive fit, smooth reset, keyboard nudges                   */
/* -------------------------------------------------------------------------- */

function CameraRig({
  controlsRef,
  rigRef,
}: {
  controlsRef: MutableRefObject<ComponentRef<typeof OrbitControls> | null>;
  rigRef: MutableRefObject<RobotRig | null>;
}) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  const distance = useMemo(() => fitDistance(size.width / Math.max(size.height, 1)), [size.width, size.height]);
  const distanceRef = useRef(distance);
  const goal = useRef({ theta: 0, phi: DEFAULT_POLAR, active: false });
  const tmp = useMemo(() => ({ off: new Vector3(), sph: new Spherical(), target: new Vector3(...TARGET) }), []);

  // Keep the robot fully in frame on resize / orientation change, preserving the
  // user's current viewing angle.
  useEffect(() => {
    distanceRef.current = distance;
    const controls = controlsRef.current;
    const target = controls?.target ?? tmp.target;
    tmp.off.copy(camera.position).sub(target);
    if (tmp.off.lengthSq() === 0) tmp.off.set(0, 0, 1);
    tmp.sph.setFromVector3(tmp.off);
    tmp.sph.radius = distance;
    tmp.off.setFromSpherical(tmp.sph);
    camera.position.copy(target).add(tmp.off);
    camera.lookAt(target);
    controls?.update();
    invalidate();
  }, [distance, camera, controlsRef, invalidate, tmp]);

  // Imperative API for buttons + keyboard.
  useEffect(() => {
    const readAngles = () => {
      const target = controlsRef.current?.target ?? tmp.target;
      tmp.off.copy(camera.position).sub(target);
      tmp.sph.setFromVector3(tmp.off);
      return tmp.sph;
    };
    const rig: RobotRig = {
      reset() {
        goal.current = { theta: 0, phi: DEFAULT_POLAR, active: true };
        invalidate();
      },
      nudge(azimuth, polar = 0) {
        const s = readAngles();
        goal.current = {
          theta: s.theta + azimuth,
          phi: MathUtils.clamp(s.phi + polar, MIN_POLAR, MAX_POLAR),
          active: true,
        };
        invalidate();
      },
    };
    rigRef.current = rig;
    return () => {
      if (rigRef.current === rig) rigRef.current = null;
    };
  }, [camera, controlsRef, invalidate, rigRef, tmp]);

  // A manual drag always wins over a running reset/nudge animation.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cancel = () => {
      goal.current.active = false;
    };
    controls.addEventListener('start', cancel);
    return () => controls.removeEventListener('start', cancel);
  }, [controlsRef]);

  useFrame((_, delta) => {
    const g = goal.current;
    if (!g.active) return;
    const controls = controlsRef.current;
    const target = controls?.target ?? tmp.target;
    tmp.off.copy(camera.position).sub(target);
    tmp.sph.setFromVector3(tmp.off);

    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 7);
    // Shortest way round for the azimuth.
    const dTheta = MathUtils.euclideanModulo(g.theta - tmp.sph.theta + Math.PI, Math.PI * 2) - Math.PI;
    const dPhi = g.phi - tmp.sph.phi;
    const dRadius = distanceRef.current - tmp.sph.radius;
    tmp.sph.theta += dTheta * k;
    tmp.sph.phi += dPhi * k;
    tmp.sph.radius += dRadius * k;
    tmp.off.setFromSpherical(tmp.sph);
    camera.position.copy(target).add(tmp.off);
    camera.lookAt(target);
    controls?.update();

    if (Math.abs(dTheta) < 0.002 && Math.abs(dPhi) < 0.002 && Math.abs(dRadius) < 0.01) g.active = false;
    invalidate();
  });

  return null;
}

/* -------------------------------------------------------------------------- */
/* Adaptive quality: step the pixel ratio down if frames are measurably slow   */
/* -------------------------------------------------------------------------- */

function QualityGovernor({ enabled, levels }: { enabled: boolean; levels: readonly number[] }) {
  const setDpr = useThree((s) => s.setDpr);
  const state = useRef({ level: 0, sum: 0, count: 0, skipped: 0 });

  useFrame((_, delta) => {
    if (!enabled) return;
    const st = state.current;
    if (st.level >= levels.length - 1) return;
    if (delta > 0.25) return; // tab was in the background; not a real frame cost
    if (st.skipped < 45) {
      st.skipped += 1; // ignore shader-compile warm-up
      return;
    }
    st.sum += delta;
    st.count += 1;
    if (st.count >= 90) {
      const average = st.sum / st.count;
      st.sum = 0;
      st.count = 0;
      if (average > 1 / 40) {
        st.level += 1;
        setDpr(levels[st.level]);
      }
    }
  });

  return null;
}

/* -------------------------------------------------------------------------- */
/* Context loss + readiness                                                    */
/* -------------------------------------------------------------------------- */

function ContextGuard({ onLost }: { onLost(): void }) {
  const gl = useThree((s) => s.gl);
  const lost = useRef(onLost);
  lost.current = onLost;

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      // Required: without preventDefault the browser never attempts a restore.
      event.preventDefault();
      lost.current();
    };
    canvas.addEventListener('webglcontextlost', handleLost);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost);
    };
  }, [gl]);

  return null;
}

function ReadySignal({ onReady }: { onReady(): void }) {
  const cb = useRef(onReady);
  cb.current = onReady;
  useEffect(() => {
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => cb.current());
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return null;
}

/* -------------------------------------------------------------------------- */
/* Atmospheric 3D layer: orbital rings, dust and a floor halo around the model */
/* -------------------------------------------------------------------------- */

const MODE_ACCENTS = ['#18c3f3', '#8f78ff', '#16d9b5'] as const;

function GuardianAtmosphere({ animate, mode }: { animate: boolean; mode: number }) {
  const accent = MODE_ACCENTS[mode] ?? MODE_ACCENTS[0];
  return (
    <group>
      <group position={[0, -0.15, -1.6]}>
        <OrbitalRings animate={animate} scale={1.4} intensity={0.5} />
      </group>
      <Dust
        count={200}
        spread={13}
        size={0.045}
        color={accent}
        opacity={0.55}
        speed={0.02}
        animate={animate}
        parallax={0.008}
      />
      <mesh position={[0, -2.4, 0]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <ringGeometry args={[1.5, 2.9, 72]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.13}
          side={DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function VisibilityInvalidate({ visible }: { visible: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [visible, invalidate]);
  return null;
}

/* -------------------------------------------------------------------------- */
/* Canvas                                                                      */
/* -------------------------------------------------------------------------- */

export default function RobotCanvas({
  mode,
  animate,
  reducedMotion,
  visible,
  antialias,
  lowPower,
  input,
  rigRef,
  onReady,
  onContextLost,
}: RobotCanvasProps) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null);
  const dprRange = useMemo<[number, number]>(() => (lowPower ? [0.75, 1] : [1, 1.25]), [lowPower]);
  const dprLevels = useMemo<readonly number[]>(() => (lowPower ? [1, 0.8, 0.65] : [1.25, 1, 0.8, 0.65]), [lowPower]);

  return (
    <Canvas
      aria-hidden="true"
      // Render continuously only while animating and on screen; otherwise on demand.
      frameloop={animate && visible ? 'always' : 'demand'}
      dpr={dprRange}
      camera={{ fov: FOV, near: 0.5, far: 60, position: [0, 1.2, 11.5] }}
      // Conservative context request: no stencil, no preserved buffer, no forced
      // high-performance GPU (the previous build's compatibility patch did the same).
      gl={{
        antialias,
        alpha: true,
        stencil: false,
        depth: true,
        powerPreference: 'default',
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
      }}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 60 } }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Three lights in total; no shadows anywhere. */}
      <ambientLight intensity={0.22} />
      <directionalLight position={[3.5, 5, 5]} intensity={0.95} color="#eaf8ff" />
      <directionalLight position={[-5, 2.5, -4]} intensity={0.8} color="#2fd0ff" />
      {/* Cool key from the front-right and cyan/violet rims from behind give the
          chrome defined edges instead of a flat wash. */}
      <directionalLight position={[6, 3, -6]} intensity={1.15} color="#9a86ff" />
      <directionalLight position={[-7, 4, -3]} intensity={0.9} color="#35d6ff" />
      <spotLight position={[0, 6, 6]} angle={0.7} penumbra={1} intensity={22} distance={20} color="#d8f6ff" />

      {/* Procedural studio reflections for the chrome. Rendered once, no network fetch. */}
      <Environment resolution={128} frames={1}>
        {/* Mid-blue studio so chrome reflects light, not black; bright panels add highlights. */}
        <color attach="background" args={['#21476f']} />
        <Lightformer form="rect" intensity={1.35} color="#ffffff" position={[0, 3, 9]} scale={[10, 2.6, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#bfe9ff" position={[-7, 0.5, 4]} scale={[1.6, 9, 1]} />
        <Lightformer form="rect" intensity={1.3} color="#8fd0ff" position={[7, 0.5, 4]} scale={[1.6, 9, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#eaf8ff" position={[0, 8, 0]} scale={[12, 12, 1]} />
        <Lightformer form="ring" intensity={2.4} color="#18c3f3" position={[0, 2, -8]} scale={7} />
        <Lightformer form="rect" intensity={0.45} color="#0b3a7a" position={[0, -6, 3]} scale={[14, 10, 1]} />
        <Lightformer form="rect" intensity={0.35} color="#07254f" position={[0, 0, -9]} scale={[14, 6, 1]} />
      </Environment>

      <Suspense fallback={null}><GuardianGLB mode={mode} animate={animate} reducedMotion={reducedMotion} input={input} /></Suspense>
      <GuardianAtmosphere animate={animate} mode={mode} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={TARGET}
        enablePan={false}
        enableZoom={false /* keep the page scrollable with the wheel */}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.7}
        minPolarAngle={MIN_POLAR}
        maxPolarAngle={MAX_POLAR}
        onStart={() => {
          input.current.dragging = true;
        }}
        onEnd={() => {
          input.current.dragging = false;
        }}
      />

      <CameraRig controlsRef={controlsRef} rigRef={rigRef} />
      <QualityGovernor enabled={animate && visible} levels={dprLevels} />
      <ContextGuard onLost={onContextLost} />
      <VisibilityInvalidate visible={visible} />
      <ReadySignal onReady={onReady} />
    </Canvas>
  );
}
