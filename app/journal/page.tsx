import type { Metadata } from 'next';
import { TransitionLink } from '@/components/layout/PageTransition';
import PageIntro from '@/components/ui/PageIntro';
import { gemstoneBySlug } from '@/lib/data/gemstones';
import { getArticles } from '@/lib/services/catalog';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'The Journal',
  description: 'On gemstones, certification, care and craft: Moonga, Cat’s Eye, the Navratna tradition, natural versus treated stones, and how to choose.',
  path: '/journal',
});

const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default async function JournalPage() {
  const [lead, ...rest] = await getArticles();
  const leadGem = lead.stone ? gemstoneBySlug(lead.stone) : null;
  return (
    <>
      <PageIntro eyebrow="The Journal" lines={['Notes on stone,', <em key="e">tradition and craft.</em>]} compact />
      <section className="container" style={{ paddingBottom: 'clamp(100px, 12vw, 180px)' }}>
        <TransitionLink
          href={`/journal/${lead.slug}`}
          stoneColor={leadGem?.swatch}
          className="journal-lead"
          style={{ display: 'grid', gap: 22, padding: 'clamp(40px, 6vw, 80px) 0', borderTop: '1px solid var(--hairline-strong)', borderBottom: '1px solid var(--hairline-strong)' }}
        >
          <span className="micro muted">
            {lead.category} · {fmt(lead.date)} · {lead.readingMinutes} min read
          </span>
          <span className="display" style={{ maxWidth: '12em' }}>
            {lead.title}
          </span>
          <span className="lead" style={{ maxWidth: '36em' }}>
            {lead.dek}
          </span>
        </TransitionLink>
        <ul className="journal-grid">
          {rest.map((a) => (
            <li key={a.slug}>
              <TransitionLink href={`/journal/${a.slug}`}>
                <span className="micro muted">
                  {a.category} · {a.readingMinutes} min
                </span>
                <span className="h3">{a.title}</span>
                <span className="body small">{a.dek}</span>
              </TransitionLink>
            </li>
          ))}
        </ul>
        <style>{`
          .journal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: var(--gutter); }
          .journal-grid li a { display: grid; gap: 14px; padding: 40px 0; border-bottom: 1px solid var(--hairline); transition: padding .7s var(--ease); }
          .journal-grid li a:hover { padding-left: 10px; }
          .journal-lead:hover .display { font-style: italic; }
          @media (max-width: 800px) { .journal-grid { grid-template-columns: 1fr; } }
        `}</style>
      </section>
    </>
  );
}
