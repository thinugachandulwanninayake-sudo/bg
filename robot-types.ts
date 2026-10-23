import type { MutableRefObject } from 'react';

/**
 * Per-mode behaviour. The index matches the `modes` array in cinematic-core.tsx
 * (0 = CLARITY, 1 = TRUST, 2 = CONTROL).
 *
 * - accent:       colour of the visor, core and trim glow
 * - pulse:        emissive pulse speed (radians/sec)
 * - breath:       breathing amplitude multiplier
 * - breathRate:   breathing speed multiplier
 * - trackLambda:  head-tracking responsiveness (higher = snappier)
 * - maxYaw/Pitch: head turn limits in radians
 */
export interface RobotModePreset {
  readonly id: 'clarity' | 'trust' | 'control';
  readonly accent: string;
  readonly pulse: number;
  readonly breath: number;
  readonly breathRate: number;
  readonly trackLambda: number;
  readonly maxYaw: number;
  readonly maxPitchUp: number;
  readonly maxPitchDown: number;
}

export const ROBOT_MODES: readonly RobotModePreset[] = [
  // CLARITY: open and attentive, ORYQEN cyan
  { id: 'clarity', accent: '#18c3f3', pulse: 1.6, breath: 1, breathRate: 1, trackLambda: 6, maxYaw: 0.6, maxPitchUp: 0.32, maxPitchDown: 0.26 },
  // TRUST: calm, slower breathing and pulses, softer head movement, violet
  { id: 'trust', accent: '#8f78ff', pulse: 0.9, breath: 0.8, breathRate: 0.75, trackLambda: 3.2, maxYaw: 0.45, maxPitchUp: 0.24, maxPitchDown: 0.2 },
  // CONTROL: precise, quicker response and pulses, teal
  { id: 'control', accent: '#16d9b5', pulse: 2.4, breath: 1.1, breathRate: 1.2, trackLambda: 9, maxYaw: 0.66, maxPitchUp: 0.34, maxPitchDown: 0.28 },
];

/** Live input written by the DOM wrapper and read by the scene every frame. */
export interface RobotInput {
  /** Cursor position in the canvas' normalised device coordinates (-1..1, may exceed when outside). */
  x: number;
  y: number;
  /** True only while a mouse/pen is hovering somewhere on the page. Never true for touch. */
  hasPointer: boolean;
  /** True while OrbitControls is being dragged; head tracking recentres meanwhile. */
  dragging: boolean;
}

export function createRobotInput(): RobotInput {
  return { x: 0, y: 0, hasPointer: false, dragging: false };
}

/** Imperative camera API exposed by the canvas to the buttons and keyboard handler. */
export interface RobotRig {
  /** Smoothly return the camera to its default view. */
  reset(): void;
  /** Smoothly rotate the camera by the given azimuth/polar deltas (radians). */
  nudge(azimuth: number, polar?: number): void;
}

export type RobotRigRef = MutableRefObject<RobotRig | null>;

/** Why the 3D view is not being shown. */
export type RobotFailureReason =
  | 'webgl2-unsupported'
  | 'context-creation-failed'
  | 'context-lost'
  | 'runtime';
