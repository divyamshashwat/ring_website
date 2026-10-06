'use client';

import { useEffect, useRef } from 'react';
import { useUI, type CursorMode } from '@/lib/store/ui';

const LABELS: Partial<Record<CursorMode, string>> = { view: 'View', rotate: 'Rotate', explore: 'Explore', drag: 'Drag' };

/**
 * A small, quiet cursor. Over interactive objects it opens into a fine ring
 * with a single word — View, Rotate, Explore. Fine pointers only.
 */
export default function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const storeMode = useUI((s) => s.cursor);
  const modeRef = useRef<CursorMode>('default');
  const domMode = useRef<CursorMode>('default');

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.documentElement.classList.add('has-cursor');
    const el = root.current!;
    const pos = { x: -100, y: -100, tx: -100, ty: -100 };
    let visible = false;
    const move = (e: PointerEvent) => {
      pos.tx = e.clientX;
      pos.ty = e.clientY;
      if (!visible) {
        visible = true;
        pos.x = pos.tx;
        pos.y = pos.ty;
        el.style.opacity = '1';
      }
      const t = e.target as HTMLElement | null;
      const tagged = t?.closest<HTMLElement>('[data-cursor]');
      if (tagged) domMode.current = tagged.dataset.cursor as CursorMode;
      else if (t?.closest('a,button,[role="button"],label,select')) domMode.current = 'link';
      else domMode.current = 'default';
    };
    const leave = () => {
      visible = false;
      el.style.opacity = '0';
    };
    let raf = 0;
    const tick = () => {
      pos.x += (pos.tx - pos.x) * 0.22;
      pos.y += (pos.ty - pos.y) * 0.22;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      const mode = modeRef.current !== 'default' ? modeRef.current : domMode.current;
      if (el.dataset.mode !== mode) {
        el.dataset.mode = mode;
        if (label.current) label.current.textContent = LABELS[mode] ?? '';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);

  useEffect(() => {
    modeRef.current = storeMode;
  }, [storeMode]);

  return (
    <div ref={root} className="vy-cursor" data-mode="default" aria-hidden="true">
      <div ref={ring} className="vy-cursor__ring">
        <span ref={label} className="vy-cursor__label" />
      </div>
      <style>{`
        .vy-cursor { position: fixed; left: 0; top: 0; z-index: 1000; pointer-events: none; opacity: 0; transition: opacity .3s; }
        .vy-cursor__ring { position: absolute; left: 0; top: 0; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%;
          background: var(--ink); display: grid; place-items: center;
          transition: width .5s var(--ease), height .5s var(--ease), margin .5s var(--ease), background-color .4s, border-color .4s; border: 1px solid transparent; }
        .vy-cursor__label { font: 500 9px/1 var(--font-sans); letter-spacing: .22em; text-transform: uppercase; color: var(--ink); opacity: 0; transition: opacity .3s; padding-left: .22em; }
        .vy-cursor[data-mode='link'] .vy-cursor__ring { width: 34px; height: 34px; margin: -17px 0 0 -17px; background: transparent; border-color: var(--hairline-strong); }
        .vy-cursor[data-mode='view'] .vy-cursor__ring,
        .vy-cursor[data-mode='rotate'] .vy-cursor__ring,
        .vy-cursor[data-mode='explore'] .vy-cursor__ring,
        .vy-cursor[data-mode='drag'] .vy-cursor__ring { width: 78px; height: 78px; margin: -39px 0 0 -39px; background: rgba(251,250,247,.72); border-color: var(--hairline-strong); backdrop-filter: blur(6px); }
        .vy-cursor[data-mode='view'] .vy-cursor__label,
        .vy-cursor[data-mode='rotate'] .vy-cursor__label,
        .vy-cursor[data-mode='explore'] .vy-cursor__label,
        .vy-cursor[data-mode='drag'] .vy-cursor__label { opacity: 1; transition-delay: .12s; }
        .vy-cursor[data-mode='hidden'] { opacity: 0 !important; }
      `}</style>
    </div>
  );
}
