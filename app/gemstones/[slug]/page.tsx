import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GemstoneDetail from '@/components/gemstone/GemstoneDetail';
import { NAVRATNA_ORDER } from '@/lib/data/gemstones';
import { getGemstoneBySlug, getGemstones, getProducts } from '@/lib/services/catalog';
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/seo';

export async function generateStaticParams() {
  return (await getGemstones()).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const gem = await getGemstoneBySlug((await params).slug);
  if (!gem) return {};
  return pageMetadata({
    title: `${gem.name} (${gem.englishName}) — ${gem.epithet}`,
    description: `${gem.name}, natural ${gem.englishName.toLowerCase()}: gemmology, typical sources and treatments, and its traditional Vedic association with ${gem.planet.name}. Certified ${gem.englishName.toLowerCase()} jewellery by VYOMA.`,
    path: `/gemstones/${gem.slug}`,
  });
}

export default async function GemstonePage({ params }: { params: Promise<{ slug: string }> }) {
  const gem = await getGemstoneBySlug((await params).slug);
  if (!gem) notFound();
  const all = await getGemstones();
  const ordered = [...NAVRATNA_ORDER.map((s) => all.find((g) => g.slug === s)!), ...all.filter((g) => g.group === 'uparatna')];
  const i = ordered.findIndex((g) => g.slug === gem.slug);
  const prev = ordered[(i - 1 + ordered.length) % ordered.length];
  const next = ordered[(i + 1) % ordered.length];
  const pieces = await getProducts({ gemstone: gem.slug });
  return (
    <>
      <GemstoneDetail gem={gem} pieces={pieces} prev={prev} next={next} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Gemstones', path: '/gemstones' },
          { name: gem.name, path: `/gemstones/${gem.slug}` },
        ])}
      />
    </>
  );
}
