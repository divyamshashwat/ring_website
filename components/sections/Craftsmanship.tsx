'use client';

import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { poseToDriver, type CameraDriver } from '@/components/3d/CameraRig';
import { craftStops, type CraftStop } from '@/components/3d/CraftScene';
import type { ProductLayout } from '@/components/3d/ProductModel';
import { MaskedLines } from '@/components/ui/Reveal';
import Placeholder from '@/components/ui/Placeholder';
import { prefersReducedMotion } from '@/lib/motion';
import styles from './Craftsmanship.module.css';

gsap.registerPlugin(ScrollTrigger);

const CraftScene = dynamic(() => import('@/components/3d/CraftScene'), { ssr: false });

const STOPS = [
  { title: 'The piece', body: 'A heritage ring in 22K gold, set with a chrysoberyl cat’s eye. Every detail you are about to see is finished by hand.' },
  { title: 'Milgrain and twisted wire', body: 'A knurled wheel raises a row of tiny beads along the bezel. Below it, two strands of drawn wire are twisted into a rope.' },
  { title: 'Granulation', body: 'Three grains of gold on each shoulder, fused to the surface without solder — one of the oldest techniques in Indian goldsmithing.' },
  { title: 'The hallmark', body: 'Inside the band, the house mark and the purity of the gold. Every piece is also hallmarked under the BIS scheme.' },
  { title: 'The polish', body: 'Finished in stages, from coarse to mirror, so the band carries one unbroken reflection from shoulder to shoulder.' },
];

const PHOTOS = ['Setting the bezel — bench photograph', 'Drawing and twisting wire', 'Granulation under the loupe', 'Final mirror polish'];

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * A macro tour of a real ring: as the visitor scrolls, the camera moves
 * between authored stops on the model itself, holding at each detail.
 */
export default function Craftsmanship() {
  const section = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const stops = useRef<CraftStop[] | null>(null);
  const driver = useMemo<CameraDriver>(() => poseToDriver({ position: [3.6, 2.3, 5.4], target: [0, 0.1, 0], fov: 24 }), []);
  const progress = useRef(0);

  const apply = useCallback(
    (p: number) => {
      const list = stops.current;
      if (!list) return;
      const s = Math.min(Math.max(p, 0), 1) * (list.length - 1);
      const i = Math.min(Math.floor(s), list.length - 2);
      // hold on each stop, travel between them
      const local = Math.min(Math.max((s - i - 0.2) / 0.6, 0), 1);
      const t = ease(local);
      const a = list[i];
      const b = list[i + 1];
      const lerp = (x: number, y: number) => x + (y - x) * t;
      Object.assign(driver, {
        px: lerp(a.position[0], b.position[0]),
        py: lerp(a.position[1], b.position[1]),
        pz: lerp(a.position[2], b.position[2]),
        tx: lerp(a.target[0], b.target[0]),
        ty: lerp(a.target[1], b.target[1]),
        tz: lerp(a.target[2], b.target[2]),
        fov: lerp(a.fov, b.fov),
      });
      setActive(Math.round(s));
    },
    [driver],
  );

  const onLayout = useCallback(
    (l: ProductLayout) => {
      stops.current = craftStops(l);
      apply(progress.current);
    },
    [apply],
  );

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: prefersReducedMotion() ? true : 0.8,
        onUpdate: (self) => {
          progress.current = self.progress;
          apply(self.progress);
        },
      });
      // the bench photographs drift slowly sideways as the page moves (phones swipe them instead)
      if (track.current && strip.current && !prefersReducedMotion() && window.innerWidth > 900) {
        gsap.fromTo(track.current, { xPercent: 4 }, { xPercent: -18, ease: 'none', scrollTrigger: { trigger: strip.current, start: 'top bottom', end: 'bottom top', scrub: 1 } });
      }
    });
    return () => ctx.revert();
  }, [apply]);

  return (
    <>
      <section ref={section} className={styles.section} aria-labelledby="craft-title">
        <div className={styles.sticky}>
          <div className={styles.canvas} data-cursor="view">
            <CraftScene driver={driver} onLayout={onLayout} />
          </div>
          <div className={styles.text}>
            <MaskedLines as="h2" className="h2" lines={['Crafted down to', <em key="e">the smallest detail.</em>]} />
            <span id="craft-title" className="visually-hidden">
              Crafted down to the smallest detail
            </span>
            <div className={styles.stops} aria-live="polite">
              {STOPS.map((s, i) => (
                <div key={s.title} className={styles.stop} data-active={i === active} aria-hidden={i !== active}>
                  <span className="micro muted">
                    {String(i + 1).padStart(2, '0')} / {String(STOPS.length).padStart(2, '0')}
                  </span>
                  <h3>{s.title}</h3>
                  <p className="body small">{s.body}</p>
                </div>
              ))}
            </div>
            <div className={styles.counter} aria-hidden="true">
              {STOPS.map((s, i) => (
                <span key={s.title} data-active={i === active} />
              ))}
            </div>
          </div>
        </div>
      </section>
      <div ref={strip} className={styles.strip}>
        <div ref={track} className={`container ${styles.track}`}>
          {PHOTOS.map((p, i) => (
            <figure key={p} className={styles.frame} style={{ marginTop: i % 2 ? 80 : 0 }}>
              <Placeholder label={p} ratio="4 / 5" tone={i % 2 ? 'sand' : 'pearl'} />
            </figure>
          ))}
        </div>
      </div>
    </>
  );
}
