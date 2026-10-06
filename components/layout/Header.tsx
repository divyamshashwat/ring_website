'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { bagCount, useBag } from '@/lib/store/bag';
import { useUI } from '@/lib/store/ui';
import { TransitionLink } from './PageTransition';
import { PRIMARY_NAV } from './navigation';
import Wordmark from './Wordmark';
import styles from './Header.module.css';

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useBag((s) => s.items);
  const setMenu = useUI((s) => s.setMenu);
  const setSearch = useUI((s) => s.setSearch);
  const count = mounted ? bagCount(items) : 0;

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <TransitionLink href="/" className={styles.brand} aria-label="VYOMA — home">
          <Wordmark />
        </TransitionLink>

        <nav className={styles.nav} aria-label="Primary">
          {PRIMARY_NAV.map((item) => (
            <TransitionLink key={item.href} href={item.href} className={styles.navLink} aria-current={pathname.startsWith(item.href) ? 'page' : undefined}>
              {item.label}
            </TransitionLink>
          ))}
        </nav>

        <div className={styles.utils}>
          <TransitionLink href="/find-your-stone" className={`${styles.util} ${styles.finder} ${styles.desktopOnly}`}>
            Find Your Stone
          </TransitionLink>
          <button type="button" className={`${styles.util} ${styles.desktopOnly}`} onClick={() => setSearch(true)}>
            Search
          </button>
          <TransitionLink href="/account" className={`${styles.util} ${styles.desktopOnly}`}>
            Account
          </TransitionLink>
          <TransitionLink href="/bag" className={styles.util} aria-label={`Bag, ${count} ${count === 1 ? 'item' : 'items'}`}>
            Bag<span className={styles.count}>{count > 0 ? count : ''}</span>
          </TransitionLink>
        </div>

        <button type="button" className={`${styles.util} ${styles.mobileOnly} ${styles.menuButton}`} onClick={() => setMenu(true)} aria-haspopup="dialog" aria-label="Open menu">
          <span className={styles.menuLines} aria-hidden="true">
            <span />
            <span />
          </span>
          Menu
        </button>
      </div>
    </header>
  );
}
