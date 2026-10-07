'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConstellationState } from '@/components/3d/ConstellationScene';
import { navigateWithTransition, TransitionLink } from '@/components/layout/PageTransition';
import { MaskedLines, Reveal } from '@/components/ui/Reveal';
import { gemstones, NAVRATNA_ORDER } from '@/lib/data/gemstones';
import { prefersReducedMotion } from '@/lib/motion';
import { useUI } from '@/lib/store/ui';
import styles from './Constellation.module.css';

const ConstellationScene = dynamic(() => import('@/components/3d/ConstellationScene'), { ssr: false });

const ordered = [...NAVRATNA_ORDER.map((s) => gemstones.find((g) => g.slug === s)!), ...gemstones.filter((g) => g.group === 'uparatna')];

export default function Constellation() {
  const [state, setState] = useState<ConstellationState>({ hovered: null, entering: null });
  const setCursor = useUI((s) => s.setCursor);
  const focus = ordered.find((g) => g.slug === state.hovered) ?? null;
  // touch screens cannot hover: the first tap brings a stone forward, the second enters it
  const [touch, setTouch] = useState(false);
  const tapped = useRef<string | null>(null);
  useEffect(() => setTouch(window.matchMedia('(hover: none)').matches), []);

  const hover = useCallback(
    (slug: string | null) => {
      if (touch && slug === null) return;
      setState((s) => (s.entering ? s : { ...s, hovered: slug }));
      setCursor(slug ? 'explore' : 'default');
    },
    [setCursor, touch],
  );

  const select = useCallback(
    (slug: string) => {
      if (touch && tapped.current !== slug) {
        tapped.current = slug;
        setState((s) => ({ ...s, hovered: slug }));
        return;
      }
      setCursor('default');
      setState({ hovered: slug, entering: slug });
      const go = () => navigateWithTransition({ href: `/gemstones/${slug}` });
      if (prefersReducedMotion()) go();
      else setTimeout(go, 650);
    },
    [setCursor, touch],
  );

  return (
    <section className={styles.section} aria-labelledby="constellation-title">
      <div className="container">
        <div className={`grid ${styles.head}`}>
          <div className={styles.title}>
            <MaskedLines as="h2" className="h1" lines={['Nine stones.', <em key="e">Nine celestial bodies.</em>]} />
          </div>
          <Reveal className={styles.intro}>
            <p className="body" id="constellation-title-desc">
              In Vedic tradition each of the nine grahas has its stone — the Navratna. Alongside them, the uparatna: secondary stones some traditions associate with the same planets.
            </p>
          </Reveal>
        </div>
      </div>

      <div className={styles.stage}>
        <span id="constellation-title" className="visually-hidden">
          The Navratna and uparatna stones
        </span>
        <ConstellationScene stones={ordered} state={state} onHover={hover} onSelect={select} />
      </div>

      <div className="container">
        <div className={styles.focus} aria-live="polite">
          {focus ? (
            <>
              <div>
                <div className={styles.focusName}>
                  <strong>{focus.name}</strong>
                  <span className="lead">{focus.englishName}</span>
                </div>
                <p className={`${styles.focusMeta} small muted`}>
                  {focus.group === 'navratna' ? 'Navratna' : 'Uparatna'} · traditionally associated with {focus.planet.name} ({focus.planet.vedic}) · {focus.traditionalAssociations.join(', ')}
                </p>
              </div>
              <TransitionLink href={`/gemstones/${focus.slug}`} className="link">
                Explore {focus.name}
              </TransitionLink>
            </>
          ) : (
            <p className={`${styles.hint} small`}>
              {touch ? 'Tap a stone to bring it forward. Tap it again to enter.' : 'Move across the stones to bring one forward. Select a stone to enter it.'}
            </p>
          )}
        </div>
        <ul className={styles.index} aria-label="Gemstones">
          {ordered.map((g, i) => (
            <li key={g.slug}>
              {i === 9 && <span className={styles.divider} aria-hidden="true" />}
              <button
                type="button"
                style={{ ['--sw' as string]: g.swatch }}
                data-active={state.hovered === g.slug}
                aria-pressed={touch ? state.hovered === g.slug : undefined}
                onMouseEnter={() => !touch && setState((s) => ({ ...s, hovered: g.slug }))}
                onMouseLeave={() => !touch && setState((s) => ({ ...s, hovered: null }))}
                onFocus={() => !touch && setState((s) => ({ ...s, hovered: g.slug }))}
                onBlur={() => !touch && setState((s) => ({ ...s, hovered: null }))}
                onClick={() => select(g.slug)}
              >
                {g.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
