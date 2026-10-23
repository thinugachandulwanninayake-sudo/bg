'use client';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Group, Object3D, Color, MeshStandardMaterial, Vector3 } from 'three';
import { ROBOT_MODES, type RobotInput } from './robot-types';

interface Props { mode: number; animate: boolean; reducedMotion: boolean; input: MutableRefObject<RobotInput> }

export default function GuardianGLB({ mode, animate, reducedMotion, input }: Props) {
  const { scene } = useGLTF('/oryqen-guardian-v8.glb');
  // Each mounted scene has independent transforms and materials, no cross-instance mutation.
  const model = useMemo(() => {
    const instance = scene.clone(true);
    instance.traverse((obj) => {
      if ('isMesh' in obj && obj.isMesh) {
        const mesh = obj as import('three').Mesh;
        const clone = (mesh.material as MeshStandardMaterial).clone();
        // Studio reflections are softened so the chrome reads as brushed metal
        // against the navy stage instead of blowing out to white.
        clone.envMapIntensity = 0.7;
        if (clone.metalness > 0.75) clone.roughness = Math.max(clone.roughness, 0.22);
        mesh.material = clone;
        mesh.frustumCulled = false;
      }
    });
    return instance;
  }, [scene]);
  const root = useRef<Group>(null);
  const head = useMemo(() => model.getObjectByName('HeadRig'), [model]);
  const modeColors = useMemo(() => ROBOT_MODES.map((m) => new Color(m.accent)), []);
  const glowMaterials = useMemo(() => {
    const arr: MeshStandardMaterial[] = [];
    model.traverse((obj) => {
      if ('isMesh' in obj && obj.isMesh) {
        const mat = (obj as import('three').Mesh).material as MeshStandardMaterial;
        if (mat.name === 'cyan' || mat.name.includes('cyan')) arr.push(mat);
      }
    });
    return arr;
  }, [model]);
  const invalidate = useThree((s) => s.invalidate);
  const current = useRef({ yaw: 0, pitch: 0 });
  const target = useMemo(() => new Vector3(), []);
  const worldPos = useMemo(() => new Vector3(), []);
  useEffect(() => { invalidate(); }, [mode, animate, reducedMotion, invalidate]);
  useEffect(() => () => {
    model.traverse((obj) => {
      if ('isMesh' in obj && obj.isMesh) {
        const mat = (obj as import('three').Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }, [model]);
  useFrame((state, delta) => {
    if (!head || !root.current) return;
    const preset = ROBOT_MODES[mode] ?? ROBOT_MODES[0];
    const dt = Math.min(delta, 0.05);
    let yaw = 0, pitch = 0;
    if (animate && !reducedMotion && input.current.hasPointer && !input.current.dragging) {
      // Convert screen pointer into bounded head turn; orbit controls take precedence while dragging.
      yaw = MathUtils.clamp(input.current.x * 0.34, -preset.maxYaw, preset.maxYaw);
      pitch = MathUtils.clamp(-input.current.y * 0.21, -preset.maxPitchDown, preset.maxPitchUp);
      head.getWorldPosition(worldPos);
      state.camera.getWorldPosition(target);
      const angle = Math.atan2(target.x - worldPos.x, target.z - worldPos.z);
      const gate = 1 - MathUtils.smoothstep(Math.abs(angle), 1.2, 2.0);
      yaw *= gate; pitch *= gate;
    }
    const smooth = animate ? 1 - Math.exp(-dt * 5.5) : 1;
    current.current.yaw = MathUtils.lerp(current.current.yaw, yaw, smooth);
    current.current.pitch = MathUtils.lerp(current.current.pitch, pitch, smooth);
    const t = state.clock.elapsedTime;
    const idle = animate && !reducedMotion ? 1 : 0;
    head.rotation.set(-current.current.pitch + Math.sin(t * .44) * .014 * idle, current.current.yaw + Math.sin(t * .32) * .028 * idle, Math.sin(t * .39) * .01 * idle);
    root.current.position.y = idle * Math.sin(t * 1.1) * .013;
    const accent = modeColors[mode] ?? modeColors[0];
    for (const mat of glowMaterials) {
      mat.emissive.copy(accent);
      mat.emissiveIntensity = 0.72 + idle * (.14 + .14 * Math.sin(t * 2.1));
    }
  });
  return <group ref={root} dispose={null}><primitive object={model as Object3D} /></group>;
}
useGLTF.preload('/oryqen-guardian-v8.glb');
