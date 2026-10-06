'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

gsap.registerPlugin(ScrollTrigger);

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'span' | 'blockquote';

/**
 * Masked line reveal for important headlines only. Lines are authored, not
 * auto-split, so every break is deliberate.
 */
export function MaskedLines({
  lines,
  as = 'h2',
  className,
  style,
  delay = 0,
  immediate = false,
  stagger = 0.09,
}: {
  lines: ReactNode[];
  as?: Tag;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  /** animate on mount rather than on scroll */
  immediate?: boolean;
  stagger?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const inner = el.querySelectorAll('[data-line]');
    const ctx = gsap.context(() => {
      gsap.set(inner, { yPercent: 112 });
      gsap.to(inner, {
        yPercent: 0,
        duration: 1.5,
        ease: 'expo.out',
        stagger,
        delay,
        scrollTrigger: immediate ? undefined : { trigger: el, start: 'top 88%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [delay, immediate, stagger]);
  return createElement(
    as,
    { ref, className, style },
    lines.map((line, i) => (
      <span key={i} className="line-mask">
        <span data-line>{line}</span>
      </span>
    )),
  );
}

/** Gentle rise for supporting content; used sparingly. */
export function Reveal({ children, className, style, delay = 0, y = 26, as = 'div' }: { children: ReactNode; className?: string; style?: CSSProperties; delay?: number; y?: number; as?: Tag }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.opacity = '1';
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { opacity: 0, y }, { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out', delay, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    }, el);
    return () => ctx.revert();
  }, [delay, y]);
  return createElement(as, { ref, className, style, 'data-reveal': '' }, children);
}

/** Image / frame reveal through a rising clip mask, with a slow inner settle. */
export function MaskReveal({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const inner = el.firstElementChild;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' });
      if (inner) tl.fromTo(inner, { scale: 1.12 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0.2);
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref} className={className} style={{ overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}
