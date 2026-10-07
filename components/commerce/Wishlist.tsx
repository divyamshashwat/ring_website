'use client';

import { TransitionLink } from '@/components/layout/PageTransition';
import ProductImage from '@/components/product/ProductImage';
import { formatPrice } from '@/lib/data/pricing';
import { products } from '@/lib/data/products';
import { useBag } from '@/lib/store/bag';
import styles from './commerce.module.css';
import { useMounted } from './useMounted';

export default function Wishlist() {
  const mounted = useMounted();
  const wishlist = useBag((s) => s.wishlist);
  const toggle = useBag((s) => s.toggleWish);
  if (!mounted) return <div style={{ minHeight: '40vh' }} />;
  const saved = products.filter((p) => wishlist.includes(p.slug));
  if (saved.length === 0) {
    return (
      <div className={styles.empty}>
        <p className="lead">Nothing saved yet. Save a piece from its page to keep it here.</p>
        <TransitionLink href="/collections" className="btn btn--solid">
          Discover the collection
        </TransitionLink>
      </div>
    );
  }
  return (
    <ul className={styles.lines}>
      {saved.map((p) => {
        return (
          <li key={p.slug} className={styles.line}>
            <div className={styles.thumb}>
              <ProductImage product={p} sizes="120px" />
            </div>
            <div className={styles.lineInfo}>
              <TransitionLink href={`/products/${p.slug}`} className="h3">
                {p.name}
              </TransitionLink>
              <span className="small muted">{p.subtitle}</span>
              <button type="button" className="link link--quiet" style={{ justifySelf: 'start' }} onClick={() => toggle(p.slug)}>
                Remove
              </button>
            </div>
            <span className="small">{formatPrice(p.price)}</span>
          </li>
        );
      })}
    </ul>
  );
}
