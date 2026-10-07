import { WebGLRenderer } from 'three';
import { report, setGpu } from '@/lib/diag';

/**
 * Creates every renderer on the site.
 *
 * The context is created exactly as three.js would create it, with a lost-context
 * listener registered first so a context the browser drops during creation can
 * still be restored. Before three starts, the context is checked for the answers
 * three reads while starting:
 *
 *   getShaderPrecisionFormat · getParameter (VERSION and limits) · getContextAttributes
 *
 * Privacy protections (Brave Shields, fingerprinting defences) can answer those
 * with null, which makes three throw. Only when this context really does that is
 * it put behind a proxy that answers with the values WebGL2 guarantees. Every
 * other browser gets the raw context, untouched.
 */
export interface RendererOptions {
  antialias: boolean;
  powerPreference: WebGLPowerPreference;
}

const FLOAT = { rangeMin: 127, rangeMax: 127, precision: 23 };
const INT = { rangeMin: 31, rangeMax: 30, precision: 0 };

/** Minimums every WebGL2 implementation guarantees (used only when the browser answers null). */
function guaranteed(gl: WebGL2RenderingContext, pname: GLenum): unknown {
  switch (pname) {
    case gl.VERSION:
      return 'WebGL 2.0';
    case gl.SHADING_LANGUAGE_VERSION:
      return 'WebGL GLSL ES 3.00';
    case gl.VENDOR:
    case gl.RENDERER:
      return 'WebKit WebGL';
    case gl.MAX_TEXTURE_SIZE:
    case gl.MAX_CUBE_MAP_TEXTURE_SIZE:
    case gl.MAX_RENDERBUFFER_SIZE:
      return 2048;
    case gl.MAX_3D_TEXTURE_SIZE:
      return 256;
    case gl.MAX_ARRAY_TEXTURE_LAYERS:
      return 256;
    case gl.MAX_TEXTURE_IMAGE_UNITS:
    case gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS:
    case gl.MAX_VERTEX_ATTRIBS:
      return 16;
    case gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS:
      return 32;
    case gl.MAX_VERTEX_UNIFORM_VECTORS:
      return 256;
    case gl.MAX_FRAGMENT_UNIFORM_VECTORS:
      return 224;
    case gl.MAX_VARYING_VECTORS:
      return 15;
    case gl.MAX_SAMPLES:
      return 4;
    case gl.MAX_DRAW_BUFFERS:
    case gl.MAX_COLOR_ATTACHMENTS:
      return 4;
    case gl.MAX_UNIFORM_BUFFER_BINDINGS:
    case gl.MAX_COMBINED_UNIFORM_BLOCKS:
      return 24;
    case gl.MAX_UNIFORM_BLOCK_SIZE:
      return 16384;
    case gl.VIEWPORT:
    case gl.SCISSOR_BOX:
      return new Int32Array([0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight]);
    default:
      return null;
  }
}

/** What this context withholds from three, if anything. */
function withheldAnswers(gl: WebGL2RenderingContext): string[] {
  const missing: string[] = [];
  const check = (name: string, ok: () => boolean) => {
    try {
      if (!ok()) missing.push(name);
    } catch {
      missing.push(name);
    }
  };
  check('shader precision', () => {
    const r = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    return !!r && typeof r.precision === 'number';
  });
  check('version', () => typeof gl.getParameter(gl.VERSION) === 'string');
  check('limits', () => typeof gl.getParameter(gl.MAX_TEXTURE_SIZE) === 'number');
  check('context attributes', () => !!gl.getContextAttributes());
  return missing;
}

