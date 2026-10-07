'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import { MaskedLines, MaskReveal, Reveal } from '@/components/ui/Reveal';
import Placeholder from '@/components/ui/Placeholder';
import { prefersReducedMotion } from '@/lib/motion';
import styles from './Heritage.module.css';

gsap.registerPlugin(ScrollTrigger);

/** A single jali (carved stone lattice) motif that draws itself once — the only ornament on the page. */
function Jali() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg || prefersReducedMotion()) return;
    const paths = svg.querySelectorAll('path');
    const ctx = gsap.context(() => {
      paths.forEach((p) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      });
      gsap.to(paths, { strokeDashoffset: 0, duration: 3.2, ease: 'power2.inOut', stagger: 0.04, scrollTrigger: { trigger: svg, start: 'top 85%', once: true } });
    }, svg);
    return () => ctx.revert();
  }, []);
  const cells = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 6; c++) {
      const x = c * 20 + 10;
      const y = r * 20 + 10;
      // an eight-pointed star inside each square, the module of countless Mughal screens
      cells.push(<path key={`${r}-${c}`} d={`M${x} ${y - 9} L${x + 3} ${y - 3} L${x + 9} ${y} L${x + 3} ${y + 3} L${x} ${y + 9} L${x - 3} ${y + 3} L${x - 9} ${y} L${x - 3} ${y - 3} Z M${x - 6.4} ${y - 6.4} L${x + 6.4} ${y + 6.4} M${x + 6.4} ${y - 6.4} L${x - 6.4} ${y + 6.4}`} />);
    }
  return (
    <svg ref={ref} className={styles.jali} viewBox="0 0 120 60" aria-hidden="true">
      {cells}
    </svg>
  );
}

export default function Heritage() {
  return (
    <section className={styles.section} aria-labelledby="heritage-title">
      <div className="container">
        <div className="grid">
          <MaskedLines as="h2" className={`serif ${styles.title}`} lines={['Ancient knowledge.', <em key="e">Contemporary form.</em>]} />
          <span id="heritage-title" className="visually-hidden">
            Ancient knowledge, contemporary form
          </span>
        </div>
        <div className={`grid ${styles.body}`}>
          <Reveal className={styles.textCol}>
            <p className="lead">
              The pairing of stones and planets is recorded in texts more than a thousand years old. The craft that sets them has been handed from bench to bench for just as long.
            </p>
            <p className="body">
              We work with that inheritance without imitating it. The proportions are drawn fresh; the techniques — the burnished bezel, the twisted wire, the single grain of gold — are kept exactly as they were.
            </p>
            <p className="body">
              What changes is what we tell you. Every stone arrives with a laboratory report, and every tradition is described as a tradition.
            </p>
            <Jali />
          </Reveal>
          <div className={styles.images}>
            <MaskReveal>
              <Placeholder label="Sandstone in raking light, Jaipur" ratio="4 / 5" tone="sand" />
            </MaskReveal>
            <figure className={styles.figure}>
              <MaskReveal>
                <Placeholder label="A carved jali, late afternoon" ratio="3 / 4" tone="stone" />
              </MaskReveal>
              <figcaption className="micro muted">
                <span>The jali</span>
                <span>Light through stone</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
