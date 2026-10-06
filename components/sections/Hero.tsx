'use client';

import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useMemo, useRef } from 'react';
import { poseToDriver } from '@/components/3d/CameraRig';
import type { HeroDriver } from '@/components/3d/HeroScene';
import { TransitionLink } from '@/components/layout/PageTransition';
import { MaskedLines } from '@/components/ui/Reveal';
import { gemstoneBySlug } from '@/lib/data/gemstones';
import { products } from '@/lib/data/products';
import { prefersReducedMotion } from '@/lib/motion';
import styles from './Hero.module.css';

gsap.registerPlugin(ScrollTrigger);

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), { ssr: false });

const product = products.find((p) => p.slug === 'moonga-ring')!;
const stone = gemstoneBySlug('moonga')!;

type V3 = [number, number, number];
/** Stone height above the ring's centre (from the model's layout) and the macro tilt. */
const STONE_Y = 0.96;
const MACRO_PITCH = 1.0;
const stoneAt = (pitch: number): V3 => [0, STONE_Y * Math.cos(pitch), STONE_Y * Math.sin(pitch)];

const pose = (narrow: boolean) => {
  const s = stoneAt(MACRO_PITCH);
  return {
    hero: narrow
      ? { position: [0, 0.9, 11.2] as V3, target: [0, -0.95, 0] as V3, fov: 26, offsetX: 0 }
      : { position: [0, 0.55, 7.6] as V3, target: [0, 0.12, 0] as V3, fov: 26, offsetX: 0.2 },
    centre: narrow
      ? { position: [0, 1.0, 9.6] as V3, target: [0, 0.0, 0] as V3, fov: 26, offsetX: 0 }
      : { position: [0, 0.85, 6.4] as V3, target: [0, 0.1, 0] as V3, fov: 26, offsetX: 0 },
    // macro: the camera looks down into the setting from just above the stone
    macro: narrow
      ? { position: [s[0] + 0.2, s[1] + 2.0, s[2] + 3.6] as V3, target: s, fov: 22, offsetX: 0 }
      : { position: [s[0] + 0.4, s[1] + 2.1, s[2] + 3.6] as V3, target: s, fov: 20, offsetX: 0 },
    stone: narrow
      ? { position: [0, 0.3, 6.0] as V3, target: [0, -0.25, 0] as V3, fov: 24, offsetX: 0 }
      : { position: [0, 0.35, 4.9] as V3, target: [0, 0, 0] as V3, fov: 24, offsetX: 0 },
  };
};

/**
 * Hero → The Stone. One pinned, scroll-scrubbed sequence:
 * the ring floats beside the headline, moves to centre and turns, the camera
 * pushes into the setting, and the stone lifts free of its bezel —
 * "before the jewellery, there is the stone".
 */
