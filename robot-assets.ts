import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  type Material,
  type Texture,
} from 'three';

type P2 = readonly [number, number];

/* -------------------------------------------------------------------------- */
/* Small geometry helpers                                                      */
/* -------------------------------------------------------------------------- */

/** Extrude a flat polygon into a bevelled plate. Cheap, and reads as machined armour. */
function polygonPlate(points: readonly P2[], depth: number, bevel = 0.014): ExtrudeGeometry {
  const shape = new Shape();
  points.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 1,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

/** Rectangle with chamfered corners. */
function chamferRect(w: number, h: number, c: number): P2[] {
  const x = w / 2;
  const y = h / 2;
  return [
    [-x + c, -y], [x - c, -y], [x, -y + c], [x, y - c],
    [x - c, y], [-x + c, y], [-x, y - c], [-x, -y + c],
  ];
}

/** Trapezoid (top width, bottom width) with chamfered corners. */
function trapezoid(topW: number, botW: number, h: number, c: number): P2[] {
  const t = topW / 2;
  const b = botW / 2;
  const y = h / 2;
  return [
    [-b + c, -y], [b - c, -y], [b, -y + c], [t, y - c],
    [t - c, y], [-t + c, y], [-t, y - c], [-b, -y + c],
  ];
}

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

export function createRobotGeometries() {
  const HALF = Math.PI / 2;

  // Head crest: a swept blade drawn in (z, y) head space, then turned so its
  // thin extrusion axis becomes X.
  const crest = polygonPlate(
    [
      [0.46, 0.54], [0.26, 0.76], [-0.1, 0.8], [-0.5, 0.5],
      [-0.42, 0.45], [-0.1, 0.7], [0.2, 0.67], [0.38, 0.5],
    ],
    0.07,
    0.012,
  );
  crest.rotateY(-HALF);

  // Rear seam arc, drawn directly in the XZ plane around the back of the skull.
  const seamArc = Math.PI * 1.3;
  const rearSeam = new TorusGeometry(0.64, 0.012, 6, 40, seamArc);
  rearSeam.rotateZ(Math.PI * 1.5 - seamArc / 2);
  rearSeam.rotateX(HALF);

  // Octagonal chest. Turned 22.5 degrees *in the geometry* so a flat faces forward;
  // doing it with mesh.rotation would apply the Z squash first (scale runs before
  // rotation in three.js) and skew the cross-section.
  const chest = new CylinderGeometry(0.98, 0.66, 1.25, 8, 1);
  chest.rotateY(Math.PI / 8);

  return {
    /* head: unit shapes are scaled in JSX to the skull ellipsoid */
    skull: new SphereGeometry(1, 32, 20),
    // One curved band is shared by the dark glass and the glowing eye-line texture (UVs line up).
    visor: new SphereGeometry(1, 44, 6, HALF - 0.98, 1.96, HALF - 0.4, 0.62),
    // Thin navy trim bands above and below the visor.
    brow: new SphereGeometry(1, 36, 2, HALF - 0.72, 1.44, 0.98, 0.14),
    jaw: new SphereGeometry(1, 32, 3, HALF - 0.62, 1.24, HALF + 0.3, 0.26),
    cheekPlate: polygonPlate([[-0.17, 0.17], [0.08, 0.23], [0.2, 0.04], [0.08, -0.28], [-0.15, -0.17]], 0.07, 0.025),
    cheekInlay: polygonPlate([[-0.09, 0.1], [0.08, 0.13], [0.11, 0.01], [0.02, -0.14], [-0.1, -0.1]], 0.025, 0.01),
    cheekLight: new BoxGeometry(0.018, 0.22, 0.025),
    templeBlade: polygonPlate([[-0.09, -0.1], [0.05, -0.15], [0.16, 0.1], [-0.05, 0.2]], 0.05, 0.02),
    chinGuard: polygonPlate([[-0.21, 0.07], [0.21, 0.07], [0.15, -0.13], [0, -0.19], [-0.15, -0.13]], 0.065, 0.025),
    chinGlow: new BoxGeometry(0.22, 0.018, 0.016),
    earDisc: new CylinderGeometry(0.2, 0.2, 0.1, 24),
    earGlass: new CylinderGeometry(0.12, 0.12, 0.04, 20),
    earRing: new TorusGeometry(0.155, 0.014, 8, 28),
    crest,
    rearSeam,
    antenna: new CylinderGeometry(0.011, 0.016, 0.55, 8),
    antennaTip: new SphereGeometry(0.035, 10, 8),

    /* neck */
    neckCore: new CylinderGeometry(0.19, 0.22, 0.56, 14),
    neckRing: new CylinderGeometry(0.28, 0.28, 0.05, 18),
    neckGlow: new TorusGeometry(0.235, 0.01, 6, 28),
    piston: new CylinderGeometry(0.024, 0.024, 0.42, 8),
    pistonSleeve: new CylinderGeometry(0.04, 0.04, 0.16, 8),

    /* torso */
    collar: new CylinderGeometry(0.4, 0.58, 0.24, 20),
    collarRing: new CylinderGeometry(0.33, 0.38, 0.08, 20),
    chest,
    sternum: polygonPlate(chamferRect(0.5, 0.46, 0.07), 0.08, 0.028),
    pecSide: polygonPlate(trapezoid(0.4, 0.46, 0.46, 0.06), 0.07, 0.028),
    ribGlow: new BoxGeometry(0.028, 0.4, 0.02),
    clavicle: polygonPlate(chamferRect(0.62, 0.13, 0.04), 0.05, 0.02),
    coreGlass: new CylinderGeometry(0.2, 0.2, 0.08, 28),
    coreRing: new TorusGeometry(0.235, 0.018, 8, 36),
    coreGem: new OctahedronGeometry(0.1, 0),
    namePlate: polygonPlate(chamferRect(0.8, 0.2, 0.04), 0.04, 0.01),
    wordmark: new PlaneGeometry(0.72, 0.135),
    backPlate: polygonPlate(trapezoid(0.95, 0.7, 1, 0.1), 0.1),
    vent: new BoxGeometry(0.035, 0.46, 0.02),
    powerModule: new CylinderGeometry(0.17, 0.17, 0.5, 16),
    moduleCap: new CylinderGeometry(0.21, 0.21, 0.06, 16),
    moduleRing: new TorusGeometry(0.19, 0.011, 6, 24),

    /* waist + base */
    belt: new CylinderGeometry(0.7, 0.66, 0.2, 12),
    abdomen: new CylinderGeometry(0.58, 0.6, 0.19, 20),
    waist: new CylinderGeometry(0.62, 0.7, 0.18, 24),
    plinth: new CylinderGeometry(1.35, 1.55, 0.32, 40),
    plinthTop: new CylinderGeometry(1.25, 1.35, 0.06, 40),
    plinthRing: new TorusGeometry(1.3, 0.016, 6, 72),

    /* shoulders + arms (built for +X, mirrored with scale.x = -1) */
    shoulderBall: new SphereGeometry(0.27, 18, 12),
    shoulderBridge: new CylinderGeometry(0.14, 0.14, 0.55, 10),
    pauldron: new SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, HALF),
    disc: new CircleGeometry(1, 28),
    pauldronTrim: new TorusGeometry(0.46, 0.026, 8, 32),
    pauldronGlow: new TorusGeometry(0.4, 0.011, 6, 32),
    upperArm: new CylinderGeometry(0.17, 0.15, 0.78, 14),
    armRing: new CylinderGeometry(0.2, 0.2, 0.06, 16),
    armGlow: new TorusGeometry(0.165, 0.01, 6, 24),
    elbow: new SphereGeometry(0.19, 16, 12),
    forearm: new CylinderGeometry(0.16, 0.125, 0.56, 14),
    forearmPlate: polygonPlate(chamferRect(0.2, 0.34, 0.05), 0.04, 0.01),
    armCap: new CylinderGeometry(0.13, 0.13, 0.03, 16),
    armCapRing: new TorusGeometry(0.135, 0.012, 6, 24),

    /* flat quad used for soft glow halos and the floor shadow */
    quad: new PlaneGeometry(1, 1),
  };
}

