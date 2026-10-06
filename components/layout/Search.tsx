'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { gemstones } from '@/lib/data/gemstones';
import { journal } from '@/lib/data/journal';
import { products } from '@/lib/data/products';
import { useUI } from '@/lib/store/ui';
import { useLenis } from './SmoothScroll';
import { TransitionLink } from './PageTransition';
import styles from './Search.module.css';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ’']/g, '');

export default function Search() {
  const open = useUI((s) => s.searchOpen);
  const setSearch = useUI((s) => s.setSearch);
  const lenis = useLenis();
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      lenis?.stop();
      setTimeout(() => input.current?.focus(), 50);
    } else lenis?.start();
  }, [open, lenis]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearch(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSearch]);

  const results = useMemo(() => {
    const term = norm(q.trim());
    const match = (...fields: string[]) => !term || fields.some((f) => norm(f).includes(term));
    return {
      pieces: products.filter((p) => match(p.name, p.subtitle, p.gemstone, p.type)).slice(0, 6),
      stones: gemstones.filter((g) => match(g.name, g.englishName, g.planet.name, g.planet.vedic)).slice(0, 6),
      journal: journal.filter((a) => match(a.title, a.dek, a.category)).slice(0, 5),
    };
  }, [q]);

  const close = () => setSearch(false);

  return (
    <div className={`${styles.root} ${open ? styles.open : ''}`} role="dialog" aria-modal="true" aria-label="Search">
      <div className={styles.scrim} onClick={close} />
      {open && (
        <div className={styles.panel} data-lenis-prevent>
          <div className="container">
            <div className={styles.row}>
              <label htmlFor="site-search" className="visually-hidden">
                Search the house
              </label>
              <input ref={input} id="site-search" className={styles.input} placeholder="Search stones, pieces, the journal" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
              <button type="button" className="link" onClick={close}>
                Close
              </button>
            </div>
            <div className={styles.results}>
              <section className={styles.group}>
                <h2 className="eyebrow">Pieces</h2>
                <ul>
                  {results.pieces.map((p) => (
                    <li key={p.slug}>
                      <TransitionLink href={`/products/${p.slug}`} onClick={close}>
                        <span>{p.name}</span>
                        <span className="muted small">{p.subtitle}</span>
                      </TransitionLink>
                    </li>
                  ))}
                  {!results.pieces.length && <li className="muted small">No pieces match.</li>}
                </ul>
              </section>
              <section className={styles.group}>
                <h2 className="eyebrow">Gemstones</h2>
                <ul>
                  {results.stones.map((g) => (
                    <li key={g.slug}>
                      <TransitionLink href={`/gemstones/${g.slug}`} onClick={close} stoneColor={g.swatch}>
                        <span>{g.name}</span>
                        <span className="muted small">{g.englishName}</span>
                      </TransitionLink>
                    </li>
                  ))}
                  {!results.stones.length && <li className="muted small">No stones match.</li>}
                </ul>
              </section>
              <section className={styles.group}>
                <h2 className="eyebrow">Journal</h2>
                <ul>
                  {results.journal.map((a) => (
                    <li key={a.slug}>
                      <TransitionLink href={`/journal/${a.slug}`} onClick={close}>
                        <span>{a.title}</span>
                      </TransitionLink>
                    </li>
                  ))}
                  {!results.journal.length && <li className="muted small">No articles match.</li>}
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
