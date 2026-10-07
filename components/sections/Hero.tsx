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
/** world-space extents used to keep the object clear of the text */
const RING_W = 2.45;
const RING_H = 2.75;
const STONE_E = 1.3;
const GAP = 48;

const stoneAt = (pitch: number): V3 => [0, STONE_Y * Math.cos(pitch), STONE_Y * Math.sin(pitch)];
const tanHalf = (fov: number) => Math.tan((fov * Math.PI) / 360);

/** Moves the camera along its own line of sight to distance d from the target. */
function atDistance(position: V3, target: V3, d: number): V3 {
  const v = [position[0] - target[0], position[1] - target[1], position[2] - target[2]];
  const l = Math.hypot(v[0], v[1], v[2]);
  return [target[0] + (v[0] / l) * d, target[1] + (v[1] / l) * d, target[2] + (v[2] / l) * d];
}

/**
 * Camera poses computed from the real layout: the ring sits in the free space
 * to the right of the headline, and the lifted stone between the title and the
 * panel — never under any text, at any viewport size.
 */
function computePoses(el: HTMLElement) {
  const W = window.innerWidth;
  const canvasBox = el.querySelector<HTMLElement>(`.${styles.canvas}`)!.getBoundingClientRect();
  const Hc = canvasBox.height;
  const aspect = W / Hc;
  const narrow = W < 820;
  const margin = parseFloat(getComputedStyle(el).getPropertyValue('--margin')) || 24;

  const fitW = (worldW: number, px: number, fov: number) => (worldW * W) / (px * 2 * tanHalf(fov) * aspect);
  const fitH = (worldH: number, fraction: number, fov: number) => worldH / (fraction * 2 * tanHalf(fov));

  const heroPose = { position: [0, 0.55, 7.6] as V3, target: [0, 0.1, 0] as V3, fov: 26, offsetX: 0 };
  const centrePose = { position: [0, 0.85, 6.4] as V3, target: [0, 0.1, 0] as V3, fov: 26, offsetX: 0 };
  const s = stoneAt(MACRO_PITCH);
  const macroPose = { position: [s[0] + 0.4, s[1] + 2.1, s[2] + 3.6] as V3, target: s, fov: 20, offsetX: 0 };
  const stonePose = { position: [0, 0.35, 4.9] as V3, target: [0, 0, 0] as V3, fov: 24, offsetX: 0 };
  let stoneScale = 0.92;

  if (narrow) {
    // fit each object inside the upper band with breathing room
    const dRing = Math.max(fitW(RING_W, W * 0.8, 26), fitH(RING_H, 0.82, 26));
    heroPose.position = atDistance(heroPose.position, heroPose.target, dRing);
    centrePose.position = atDistance(centrePose.position, centrePose.target, dRing);
    const dMacro = Math.max(fitW(1.6, W * 0.92, 20), fitH(1.4, 0.92, 20));
    macroPose.position = atDistance(macroPose.position, macroPose.target, dMacro);
    stoneScale = 0.85;
    const dStone = Math.max(fitW(STONE_E * stoneScale, W * 0.7, 24), fitH(STONE_E * stoneScale, 0.75, 24));
    stonePose.position = atDistance(stonePose.position, stonePose.target, dStone);
    return { hero: heroPose, centre: centrePose, macro: macroPose, stone: stonePose, stoneScale };
  }

  // hero: the ring occupies the band between the headline and the right margin
  const textRight = el.querySelector<HTMLElement>(`.${styles.intro}`)!.getBoundingClientRect().right + GAP;
  const band = W - margin - textRight;
  let d = Math.max(heroPose.position[2], fitW(RING_W, band, 26), fitH(RING_H, 0.86, 26));
  heroPose.position = atDistance(heroPose.position, heroPose.target, d);
  heroPose.offsetX = (textRight + band / 2) / W - 0.5;
  // centre: whole viewport is free, only keep it within the frame
  d = Math.max(6.4, fitH(RING_H, 0.86, 26));
  centrePose.position = atDistance(centrePose.position, centrePose.target, d);

  // stone: centred between the title and the panel, sized to the gap
  const titleRight = el.querySelector<HTMLElement>(`.${styles.stoneTitle}`)!.getBoundingClientRect().right + GAP;
  const panelLeft = el.querySelector<HTMLElement>(`.${styles.panel}`)!.getBoundingClientRect().left - GAP;
  const gap = Math.max(panelLeft - titleRight, 120);
  const dS = Math.hypot(...stonePose.position.map((v, i) => v - stonePose.target[i]));
  const visW = 2 * dS * tanHalf(24) * aspect;
  const visH = 2 * dS * tanHalf(24);
  stoneScale = Math.min(0.92, (gap * visW) / (STONE_E * W), (0.72 * visH) / STONE_E);
  stonePose.offsetX = (titleRight + gap / 2) / W - 0.5;
  return { hero: heroPose, centre: centrePose, macro: macroPose, stone: stonePose, stoneScale };
}

