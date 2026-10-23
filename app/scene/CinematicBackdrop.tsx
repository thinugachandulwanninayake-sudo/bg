'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, MathUtils, type Group } from 'three';
import Dust from './Dust';
import { glowTexture } from './textures';

function Nebula({
  position,
  scale,
  color,
  opacity,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  opacity: number;
}) {
  const texture = useMemo(() => glowTexture(color), [color]);
  return (
    <mesh position={position} scale={scale} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture ?? undefined}
        transparent
        opacity={opacity}
        blending={AdditiveBlending}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function ScrollField({ animate }: { animate: boolean }) {
  const group = useRef<Group>(null);
  const look = useRef(0);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;
    const dt = Math.min(delta, 0.05);
    const scroll = typeof window === 'undefined' ? 0 : window.scrollY;
    look.current = MathUtils.damp(look.current, scroll, 3.2, dt);
    node.position.y = look.current * 0.0009;
    if (animate) {
      node.rotation.y = MathUtils.damp(node.rotation.y, state.pointer.x * 0.05, 1.4, dt);
      node.rotation.x = MathUtils.damp(node.rotation.x, state.pointer.y * -0.03, 1.4, dt);
    }
  });

  return (
    <group ref={group}>
      <Nebula position={[-7, 3, -9]} scale={26} color="40,120,255" opacity={0.38} />
      <Nebula position={[8, -4, -12]} scale={30} color="20,190,240" opacity={0.26} />
      <Nebula position={[1, 6, -14]} scale={22} color="120,110,255" opacity={0.2} />
      <Dust
        count={620}
        spread={34}
        size={0.06}
        opacity={0.6}
        speed={0.012}
        animate={animate}
        parallax={0.03}
      />
    </group>
  );
}

function InvalidateOnce() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
}

export default function CinematicBackdrop({
  animate = true,
  lowPower = false,
}: {
  animate?: boolean;
  lowPower?: boolean;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  const running = animate && visible;

  return (
    <Canvas
      aria-hidden="true"
      dpr={lowPower ? [0.8, 1] : [1, 1.35]}
      frameloop={running ? 'always' : 'demand'}
      camera={{ fov: 55, position: [0, 0, 12], near: 0.1, far: 80 }}
      gl={{
        alpha: true,
        antialias: false,
        stencil: false,
        depth: false,
        powerPreference: 'default',
        preserveDrawingBuffer: false,
      }}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <InvalidateOnce />
      <Suspense fallback={null}>
        <ScrollField animate={running && !lowPower} />
        <OrbitalHaze animate={running} />
      </Suspense>
    </Canvas>
  );
}

/** Two very large, very faint rings that give the whole page a sense of depth. */
function OrbitalHaze({ animate }: { animate: boolean }) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!animate || !group.current) return;
    const dt = Math.min(delta, 0.05);
    group.current.rotation.z += dt * 0.006;
    group.current.children.forEach((child, index) => {
      child.rotation.x += dt * 0.004 * (index + 1);
    });
  });

  return (
    <group ref={group} position={[0, 0, -6]}>
      <mesh rotation={[1.35, 0.2, 0]} frustumCulled={false}>
        <torusGeometry args={[13, 0.012, 4, 160]} />
        <meshBasicMaterial color="#2f9fe0" transparent opacity={0.22} toneMapped={false} />
      </mesh>
      <mesh rotation={[1.1, -0.5, 0.6]} frustumCulled={false}>
        <torusGeometry args={[18, 0.01, 4, 160]} />
        <meshBasicMaterial color="#4d7fff" transparent opacity={0.15} toneMapped={false} />
      </mesh>
    </group>
  );
}
