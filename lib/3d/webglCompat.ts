/**
 * Privacy browsers (e.g. Brave Shields) can make getShaderPrecisionFormat()
 * return null to resist fingerprinting. three.js reads `.precision` from it while
 * creating the renderer and throws, so the 3D never starts. WebGL2 guarantees
 * IEEE single precision for highp, so we answer with exactly that when the
 * browser withholds it.
 */
const FALLBACK = {
  float: { rangeMin: 127, rangeMax: 127, precision: 23 },
  int: { rangeMin: 31, rangeMax: 30, precision: 0 },
};

let patched = false;

export function patchWebGLForPrivacyBrowsers() {
  if (patched || typeof window === 'undefined') return;
  patched = true;
  const contexts = [window.WebGL2RenderingContext, window.WebGLRenderingContext].filter(Boolean);
  for (const ctx of contexts) {
    const proto = ctx.prototype as WebGLRenderingContext;
    const original = proto.getShaderPrecisionFormat;
    if (!original) continue;
    proto.getShaderPrecisionFormat = function (shaderType: GLenum, precisionType: GLenum) {
      let result: WebGLShaderPrecisionFormat | null = null;
      try {
        result = original.call(this, shaderType, precisionType);
      } catch {
        result = null;
      }
      if (result) return result;
      const isInt = precisionType === this.LOW_INT || precisionType === this.MEDIUM_INT || precisionType === this.HIGH_INT;
      return (isInt ? FALLBACK.int : FALLBACK.float) as WebGLShaderPrecisionFormat;
    };
  }
}
