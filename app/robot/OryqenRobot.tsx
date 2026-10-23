'use client';

import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, MathUtils, Vector3, type Group, type Mesh } from 'three';
import { useRobotAssets, type RobotGeometries, type RobotMaterials } from './robot-assets';
import { ROBOT_MODES, type RobotInput } from './robot-types';

const HALF = Math.PI / 2;
type V3 = readonly [number, number, number];

/** Skull ellipsoid radii. Shell parts (visor, brow, jaw) are scaled from this. */
const SK: V3 = [0.64, 0.7, 0.68];
const grow = (v: V3, k: number): [number, number, number] => [v[0] * k, v[1] * k, v[2] * k];

/** How far in front of the head the gaze target sits. Sets the cursor-to-angle mapping. */
const GAZE_DEPTH = 2.6;

export interface OryqenRobotProps {
  /** Index into ROBOT_MODES. */
  mode: number;
  /** False when paused or reduced-motion: no idle motion, no head tracking, no pulses. */
  animate: boolean;
  /** Reduced motion additionally forces the neutral rest pose. */
  reducedMotion: boolean;
  input: MutableRefObject<RobotInput>;
}

interface PartProps {
  G: RobotGeometries;
  M: RobotMaterials;
}

/* -------------------------------------------------------------------------- */
/* Arm (built for +X and mirrored with an inner scale)                         */
/* -------------------------------------------------------------------------- */

