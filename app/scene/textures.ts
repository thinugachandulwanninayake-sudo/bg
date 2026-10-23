import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';

/**
 * Procedural textures drawn once in the browser. No network fetches, no external
 * HDRIs — the whole scene stays self-contained and works offline.
 */

const cache = new Map<string, Texture>();

function create(key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const cached = cache.get(key);
  if (cached) return cached;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  draw(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  cache.set(key, texture);
  return texture;
}

/** Soft round sprite used by every particle field. */
export function particleSprite(): Texture | null {
  return create('particle', 64, 64, (ctx) => {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(190,240,255,0.85)');
    gradient.addColorStop(0.7, 'rgba(90,200,255,0.22)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  });
}

/** Large radial bloom used as an atmospheric light card. */
export function glowTexture(color = '70,210,255'): Texture | null {
  return create(`glow-${color}`, 256, 256, (ctx) => {
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, `rgba(${color},0.95)`);
    gradient.addColorStop(0.28, `rgba(${color},0.42)`);
    gradient.addColorStop(0.62, `rgba(${color},0.10)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  });
}

/** Frosted holographic data panel with a technical grid and corner brackets. */
export function holoPanelTexture(variant = 0): Texture | null {
  return create(`panel-${variant}`, 512, 320, (ctx) => {
    ctx.clearRect(0, 0, 512, 320);
    ctx.fillStyle = 'rgba(10,38,68,0.34)';
    ctx.fillRect(0, 0, 512, 320);

    ctx.strokeStyle = 'rgba(90,200,255,0.16)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 320);
      ctx.stroke();
    }
    for (let y = 0; y <= 320; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(120,225,255,0.75)';
    ctx.lineWidth = 2;
    const corners: Array<[number, number, number, number]> = [
      [16, 16, 1, 1],
      [496, 16, -1, 1],
      [16, 304, 1, -1],
      [496, 304, -1, -1],
    ];
    for (const [x, y, sx, sy] of corners) {
      ctx.beginPath();
      ctx.moveTo(x, y + sy * 34);
      ctx.lineTo(x, y);
      ctx.lineTo(x + sx * 34, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(120,225,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(300, 272);
    ctx.lineTo(300, 296);
    ctx.lineTo(340, 296);
    ctx.stroke();

    ctx.fillStyle = 'rgba(175,238,255,0.8)';
    ctx.font = '700 16px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(variant === 0 ? 'ORYQEN / CORE' : 'ORYQEN / SIGNAL', 44, 68);

    ctx.fillStyle = 'rgba(120,205,255,0.42)';
    ctx.font = '500 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    const rows = [92, 108, 124, 140];
    rows.forEach((y, index) => {
      ctx.fillStyle = `rgba(120,205,255,${0.34 - index * 0.05})`;
      ctx.fillRect(44, y, 130 + (index % 2) * 46, 4);
    });

    /* Small telemetry bar cluster — decorative only. */
    for (let i = 0; i < 12; i += 1) {
      const height = 10 + ((i * 13 + variant * 7) % 46);
      ctx.fillStyle = i % 3 === 0 ? 'rgba(150,240,255,0.7)' : 'rgba(90,190,255,0.38)';
      ctx.fillRect(44 + i * 13, 210 - height, 5, height);
    }

    ctx.strokeStyle = 'rgba(150,240,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(390, 120, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(390, 120, 46, 0.6, 2.4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(150,240,255,0.85)';
    ctx.beginPath();
    ctx.arc(390, 120, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}
