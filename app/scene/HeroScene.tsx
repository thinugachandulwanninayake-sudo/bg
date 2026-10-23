'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { MathUtils, type Group, type Mesh } from 'three';
import Dust from './Dust';
import OrbitalRings from './OrbitalRings';
import HoloPanels from './HoloPanels';

/* -------------------------------------------------------------------------- */
/* Camera / scroll rig                                                        */
/* -------------------------------------------------------------------------- */

function ParallaxRig({ animate, children }: { animate: boolean; children: React.ReactNode }) {
  const ref = useRef<Group>(null);
  const scroll = useRef(0);

  useFrame((state, delta) => {
    const group = ref.current;
    if (!group) return;
    const dt = Math.min(delta, 0.05);

    if (animate) {
      group.rotation.x = MathUtils.damp(group.rotation.x, state.pointer.y * -0.09, 2.2, dt);
      group.rotation.y = MathUtils.damp(group.rotation.y, state.pointer.x * 0.14, 2.2, dt);
    }

    scroll.current = typeof window === 'undefined' ? 0 : window.scrollY;
    group.position.y = MathUtils.damp(group.position.y, scroll.current * 0.0016, 3, dt);
  });

  return <group ref={ref}>{children}</group>;
}

/* -------------------------------------------------------------------------- */
/* Responsive framing: keeps the ring system in view on tablets and phones     */
/* -------------------------------------------------------------------------- */

function ResponsiveStage({ children }: { children: React.ReactNode }) {
  const width = useThree((state) => state.size.width);
  const scale = MathUtils.clamp(0.58 + (width - 320) / 1500, 0.58, 1);
  return <group scale={scale}>{children}</group>;
}

function InvalidateOnce() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
}

/* -------------------------------------------------------------------------- */
/* Glass shards                                                               */
/* -------------------------------------------------------------------------- */

const SHARDS: Array<{
  position: [number, number, number];
  scale: number;
  speed: number;
  color: string;
}> = [
  { position: [-4.6, 2.4, -2.4] , scale: 0.22, speed: 0.18, color: '#bfe9ff' },
  { position: [4.9, 2.9, -3.2] , scale: 0.15, speed: -0.24, color: '#9fdcff' },
  { position: [5.4, -1.9, -1.8] , scale: 0.28, speed: 0.14, color: '#c9f2ff' },
  { position: [-5.2, -2.2, -1.2] , scale: 0.19, speed: -0.2, color: '#b8e4ff' },
  { position: [2.9, 3.5, -4.5] , scale: 0.12, speed: 0.3, color: '#8fd4ff' },
  { position: [-2.6, -3.4, -3.6] , scale: 0.16, speed: 0.22, color: '#d6f6ff' },
  { position: [0.4, 3.9, -5] , scale: 0.1, speed: -0.28, color: '#bdeeff' },
];

function Shard({
  position,
  scale,
  speed,
  color,
  animate,
}: {
  position: readonly [number, number, number];
  scale: number;
  speed: number;
  color: string;
  animate: boolean;
}) {
  const ref = useRef<Mesh>(null);
  const base = useRef(position[1]);

  useFrame((state, delta) => {
    if (!animate || !ref.current) return;
    const dt = Math.min(delta, 0.05);
    ref.current.rotation.x += dt * speed;
    ref.current.rotation.y += dt * speed * 0.7;
    ref.current.position.y = base.current + Math.sin(state.clock.elapsedTime * speed * 2 + position[0]) * 0.18;
  });

  return (
    <mesh ref={ref} position={position} scale={scale} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={color}
        metalness={0.92}
        roughness={0.12}
        emissive="#0a3f66"
        emissiveIntensity={0.55}
        envMapIntensity={1.6}
        flatShading
      />
    </mesh>
  );
}

/* -------------------------------------------------------------------------- */
/* Central crystal                                                            */
/* -------------------------------------------------------------------------- */

function Crystal({ animate }: { animate: boolean }) {
  const outer = useRef<Mesh>(null);
  const inner = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (!animate) return;
    const dt = Math.min(delta, 0.05);
    if (outer.current) {
      outer.current.rotation.y += dt * 0.12;
      outer.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.18;
    }
    if (inner.current) {
      inner.current.rotation.y -= dt * 0.2;
      inner.current.rotation.z += dt * 0.08;
    }
  });

  return (
    <group position={[0, 0.15, -1.2]}>
      <mesh ref={outer} frustumCulled={false}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial
          color="#8ed9ff"
          metalness={0.98}
          roughness={0.06}
          emissive="#0b5f96"
          emissiveIntensity={0.5}
          envMapIntensity={2}
          flatShading
        />
      </mesh>
      <mesh ref={inner} scale={0.55} frustumCulled={false}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshBasicMaterial color="#c9f6ff" transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <mesh scale={1.02} frustumCulled={false}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshBasicMaterial color="#7fe4ff" wireframe transparent opacity={0.22} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Scene                                                                      */
/* -------------------------------------------------------------------------- */

function Scene({ animate, lowPower }: { animate: boolean; lowPower: boolean }) {
  const shards = useMemo(() => (lowPower ? SHARDS.slice(0, 4) : SHARDS), [lowPower]);

  return (
    <>
      <InvalidateOnce />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 6]} intensity={1.6} color="#e9fbff" />
      <directionalLight position={[-6, 2, -4]} intensity={1.1} color="#2f8bff" />
      <pointLight position={[0, -3, 4]} intensity={18} distance={14} color="#18c3f3" />
      <pointLight position={[4, 3, 2]} intensity={10} distance={12} color="#8f78ff" />

      <Environment resolution={64} frames={1}>
        <color attach="background" args={['#0a2744']} />
        <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[0, 3, 8]} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={2.6} color="#bfeeff" position={[-7, 0, 4]} scale={[2, 10, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#8fd6ff" position={[7, 0, 4]} scale={[2, 10, 1]} />
        <Lightformer form="ring" intensity={3} color="#18c3f3" position={[0, 2, -7]} scale={6} />
        <Lightformer form="rect" intensity={0.8} color="#0b3a7a" position={[0, -6, 2]} scale={[14, 10, 1]} />
      </Environment>

      <ParallaxRig animate={animate}>
        <ResponsiveStage>
          <Crystal animate={animate} />
          <OrbitalRings animate={animate} scale={1} intensity={1} />
          <group position={[0, -0.15, 0]}>
            <HoloPanels animate={animate} />
          </group>
          {shards.map((shard, index) => (
            <Shard key={index} {...shard} animate={animate} />
          ))}
          <Dust
            count={lowPower ? 260 : 720}
            spread={22}
            size={0.075}
            opacity={0.75}
            animate={animate}
            speed={0.03}
          />
        </ResponsiveStage>
      </ParallaxRig>
    </>
  );
}

export default function HeroScene({
  animate = true,
  lowPower = false,
}: {
  animate?: boolean;
  lowPower?: boolean;
}) {
  return (
    <Canvas
      aria-hidden="true"
      dpr={lowPower ? [1, 1.15] : [1, 1.7]}
      frameloop={animate ? 'always' : 'demand'}
      camera={{ fov: 45, position: [0, 0, 10], near: 0.1, far: 60 }}
      gl={{
        alpha: true,
        antialias: !lowPower,
        stencil: false,
        depth: true,
        powerPreference: 'default',
        preserveDrawingBuffer: false,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <Scene animate={animate} lowPower={lowPower} />
      </Suspense>
    </Canvas>
  );
}
