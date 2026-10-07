import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetail from '@/components/product/ProductDetail';
import { gemstoneBySlug } from '@/lib/data/gemstones';
import { getProductBySlug, getProducts } from '@/lib/services/catalog';
import { breadcrumbJsonLd, JsonLd, pageMetadata, SITE_URL } from '@/lib/seo';

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  const gem = gemstoneBySlug(product.gemstone)!;
  return pageMetadata({
    title: `${product.name} — Natural ${gem.englishName} in ${product.configuration.purity.toUpperCase()} Gold`,
    description: `${product.description} Natural, independently certified ${gem.englishName.toLowerCase()} (${gem.name}).`,
    path: `/products/${product.slug}`,
    image: product.thumbnail,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const all = await getProducts();
  const related = all.filter((p) => p.slug !== product.slug && (p.gemstone === product.gemstone || p.type === product.type)).slice(0, 3);
  const gem = gemstoneBySlug(product.gemstone)!;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.id,
    image: new URL(product.thumbnail, SITE_URL).toString(),
    brand: { '@type': 'Brand', name: 'VYOMA' },
    material: `${product.configuration.purity.toUpperCase()} gold, natural ${gem.englishName.toLowerCase()}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      availability: 'https://schema.org/MadeToOrder',
      url: new URL(`/products/${product.slug}`, SITE_URL).toString(),
    },
  };
  return (
    <>
      <ProductDetail product={product} related={related} />
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Collections', path: '/collections' },
          { name: product.name, path: `/products/${product.slug}` },
        ])}
      />
    </>
  );
}
