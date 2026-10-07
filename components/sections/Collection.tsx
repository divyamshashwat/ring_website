'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { TransitionLink } from '@/components/layout/PageTransition';
import { MaskedLines } from '@/components/ui/Reveal';
import { gemstoneBySlug } from '@/lib/data/gemstones';
import { METAL_OPTIONS } from '@/lib/data/options';
import { formatPrice } from '@/lib/data/pricing';
import { products } from '@/lib/data/products';
import styles from './Collection.module.css';

const ShowcaseScene = dynamic(() => import('@/components/3d/ShowcaseScene'), { ssr: false });

const featured = products.filter((p) => p.featured);

/**
 * The collection as an editorial index: one piece at a time, large, in 3D.
 * Choosing another piece transforms the object in place rather than swapping a picture.
 */
export default function Collection() {
  const [index, setIndex] = useState(0);
  const [changing, setChanging] = useState(false);
  const product = featured[index];
  const gem = gemstoneBySlug(product.gemstone)!;

  useEffect(() => {
    setChanging(true);
    const t = setTimeout(() => setChanging(false), 380);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <section className={styles.section} style={{ ['--tint' as string]: gem.swatch }} aria-labelledby="collection-title">
      <div className="container">
        <div className={`grid ${styles.head}`}>
          <div className={styles.headTitle}>
            <MaskedLines as="h2" className="h1" lines={['One stone,', <em key="e">one setting.</em>]} />
            <span id="collection-title" className="visually-hidden">
              The collection
            </span>
          </div>
          <p className="body">Each piece is made around a single natural stone, chosen for it and documented with it. Select a piece to bring it forward.</p>
        </div>

        <div className={`grid ${styles.body}`}>
          <nav className={styles.index} aria-label="Featured pieces">
            {featured.map((p, i) => (
              <button key={p.slug} type="button" className={styles.item} aria-current={i === index} onClick={() => setIndex(i)} onMouseEnter={() => setIndex(i)} onFocus={() => setIndex(i)}>
                <span className="micro">{String(i + 1).padStart(2, '0')}</span>
                <strong>{gemstoneBySlug(p.gemstone)!.name}</strong>
              </button>
            ))}
          </nav>

          <div className={styles.stage} data-cursor="view">
            <ShowcaseScene config={product.configuration} label={`${product.name}, interactive 3D model`} />
          </div>

          <div className={`${styles.meta} ${styles.fade}`} data-changing={changing}>
            <p className={styles.metaName}>{gem.name}</p>
            <div className={`${styles.specs} micro muted`}>
              <span>
                {product.configuration.purity.toUpperCase()} {METAL_OPTIONS.find((m) => m.id === product.configuration.metal)!.label}
              </span>
              <span>Natural {gem.englishName}</span>
              <span>Certified</span>
            </div>
            <p className="small">{formatPrice(product.price)}</p>
            <TransitionLink href={`/products/${product.slug}`} className="link" data-cursor="explore">
              Explore
            </TransitionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
