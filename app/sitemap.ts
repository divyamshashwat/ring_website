import type { MetadataRoute } from 'next';
import { getArticles, getGemstones, getProducts } from '@/lib/services/catalog';
import { SITE_URL } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (p: string) => new URL(p, SITE_URL).toString();
  const statics = ['/', '/collections', '/gemstones', '/zodiac', '/find-your-stone', '/configure', '/craftsmanship', '/our-story', '/journal', '/consultation', '/contact', '/shipping', '/returns', '/care', '/privacy', '/terms'];
  const [products, gemstones, articles] = await Promise.all([getProducts(), getGemstones(), getArticles()]);
  return [
    ...statics.map((p) => ({ url: url(p), changeFrequency: 'weekly' as const, priority: p === '/' ? 1 : 0.7 })),
    ...products.map((p) => ({ url: url(`/products/${p.slug}`), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...gemstones.map((g) => ({ url: url(`/gemstones/${g.slug}`), changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...articles.map((a) => ({ url: url(`/journal/${a.slug}`), lastModified: a.date, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];
}
