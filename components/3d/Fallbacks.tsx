import { gemstoneBySlug } from '@/lib/data/gemstones';
import { products } from '@/lib/data/products';
import type { Configuration } from '@/lib/data/types';

/** A still of the piece (rendered from the same 3D model), shown when WebGL is unavailable. */
export function ProductStill({ config, slug }: { config?: Configuration; slug?: string }) {
  const product = (slug && products.find((p) => p.slug === slug)) || products.find((p) => p.gemstone === config?.stone && p.type === config?.type) || products.find((p) => p.gemstone === config?.stone) || products[0];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.thumbnail} alt="" style={{ maxWidth: '86%', maxHeight: '92%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
    </div>
  );
}

/** A quiet colour study of the stone, shown when WebGL is unavailable. */
export function StoneStill({ slug }: { slug: string }) {
  const gem = gemstoneBySlug(slug);
  const c = gem?.swatch ?? '#b4442c';
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
      <div
        style={{
          width: 'min(46%, 280px)',
          aspectRatio: '1.25',
          borderRadius: '50%',
          background: `radial-gradient(circle at 36% 30%, rgba(255,255,255,.75) 0%, ${c} 26%, ${c} 62%, rgba(0,0,0,.35) 100%)`,
          boxShadow: '0 30px 40px -28px rgba(60,40,20,.45)',
        }}
      />
    </div>
  );
}
