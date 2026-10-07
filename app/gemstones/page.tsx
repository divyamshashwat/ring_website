import type { Metadata } from 'next';
import { TransitionLink } from '@/components/layout/PageTransition';
import Constellation from '@/components/sections/Constellation';
import PageIntro from '@/components/ui/PageIntro';
import { NAVRATNA_ORDER } from '@/lib/data/gemstones';
import { getGemstones } from '@/lib/services/catalog';
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Gemstones — The Navratna and Uparatna',
  description:
    'The nine classical Vedic gemstones — Manik, Moti, Moonga, Panna, Pukhraj, Heera, Neelam, Gomed and Lehsunia — and the uparatna, with verifiable gemmology and their traditional associations.',
  path: '/gemstones',
});

export default async function GemstonesPage() {
  const all = await getGemstones();
  const ordered = [...NAVRATNA_ORDER.map((s) => all.find((g) => g.slug === s)!), ...all.filter((g) => g.group === 'uparatna')];
  return (
    <>
      <PageIntro
        lines={['The stones,', <em key="e">and what is known of them.</em>]}
        lead="For each stone: what gemmology can verify, and — kept separate — what Vedic tradition holds."
      />
      <Constellation />
      <section className="container" style={{ paddingBlock: 'clamp(90px, 11vw, 160px)' }} aria-labelledby="register-title">
        <h2 id="register-title" className="h2" style={{ marginBottom: 40 }}>
          The register
        </h2>
        <div style={{ position: 'relative', overflowX: 'auto' }}>
          <table className="register">
            <thead>
              <tr>
                <th scope="col">Stone</th>
                <th scope="col">Species</th>
                <th scope="col">Hardness</th>
                <th scope="col">Tradition</th>
                <th scope="col">
                  <span className="visually-hidden">Link</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((g) => (
                <tr key={g.slug}>
                  <th scope="row">
                    <span className="dot" style={{ background: g.swatch }} aria-hidden="true" />
                    <span className="h3">{g.name}</span>
                    <span className="muted small"> {g.englishName}</span>
                  </th>
                  <td data-label="Species">{g.gemmology.species}</td>
                  <td data-label="Hardness" style={{ whiteSpace: 'nowrap' }}>
                    {g.gemmology.hardness}
                  </td>
                  <td data-label="Tradition">
                    {g.group === 'navratna' ? 'Navratna' : 'Uparatna'} · {g.planet.name}
                  </td>
                  <td>
                    <TransitionLink href={`/gemstones/${g.slug}`} className="link" stoneColor={g.swatch}>
                      Explore
                    </TransitionLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <style>{`
          .register { width: 100%; min-width: 760px; border-collapse: collapse; }
          .register th, .register td { text-align: left; padding: 20px 16px 20px 0; border-bottom: 1px solid var(--hairline); font-weight: 300; font-size: var(--fs-small); vertical-align: baseline; }
          .register thead th { font-size: var(--fs-micro); letter-spacing: .2em; text-transform: uppercase; font-weight: 500; color: var(--muted); border-bottom-color: var(--hairline-strong); }
          .register tbody th { white-space: nowrap; }
          .register .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 14px; vertical-align: 3px; }
          @media (max-width: 700px) {
            .register { min-width: 0; }
            .register thead { display: none; }
            .register tbody, .register tr { display: block; }
            .register tr { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 16px; padding: 20px 0; border-bottom: 1px solid var(--hairline); }
            .register th, .register td { display: block; padding: 0; border: 0; }
            .register tbody th { grid-column: 1; white-space: normal; }
            .register td[data-label] { grid-column: 1 / -1; color: var(--ink-soft); }
            .register td[data-label]::before { content: attr(data-label); display: inline-block; min-width: 6.5em; color: var(--muted); }
            .register td:last-child { grid-column: 2; grid-row: 1; align-self: center; }
          }
        `}</style>
      </section>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Gemstones', path: '/gemstones' }])} />
    </>
  );
}
