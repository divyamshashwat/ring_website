import type { ReactNode } from 'react';
import PageIntro from './PageIntro';

/** Long-form utility pages (shipping, care, legal): quiet, readable, with a section index. */
export default function InfoPage({ title, lead, sections }: { title: ReactNode[]; lead?: string; sections: { id: string; heading: string; body: ReactNode }[] }) {
  return (
    <>
      <PageIntro lines={title} lead={lead} compact />
      <div className="container" style={{ paddingBottom: 'clamp(100px, 12vw, 180px)' }}>
        <div className="grid info-grid" style={{ borderTop: '1px solid var(--hairline-strong)', paddingTop: 48, rowGap: 40 }}>
          <nav aria-label="On this page" style={{ gridColumn: '1 / span 3', alignSelf: 'start', position: 'sticky', top: 'calc(var(--header-h) + 32px)' }} className="info-nav">
            <ul style={{ display: 'grid', gap: 10 }}>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="micro muted">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div style={{ gridColumn: '5 / span 7', display: 'grid', gap: 64 }} className="info-body">
            {sections.map((s) => (
              <section key={s.id} id={s.id} style={{ scrollMarginTop: 'calc(var(--header-h) + 32px)', display: 'grid', gap: 18 }}>
                <h2 className="h3">{s.heading}</h2>
                <div className="body prose">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .prose { display: grid; gap: 14px; max-width: 38em; }
        .prose ul { display: grid; gap: 8px; padding-left: 1.1em; list-style: disc; }
        .prose table { width: 100%; border-collapse: collapse; font-size: var(--fs-small); }
        .prose th, .prose td { text-align: left; padding: 10px 8px 10px 0; border-bottom: 1px solid var(--hairline); font-weight: 300; }
        .prose th { font-size: var(--fs-micro); letter-spacing: .18em; text-transform: uppercase; font-weight: 500; color: var(--muted); }
        @media (max-width: 900px) { .info-nav { display: none; } .info-body { grid-column: 1 / -1 !important; } }
      `}</style>
    </>
  );
}
