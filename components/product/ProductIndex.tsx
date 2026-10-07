'use client';

import { useMemo, useState } from 'react';
import { TransitionLink } from '@/components/layout/PageTransition';
import { gemstoneBySlug } from '@/lib/data/gemstones';
import { METAL_OPTIONS } from '@/lib/data/options';
import { formatPrice } from '@/lib/data/pricing';
import type { Product } from '@/lib/data/types';
import ProductImage from './ProductImage';
import styles from './ProductIndex.module.css';

const FILTERS: { id: 'all' | Product['type']; label: string }[] = [
  { id: 'all', label: 'All pieces' },
  { id: 'ring', label: 'Rings' },
  { id: 'pendant', label: 'Pendants' },
  { id: 'bracelet', label: 'Kada' },
];

/** Editorial product discovery: one piece per row, asymmetric, never a card grid. */
export default function ProductIndex({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const list = useMemo(() => products.filter((p) => filter === 'all' || p.type === filter), [products, filter]);
  return (
    <div className="container">
      <div className={styles.filters} role="group" aria-label="Filter pieces">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={styles.filter} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
        <span className="micro muted" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          {list.length} {list.length === 1 ? 'piece' : 'pieces'}
        </span>
      </div>
      <ul className={styles.list}>
        {list.map((p, i) => {
          const gem = gemstoneBySlug(p.gemstone)!;
          return (
            <li key={p.slug} className={styles.row} style={{ ['--sw' as string]: gem.swatch }}>
              <TransitionLink href={`/products/${p.slug}`} className={styles.media} data-cursor="view" aria-label={`View ${p.name}`}>
                <ProductImage product={p} priority={i < 2} sizes="(max-width: 600px) 50vw, (max-width: 900px) 100vw, 58vw" />
              </TransitionLink>
              <div className={styles.text}>
                <h2 className={styles.name}>{gem.name}</h2>
                <div className={`${styles.specs} micro muted`}>
                  <span>
                    {p.configuration.purity.toUpperCase()} {METAL_OPTIONS.find((m) => m.id === p.configuration.metal)!.label}
                  </span>
                  <span>Natural {gem.englishName}</span>
                  <span>Certified</span>
                </div>
                <p className={`body small ${styles.desc}`}>{p.description}</p>
                <div className={styles.buy}>
                  <TransitionLink href={`/products/${p.slug}`} className="link">
                    Explore
                  </TransitionLink>
                  <span className="small muted">{formatPrice(p.price)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