/**
 * Hero → The Stone. One pinned, scroll-scrubbed sequence:
 * the ring floats beside the headline, moves to centre and turns, the camera
 * pushes into the setting, and the stone lifts free of its bezel —
 * "before the jewellery, there is the stone".
 */
export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const driver = useMemo<HeroDriver>(
    () => ({
      camera: poseToDriver({ position: [0, 0.55, 7.6], target: [0, 0.1, 0], fov: 26, offsetX: 0.2 }),
      pitch: 0.58,
      yaw: -0.62,
      settle: 0,
      ringY: 0,
      lift: 0,
      stoneScale: 0.92,
      interactive: 0,
    }),
    [],
  );

  useEffect(() => {
    const el = section.current!;
    const q = (sel: string) => el.querySelectorAll(sel);
    const reduced = prefersReducedMotion();
    let ctx: gsap.Context | null = null;

    const build = () => {
      ctx?.revert();
      const P = computePoses(el);
      Object.assign(driver.camera, poseToDriver(P.hero));
      Object.assign(driver, { pitch: 0.58, yaw: -0.62, settle: 0, ringY: 0, lift: 0, interactive: 0, stoneScale: P.stoneScale });
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
        tl.to(q('[data-intro]'), { autoAlpha: 0, y: -40, duration: 0.1, stagger: 0.012, ease: 'power2.in' }, 0.07)
          .to(q(`.${styles.scroll}`), { opacity: 0, duration: 0.05 }, 0.05)
          // 2 — the ring comes to centre, the camera draws closer, the ring turns
          .to(cam, { ...poseToDriver(P.centre), duration: 0.32, ease: 'expo.inOut' }, 0.1)
          .to(driver, { pitch: 0.7, yaw: Math.PI * 2 - 0.4, settle: 1, duration: 0.34, ease: 'power3.inOut' }, 0.1)
          // 3 — macro: the camera pushes into the setting
          .to(cam, { ...poseToDriver(P.macro), duration: 0.18, ease: 'expo.inOut' }, 0.44)
          .to(driver, { pitch: MACRO_PITCH, yaw: Math.PI * 2, duration: 0.18, ease: 'power3.inOut' }, 0.44)
          // 4 — the stone lifts free of its bezel; the ring falls away
          .to(driver, { lift: 1, duration: 0.22, ease: 'power2.inOut' }, 0.62)
          .to(driver, { ringY: -7, duration: 0.09, ease: 'power2.in' }, 0.655)
          .to(cam, { ...poseToDriver(P.stone), duration: 0.2, ease: 'expo.inOut' }, 0.62)
          .fromTo(q('[data-stone-line]'), { yPercent: 112 }, { yPercent: 0, duration: 0.08, stagger: 0.015, ease: 'expo.out' }, 0.74)
          .fromTo(q(`.${styles.panel}`), { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.08, ease: 'power3.out' }, 0.79)
          .fromTo(q('[data-stone-meta]'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: 'power3.out' }, 0.79)
          .set(driver, { interactive: 1 }, 0.8)
          .to({}, { duration: 0.1 }, 0.9);
      }, el);
    };
    build();
    let timer = 0;
    const onResize = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        build();
        ScrollTrigger.refresh();
      }, 200);
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


          <div className={`${styles.scroll} micro muted`}>
            <span className={styles.scrollLine} aria-hidden="true" />
            Scroll
          </div>



          <div className={styles.stoneTitle}>
            <h2 className="h1">
              <span className="line-mask">
                <span data-stone-line>Before the jewellery,</span>
              </span>
              <span className="line-mask">
                <span data-stone-line>
                  there is <em>the stone.</em>
                </span>
              </span>
            </h2>
            {/* phones: the essentials of the panel, under the title */}
            <div className={styles.stoneMobile} data-stone-meta>
              <p className="small">
                {stone.englishName} · {stone.name} · approx. {product.stoneDetails.weightCarats.toFixed(2)} ct
              </p>
              <p className="small muted">Traditionally associated with Mars. Drag the stone to turn it.</p>
              <TransitionLink href={`/products/${product.slug}`} className="link" stoneColor={stone.swatch}>
                View the Moonga Ring
              </TransitionLink>
            </div>
          </div>

          <aside className={styles.panel} aria-label="About this stone">
            <div className={styles.panelHead}>
              <p className="h3">Natural gemstone</p>
              <p className="small muted">Example piece</p>
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
            <p className={`${styles.drag} small muted`}>
              <span aria-hidden="true">← →</span>
              Drag to turn the stone
            </p>
          </aside>


          <div className={styles.rail} aria-hidden="true">
            <div className={styles.railFill} />
          </div>
        </div>
      </div>
    </section>
  );
}
