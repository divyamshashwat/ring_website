'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Component, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type ErrorInfo, type ReactNode } from 'react';
import { NeutralToneMapping, SRGBColorSpace } from 'three';
import { detectQuality, QUALITY, type QualityTier } from '@/lib/3d/quality';
import { QualityContext } from './QualityContext';
import { report, setGpu } from '@/lib/diag';
import { createRenderer } from '@/lib/3d/webglCompat';

interface StageProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  camera?: { position: [number, number, number]; fov: number };
  /** pause rendering even while visible */
  paused?: boolean;
  /** called once the first frame with all suspended assets has rendered */
  onReady?: () => void;
  /** keep the WebGL context alive while far off-screen (default: only on high tier) */
  persistent?: boolean;
  ariaLabel?: string;
  /** shown instead of the 3D scene when WebGL is unavailable, fails, or the GPU drops the context */
  fallback?: ReactNode;
  /** called if the scene ends up showing its fallback */
  onFail?: () => void;
  /** upper bound on the pixel ratio for heavy scenes (default: the tier's) */
  maxDpr?: number;
}

function ReadySignal({ onReady, name }: { onReady?: () => void; name: string }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      invalidate();
      raf2 = requestAnimationFrame(() => {
        report('scene', `${name}: first frame`);
        onReady?.();
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [invalidate, onReady, name]);
  return null;
}

/** A context the GPU drops is given time to come back before the scene is restarted. */
function ContextWatch({ name, onLost }: { name: string; onLost: (why: string) => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const lost = () => {
      report('context', `${name}: lost`);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (gl.getContext().isContextLost()) onLost('context lost and not restored');
      }, 3000);
    };
    const restored = () => {
      clearTimeout(timer);
      report('context', `${name}: restored`);
    };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    return () => {
      clearTimeout(timer);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
    };
  }, [gl, name, onLost]);
  return null;
}

/** Contains any 3D failure to its own canvas instead of taking the page down. */
class SceneBoundary extends Component<{ children: ReactNode; onError: (why: string, fatal: boolean) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[vyoma] 3D scene error:', error.message);
    report('scene-error', `${error.message} | ${(error.stack ?? '').split('\n').slice(0, 3).join(' | ')} | ${info.componentStack?.split('\n').filter(Boolean)[0]?.trim() ?? ''}`);
    // no context at all will not get better on a second try
    this.props.onError(error.message, /could not be created/.test(error.message));
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const hasWebGL2 = () => typeof window !== 'undefined' && 'WebGL2RenderingContext' in window;

/**
 * A lazily-mounted, visibility-aware, failure-safe WebGL canvas.
 *  - mounts when near the viewport, pauses the render loop when off-screen
 *  - on medium/low tiers (phones), unmounts when away from the viewport to free GPU memory
 *  - adaptive DPR via PerformanceMonitor, tone mapping tuned for product colour
 *  - a scene that throws or loses its context is restarted on a lighter context
 *    (no antialias, 1× pixels) up to twice before the still is shown; the rest of
 *    the page keeps working either way
 */
export default function Stage({ children, className, style, camera = { position: [0, 0.6, 7], fov: 26 }, paused = false, onReady, persistent, ariaLabel, fallback = null, onFail, maxDpr }: StageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<QualityTier>('high');
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [dpr, setDpr] = useState(1);
  const attemptRef = useRef(0);
  const name = (ariaLabel ?? 'scene').split(',')[0];

  const fail = useCallback(
    (why: string, fatal = false) => {
      const n = attemptRef.current;
      report('stage', `${name}: ${why} (attempt ${n + 1})`);
      if (!fatal && n < 2) {
        attemptRef.current = n + 1;
        setAttempt(n + 1);
        setDpr((d) => Math.min(d, 1));
      } else setFailed(true);
    },
    [name],
  );

  useEffect(() => {
    if (!hasWebGL2()) {
      setGpu(false, 'no WebGL2');
      report('stage', 'WebGL2 unavailable — showing stills');
      setFailed(true);
      return;
    }
    const t = detectQuality();
    setTier(t);
    setDpr(Math.min(window.devicePixelRatio, maxDpr ?? QUALITY[t].dpr[1]));
    const el = ref.current;
    if (!el) return;
    const keep = persistent ?? t === 'high';
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true);
        else if (!keep) setMounted(false);
      },
      { rootMargin: t === 'high' ? '120% 0px 120% 0px' : '50% 0px 50% 0px' },
    );
    const view = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '10% 0px 10% 0px' });
    near.observe(el);
    view.observe(el);
    return () => {
      near.disconnect();
      view.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistent]);

  useEffect(() => {
    if (failed) onFail?.();
  }, [failed, onFail]);

  const q = QUALITY[tier];
  // multisampling everywhere (cheap on phone GPUs); a restarted scene trades it for stability
  const antialias = attempt === 0;
  return (
    <div ref={ref} className={className} style={{ position: 'relative', ...style }} role={ariaLabel ? 'img' : undefined} aria-label={ariaLabel}>
      {failed && fallback}
      {mounted && !failed && (
        <SceneBoundary key={attempt} onError={fail}>
          <Canvas
            dpr={dpr}
            frameloop={visible && !paused ? 'always' : 'never'}
            camera={{ position: camera.position, fov: camera.fov, near: 0.1, far: 100 }}
            gl={(defaults) =>
              createRenderer(defaults.canvas as HTMLCanvasElement, {
                antialias,
                powerPreference: attempt === 0 ? 'high-performance' : 'default',
              })
            }
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
              gl.toneMapping = NeutralToneMapping;
              gl.toneMappingExposure = 1.0;
              gl.outputColorSpace = SRGBColorSpace;
              gl.transmissionResolutionScale = q.transmissionScale;
              report('scene', `${name}: renderer ready (tier ${tier}, dpr ${gl.getPixelRatio()}, aa ${antialias ? 'on' : 'off'})`);
            }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <ContextWatch name={name} onLost={fail} />
            <PerformanceMonitor
              onDecline={() => setDpr((d) => Math.max(q.dpr[0], Math.round((d - 0.25) * 100) / 100))}
              onIncline={() => setDpr((d) => Math.min(maxDpr ?? q.dpr[1], window.devicePixelRatio, Math.round((d + 0.25) * 100) / 100))}
            />
            <QualityContext.Provider value={tier}>
              <Suspense fallback={null}>
                {children}
                <ReadySignal onReady={onReady} name={name} />
              </Suspense>
            </QualityContext.Provider>
          </Canvas>
        </SceneBoundary>
      )}
    </div>
  );
}
