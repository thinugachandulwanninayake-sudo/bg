'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, DoubleSide, MathUtils, type Group, type Mesh } from 'three';

type RingSpec = {
  radius: number;
  tube?: number;
  tilt: [number, number, number];
  speed: number;
  opacity: number;
  satellites?: number;
  color?: string;
};

function Ring({
  radius,
  tube = 0.008,
  tilt,
  speed,
  opacity,
  satellites = 0,
  color = '#63dcff',
  animate,
}: RingSpec & { animate: boolean }) {
  const orbit = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const tone = useMemo(() => new Color(color), [color]);

  useFrame((state, delta) => {
    if (!animate) return;
    const dt = Math.min(delta, 0.05);
    if (orbit.current) orbit.current.rotation.z += dt * speed;
    if (ring.current) {
      const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 0.9 + radius) * 0.15;
      (ring.current.material as { opacity: number }).opacity = opacity * pulse;
    }
  });

  return (
    <group rotation={tilt}>
      <mesh ref={ring} frustumCulled={false}>
        <torusGeometry args={[radius, tube, 6, 220]} />
        <meshBasicMaterial
          color={tone}
          transparent
          opacity={opacity}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <group ref={orbit}>
        {Array.from({ length: satellites }).map((_, index) => {
          const angle = (index / Math.max(satellites, 1)) * Math.PI * 2;
          return (
            <mesh
              key={index}
              position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}
              frustumCulled={false}
            >
              <sphereGeometry args={[index % 2 ? 0.026 : 0.04, 12, 12]} />
              <meshBasicMaterial color="#d8f7ff" toneMapped={false} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/**
 * Holographic orbital system. Every element is additive and unlit, so it reads as
 * light rather than geometry and stays inexpensive to render.
 */
export default function OrbitalRings({
  animate = true,
  scale = 1,
  intensity = 1,
}: {
  animate?: boolean;
  scale?: number;
  intensity?: number;
}) {
  const specs: RingSpec[] = [
    { radius: 2.15, tilt: [1.42, 0.12, 0.2], speed: 0.16, opacity: 0.55 * intensity, satellites: 2 },
    { radius: 3.05, tube: 0.006, tilt: [1.18, -0.34, -0.5], speed: -0.11, opacity: 0.4 * intensity, satellites: 3, color: '#8f78ff' },
    { radius: 4.0, tube: 0.005, tilt: [1.62, 0.42, 0.14], speed: 0.07, opacity: 0.28 * intensity, satellites: 1, color: '#42a7ff' },
    { radius: 5.1, tube: 0.004, tilt: [1.3, 0.1, 0.9], speed: -0.05, opacity: 0.18 * intensity, satellites: 2, color: '#b6f2ff' },
  ];

  return (
    <group scale={scale}>
      {specs.map((spec, index) => (
        <Ring key={index} {...spec} animate={animate} />
      ))}
      {/* Faint central halo keeps the ring system anchored. */}
      <mesh frustumCulled={false}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshBasicMaterial
          color="#8ee9ff"
          transparent
          opacity={0.22 * intensity}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <Halo animate={animate} intensity={intensity} />
    </group>
  );
}

function Halo({ animate, intensity }: { animate: boolean; intensity: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!animate || !ref.current) return;
    ref.current.rotation.z += Math.min(delta, 0.05) * 0.02;
    ref.current.rotation.x = MathUtils.damp(
      ref.current.rotation.x,
      Math.sin(performance.now() * 0.00008) * 0.2,
      1.2,
      Math.min(delta, 0.05),
    );
  });
  return (
    <mesh ref={ref} frustumCulled={false} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1.02, 96]} />
      <meshBasicMaterial
        color="#5ad8ff"
        transparent
        opacity={0.18 * intensity}
        side={DoubleSide}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
