import type { Metadata } from 'next';
import Craftsmanship from '@/components/sections/Craftsmanship';
import PageIntro from '@/components/ui/PageIntro';
import { Reveal } from '@/components/ui/Reveal';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Craftsmanship — How a VYOMA Piece Is Made',
  description: 'From the selection of a single natural stone to the final mirror polish: bezel setting, milgrain, twisted wire, granulation and hallmarking, by hand in India.',
  path: '/craftsmanship',
});

const PROCESS = [
  { title: 'Selection', body: 'Stones are chosen one at a time, under daylight and under the loupe. Most are declined.' },
  { title: 'Certification', body: 'Before anything is made, the stone goes to an independent laboratory. You receive the report number to verify.' },
  { title: 'Drawing the piece', body: 'Proportions are drawn around the actual stone: its outline, its height, the way its light falls.' },
  { title: 'Forming the setting', body: 'The bezel is formed in gold of the chosen purity, fitted to the stone to a fraction of a millimetre.' },
  { title: 'Setting', body: 'The bezel is pushed and burnished over the stone’s edge by hand, all the way round, without a mark on the stone.' },
  { title: 'Finishing', body: 'Milgrain, wire and granulation where the design calls for them; then polishing in stages to a mirror.' },
  { title: 'Hallmarking', body: 'The gold is hallmarked under the BIS scheme; the house mark and purity are engraved inside.' },
];

export default function CraftsmanshipPage() {
  return (
    <>
      <PageIntro
        lines={['Made slowly,', <em key="e">by hand.</em>]}
        lead="A piece takes three to four weeks, most of it spent on things you will only notice when you hold it."
      />
      <Craftsmanship />
      <section className="container" style={{ paddingBlock: 'clamp(100px, 12vw, 180px)' }} aria-labelledby="process-title">
        <div className="grid" style={{ rowGap: 48 }}>
          <div style={{ gridColumn: '1 / span 4' }} className="proc-head">
            <h2 id="process-title" className="h2">
              Seven stages, in order.
            </h2>
          </div>
          <ol style={{ gridColumn: '6 / span 7', borderTop: '1px solid var(--hairline-strong)' }} className="proc-list">
            {PROCESS.map((p, i) => (
              <Reveal as="li" key={p.title} style={{ display: 'grid', gridTemplateColumns: '3em 1fr', gap: '6px 16px', padding: '26px 0', borderBottom: '1px solid var(--hairline)' }}>
                <span className="micro muted">{String(i + 1).padStart(2, '0')}</span>
                <span className="h3">{p.title}</span>
                <span className="body small" style={{ gridColumn: 2 }}>
                  {p.body}
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
        <style>{`@media (max-width: 900px) { .proc-head, .proc-list { grid-column: 1 / -1 !important; } }`}</style>
      </section>
    </>
  );
}
