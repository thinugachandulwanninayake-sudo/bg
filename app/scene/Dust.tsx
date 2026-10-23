'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  Color,
  MathUtils,
  type Points as ThreePoints,
} from 'three';
import { particleSprite } from './textures';

/**
 * Glowing particle field. Kept deliberately cheap: one draw call, no shadows,
 * additive blending and a single generated sprite.
 */
export default function Dust({
  count = 500,
  spread = 18,
  size = 0.06,
  color = '#9fe8ff',
  speed = 0.035,
  opacity = 0.85,
  animate = true,
  parallax = 0.02,
}: {
  count?: number;
  spread?: number;
  size?: number;
  color?: string;
  speed?: number;
  opacity?: number;
  animate?: boolean;
  parallax?: number;
}) {
  const ref = useRef<ThreePoints>(null);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const base = new Color(color);
    const cool = new Color('#2f7bff');
    const warm = new Color('#bff4ff');
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.75;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.7;
      const tint = base.clone().lerp(Math.random() > 0.7 ? warm : cool, Math.random() * 0.7);
      col[i * 3] = tint.r;
      col[i * 3 + 1] = tint.g;
      col[i * 3 + 2] = tint.b;
    }
    return { positions: pos, colors: col };
  }, [count, spread, color]);

  const sprite = useMemo(() => particleSprite(), []);

  useFrame((state, delta) => {
    const points = ref.current;
    if (!points || !animate) return;
    const dt = Math.min(delta, 0.05);
    points.rotation.y += dt * speed;
    points.rotation.x = MathUtils.damp(points.rotation.x, state.pointer.y * parallax, 1.6, dt);
    points.rotation.z = MathUtils.damp(points.rotation.z, state.pointer.x * parallax * 0.6, 1.6, dt);
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        map={sprite ?? undefined}
        vertexColors
        transparent
        opacity={opacity}
        depthWrite={false}
        sizeAttenuation
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
