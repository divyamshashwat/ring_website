import type { Metadata } from 'next';
import ProductIndex from '@/components/product/ProductIndex';
import PageIntro from '@/components/ui/PageIntro';
import { getProducts } from '@/lib/services/catalog';
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'The Collection — Astrological Gemstone Rings, Pendants & Kada',
  description: 'Natural, certified Navratna gemstones — Moonga, Lehsunia, Neelam, Pukhraj, Panna and more — set by hand in 18K and 22K gold.',
  path: '/collections',
});

export default async function CollectionsPage() {
  const products = await getProducts();
  return (
    <>
      <PageIntro
        eyebrow="The Collection"
        lines={['One stone,', <em key="e">one setting.</em>]}
        lead="Every piece is made around a single natural stone, chosen for it and documented with it. Each can also be made to your own specification."
      />
      <ProductIndex products={products} />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Collections', path: '/collections' }])} />
    </>
  );
}
