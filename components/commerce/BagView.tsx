'use client';

import Image from 'next/image';
import { TransitionLink } from '@/components/layout/PageTransition';
import { configurationName } from '@/components/configurator/Configurator';
import { gemstoneBySlug } from '@/lib/data/gemstones';
import { METAL_OPTIONS } from '@/lib/data/options';
import { formatPrice } from '@/lib/data/pricing';
import { products } from '@/lib/data/products';
import { bagTotal, useBag, type BagItem } from '@/lib/store/bag';
import styles from './commerce.module.css';
import { useMounted } from './useMounted';

export function lineDescription(item: BagItem) {
  const c = item.configuration;
  const gem = gemstoneBySlug(c.stone)!;
  const metal = METAL_OPTIONS.find((m) => m.id === c.metal)!.label;
  return [`Natural ${gem.englishName.toLowerCase()}`, `${c.purity.toUpperCase()} ${metal.toLowerCase()}`, c.style, c.type === 'ring' ? `US ${c.size}` : null].filter(Boolean).join(' · ');
}

export function LineThumb({ item }: { item: BagItem }) {
  const product = products.find((p) => p.slug === item.productSlug) ?? products.find((p) => p.gemstone === item.configuration.stone && p.type === item.configuration.type);
  const gem = gemstoneBySlug(item.configuration.stone)!;
  return (
    <div className={styles.thumb} style={{ background: `color-mix(in srgb, ${gem.swatch} 8%, var(--pearl))` }}>
      {product && <Image src={product.thumbnail} alt="" width={240} height={240} style={{ width: '100%', height: 'auto', mixBlendMode: 'multiply' }} />}
    </div>
  );
}

export default function BagView() {
  const mounted = useMounted();
  const items = useBag((s) => s.items);
  const remove = useBag((s) => s.remove);
  const setQuantity = useBag((s) => s.setQuantity);
  if (!mounted) return <div style={{ minHeight: '40vh' }} />;

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p className="lead">Your bag is empty.</p>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <TransitionLink href="/collections" className="btn btn--solid">
            Discover the collection
          </TransitionLink>
          <TransitionLink href="/configure" className="link" style={{ alignSelf: 'center' }}>
            Create your own piece
          </TransitionLink>
        </div>
      </div>
    );
  }
  const total = bagTotal(items);
  return (
    <div className={styles.layout}>
      <ul className={styles.lines}>
        {items.map((item) => (
          <li key={item.key} className={styles.line}>
            <LineThumb item={item} />
            <div className={styles.lineInfo}>
              <span className="h3">{item.name || configurationName(item.configuration)}</span>
              <span className="small muted">{lineDescription(item)}</span>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                <div className={styles.qty} aria-label="Quantity">
                  <button type="button" onClick={() => setQuantity(item.key, item.quantity - 1)} aria-label="Decrease quantity">
                    −
                  </button>
                  <span aria-live="polite">{item.quantity}</span>
                  <button type="button" onClick={() => setQuantity(item.key, item.quantity + 1)} aria-label="Increase quantity">
                    +
                  </button>
                </div>
                <button type="button" className="link link--quiet" onClick={() => remove(item.key)}>
                  Remove
                </button>
              </div>
            </div>
            <span className="small">{formatPrice(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <aside className={styles.summary} aria-label="Summary">
        <p className="label">Summary</p>
        <div className={styles.row}>
          <span>Subtotal</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div className={styles.row}>
          <span>Insured delivery in India</span>
          <span>Complimentary</span>
        </div>
        <div className={styles.row}>
          <span>Laboratory report</span>
          <span>Included</span>
        </div>
        <div className={styles.total}>
          <span className="label">Total</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <TransitionLink href="/checkout" className="btn btn--solid btn--block">
          Proceed to checkout
        </TransitionLink>
        <p className="small muted">Prices include GST. Made-to-order pieces are confirmed by a gemmologist before payment is taken.</p>
      </aside>
    </div>
  );
}
