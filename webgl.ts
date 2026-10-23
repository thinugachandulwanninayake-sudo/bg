import type { RobotFailureReason } from './robot-types';

export type WebGLProbeResult =
  | {
      ok: true;
      /** Whether a multisampled context could be created. */
      antialias: boolean;
      /** True when the browser reports a software rasteriser (SwiftShader, llvmpipe...). */
      software: boolean;
    }
  | { ok: false; reason: Extract<RobotFailureReason, 'webgl2-unsupported' | 'context-creation-failed'> };

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|software|softpipe|basic render/i;

/**
 * three.js r163+ (this project uses r180) only supports WebGL 2. A WebGL 1 context
 * is useless to it, so we probe `webgl2` specifically and never fall back to `webgl`.
 *
 * The probe context is released straight away so it never counts against the
 * browser's limit on live WebGL contexts.
 *
 * Browser only: call from an effect or event handler, never during render.
 */
export function probeWebGL2(): WebGLProbeResult {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { ok: false, reason: 'webgl2-unsupported' };
  }
  if (typeof window.WebGL2RenderingContext === 'undefined') {
    return { ok: false, reason: 'webgl2-unsupported' };
  }

  // Same attribute set the renderer will request, so the probe is representative.
  const base: WebGLContextAttributes = {
    alpha: true,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'default',
    failIfMajorPerformanceCaveat: false,
  };

  for (const antialias of [true, false]) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2', { ...base, antialias });
    } catch {
      gl = null;
    }
    if (gl && !gl.isContextLost()) {
      let software = false;
      try {
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        if (info) {
          const renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? '');
          software = SOFTWARE_RENDERER.test(renderer);
        }
      } catch {
        /* extension blocked: treat as hardware */
      }
      try {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        /* nothing to release */
      }
      return { ok: true, antialias, software };
    }
  }

  return { ok: false, reason: 'context-creation-failed' };
}
