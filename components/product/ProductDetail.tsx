'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import StickyBuy from '@/components/commerce/StickyBuy';
import { TransitionLink } from '@/components/layout/PageTransition';
import { MaskedLines, Reveal } from '@/components/ui/Reveal';
import { gemstoneBySlug } from '@/lib/data/gemstones';
import { METAL_OPTIONS, RING_SIZES } from '@/lib/data/options';
import { formatPrice } from '@/lib/data/pricing';
import type { Product } from '@/lib/data/types';
import { useBag } from '@/lib/store/bag';
import { configToSearch } from '@/lib/store/configurator';
import ProductImage from './ProductImage';
import styles from './ProductDetail.module.css';

const RingViewer = dynamic(() => import('@/components/3d/RingViewer'), { ssr: false });

const REPORT = 'Stated on the laboratory report';

export default function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const gem = gemstoneBySlug(product.gemstone)!;
  const metal = METAL_OPTIONS.find((m) => m.id === product.configuration.metal)!;
  const [size, setSize] = useState<number | null>(product.type === 'ring' ? null : product.configuration.size);
  const [error, setError] = useState('');
  const add = useBag((s) => s.add);
  const wishlist = useBag((s) => s.wishlist);
  const toggleWish = useBag((s) => s.toggleWish);
  const wished = wishlist.includes(product.slug);
  const articleRef = useRef<HTMLElement>(null);
  const buyRef = useRef<HTMLButtonElement>(null);
  const sizesRef = useRef<HTMLDivElement>(null);
  const customise = `/configure?${configToSearch({ ...product.configuration, size: size ?? product.configuration.size })}`;

  const addToBag = () => {
    if (product.type === 'ring' && size === null) {
      setError('Please select your ring size.');
      sizesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setError('');
    add({ productSlug: product.slug, name: product.name, configuration: { ...product.configuration, size: size ?? product.configuration.size }, price: product.price });
  };

  return (
    <article ref={articleRef} style={{ ['--sw' as string]: gem.swatch }}>
      <section className={styles.hero}>
        <div className={styles.viewer}>
          <div className={styles.viewerInner}>
            <RingViewer config={product.configuration} modelPath={product.modelPath} label={`${product.name}, interactive 3D model`} />
          </div>
        </div>
        <div className={styles.info}>
          <nav className={`${styles.crumbs} micro muted`} aria-label="Breadcrumb">
            <TransitionLink href="/">Home</TransitionLink>
            <span aria-hidden="true">/</span>
            <TransitionLink href="/collections">Collection</TransitionLink>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{gem.name}</span>
          </nav>
          <div>
            <h1 className={styles.name}>{product.name}</h1>
            <p className="lead" style={{ marginTop: 14 }}>
              {gem.englishName} · {product.configuration.purity.toUpperCase()} {metal.label}
            </p>
          </div>
          <div className={styles.price}>
            <strong>{formatPrice(product.price)}</strong>
            <span className="micro muted">Certification included</span>
          </div>

          {product.type === 'ring' && (
            <div ref={sizesRef}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="label">Select size</span>
                <TransitionLink href="/care#sizing" className="micro muted">
                  Size guide
                </TransitionLink>
              </div>
              <div className={styles.sizes} role="radiogroup" aria-label="Ring size">
                {RING_SIZES.filter((r) => product.sizes.includes(r.us)).map((r) => (
                  <button key={r.us} type="button" role="radio" aria-checked={size === r.us} className={styles.size} onClick={() => setSize(r.us)}>
                    <span>
                      US {r.us}
                      <small>IN {r.india}</small>
                    </span>
                  </button>
                ))}
              </div>
              {error && (
                <p role="alert" className="small" style={{ color: '#8e2a1c', marginTop: 10 }}>
                  {error}
                </p>
              )}
            </div>
          )}

          <div className={styles.actions}>
            <button ref={buyRef} type="button" className="btn btn--solid btn--block" onClick={addToBag}>
              Add to bag
            </button>
            <TransitionLink href="/consultation" className="btn btn--block">
              Book a consultation
            </TransitionLink>
            <div className={styles.secondary}>
              <TransitionLink href={customise} className="link">
                Customise this piece
              </TransitionLink>
              <button type="button" className="link link--quiet" aria-pressed={wished} onClick={() => toggleWish(product.slug)}>
                {wished ? 'Saved to wishlist' : 'Save to wishlist'}
              </button>
            </div>
          </div>

          <dl className={styles.facts}>
            <div>
              <dt>Stone</dt>
              <dd>
                Natural {gem.englishName.toLowerCase()} · {gem.cutLabel.toLowerCase()}
              </dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>approx. {product.stoneDetails.weightCarats.toFixed(2)} ct</dd>
            </div>
            <div>
              <dt>Dimensions</dt>
              <dd>{product.stoneDetails.dimensionsMm.join(' × ')} mm</dd>
            </div>
            <div>
              <dt>Metal</dt>
              <dd>
                {product.configuration.purity.toUpperCase()} {metal.label.toLowerCase()}, approx. {product.metalWeightGrams} g
              </dd>
            </div>
            <div>
              <dt>Made to order</dt>
              <dd>3–4 weeks · insured delivery</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className={`container ${styles.sections}`}>
        <section className="grid" aria-labelledby="story-title">
          <div className={styles.story}>
            <h2 className="visually-hidden" id="story-title">
              The story
            </h2>
            <MaskedLines as="p" className="h2" lines={[product.description]} />
            <Reveal>
              <p className="lead" style={{ marginTop: 36 }}>
                {product.story}
              </p>
            </Reveal>
          </div>
        </section>

        <section className={`grid ${styles.split}`} aria-label="About the stone">
          <div>
            <p className="label">What we can verify</p>
            <dl className={styles.facts}>
              <div>
                <dt>Species</dt>
                <dd>{gem.gemmology.species}</dd>
              </div>
              <div>
                <dt>Hardness</dt>
                <dd>{gem.gemmology.hardness}</dd>
              </div>
              <div>
                <dt>Refractive index</dt>
                <dd>{gem.gemmology.refractiveIndex}</dd>
              </div>
              <div>
                <dt>Origin</dt>
                <dd>{product.stoneDetails.origin ?? REPORT}</dd>
              </div>
              <div>
                <dt>Treatment</dt>
                <dd>{product.stoneDetails.treatment ?? REPORT}</dd>
              </div>
              <div>
                <dt>Certification</dt>
                <dd>{product.stoneDetails.certification}</dd>
              </div>
            </dl>
            <p className="small muted">{gem.gemmology.treatments}</p>
          </div>
          <div>
            <p className="label">What tradition holds</p>
            <p className="h3">
              {gem.name}, {gem.epithet.toLowerCase()}.
            </p>
            <p className="body">Traditionally associated with {gem.traditionalAssociations.join(', ').toLowerCase()}.</p>
            <p className="body">{gem.traditionNote}</p>
            <TransitionLink href={`/gemstones/${gem.slug}`} className="link">
              More about {gem.name}
            </TransitionLink>
          </div>
        </section>

        <section className="grid" aria-label="Details">
          <div className={styles.accordion}>
            <details open>
              <summary>Craftsmanship</summary>
              <div className="body">
                The setting is formed by hand around this stone, burnished over its edge and finished in stages to a mirror polish. Inside the band: the house mark and the purity of the gold, alongside its BIS hallmark.
              </div>
            </details>
            <details>
              <summary>Certification</summary>
              <div className="body">
                Your stone is accompanied by an independent gemmological laboratory report stating species, whether it is natural, its weight and measurements, and any treatment. You receive the report number before the stone is set, so you can verify it with the laboratory.
              </div>
            </details>
            <details>
              <summary>Shipping</summary>
              <div className="body">
                Made to order in 3–4 weeks. Delivered fully insured across India, signature required. International delivery on request. <TransitionLink href="/shipping">Shipping details</TransitionLink>
              </div>
            </details>
            <details>
              <summary>Care</summary>
              <div className="body">
                {gem.gemmology.hardness.startsWith('9') || gem.gemmology.hardness.startsWith('10') || gem.gemmology.hardness.startsWith('8')
                  ? 'A hard, durable stone. Clean in lukewarm water with mild soap and a soft brush; store separately so it cannot scratch softer pieces.'
                  : 'A softer stone. Put it on after perfume and cosmetics, wipe it with a soft dry cloth after wearing, and keep it away from acids and household cleaners.'}{' '}
                <TransitionLink href="/care">Care guide</TransitionLink>
              </div>
            </details>
          </div>
          <p className={styles.disclaimer} style={{ gridColumn: '1 / -1', marginTop: 32 }}>
            Gemstone associations shown here reflect traditional astrological practices and are not scientific or medical claims.
          </p>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="related-title">
            <h2 id="related-title" className="h2" style={{ marginBottom: 48 }}>
              Also in the house
            </h2>
            <ul className={styles.related}>
              {related.map((p) => {
                return (
                  <li key={p.slug}>
                    <TransitionLink href={`/products/${p.slug}`} data-cursor="view">
                      <div className={styles.img}>
                        <ProductImage product={p} sizes="(max-width: 1000px) 100vw, 33vw" />
                      </div>
                      <span className="micro muted">{p.subtitle}</span>
                      <span className="h3">{p.name}</span>
                    </TransitionLink>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
      <StickyBuy within={articleRef} target={buyRef} name={product.name} price={formatPrice(product.price)} onAdd={addToBag} />
    </article>
  );
}
