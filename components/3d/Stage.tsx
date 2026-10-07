'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Component, Suspense, useEffect, useRef, useState, type CSSProperties, type ErrorInfo, type ReactNode } from 'react';
import { NeutralToneMapping, SRGBColorSpace } from 'three';
import { detectQuality, QUALITY, type QualityTier } from '@/lib/3d/quality';
import { QualityContext } from './QualityContext';
import { report, setGpu } from '@/lib/diag';

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
}

function ReadySignal({ onReady }: { onReady?: () => void }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      invalidate();
      raf2 = requestAnimationFrame(() => onReady?.());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [invalidate, onReady]);
  return null;
}

/** Contains any 3D failure to its own canvas instead of taking the page down. */
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[vyoma] 3D scene error:', error.message);
    report('scene-error', `${error.message} | ${(error.stack ?? '').split('\n').slice(0, 3).join(' | ')} | ${info.componentStack?.split('\n').filter(Boolean)[0]?.trim() ?? ''}`);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

let webglSupport: boolean | null = null;
function supportsWebGL2() {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    webglSupport = !!gl;
    let renderer = '';
    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    } else {
      renderer = document.createElement('canvas').getContext('webgl') ? 'WebGL1 only' : 'no WebGL';
    }
    setGpu(webglSupport, renderer);
    (gl?.getExtension('WEBGL_lose_context') as { loseContext?: () => void } | null)?.loseContext?.();
  } catch (e) {
    webglSupport = false;
    report('webgl-probe', String((e as Error).message));
  }
  return webglSupport;
}

/**
 * A lazily-mounted, visibility-aware, failure-safe WebGL canvas.
 *  - mounts when near the viewport, pauses the render loop when off-screen
 *  - on medium/low tiers (phones), unmounts when away from the viewport to free GPU memory
 *  - adaptive DPR via PerformanceMonitor, tone mapping tuned for product colour
 *  - if WebGL is missing, a scene throws, or the GPU drops the context, the
 *    fallback is shown and the rest of the page keeps working
 */
export default function Stage({ children, className, style, camera = { position: [0, 0.6, 7], fov: 26 }, paused = false, onReady, persistent, ariaLabel, fallback = null }: StageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<QualityTier>('high');
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [dpr, setDpr] = useState(1);
  // a scene gets two more chances (fresh context) before the still is shown
  const fail = (why: string) => {
    report('stage', `${ariaLabel ?? 'scene'}: ${why} (attempt ${attempt + 1})`);
    if (attempt < 2) setAttempt((a) => a + 1);
    else setFailed(true);
  };

  useEffect(() => {
    if (!supportsWebGL2()) {
      report('stage', 'WebGL2 unavailable — showing stills');
      setFailed(true);
      return;
    }
    const t = detectQuality();
    setTier(t);
    setDpr(Math.min(window.devicePixelRatio, QUALITY[t].dpr[1]));
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
  }, [persistent]);

  const q = QUALITY[tier];
  return (
    <div ref={ref} className={className} style={{ position: 'relative', ...style }} role={ariaLabel ? 'img' : undefined} aria-label={ariaLabel}>
      {failed && fallback}
      {mounted && !failed && (
        <SceneBoundary key={attempt} onError={() => fail('render error')}>
          <Canvas
            dpr={dpr}
            frameloop={visible && !paused ? 'always' : 'never'}
            camera={{ position: camera.position, fov: camera.fov, near: 0.1, far: 100 }}
            gl={{ antialias: tier !== 'low', alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
              gl.toneMapping = NeutralToneMapping;
              gl.toneMappingExposure = 1.0;
              gl.outputColorSpace = SRGBColorSpace;
              gl.transmissionResolutionScale = q.transmissionScale;
              const canvas = gl.domElement;
              // a context lost while the canvas is still on the page means the GPU gave up: show the still
              canvas.addEventListener('webglcontextlost', (e) => {
                // allow the browser to restore it; if it does not, start a fresh context
                e.preventDefault();
                setTimeout(() => {
                  if (canvas.isConnected && gl.getContext().isContextLost()) fail('context lost');
                }, 1500);
              });
            }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <PerformanceMonitor
              onDecline={() => setDpr((d) => Math.max(q.dpr[0], Math.round((d - 0.25) * 100) / 100))}
              onIncline={() => setDpr((d) => Math.min(q.dpr[1], window.devicePixelRatio, Math.round((d + 0.25) * 100) / 100))}
            />
            <QualityContext.Provider value={tier}>
              <Suspense fallback={null}>
                {children}
                <ReadySignal onReady={onReady} />
              </Suspense>
            </QualityContext.Provider>
          </Canvas>
        </SceneBoundary>
      )}
    </div>
  );
}