function Arm({ G, M, side, armRef }: PartProps & { side: 1 | -1; armRef: MutableRefObject<Group | null> }) {
  return (
    <group ref={armRef} position={[side * 1.17, 0.2, 0]}>
      <group scale={[side, 1, 1]}>
        {/* shoulder joint and bridge back to the chest */}
        <mesh geometry={G.shoulderBridge} material={M.chrome} position={[-0.3, 0, 0]} rotation={[0, 0, HALF]} />
        <mesh geometry={G.shoulderBall} material={M.gun} />

        {/* pauldron */}
        <group position={[0.03, 0.1, 0]} rotation={[0, 0, -0.32]}>
          <mesh geometry={G.pauldron} material={M.chrome} scale={[0.46, 0.34, 0.5]} />
          <mesh geometry={G.disc} material={M.gun} rotation={[HALF, 0, 0]} scale={[0.46, 0.5, 1]} />
          <mesh geometry={G.pauldronTrim} material={M.navy} rotation={[HALF, 0, 0]} scale={[1, 1.09, 1]} />
          <mesh geometry={G.pauldronGlow} material={M.glow} position={[0, 0.05, 0]} rotation={[HALF, 0, 0]} scale={[1, 1.1, 1]} />
        </group>

        {/* upper arm, elbow, forearm: relaxed pose, slightly outward and forward */}
        <group rotation={[0, 0, 0.1]}>
          <mesh geometry={G.upperArm} material={M.navy} position={[0, -0.5, 0]} />
          <mesh geometry={G.armRing} material={M.chrome} position={[0, -0.18, 0]} />
          <mesh geometry={G.armGlow} material={M.glow} position={[0, -0.4, 0]} rotation={[HALF, 0, 0]} scale={[1, 1, 3]} />
          <mesh geometry={G.armRing} material={M.chrome} position={[0, -0.82, 0]} />

          <group position={[0, -0.96, 0]}>
            <mesh geometry={G.elbow} material={M.gun} />
            <group rotation={[-0.38, 0, 0]}>
              <mesh geometry={G.forearm} material={M.chrome} position={[0, -0.34, 0]} />
              <mesh geometry={G.forearmPlate} material={M.navy} position={[0, -0.3, 0.14]} />
              {/* clean "display cut" end: glowing ring and dark cap */}
              <mesh geometry={G.armCap} material={M.gun} position={[0, -0.63, 0]} />
              <mesh geometry={G.armCapRing} material={M.glow} position={[0, -0.615, 0]} rotation={[HALF, 0, 0]} scale={[1, 1, 3]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Robot                                                                       */
/* -------------------------------------------------------------------------- */

export default function OryqenRobot({ mode, animate, reducedMotion, input }: OryqenRobotProps) {
  const invalidate = useThree((s) => s.invalidate);
  const { G, M } = useRobotAssets();

  const rootRef = useRef<Group>(null);
  const upperRef = useRef<Group>(null);
  const chestRef = useRef<Group>(null);
  const neckRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const coreRef = useRef<Group>(null);
  const tipRef = useRef<Mesh>(null);
  const scanRef = useRef<Mesh>(null);
  const armRRef = useRef<Group>(null);
  const armLRef = useRef<Group>(null);

  const pose = useRef({ yaw: 0, pitch: 0 });

  const scratch = useMemo(
    () => ({
      pivot: new Vector3(),
      cam: new Vector3(),
      ndc: new Vector3(),
      dir: new Vector3(),
      target: new Vector3(),
      accent: new Color(ROBOT_MODES[0].accent),
      white: new Color(1, 1, 1),
      modeColours: ROBOT_MODES.map((m) => new Color(m.accent)),
    }),
    [],
  );

  // In 'demand' mode (paused / reduced motion / off-screen) nothing re-renders on its
  // own, so repaint once whenever the inputs that change the picture change.
  useEffect(() => {
    invalidate();
  }, [mode, animate, reducedMotion, invalidate]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    const upper = upperRef.current;
    const chest = chestRef.current;
    const neck = neckRef.current;
    const head = headRef.current;
    const core = coreRef.current;
    const tip = tipRef.current;
    const scan = scanRef.current;
    const armR = armRRef.current;
    const armL = armLRef.current;
    if (!root || !upper || !chest || !neck || !head || !core || !tip || !scan || !armR || !armL) return;

    const modeIndex = ROBOT_MODES[mode] ? mode : 0;
    const preset = ROBOT_MODES[modeIndex];
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const s = scratch;
    const p = pose.current;

    // Accent colour: ease between modes while animating, snap when paused.
    if (animate) s.accent.lerp(s.modeColours[modeIndex], 1 - Math.exp(-dt * 6));
    else s.accent.copy(s.modeColours[modeIndex]);

    const applyGlow = (pulse: number, flicker: number, scanX: number) => {
      M.glow.color.copy(s.accent).multiplyScalar(0.7 + 0.3 * pulse);
      M.visor.color.copy(s.accent).multiplyScalar(0.86 + 0.14 * flicker);
      M.scan.color.copy(s.accent).lerp(s.white, 0.68);
      M.visorHalo.color.copy(s.accent);
      M.visorHalo.opacity = 0.18 + 0.16 * pulse;
      M.coreHalo.color.copy(s.accent);
      M.coreHalo.opacity = 0.28 + 0.2 * pulse;
      M.floorGlow.color.copy(s.accent);
      M.floorGlow.opacity = 0.14 + 0.1 * pulse;

      // Scan highlight slides across the visor, following the skull's curvature.
      const a = SK[0] * 1.06;
      const b = SK[1] * 1.06;
      const c = SK[2] * 1.06;
      const y = 0.07;
      const x = scanX * a;
      const z = c * Math.sqrt(Math.max(0, 1 - (x / a) ** 2 - (y / b) ** 2));
      scan.position.set(x, y, z);
      scan.rotation.y = Math.atan2(x / (a * a), z / (c * c));
    };

    // Paused: freeze the pose exactly where it is. Colours still follow the selected mode.
    if (!animate && !reducedMotion) {
      applyGlow(0.5, 0.5, 0);
      return;
    }

    // Reduced motion: neutral rest pose, no tracking, no pulses.
    if (!animate) {
      p.yaw = 0;
      p.pitch = 0;
      neck.rotation.set(0, 0, 0);
      head.rotation.set(0, 0, 0);
      upper.position.y = 0;
      chest.scale.set(1, 1, 1);
      armR.rotation.z = 0;
      armL.rotation.z = 0;
      tip.scale.setScalar(1);
      core.scale.setScalar(1);
      applyGlow(0.5, 0.5, 0);
      return;
    }

    /* ---- head tracking: look at the point under the cursor ---------------- */
    const inp = input.current;
    let targetYaw = 0;
    let targetPitch = 0;
    if (inp.hasPointer && !inp.dragging) {
      const cam = state.camera;
      head.getWorldPosition(s.pivot);
      const depth = Math.max(cam.position.distanceTo(s.pivot) - GAZE_DEPTH, 1);
      s.ndc
        .set(MathUtils.clamp(inp.x, -2.4, 2.4), MathUtils.clamp(inp.y, -2.4, 2.4), 0.5)
        .unproject(cam);
      s.dir.copy(s.ndc).sub(cam.position).normalize();
      s.target.copy(cam.position).addScaledVector(s.dir, depth);
      root.worldToLocal(s.target);
      root.worldToLocal(s.pivot);
      const dx = s.target.x - s.pivot.x;
      const dy = s.target.y - s.pivot.y;
      const dz = s.target.z - s.pivot.z;

      // Fade tracking out as the camera swings round behind the robot.
      s.cam.copy(cam.position);
      root.worldToLocal(s.cam);
      const azimuth = Math.atan2(s.cam.x, s.cam.z);
      const gate = 1 - MathUtils.smoothstep(Math.abs(azimuth), 1.15, 1.9);

      targetYaw = MathUtils.clamp(Math.atan2(dx, dz), -preset.maxYaw, preset.maxYaw) * gate;
      targetPitch =
        MathUtils.clamp(Math.atan2(dy, Math.hypot(dx, dz)), -preset.maxPitchDown, preset.maxPitchUp) * gate;
    }
    // While dragging the camera the head recentres, so tracking never fights the drag.
    const lambda = inp.dragging ? 3 : preset.trackLambda;
    p.yaw = MathUtils.damp(p.yaw, targetYaw, lambda, dt);
    p.pitch = MathUtils.damp(p.pitch, targetPitch, lambda, dt);

    /* ---- idle: breathing + gentle head drift ------------------------------ */
    const breath = Math.sin(t * 1.45 * preset.breathRate) * preset.breath;
    upper.position.y = breath * 0.008;
    chest.scale.set(1 + breath * 0.005, 1 + breath * 0.012, 1 + breath * 0.007);
    armR.rotation.z = 1 * (breath * 0.012);
    armL.rotation.z = -1 * (breath * 0.012);

    const idleYaw = (Math.sin(t * 0.47) * 0.05 + Math.sin(t * 0.9 + 2) * 0.015) * preset.breath;
    const idlePitch = Math.sin(t * 0.36 + 1) * 0.025 * preset.breath;
    const idleRoll = Math.sin(t * 0.41) * 0.018 * preset.breath;
    neck.rotation.set(-p.pitch * 0.25, p.yaw * 0.35, 0);
    head.rotation.set(-p.pitch * 0.75 + idlePitch, p.yaw * 0.65 + idleYaw, -p.yaw * 0.1 + idleRoll);

    /* ---- emissive pulses -------------------------------------------------- */
    const pulse = 0.5 + 0.5 * Math.sin(t * preset.pulse);
    const flicker = Math.sin(t * preset.pulse * 1.3 + 1);
    applyGlow(pulse, flicker, Math.sin(t * 0.9) * 0.5);
    core.rotation.y += dt * 0.7 * (preset.pulse > 2 ? 1.5 : 1);
    core.scale.setScalar(1 + 0.08 * pulse);
    tip.scale.setScalar(0.8 + 0.5 * pulse);
  });

  return (
    <group ref={rootRef}>
      {/* ---------------- floor: soft shadow + coloured haze ---------------- */}
      <mesh geometry={G.quad} material={M.shadow} position={[0, -2.455, 0]} rotation={[-HALF, 0, 0]} scale={[5.4, 5.4, 1]} renderOrder={-2} />
      <mesh geometry={G.quad} material={M.floorGlow} position={[0, -2.445, 0]} rotation={[-HALF, 0, 0]} scale={[3.9, 3.9, 1]} renderOrder={-1} />

      {/* ---------------- plinth ---------------- */}
      <mesh geometry={G.plinth} material={M.gun} position={[0, -2.28, 0]} />
      <mesh geometry={G.plinthTop} material={M.chrome} position={[0, -2.09, 0]} />
      <mesh geometry={G.plinthRing} material={M.glow} position={[0, -2.055, 0]} rotation={[HALF, 0, 0]} />

      {/* ---------------- waist + abdomen ---------------- */}
      <mesh geometry={G.waist} material={M.gun} position={[0, -1.9, 0]} scale={[1, 1, 0.66]} />
      <mesh geometry={G.abdomen} material={M.chrome} position={[0, -1.68, 0]} scale={[1, 1, 0.64]} />
      <mesh geometry={G.abdomen} material={M.navy} position={[0, -1.47, 0]} scale={[1, 1, 0.64]} />
      <mesh geometry={G.abdomen} material={M.chrome} position={[0, -1.26, 0]} scale={[1, 1, 0.64]} />
      <mesh geometry={G.neckGlow} material={M.glow} position={[0, -1.575, 0]} rotation={[HALF, 0, 0]} scale={[2.52, 1.65, 2.5]} />
      <mesh geometry={G.neckGlow} material={M.glow} position={[0, -1.365, 0]} rotation={[HALF, 0, 0]} scale={[2.52, 1.65, 2.5]} />
      <mesh geometry={G.belt} material={M.gun} position={[0, -1.03, 0]} scale={[1, 1, 0.62]} />

      {/* ---------------- upper body (breathes as one) ---------------- */}
      <group ref={upperRef}>
        {/* chest */}
        <group ref={chestRef} position={[0, -0.25, 0]}>
          <mesh geometry={G.chest} material={M.navy} scale={[1, 1, 0.58]} />

          {/* chest armour: sternum plate + two plates seated on the octagon's side facets */}
          <mesh geometry={G.sternum} material={M.satin} position={[0, 0.3, 0.505]} rotation={[-0.14, 0, 0]} />
          {([-1, 1] as const).map((sx) => (
            <mesh key={sx} geometry={G.pecSide} material={M.satin} position={[sx * 0.62, 0.3, 0.385]} rotation={[-0.14, sx * 0.525, 0, 'YXZ']} />
          ))}

          {/* ORYQEN core: glass window, ring, spinning gem, halo */}
          <mesh geometry={G.coreGlass} material={M.glass} position={[0, -0.15, 0.44]} rotation={[HALF, 0, 0]} />
          <mesh geometry={G.coreRing} material={M.glow} position={[0, -0.15, 0.475]} />
          <group ref={coreRef} position={[0, -0.15, 0.47]}>
            <mesh geometry={G.coreGem} material={M.glow} scale={[1, 1.3, 1]} />
          </group>
          <mesh geometry={G.quad} material={M.coreHalo} position={[0, -0.15, 0.52]} scale={[0.95, 0.95, 1]} renderOrder={3} />

          {([-1, 1] as const).map((sx) => (
            <mesh key={sx} geometry={G.ribGlow} material={M.glow} position={[sx * 0.33, -0.15, 0.432]} />
          ))}

          {/* name plate */}
          <mesh geometry={G.namePlate} material={M.gun} position={[0, -0.5, 0.4]} />
          <mesh geometry={G.wordmark} material={M.wordmark} position={[0, -0.5, 0.436]} renderOrder={4} />

          {/* back: armour plate, vents, power module */}
          <mesh geometry={G.backPlate} material={M.navy} position={[0, 0.05, -0.47]} rotation={[0, Math.PI, 0]} />
          {([-0.42, -0.3, 0.3, 0.42] as const).map((x) => (
            <mesh key={x} geometry={G.vent} material={M.glow} position={[x, 0.06, -0.56]} />
          ))}
          <mesh geometry={G.powerModule} material={M.gun} position={[0, 0.02, -0.6]} />
          <mesh geometry={G.moduleCap} material={M.chrome} position={[0, 0.28, -0.6]} />
          <mesh geometry={G.moduleCap} material={M.chrome} position={[0, -0.24, -0.6]} />
          <mesh geometry={G.moduleRing} material={M.glow} position={[0, 0.02, -0.6]} rotation={[HALF, 0, 0]} scale={[1, 1, 2.2]} />
        </group>

        {/* collar + clavicles */}
        <mesh geometry={G.collar} material={M.gun} position={[0, 0.5, 0]} scale={[1, 1, 0.8]} />
        <mesh geometry={G.collarRing} material={M.chrome} position={[0, 0.64, 0]} scale={[1, 1, 0.9]} />
        {([-1, 1] as const).map((sx) => (
          <mesh key={sx} geometry={G.clavicle} material={M.satin} position={[sx * 0.52, 0.52, 0.2]} rotation={[0.35, sx * -0.1, sx * -0.28]} />
        ))}

        {/* arms */}
        <Arm G={G} M={M} side={1} armRef={armRRef} />
        <Arm G={G} M={M} side={-1} armRef={armLRef} />

        {/* neck */}
        <group ref={neckRef} position={[0, 0.66, 0]}>
          <mesh geometry={G.neckCore} material={M.gun} position={[0, 0.25, 0]} />
          {[0.08, 0.24, 0.4].map((y, i) => (
            <mesh key={y} geometry={G.neckRing} material={i === 1 ? M.navy : M.chrome} position={[0, y, 0]} />
          ))}
          {[0.16, 0.32].map((y) => (
            <mesh key={y} geometry={G.neckGlow} material={M.glow} position={[0, y, 0]} rotation={[HALF, 0, 0]} />
          ))}
          {([-1, 1] as const).map((sx) => (
            <group key={sx} position={[sx * 0.3, 0.22, -0.08]} rotation={[0, 0, sx * -0.1]}>
              <mesh geometry={G.piston} material={M.chrome} />
              <mesh geometry={G.pistonSleeve} material={M.gun} position={[0, -0.12, 0]} />
            </group>
          ))}

          {/* ---------------- head ---------------- */}
          <group ref={headRef} position={[0, 0.5, 0]}>
            <group position={[0, 0.56, 0]}>
              <mesh geometry={G.skull} material={M.chrome} scale={SK} />
              <mesh geometry={G.crest} material={M.chrome} />
              <mesh geometry={G.rearSeam} material={M.glow} position={[0, 0.24, 0]} scale={[0.95, 1, 1.008]} />
              <mesh geometry={G.brow} material={M.navy} scale={grow(SK, 1.03)} />
              <mesh geometry={G.jaw} material={M.navy} scale={grow(SK, 1.03)} />

              {/* visor: near-black glass, glowing eye-line, soft spot that sweeps across it, halo */}
              <mesh geometry={G.visor} material={M.visorGlass} scale={grow(SK, 1.035)} renderOrder={2} />
              <mesh geometry={G.visor} material={M.visor} scale={grow(SK, 1.045)} renderOrder={3} />
              <mesh ref={scanRef} geometry={G.quad} material={M.scan} scale={[0.2, 0.16, 1]} renderOrder={4} />
              <mesh geometry={G.quad} material={M.visorHalo} position={[0, 0.07, 0.76]} scale={[1.9, 0.8, 1]} renderOrder={3} />

              {/* Guardian Edition: layered floating cheek armour, sculpted jaw and
                  twin cyan optical channels. All geometry remains real 3D and
                  inherits the tracked head rig rather than facing the camera. */}
              {([-1, 1] as const).map((side) => (
                <group key={`face-${side}`} scale={[side, 1, 1]}>
                  <mesh geometry={G.cheekPlate} material={M.chrome}
                    position={[0.48, -0.28, 0.38]} rotation={[0.12, -0.28, -0.16]} />
                  <mesh geometry={G.cheekInlay} material={M.navy}
                    position={[0.505, -0.26, 0.425]} rotation={[0.12, -0.28, -0.16]} />
                  <mesh geometry={G.cheekLight} material={M.glow}
                    position={[0.49, -0.18, 0.456]} rotation={[0.12, -0.28, -0.16]} />
                  <mesh geometry={G.templeBlade} material={M.chrome}
                    position={[0.54, 0.26, 0.24]} rotation={[0.1, -0.35, -0.1]} />
                </group>
              ))}
              <mesh geometry={G.chinGuard} material={M.chrome} position={[0, -0.55, 0.38]} rotation={[0.18, 0, 0]} />
              <mesh geometry={G.chinGlow} material={M.glow} position={[0, -0.47, 0.485]} />

              {/* ear modules */}
              {([-1, 1] as const).map((sx) => (
                <group key={sx} position={[sx * 0.65, -0.02, -0.02]}>
                  <mesh geometry={G.earDisc} material={M.chrome} rotation={[0, 0, HALF]} />
                  <mesh geometry={G.earGlass} material={M.glass} position={[sx * 0.06, 0, 0]} rotation={[0, 0, HALF]} />
                  <mesh geometry={G.earRing} material={M.glow} position={[sx * 0.082, 0, 0]} rotation={[0, HALF, 0]} />
                </group>
              ))}

              {/* Low-profile neural receiver replaces the toy-like antenna. */}
              <group position={[0.57, 0.28, -0.12]} rotation={[0, 0, -0.12]}>
                <mesh geometry={G.antennaTip} material={M.chrome} scale={[1.8, 0.9, 1.8]} />
                <mesh ref={tipRef} geometry={G.antennaTip} material={M.glow} position={[0, 0.05, 0]} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
