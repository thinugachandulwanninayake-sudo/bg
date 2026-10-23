'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, MathUtils, type Group } from 'three';
import { holoPanelTexture } from './textures';

const PANELS: Array<{
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  variant: number;
  phase: number;
}> = [
  { position: [-4.1, 1.35, -1.6], rotation: [0.05, 0.52, 0.06], scale: 1.05, variant: 0, phase: 0 },
  { position: [4.25, 0.75, -2.1], rotation: [-0.04, -0.48, -0.05], scale: 0.92, variant: 1, phase: 1.7 },
  { position: [-3.55, -1.85, -0.9], rotation: [0.02, 0.4, -0.03], scale: 0.7, variant: 1, phase: 3.1 },
];

/** Floating holographic data panels behind the hero phone. */
export default function HoloPanels({ animate = true, scale = 1 }: { animate?: boolean; scale?: number }) {
  const group = useRef<Group>(null);
  const textures = useMemo(() => [holoPanelTexture(0), holoPanelTexture(1)], []);

  useFrame((state, delta) => {
    if (!animate || !group.current) return;
    const dt = Math.min(delta, 0.05);
    group.current.children.forEach((child, index) => {
      const phase = PANELS[index]?.phase ?? 0;
      child.position.y += Math.sin(state.clock.elapsedTime * 0.55 + phase) * dt * 0.06;
      child.rotation.z = MathUtils.damp(
        child.rotation.z,
        Math.sin(state.clock.elapsedTime * 0.3 + phase) * 0.04,
        1.4,
        dt,
      );
    });
  });

  return (
    <group ref={group} scale={scale}>
      {PANELS.map((panel, index) => {
        const texture = textures[panel.variant];
        return (
          <group key={index} position={panel.position} rotation={panel.rotation} scale={panel.scale}>
            <mesh>
              <planeGeometry args={[2.5, 1.56]} />
              <meshBasicMaterial
                map={texture ?? undefined}
                transparent
                opacity={0.38}
                side={DoubleSide}
                depthWrite={false}
                toneMapped={false}
                blending={AdditiveBlending}
              />
            </mesh>
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[2.56, 1.62]} />
              <meshBasicMaterial color="#0a2b4d" transparent opacity={0.24} depthWrite={false} />
            </mesh>
            <mesh position={[0, -0.85, 0]}>
              <boxGeometry args={[2.5, 0.004, 0.004]} />
              <meshBasicMaterial color="#59d7ff" transparent opacity={0.38} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
