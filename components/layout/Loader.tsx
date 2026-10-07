'use client';

import gsap from 'gsap';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useUI } from '@/lib/store/ui';
import { useLenis } from './SmoothScroll';
import Wordmark from './Wordmark';

/**
 * The home page's preparation screen. Its progress is real, built from the
 * actual loading steps:
 *   fonts 10% · 3D code and canvas 15% · model and decoder downloads 55% · first rendered frame 20%
 * It closes the moment the ring has rendered — or has fallen back to its still —
 * never on a timer. A 10 s safety net only guards against a stalled network.
 */
export default function Loader() {
  const pathname = usePathname();
  const [active, setActive] = useState(pathname === '/');
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const shown = useRef({ v: 0 });
  const lenis = useLenis();
  const done = useRef(false);

  useEffect(() => {
    if (!active) return;
    lenis?.stop();
    let fonts = false;
    const draw = () => line.current && (line.current.style.transform = `scaleX(${shown.current.v})`);
    const finish = () => {
      if (done.current) return;
      done.current = true;
      gsap
        .timeline({ onComplete: () => setActive(false) })
        .to(shown.current, { v: 1, duration: 0.45, ease: 'power2.out', onUpdate: draw, overwrite: true })
        .to(root.current!.querySelectorAll('[data-fade]'), { opacity: 0, y: -8, duration: 0.6, ease: 'power2.in', stagger: 0.05 }, '+=0.1')
        .to(root.current, { opacity: 0, duration: 0.9, ease: 'power2.inOut', onStart: () => lenis?.start() }, '-=0.2');
    };
    const update = () => {
      const s = useUI.getState();
      if (s.sceneReady) return finish();
      const target = (fonts ? 0.1 : 0) + (s.sceneMounted ? 0.15 : 0) + s.progress * 0.55;
      gsap.to(shown.current, { v: Math.min(target, 0.8), duration: 0.8, ease: 'power3.out', overwrite: true, onUpdate: draw });
    };
    document.fonts?.ready.then(() => {
      fonts = true;
      update();
    });
    const unsub = useUI.subscribe(update);
    update();
    const safety = setTimeout(finish, 10000);
    return () => {
      unsub();
      clearTimeout(safety);
      lenis?.start();
    };
  }, [active, lenis]);

  if (!active) return null;
  return (
    <div ref={root} role="status" aria-live="polite" aria-label="Loading" style={{ position: 'fixed', inset: 0, zIndex: 950, background: 'var(--ivory)', display: 'grid', placeItems: 'center' }}>
      <div style={{ display: 'grid', justifyItems: 'center', gap: 28, width: 'min(280px, 70vw)' }}>
        <div data-fade>
          <Wordmark />
        </div>
        <p data-fade className="small muted" style={{ fontWeight: 300, letterSpacing: '0.02em' }}>
          Preparing your experience.
        </p>
        <div data-fade style={{ width: '100%', height: 1, background: 'var(--hairline)', overflow: 'hidden' }}>
          <div ref={line} style={{ height: '100%', background: 'var(--gold)', transform: 'scaleX(0)', transformOrigin: '0 50%' }} />
        </div>
      </div>
    </div>
  );
}
