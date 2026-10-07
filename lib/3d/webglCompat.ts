import { WebGLRenderer, type WebGLRendererParameters } from 'three';
import { report } from '@/lib/diag';

/**
 * Privacy browsers (e.g. Brave Shields) can make getShaderPrecisionFormat()
 * return null — or throw — to resist fingerprinting. three.js reads
 * `.precision` from it while creating the renderer, so the 3D never starts.
 *
 * Two layers of protection:
 *  1. the shared WebGL prototypes are patched where the browser allows it;
 *  2. every renderer is created on a context we own, wrapped in a proxy that
 *     always answers getShaderPrecisionFormat — whatever the browser has done to
 *     the prototype or to the context instance.
 * WebGL2 guarantees IEEE single precision for highp, so that is the answer.
 */
const FLOAT = { rangeMin: 127, rangeMax: 127, precision: 23 };
const INT = { rangeMin: 31, rangeMax: 30, precision: 0 };

function safePrecision(gl: WebGLRenderingContext | WebGL2RenderingContext, original: (s: GLenum, p: GLenum) => WebGLShaderPrecisionFormat | null) {
  return (shaderType: GLenum, precisionType: GLenum): WebGLShaderPrecisionFormat => {
    let result: WebGLShaderPrecisionFormat | null = null;
    try {
      result = original.call(gl, shaderType, precisionType);
    } catch {
      result = null;
    }
    if (result && typeof result.precision === 'number') return result;
    const isInt = precisionType === gl.LOW_INT || precisionType === gl.MEDIUM_INT || precisionType === gl.HIGH_INT;
    return (isInt ? INT : FLOAT) as WebGLShaderPrecisionFormat;
  };
}

let withheld: boolean | null = null;

/**
 * True when this browser withholds shader precision (e.g. Brave Shields).
 * Probed once on a throwaway context; every other browser keeps the standard
 * renderer path untouched.
 */
export function browserWithholdsPrecision(gl?: WebGL2RenderingContext | null): boolean {
  if (withheld !== null) return withheld;
  try {
    const ctx = gl ?? document.createElement('canvas').getContext('webgl2');
    if (!ctx) return (withheld = false);
    const r = ctx.getShaderPrecisionFormat(ctx.VERTEX_SHADER, ctx.HIGH_FLOAT);
    withheld = !r || typeof r.precision !== 'number';
  } catch {
    withheld = true;
  }
  if (withheld) report('compat', 'browser withholds shader precision (privacy protection) — using the protected context');
  return withheld;
}

/** Wraps a context so that getShaderPrecisionFormat can never be null, with bound-method caching. */
export function hardenContext<T extends WebGL2RenderingContext>(gl: T): T {
  const original = gl.getShaderPrecisionFormat;
  const safe = safePrecision(gl, original);
  const cache = new Map<PropertyKey, unknown>();
  // The proxy stands in front of the context rather than wrapping it directly, so a
  // browser that locked the method on the instance cannot trip proxy invariants.
  const stand = Object.create(Object.getPrototypeOf(gl)) as T;
  return new Proxy(stand, {
    get(_stand, prop) {
      if (prop === 'getShaderPrecisionFormat') return safe;
      const value = Reflect.get(gl, prop, gl);
      if (typeof value !== 'function') return value;
      let bound = cache.get(prop);
      if (!bound || (bound as { __src?: unknown }).__src !== value) {
        bound = Object.assign((value as (...a: unknown[]) => unknown).bind(gl), { __src: value });
        cache.set(prop, bound);
      }
      return bound;
    },
    set(_stand, prop, value) {
      return Reflect.set(gl, prop, value, gl);
    },
    has(_stand, prop) {
      return prop in gl;
    },
  });
}

/** Renderer factory for <Canvas gl={...}>: our own context, hardened. */
export function createHardenedRenderer(canvas: HTMLCanvasElement, params: Omit<WebGLRendererParameters, 'canvas' | 'context'>) {
  const attributes: WebGLContextAttributes = {
    alpha: params.alpha ?? true,
    antialias: params.antialias ?? true,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: params.preserveDrawingBuffer ?? false,
    powerPreference: params.powerPreference ?? 'high-performance',
  };
  const raw = canvas.getContext('webgl2', attributes) as WebGL2RenderingContext | null;
  if (!raw) throw new Error('WebGL2 context could not be created');
  return new WebGLRenderer({ ...params, canvas, context: hardenContext(raw) });
}
