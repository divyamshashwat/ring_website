import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.vyoma.example';
export const SITE_NAME = 'VYOMA';
export const SITE_DESCRIPTION =
  'VYOMA is a house of astrological gemstone jewellery: natural, independently certified Navratna stones — Moonga, Lehsunia, Neelam, Pukhraj and more — set by hand in 18K and 22K gold.';

/** Consistent metadata: canonical, Open Graph and Twitter cards for every page. */
export function pageMetadata({ title, description, path, image }: { title: string; description: string; path: string; image?: string }): Metadata {
  const url = new URL(path, SITE_URL).toString();
  const images = [{ url: image ?? '/og/vyoma.jpg', width: 1200, height: 630, alt: title }];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: 'website', locale: 'en_IN', images },
    twitter: { card: 'summary_large_image', title, description, images: images.map((i) => i.url) },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: new URL(item.path, SITE_URL).toString() })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
