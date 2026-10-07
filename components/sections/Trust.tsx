import { TransitionLink } from '@/components/layout/PageTransition';
import { MaskedLines, Reveal } from '@/components/ui/Reveal';
import styles from './Trust.module.css';

export const TRUST = [
  { title: 'Certified gemstones', body: 'Every stone is examined by an independent gemmological laboratory. The report travels with the piece.' },
  { title: 'Transparent sourcing', body: 'We state what the report states: species, natural or synthetic, treatment, and origin only where a laboratory has determined it.' },
  { title: 'Craftsmanship', body: 'Settings are formed, set and finished by hand. Gold is BIS hallmarked.' },
  { title: 'Authenticity documentation', body: 'Each piece carries its report, a record of its stone and metal weights, and the house certificate.' },
  { title: 'Custom sizing', body: 'Rings are made to your size. A complimentary resize is available within the first year.' },
  { title: 'Care guidance', body: 'Soft stones and hard stones need different care. You receive instructions written for your piece.' },
  { title: 'Consultation', body: 'Speak with a gemmologist — and, if you wish, an astrologer — by video or at the atelier.' },
  { title: 'Secure payments', body: 'Payments are processed by an RBI-regulated payment gateway. We never store card details.' },
];

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'];

export default function Trust() {
  return (
    <section className={styles.section} aria-labelledby="trust-title">
      <div className="container grid">
        <div className={styles.title}>
          <p className="eyebrow" style={{ marginBottom: 28 }}>
            08 — Our undertaking
          </p>
          <MaskedLines as="h2" className="h2" lines={['What you can', <em key="e">rely upon.</em>]} />
          <span id="trust-title" className="visually-hidden">
            Our undertaking
          </span>
          <p className="body" style={{ marginTop: 28 }}>
            Tradition tells you which stone. Everything else should be verifiable.
          </p>
          <TransitionLink href="/our-story" className="link" style={{ marginTop: 28 }}>
            Our story
          </TransitionLink>
        </div>
        <ol className={styles.list}>
          {TRUST.map((t, i) => (
            <Reveal as="li" key={t.title} className={styles.row} delay={(i % 2) * 0.05}>
              <span className={styles.numeral}>{ROMAN[i]}.</span>
              <h3>{t.title}</h3>
              <p className="body small">{t.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
