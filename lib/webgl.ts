import type { OGLRenderingContext, Renderer } from "ogl";

// For the WebGL liquid layer: finding half-float render targets the GPU can
// actually draw into.

export type Format = { internalFormat: number; format: number };

// Can this float format be rendered into? Falls back R → RG → RGBA, since
// some GPUs only support the wider ones as render targets.
function supportedFormat(gl: OGLRenderingContext, internalFormat: number, format: number, type: number): Format | null {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(tex);
  if (ok) return { internalFormat, format };
  const gl2 = gl as WebGL2RenderingContext;
  if (internalFormat === gl2.R16F) return supportedFormat(gl, gl2.RG16F, gl2.RG, type);
  if (internalFormat === gl2.RG16F) return supportedFormat(gl, gl2.RGBA16F, gl.RGBA, type);
  return null;
}

// Half-float targets, WebGL2 first, WebGL1 via extensions. Null when the GPU
// can't do it, in which case the caller should fall back to no effect.
export function halfFloatTargets(renderer: Renderer) {
  const gl = renderer.gl;
  const gl2 = gl as WebGL2RenderingContext;
  const isWebgl2 = renderer.isWebgl2;
  const type: number | undefined = isWebgl2 ? gl2.HALF_FLOAT : renderer.extensions.OES_texture_half_float?.HALF_FLOAT_OES;
  if (!type) return null;
  const rg = isWebgl2 ? supportedFormat(gl, gl2.RG16F, gl2.RG, type) : supportedFormat(gl, gl.RGBA, gl.RGBA, type);
  const r = isWebgl2 ? supportedFormat(gl, gl2.R16F, gl2.RED, type) : rg;
  if (!rg || !r) return null;
  const linear = renderer.extensions[`OES_texture_${isWebgl2 ? "" : "half_"}float_linear`] ? gl.LINEAR : gl.NEAREST;
  return { type, rg, r, linear };
}
