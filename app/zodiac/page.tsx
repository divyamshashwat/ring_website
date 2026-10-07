import type { Metadata } from 'next';
import { TransitionLink } from '@/components/layout/PageTransition';
import PageIntro from '@/components/ui/PageIntro';
import { PLANET_STONE, RASHIS, rashiDateRange } from '@/lib/astro/zodiac';
import { gemstoneBySlug } from '@/lib/data/gemstones';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'The Zodiac — Rashis, Ruling Planets and Their Stones',
  description: 'The twelve sidereal signs of Vedic astrology, their ruling planets, and the gemstone each planet is traditionally associated with.',
  path: '/zodiac',
});

export default function ZodiacPage() {
  return (
    <>
      <PageIntro
        lines={['Twelve signs.', <em key="e">Seven rulers.</em>]}
        lead="Vedic astrology uses the sidereal zodiac. Each rashi is ruled by a planet, and each planet is traditionally associated with a stone. Dates below are for the Sun’s sidereal sign and shift by a day between years."
        aside={
          <TransitionLink href="/find-your-stone" className="link">
            Find your stone
          </TransitionLink>
        }
      />
      <section className="container" style={{ paddingBottom: 'clamp(100px, 12vw, 180px)' }} aria-label="The twelve rashis">
        <ol className="rashis">
          {RASHIS.map((r, i) => {
            const gem = gemstoneBySlug(PLANET_STONE[r.lord])!;
            return (
              <li key={r.slug}>
                <span className="micro muted idx">{String(i + 1).padStart(2, '0')}</span>
                <span className="nm">
                  <span className="h2">{r.name}</span>
                  <span className="small muted">{r.western}</span>
                </span>
                <span className="small">{rashiDateRange(r)}</span>
                <span className="small">
                  Ruled by {r.lord} · {r.element}
                </span>
                <TransitionLink href={`/gemstones/${gem.slug}`} className="stone" stoneColor={gem.swatch}>
                  <span className="dot" style={{ background: gem.swatch }} aria-hidden="true" />
                  {gem.name}
                  <span className="muted"> · {gem.englishName}</span>
                </TransitionLink>
              </li>
            );
          })}
        </ol>
        <p className="small muted" style={{ marginTop: 48, maxWidth: '46em' }}>
          A traditional recommendation considers the full birth chart — ascendant, planetary periods and more — not the Sun sign alone. Gemstone associations reflect traditional practice and are not scientific or medical claims.
        </p>
        <style>{`
          .rashis { border-top: 1px solid var(--hairline-strong); }
          .rashis li { display: grid; grid-template-columns: 3em minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr); gap: 16px; align-items: baseline; padding: 26px 0; border-bottom: 1px solid var(--hairline); transition: background-color .6s var(--ease); }
          .rashis li:hover { background: var(--porcelain); }
          .rashis .nm { display: flex; gap: 14px; align-items: baseline; flex-wrap: wrap; }
          .rashis .stone { font-size: var(--fs-small); }
          .rashis .stone:hover { text-decoration: underline; text-underline-offset: 4px; }
          .rashis .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 10px; vertical-align: 1px; }
          @media (max-width: 900px) { .rashis li { grid-template-columns: 2.4em 1fr; } .rashis li > :nth-child(n+3) { grid-column: 2; } }
        `}</style>
      </section>
    </>
  );
}
