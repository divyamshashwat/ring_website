'use client';

import gsap from 'gsap';
import Link, { type LinkProps } from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * Object-connected page transitions.
 *
 * A link may carry a colour (the stone it leads to). On click, a small stone of
 * that colour grows from the link itself and fills the screen, the page settles
 * into warm white, then the new page is revealed from it.
 */
interface TransitionRequest {
  href: string;
  origin?: DOMRect;
  color?: string;
}

let run: ((req: TransitionRequest) => void) | null = null;

export function navigateWithTransition(req: TransitionRequest) {
  if (run) run(req);
  else window.location.href = req.href;
}

export function TransitionLayer() {
  const router = useRouter();
  const pathname = usePathname();
  const layer = useRef<HTMLDivElement>(null);
  const stone = useRef<HTMLDivElement>(null);
  const pendingPath = useRef<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    run = ({ href, origin, color }) => {
      const url = new URL(href, window.location.href);
      if (busy.current) return;
      if (prefersReducedMotion() || url.pathname === window.location.pathname) {
        router.push(href);
        return;
      }
      busy.current = true;
      pendingPath.current = url.pathname;
      const el = layer.current!;
      const dot = stone.current!;
      const cx = origin ? origin.left + origin.width / 2 : window.innerWidth / 2;
      const cy = origin ? origin.top + origin.height / 2 : window.innerHeight / 2;
      const cover = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy)) / 8;
      gsap.set(el, { autoAlpha: 1, pointerEvents: 'auto' });
      gsap.set(dot, { left: cx, top: cy, scale: 0, opacity: 1, background: color ? `radial-gradient(circle at 35% 30%, #fff8 0%, ${color} 38%, ${color} 70%, #0003 100%)` : 'var(--champagne)' });
      const tl = gsap.timeline({ onComplete: () => router.push(href) });
      tl.fromTo(el.querySelector('[data-veil]'), { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.inOut' }, 0);
      tl.to(dot, { scale: 1, duration: 0.35, ease: 'power3.out' }, 0);
      tl.to(dot, { scale: cover, duration: 0.85, ease: 'expo.inOut' }, 0.22);
      tl.to(dot, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.75);
    };
    return () => {
      run = null;
    };
  }, [router]);

  // reveal the new page once the route has changed
  useEffect(() => {
    if (!busy.current || pendingPath.current !== pathname) return;
    const el = layer.current!;
    const main = document.getElementById('main');
    const tl = gsap.timeline({
      delay: 0.15,
      onComplete: () => {
        busy.current = false;
        gsap.set(el, { autoAlpha: 0, pointerEvents: 'none' });
      },
    });
    tl.to(el.querySelector('[data-veil]'), { opacity: 0, duration: 1.0, ease: 'power2.inOut' }, 0);
    if (main) tl.fromTo(main, { y: 28 }, { y: 0, duration: 1.4, ease: 'expo.out', clearProps: 'transform' }, 0);
  }, [pathname]);

  return (
    <div ref={layer} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 900, pointerEvents: 'none', visibility: 'hidden' }}>
      <div data-veil style={{ position: 'absolute', inset: 0, background: 'var(--ivory)' }} />
      <div ref={stone} style={{ position: 'absolute', width: 16, height: 16, marginLeft: -8, marginTop: -8, borderRadius: '50%', willChange: 'transform' }} />
    </div>
  );
}

type TransitionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    /** colour of the object this link leads to (e.g. the stone) */
    stoneColor?: string;
  };

/** A next/link that leaves the page with the house transition. */
export function TransitionLink({ href, stoneColor, onClick, children, ...rest }: TransitionLinkProps) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const target = String(href);
    if (target.startsWith('http') || target.startsWith('mailto:') || target.startsWith('tel:') || target.startsWith('#')) return;
    e.preventDefault();
    navigateWithTransition({ href: target, origin: e.currentTarget.getBoundingClientRect(), color: stoneColor });
  };
  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
