import { TransitionLink } from '@/components/layout/PageTransition';
import { journal } from '@/lib/data/journal';

const latest = [...journal].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

export default function JournalTeaser() {
  return (
    <section style={{ background: 'var(--porcelain)', paddingBlock: 'clamp(100px, 12vw, 180px)', borderTop: '1px solid var(--hairline)' }} aria-labelledby="journal-teaser">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 24, flexWrap: 'wrap', marginBottom: 48 }}>
          <h2 id="journal-teaser" className="h2">
            The Journal
          </h2>
          <TransitionLink href="/journal" className="link">
            All articles
          </TransitionLink>
        </div>
        <ul style={{ borderTop: '1px solid var(--hairline-strong)' }}>
          {latest.map((a) => (
            <li key={a.slug} style={{ borderBottom: '1px solid var(--hairline)' }}>
              <TransitionLink
                href={`/journal/${a.slug}`}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 24, padding: '28px 0', alignItems: 'baseline' }}
              >
                <span>
                  <span className="micro muted" style={{ display: 'block', marginBottom: 10 }}>
                    {a.category} · {a.readingMinutes} min
                  </span>
                  <span className="h3">{a.title}</span>
                </span>
                <span className="micro">Read</span>
              </TransitionLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
