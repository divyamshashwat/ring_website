'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { NeutralToneMapping, SRGBColorSpace } from 'three';
import { detectQuality, QUALITY, type QualityTier } from '@/lib/3d/quality';
import { QualityContext } from './QualityContext';

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

/**
 * A lazily-mounted, visibility-aware WebGL canvas.
 *  - mounts when within ~1 viewport, pauses the render loop when off-screen
 *  - on medium/low tiers, unmounts when far away to free GPU memory
 *  - adaptive DPR via PerformanceMonitor, tone mapping tuned for product colour
 */
export default function Stage({ children, className, style, camera = { position: [0, 0.6, 7], fov: 26 }, paused = false, onReady, persistent, ariaLabel }: StageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<QualityTier>('high');
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
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
      { rootMargin: '120% 0px 120% 0px' },
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
      {mounted && (
        <Canvas
          dpr={dpr}
          frameloop={visible && !paused ? 'always' : 'never'}
          camera={{ position: camera.position, fov: camera.fov, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            gl.toneMapping = NeutralToneMapping;
            gl.toneMappingExposure = 1.0;
            gl.outputColorSpace = SRGBColorSpace;
            gl.transmissionResolutionScale = q.transmissionScale;
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
      )}
    </div>
  );
}
