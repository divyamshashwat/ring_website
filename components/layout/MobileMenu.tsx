'use client';

import gsap from 'gsap';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useLenis } from './SmoothScroll';
import { useUI } from '@/lib/store/ui';
import { prefersReducedMotion } from '@/lib/motion';
import { TransitionLink } from './PageTransition';
import { PRIMARY_NAV, WHATSAPP_URL } from './navigation';
import Wordmark from './Wordmark';
import styles from './MobileMenu.module.css';

const LINKS = [
  PRIMARY_NAV[0],
  PRIMARY_NAV[1],
  { href: '/find-your-stone', label: 'Find Your Stone' },
  { href: '/configure', label: 'Create Your Ring' },
  ...PRIMARY_NAV.slice(2),
  { href: '/journal', label: 'Journal' },
];

/** The menu falls like an editorial curtain; each line rises through its own mask. */
export default function MobileMenu() {
  const open = useUI((s) => s.menuOpen);
  const setMenu = useUI((s) => s.setMenu);
  const setSearch = useUI((s) => s.setSearch);
  const lenis = useLenis();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = root.current!;
    const panel = el.querySelector(`.${styles.panel}`);
    const lines = el.querySelectorAll('[data-line]');
    const fade = el.querySelectorAll('[data-fade]');
    tl.current = gsap
      .timeline({ paused: true, defaults: { ease: 'expo.inOut' } })
      .set(el, { visibility: 'visible' })
      .fromTo(panel, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.0 })
      .fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.05, ease: 'expo.out' }, 0.45)
      .fromTo(fade, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.8);
    return () => {
      tl.current?.kill();
    };
  }, []);

  useEffect(() => {
    const t = tl.current;
    if (!t) return;
    if (open) {
      lenis?.stop();
      if (prefersReducedMotion()) t.progress(1);
      else t.timeScale(1).play();
      setTimeout(() => closeRef.current?.focus(), 400);
    } else {
      lenis?.start();
      if (t.progress() > 0) t.timeScale(1.6).reverse();
    }
  }, [open, lenis]);

  useEffect(() => setMenu(false), [pathname, setMenu]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setMenu]);

  return (
    <div ref={root} className={styles.root} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open}>
      <div className={styles.panel}>
        <div className={`container ${styles.top}`}>
          <Wordmark />
          <button ref={closeRef} type="button" className={styles.close} onClick={() => setMenu(false)}>
            Close
          </button>
        </div>
        <nav className={`container ${styles.links}`} aria-label="Menu">
          {LINKS.map((item, i) => (
            <span key={item.href} className="line-mask">
              <span data-line>
                <TransitionLink href={item.href} className={styles.link} tabIndex={open ? 0 : -1}>
                  <span className={styles.index}>{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </TransitionLink>
              </span>
            </span>
          ))}
        </nav>
        <div className={`container ${styles.foot}`} data-fade>
          <TransitionLink href="/consultation" className="link" tabIndex={open ? 0 : -1}>
            Book a consultation
          </TransitionLink>
          <button
            type="button"
            className="link link--quiet"
            tabIndex={open ? 0 : -1}
            onClick={() => {
              setMenu(false);
              setSearch(true);
            }}
          >
            Search
          </button>
          <TransitionLink href="/contact" className="link link--quiet" tabIndex={open ? 0 : -1}>
            Contact
          </TransitionLink>
          <a href={WHATSAPP_URL} className="link link--quiet" target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
            WhatsApp
          </a>
          <TransitionLink href="/account" className="link link--quiet" tabIndex={open ? 0 : -1}>
            Account
          </TransitionLink>
        </div>
      </div>
    </div>
  );
}
