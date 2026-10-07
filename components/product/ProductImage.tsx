import Image from 'next/image';
import type { Product } from '@/lib/data/types';

/**
 * A still rendered from the piece's real 3D model (scripts/render-products.ts).
 * Rendered on ivory and multiplied onto the page, so it sits on any warm ground.
 */
export default function ProductImage({ product, sizes = '(max-width: 900px) 100vw, 50vw', priority, className }: { product: Product; sizes?: string; priority?: boolean; className?: string }) {
  return (
    <Image
      src={product.thumbnail}
      alt={`${product.name} — ${product.subtitle}`}
      width={1000}
      height={1000}
      sizes={sizes}
      priority={priority}
      className={className}
      style={{ width: '100%', height: 'auto', mixBlendMode: 'multiply' }}
    />
  );
}