export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const driver = useMemo<HeroDriver>(
    () => ({ camera: poseToDriver(pose(false).hero), pitch: 0.58, yaw: -0.62, settle: 0, ringY: 0, lift: 0, stoneScale: 0.92, interactive: 0 }),
    [],
  );

  useEffect(() => {
    const el = section.current!;
    const q = (sel: string) => el.querySelectorAll(sel);
    const reduced = prefersReducedMotion();
    let ctx: gsap.Context | null = null;

    const build = () => {
      ctx?.revert();
      const narrow = window.innerWidth < 820;
      const P = pose(narrow);
      Object.assign(driver.camera, poseToDriver(P.hero));
      Object.assign(driver, { pitch: 0.58, yaw: -0.62, settle: 0, ringY: 0, lift: 0, interactive: 0 });
      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: 'bottom bottom',
            scrub: reduced ? true : 0.6,
            onUpdate: (self) => {
              gsap.set(q(`.${styles.railFill}`), { scaleY: self.progress });
            },
          },
        });
        const cam = driver.camera;
        // 1 — the intro dissolves
        tl.to(q('[data-intro]'), { opacity: 0, y: -40, duration: 0.1, stagger: 0.012, ease: 'power2.in' }, 0.07)
          .to(q(`.${styles.scroll}, .${styles.label}`), { opacity: 0, duration: 0.05 }, 0.05)
          // 2 — the ring comes to centre, the camera draws closer, the ring turns
          .to(cam, { ...poseToDriver(P.centre), duration: 0.32, ease: 'expo.inOut' }, 0.1)
          .to(driver, { pitch: 0.7, yaw: Math.PI * 2 - 0.4, settle: 1, duration: 0.34, ease: 'power3.inOut' }, 0.1)
          .fromTo(q(`.${styles.caption}`), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.06 }, 0.27)
          .to(q(`.${styles.caption}`), { opacity: 0, y: -12, duration: 0.05 }, 0.42)
          // 3 — macro: the camera pushes into the setting
          .to(cam, { ...poseToDriver(P.macro), duration: 0.18, ease: 'expo.inOut' }, 0.44)
          .to(driver, { pitch: MACRO_PITCH, yaw: Math.PI * 2, duration: 0.18, ease: 'power3.inOut' }, 0.44)
          .fromTo(q(`.${styles.macro}`), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.05 }, 0.52)
          .to(q(`.${styles.macro}`), { opacity: 0, duration: 0.04 }, 0.6)
          // 4 — the stone lifts free of its bezel; the ring falls away
          .to(driver, { lift: 1, duration: 0.2, ease: 'power3.inOut' }, 0.62)
          .to(driver, { ringY: -4.6, duration: 0.18, ease: 'power2.in' }, 0.63)
          .to(cam, { ...poseToDriver(P.stone), duration: 0.2, ease: 'expo.inOut' }, 0.62)
          .fromTo(q('[data-stone-line]'), { yPercent: 112 }, { yPercent: 0, duration: 0.08, stagger: 0.015, ease: 'expo.out' }, 0.74)
          .to(q(`.${styles.stoneTitle} .eyebrow`), { opacity: 1, duration: 0.05 }, 0.74)
          .fromTo(q(`.${styles.panel}`), { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.08, ease: 'power3.out' }, 0.79)
          .fromTo(q(`.${styles.drag}`), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.84)
          .set(driver, { interactive: 1 }, 0.8)
          .to({}, { duration: 0.1 }, 0.9);
      }, el);
    };
    build();
    let w = window.innerWidth;
    const onResize = () => {
      if ((w < 820) !== (window.innerWidth < 820)) build();
      w = window.innerWidth;
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      ctx?.revert();
    };
  }, [driver]);

  return (
    <section ref={section} className={styles.hero} aria-label="Introduction">
      <div className={styles.sticky}>
        <div className={styles.glow} />
        <div className={styles.canvas}>
          <HeroScene driver={driver} />
        </div>

        <div className={styles.layer}>
          <div className={styles.intro}>
            <p className="eyebrow" data-intro>
              Astrological jewellery <span aria-hidden="true">/</span> Handcrafted in India
            </p>
            <div data-intro>
              <MaskedLines
                as="h1"
                className={`display ${styles.title}`}
                immediate
                delay={0.35}
                lines={[
                  'Worn with',
                  <>
                    <em>intention</em>.
                  </>,
                ]}
              />
            </div>
            <p className={`body ${styles.copy}`} data-intro>
              Rare natural gemstones, individually selected and set into finely crafted jewellery inspired by the traditional wisdom of Indian astrology.
            </p>
            <div className={styles.ctas} data-intro>
              <TransitionLink href="/collections" className="btn btn--solid">
                Discover the collection
              </TransitionLink>
              <TransitionLink href="/find-your-stone" className="link" stoneColor={stone.swatch}>
                Find your stone
              </TransitionLink>
            </div>
          </div>

          <p className={`${styles.label} micro muted`}>
            <span>
              <span className={styles.dot} aria-hidden="true" />
              {product.name}
            </span>
            <span>22K yellow gold · natural red coral · move to turn</span>
          </p>

          <div className={`${styles.scroll} micro muted`}>
            <span className={styles.scrollLine} aria-hidden="true" />
            Scroll
          </div>

          <p className={`${styles.caption} micro muted`}>
            Moonga · {product.stoneDetails.dimensionsMm.join(' × ')} mm oval cabochon · 22K yellow gold
          </p>

          <p className={`${styles.macro} small muted`}>The bezel is formed by hand and burnished over the stone, so that nothing interrupts its outline.</p>

          <div className={styles.stoneTitle}>
            <p className="eyebrow">01 — The Stone</p>
            <h2 className="h1">
              <span className="line-mask">
                <span data-stone-line>Before the jewellery,</span>
              </span>
              <span className="line-mask">
                <span data-stone-line>
                  there is <em className="italic">the stone.</em>
                </span>
              </span>
            </h2>
          </div>

          <aside className={styles.panel} aria-label="About this stone">
            <div className={styles.panelHead}>
              <p className="eyebrow">Natural gemstone</p>
              <p className="micro muted">Example</p>
            </div>
            <dl>
              <div>
                <dt>Stone</dt>
                <dd>
                  {stone.englishName} · {stone.name}
                </dd>
              </div>
              <div>
                <dt>Origin</dt>
                <dd>Typically {stone.gemmology.typicalOrigins.slice(0, 2).join(' or ')} — stated per stone</dd>
              </div>
              <div>
                <dt>Cut</dt>
                <dd>{stone.cutLabel}</dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd>approx. {product.stoneDetails.weightCarats.toFixed(2)} ct</dd>
              </div>
              <div>
                <dt>Treatment</dt>
                <dd>Untreated, or fully disclosed</dd>
              </div>
              <div>
                <dt>Certification</dt>
                <dd>Independent laboratory report</dd>
              </div>
            </dl>
            <p className={`${styles.note} muted`}>Traditionally associated with Mars — courage, vitality, determination. A traditional association, not a claim of effect.</p>
          </aside>

          <p className={`${styles.drag} micro muted`}>
            <span className={styles.dragArrows} aria-hidden="true">
              ←<span>→</span>
            </span>
            Drag to turn the stone
          </p>

          <div className={styles.rail} aria-hidden="true">
            <div className={styles.railFill} />
          </div>
        </div>
      </div>
    </section>
  );
}
