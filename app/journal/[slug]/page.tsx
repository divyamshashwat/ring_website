import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TransitionLink } from '@/components/layout/PageTransition';
import { MaskedLines } from '@/components/ui/Reveal';
import { gemstoneBySlug } from '@/lib/data/gemstones';
import { getArticleBySlug, getArticles } from '@/lib/services/catalog';
import { breadcrumbJsonLd, JsonLd, pageMetadata, SITE_URL } from '@/lib/seo';

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getArticleBySlug((await params).slug);
  if (!a) return {};
  return pageMetadata({ title: a.title, description: a.dek, path: `/journal/${a.slug}` });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getArticleBySlug((await params).slug);
  if (!article) notFound();
  const all = await getArticles();
  const next = all[(all.findIndex((a) => a.slug === article.slug) + 1) % all.length];
  const gem = article.stone ? gemstoneBySlug(article.stone) : null;
  return (
    <article>
      <header className="container" style={{ paddingTop: 'calc(var(--header-h) + clamp(64px, 9vw, 140px))', paddingBottom: 'clamp(48px, 6vw, 90px)' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gap: 28, textAlign: 'center', justifyItems: 'center' }}>
          <p className="small muted">
            {article.category} · {new Date(article.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · {article.readingMinutes} min read
          </p>
          <MaskedLines as="h1" className="display balance" lines={[article.title]} immediate />
          <p className="lead" style={{ maxWidth: '34em' }}>
            {article.dek}
          </p>
        </div>
      </header>
      <div className="container" style={{ paddingBottom: 'clamp(100px, 12vw, 180px)' }}>
        <div className="article-body">
          {article.body.map((block, i) => (
            <section key={i}>
              {block.heading && <h2 className="h3">{block.heading}</h2>}
              {block.paragraphs.map((p, j) => (
                <p key={j} className={i === 0 && j === 0 ? 'lead first' : 'body'}>
                  {p}
                </p>
              ))}
            </section>
          ))}
          {gem && (
            <aside style={{ borderTop: '1px solid var(--hairline-strong)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <span className="small muted">
                Read about {gem.name} — {gem.englishName}
              </span>
              <TransitionLink href={`/gemstones/${gem.slug}`} className="link">
                Explore the stone
              </TransitionLink>
            </aside>
          )}
          <nav aria-label="Next article" style={{ borderTop: '1px solid var(--hairline-strong)', paddingTop: 40 }}>
            <span className="micro muted">Next</span>
            <TransitionLink href={`/journal/${next.slug}`} className="h2" style={{ display: 'block', marginTop: 12 }}>
              {next.title}
            </TransitionLink>
          </nav>
        </div>
      </div>
      <style>{`
        .article-body { max-width: 680px; margin: 0 auto; display: grid; gap: 48px; }
        .article-body section { display: grid; gap: 20px; }
        .article-body .body { max-width: none; font-size: 1.08rem; line-height: 1.8; }
        .article-body .first::first-letter { font-family: var(--font-serif); font-size: 4.2em; float: left; line-height: .8; padding: .05em .1em 0 0; }
      `}</style>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.dek,
          datePublished: article.date,
          author: { '@type': 'Organization', name: 'VYOMA' },
          mainEntityOfPage: new URL(`/journal/${article.slug}`, SITE_URL).toString(),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Journal', path: '/journal' },
          { name: article.title, path: `/journal/${article.slug}` },
        ])}
      />
    </article>
  );
}
