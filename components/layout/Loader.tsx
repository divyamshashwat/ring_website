'use client';

import gsap from 'gsap';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useUI } from '@/lib/store/ui';
import { useLenis } from './SmoothScroll';
import Wordmark from './Wordmark';

/**
 * First-visit preparation screen for the 3D home page: the wordmark, one line
 * of copy, and a hairline that fills as the ring's assets arrive.
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
    let seen = false;
    try {
      seen = sessionStorage.getItem('vyoma-prepared') === '1';
    } catch {}
    lenis?.stop();
    const finish = () => {
      if (done.current) return;
      done.current = true;
      try {
        sessionStorage.setItem('vyoma-prepared', '1');
      } catch {}
      gsap
        .timeline({ onComplete: () => setActive(false) })
        .to(shown.current, { v: 1, duration: 0.6, ease: 'power2.out', onUpdate: () => line.current && (line.current.style.transform = `scaleX(${shown.current.v})`) })
        .to(root.current!.querySelectorAll('[data-fade]'), { opacity: 0, y: -8, duration: 0.7, ease: 'power2.in', stagger: 0.05 }, '+=0.15')
        .to(root.current, { opacity: 0, duration: 1.1, ease: 'power2.inOut', onStart: () => lenis?.start() }, '-=0.2');
    };
    const unsub = useUI.subscribe((s) => {
      const target = Math.max(s.progress * 0.85, s.sceneReady ? 1 : 0);
      gsap.to(shown.current, {
        v: target,
        duration: 1.2,
        ease: 'power3.out',
        overwrite: true,
        onUpdate: () => line.current && (line.current.style.transform = `scaleX(${shown.current.v})`),
      });
      if (s.sceneReady) finish();
    });
    if (useUI.getState().sceneReady) finish();
    // never hold the visitor: a returning visit or a slow device continues regardless
    const timeout = setTimeout(finish, seen ? 1200 : 7000);
    return () => {
      unsub();
      clearTimeout(timeout);
      lenis?.start();
    };
  }, [active, lenis]);

  if (!active) return null;
  return (
    <div
      ref={root}
      role="status"
      aria-live="polite"
      style={{ position: 'fixed', inset: 0, zIndex: 950, background: 'var(--ivory)', display: 'grid', placeItems: 'center' }}
    >
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