function protectedContext(gl: WebGL2RenderingContext, attributes: WebGLContextAttributes): WebGL2RenderingContext {
  const cache = new Map<PropertyKey, unknown>();
  const answers: Record<string, (...a: never[]) => unknown> = {
    getShaderPrecisionFormat: (shaderType: GLenum, precisionType: GLenum) => {
      let r: WebGLShaderPrecisionFormat | null = null;
      try {
        r = gl.getShaderPrecisionFormat(shaderType, precisionType);
      } catch {}
      if (r && typeof r.precision === 'number') return r;
      return precisionType === gl.LOW_INT || precisionType === gl.MEDIUM_INT || precisionType === gl.HIGH_INT ? INT : FLOAT;
    },
    getParameter: (pname: GLenum) => {
      let v: unknown = null;
      try {
        v = gl.getParameter(pname);
      } catch {}
      return v ?? guaranteed(gl, pname);
    },
    getContextAttributes: () => {
      let a: WebGLContextAttributes | null = null;
      try {
        a = gl.getContextAttributes();
      } catch {}
      return a ?? attributes;
    },
    getSupportedExtensions: () => {
      let e: string[] | null = null;
      try {
        e = gl.getSupportedExtensions();
      } catch {}
      return e ?? [];
    },
  };
  // the proxy stands in front of the context (not around it), so a browser that
  // locked a method on the instance cannot trip proxy invariants
  const stand = Object.create(Object.getPrototypeOf(gl)) as WebGL2RenderingContext;
  return new Proxy(stand, {
    get(_s, prop) {
      if (typeof prop === 'string' && prop in answers) return answers[prop];
      const value = Reflect.get(gl, prop, gl);
      if (typeof value !== 'function') return value;
      let bound = cache.get(prop) as ((...a: unknown[]) => unknown) & { __src?: unknown };
      if (!bound || bound.__src !== value) {
        bound = Object.assign((value as (...a: unknown[]) => unknown).bind(gl), { __src: value });
        cache.set(prop, bound);
      }
      return bound;
    },
    set: (_s, prop, value) => Reflect.set(gl, prop, value, gl),
    has: (_s, prop) => prop in gl,
  });
}

function waitForRestore(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, ms: number) {
  return new Promise<boolean>((resolve) => {
    if (!gl.isContextLost()) return resolve(true);
    const done = (ok: boolean) => {
      clearTimeout(timer);
      canvas.removeEventListener('webglcontextrestored', onRestore);
      resolve(ok);
    };
    const onRestore = () => done(true);
    const timer = setTimeout(() => done(!gl.isContextLost()), ms);
    canvas.addEventListener('webglcontextrestored', onRestore);
  });
}

let gpuReported = false;
function reportGpu(gl: WebGL2RenderingContext) {
  if (gpuReported) return;
  gpuReported = true;
  let name = '';
  try {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? 'withheld');
  } catch {
    name = 'withheld';
  }
  setGpu(true, name);
}

/** Async renderer factory for <Canvas gl={...}>. */
export async function createRenderer(canvas: HTMLCanvasElement, options: RendererOptions): Promise<WebGLRenderer> {
  const attributes: WebGLContextAttributes = {
    alpha: true,
    depth: true,
    stencil: false,
    antialias: options.antialias,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: options.powerPreference,
    failIfMajorPerformanceCaveat: false,
  };
  // registered before the context exists: a context dropped during creation stays restorable
  const keep = (e: Event) => e.preventDefault();
  canvas.addEventListener('webglcontextlost', keep);
  let creationError = '';
  const onCreationError = (e: Event) => (creationError = (e as WebGLContextEvent).statusMessage || 'unknown');
  canvas.addEventListener('webglcontextcreationerror', onCreationError);

  let gl = canvas.getContext('webgl2', attributes) as WebGL2RenderingContext | null;
  if (!gl) {
    report('context', `not created with the requested attributes${creationError ? ` (${creationError})` : ''} — retrying with defaults`);
    gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
  }
  canvas.removeEventListener('webglcontextcreationerror', onCreationError);
  if (!gl) throw new Error(`WebGL2 context could not be created${creationError ? `: ${creationError}` : ''}`);

  if (gl.isContextLost()) {
    report('context', 'created lost — waiting for the browser to restore it');
    if (!(await waitForRestore(canvas, gl, 4000))) {
      canvas.removeEventListener('webglcontextlost', keep);
      throw new Error('WebGL context lost at creation and not restored');
    }
    report('context', 'restored');
  }
  canvas.removeEventListener('webglcontextlost', keep);
  reportGpu(gl);

  const missing = withheldAnswers(gl);
  if (missing.length) report('compat', `browser withholds ${missing.join(', ')} — answering with WebGL2 guarantees`);
  const context = missing.length ? protectedContext(gl, attributes) : gl;

  const renderer = new WebGLRenderer({ canvas, context, ...attributes });
  renderer.debug.onShaderError = (g, program, vs, fs) => {
    const log = [g.getProgramInfoLog(program), g.getShaderInfoLog(vs), g.getShaderInfoLog(fs)]
      .filter(Boolean)
      .join(' | ')
      .replace(/\s+/g, ' ')
      .trim();
    console.error('[vyoma] shader error:', log);
    report('shader', log || 'program failed to link (no log)');
  };
  return renderer;
}