export type RobotGeometries = ReturnType<typeof createRobotGeometries>;

/* -------------------------------------------------------------------------- */
/* Procedural textures (no network, no files)                                  */
/* -------------------------------------------------------------------------- */

function createGlowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.42)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** Glowing eye-line for the visor: a bar with soft fading ends and two brighter modules. */
function createVisorTexture(): CanvasTexture {
  const w = 768;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cy = h / 2;
    const fade = ctx.createLinearGradient(0, 0, w, 0);
    fade.addColorStop(0, 'rgba(255,255,255,0)');
    fade.addColorStop(0.14, 'rgba(255,255,255,0.25)');
    fade.addColorStop(0.26, 'rgba(255,255,255,1)');
    fade.addColorStop(0.74, 'rgba(255,255,255,1)');
    fade.addColorStop(0.86, 'rgba(255,255,255,0.25)');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    // wide soft bloom, then the crisp line on top
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 46;
    ctx.fillStyle = fade;
    ctx.fillRect(70, cy - 9, w - 140, 18);
    ctx.shadowBlur = 14;
    ctx.fillRect(70, cy - 9, w - 140, 18);
    // two brighter "sensor" modules
    ctx.shadowBlur = 24;
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.fillRect(w * 0.31 - 28, cy - 22, 56, 44);
    ctx.fillRect(w * 0.69 - 28, cy - 22, 56, 44);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

const WORDMARK_W = 1024;
const WORDMARK_H = 192;

/** Draws the ORYQEN wordmark and diamond brand mark (◈) onto a 2D canvas. */
function drawWordmark(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, WORDMARK_W, WORDMARK_H);

  const fontSize = 112;
  ctx.font = `700 ${fontSize}px "Space Grotesk", "DM Sans", system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const parts: ReadonlyArray<readonly [string, string]> = [
    ['ORY', '#eaf9ff'],
    ['Q', '#3fd8ff'],
    ['EN', '#eaf9ff'],
    ['.', '#3fd8ff'],
  ];
  const widths = parts.map(([t]) => ctx.measureText(t).width);
  const markSize = 54;
  const markGap = 36;
  const total = markSize * 2 + markGap + widths.reduce((a, b) => a + b, 0);
  let x = (WORDMARK_W - total) / 2;
  const cy = WORDMARK_H / 2 + 4;

  // Diamond mark: outlined diamond with a solid centre.
  const mx = x + markSize;
  ctx.strokeStyle = '#3fd8ff';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(mx, cy - markSize);
  ctx.lineTo(mx + markSize, cy);
  ctx.lineTo(mx, cy + markSize);
  ctx.lineTo(mx - markSize, cy);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#eaf9ff';
  ctx.beginPath();
  ctx.moveTo(mx, cy - markSize * 0.42);
  ctx.lineTo(mx + markSize * 0.42, cy);
  ctx.lineTo(mx, cy + markSize * 0.42);
  ctx.lineTo(mx - markSize * 0.42, cy);
  ctx.closePath();
  ctx.fill();

  x += markSize * 2 + markGap;
  parts.forEach(([text, colour], i) => {
    ctx.fillStyle = colour;
    ctx.fillText(text, x, cy);
    x += widths[i];
  });
}

function createWordmarkTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = WORDMARK_W;
  canvas.height = WORDMARK_H;
  drawWordmark(canvas);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* -------------------------------------------------------------------------- */
/* Materials                                                                   */
/* -------------------------------------------------------------------------- */

function createRobotMaterials(glowTex: Texture, wordmarkTex: Texture, visorTex: Texture) {
  const halo = (opacity: number) =>
    new MeshBasicMaterial({
      map: glowTex,
      color: '#18c3f3',
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false,
    });

  return {
    // Premium chrome armour: lit mostly by the procedural environment map.
    chrome: new MeshStandardMaterial({ color: '#e6eef7', metalness: 1, roughness: 0.15, envMapIntensity: 1.05 }),
    // Satin chrome for flat panels: a blurrier reflection reads evenly, unlike a flat mirror.
    satin: new MeshStandardMaterial({ color: '#dbe6f2', metalness: 1, roughness: 0.34, envMapIntensity: 1.0 }),
    navy: new MeshStandardMaterial({ color: '#14437f', metalness: 0.55, roughness: 0.3, envMapIntensity: 0.95 }),
    gun: new MeshStandardMaterial({ color: '#233656', metalness: 0.75, roughness: 0.4, envMapIntensity: 0.85 }),
    // Cheap glass: alpha blend, no transmission pass (that would be costly on integrated GPUs).
    glass: new MeshStandardMaterial({
      color: '#08336a',
      metalness: 0.25,
      roughness: 0.04,
      transparent: true,
      opacity: 0.6,
      envMapIntensity: 1.8,
    }),
    // Near-black glossy visor glass; the eye-line is drawn over it.
    visorGlass: new MeshStandardMaterial({
      color: '#030f24',
      metalness: 0.4,
      roughness: 0.03,
      transparent: true,
      opacity: 0.94,
      envMapIntensity: 2.4,
    }),
    // Emissive-style materials are unlit basic materials whose colour is pulsed per frame.
    glow: new MeshBasicMaterial({ color: '#18c3f3', toneMapped: false }),
    visor: new MeshBasicMaterial({
      map: visorTex,
      color: '#18c3f3',
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
    scan: new MeshBasicMaterial({
      map: glowTex,
      color: '#d9f8ff',
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
    wordmark: new MeshBasicMaterial({
      map: wordmarkTex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: DoubleSide,
    }),
    visorHalo: halo(0.4),
    coreHalo: halo(0.4),
    floorGlow: halo(0.2),
    shadow: new MeshBasicMaterial({
      map: glowTex,
      color: '#0a2a52',
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      toneMapped: false,
    }),
  };
}

export type RobotMaterials = ReturnType<typeof createRobotMaterials>;

/* -------------------------------------------------------------------------- */
/* Bundle + React hook                                                         */
/* -------------------------------------------------------------------------- */

export interface RobotAssets {
  G: RobotGeometries;
  M: RobotMaterials;
  /** Redraw the wordmark texture (call after the web font finishes loading). */
  refreshWordmark(): void;
  dispose(): void;
}

export function createRobotAssets(): RobotAssets {
  const G = createRobotGeometries();
  const glowTex = createGlowTexture();
  const wordmarkTex = createWordmarkTexture();
  const visorTex = createVisorTexture();
  const M = createRobotMaterials(glowTex, wordmarkTex, visorTex);

  return {
    G,
    M,
    refreshWordmark() {
      const canvas = wordmarkTex.image as HTMLCanvasElement;
      drawWordmark(canvas);
      wordmarkTex.needsUpdate = true;
    },
    dispose() {
      (Object.values(G) as BufferGeometry[]).forEach((g) => g.dispose());
      (Object.values(M) as Material[]).forEach((m) => m.dispose());
      glowTex.dispose();
      wordmarkTex.dispose();
      visorTex.dispose();
    },
  };
}

/**
 * Creates the robot's GPU resources once and frees them on unmount.
 *
 * Strict Mode safe: React keeps the memoised assets across its simulated
 * unmount/remount and three.js transparently re-uploads anything that was
 * disposed in between.
 */
export function useRobotAssets(): RobotAssets {
  const invalidate = useThree((s) => s.invalidate);
  const assets = useMemo(createRobotAssets, []);

  useEffect(() => () => assets.dispose(), [assets]);

  // The wordmark uses Space Grotesk (already loaded by the page). Redraw once it is available.
  useEffect(() => {
    let cancelled = false;
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    if (fonts?.load) {
      fonts
        .load('700 112px "Space Grotesk"')
        .then(() => {
          if (cancelled) return;
          assets.refreshWordmark();
          invalidate();
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [assets, invalidate]);

  return assets;
}
