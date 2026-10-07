'use client';

import dynamic from 'next/dynamic';
import { TransitionLink } from '@/components/layout/PageTransition';
import ProductImage from '@/components/product/ProductImage';
import { MaskedLines, Reveal } from '@/components/ui/Reveal';
import { caratsFor } from '@/lib/data/pricing';
import type { Gemstone, Product } from '@/lib/data/types';
import { configToSearch, DEFAULT_CONFIGURATION } from '@/lib/store/configurator';
import styles from './GemstoneDetail.module.css';

const GemstoneViewer = dynamic(() => import('@/components/3d/GemstoneViewer'), { ssr: false });

export default function GemstoneDetail({ gem, pieces, prev, next }: { gem: Gemstone; pieces: Product[]; prev: Gemstone; next: Gemstone }) {
  const configure = `/configure?${configToSearch({ ...DEFAULT_CONFIGURATION, stone: gem.slug, purity: '18k' })}`;
  return (
    <article style={{ ['--sw' as string]: gem.swatch }}>
      <header className={styles.hero}>
        <div className="container">
          <p className="eyebrow" style={{ marginBottom: 24 }}>
            {gem.group === 'navratna' ? 'Navratna' : 'Uparatna'} · {gem.englishName}
          </p>
          <MaskedLines as="h1" className={styles.name} lines={[gem.name]} immediate delay={0.1} />
          <div className={styles.sub}>
            <span className={styles.epithet}>{gem.epithet}</span>
            <span className="micro muted">
              {gem.planet.name} · {gem.planet.vedic}
            </span>
          </div>
          <div className={styles.assoc}>
            <span className="eyebrow">Traditionally associated with</span>
            {gem.traditionalAssociations.map((a) => (
              <strong key={a}>{a}</strong>
            ))}
          </div>
        </div>
      </header>

      <section className="container" aria-labelledby="explore-title">
        <div className={styles.explore}>
          <div className={styles.viewer}>
            <GemstoneViewer slug={gem.slug} label={`${gem.englishName}, interactive 3D gemstone`} />
          </div>
          <div style={{ display: 'grid', gap: 24 }}>
            <p className="eyebrow" id="explore-title">
              Explore the stone
            </p>
            <p className="h2">{gem.description}</p>
            <p className="small muted">Drag to rotate. Pinch or scroll over the stone to look closer.</p>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 'clamp(90px, 11vw, 160px)' }} aria-label="Gemmology and tradition">
        <div className={`grid ${styles.split}`}>
          <Reveal>
            <p className="eyebrow">What gemmology verifies</p>
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
                <dt>Specific gravity</dt>
                <dd>{gem.gemmology.specificGravity.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Typical sources</dt>
                <dd>{gem.gemmology.typicalOrigins.join(' · ')}</dd>
              </div>
              <div>
                <dt>Treatments</dt>
                <dd>{gem.gemmology.treatments}</dd>
              </div>
              <div>
                <dt>Our cut</dt>
                <dd>
                  {gem.cutLabel}, approx. {caratsFor(gem, 'small').toFixed(1)} – {caratsFor(gem, 'large').toFixed(1)} ct
                </dd>
              </div>
            </dl>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="eyebrow">What tradition holds</p>
            <p className="h3">{gem.traditionNote}</p>
            <p className="body">
              These associations come from Jyotish, the Vedic astrological tradition. They are cultural beliefs, offered here as context for choosing a stone — not as claims of any effect.
            </p>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginTop: 8 }}>
              <TransitionLink href={configure} className="btn btn--solid" stoneColor={gem.swatch}>
                Create a piece with {gem.name}
              </TransitionLink>
              <TransitionLink href="/consultation" className="link" style={{ alignSelf: 'center' }}>
                Ask a gemmologist
              </TransitionLink>
            </div>
          </Reveal>
        </div>
      </section>

      {pieces.length > 0 && (
        <section className="container" style={{ paddingBottom: 'clamp(90px, 11vw, 160px)' }} aria-labelledby="pieces-title">
          <h2 id="pieces-title" className="h2" style={{ marginBottom: 40 }}>
            {gem.name} in the collection
          </h2>
          <ul className={styles.pieces}>
            {pieces.map((p) => (
              <li key={p.slug}>
                <TransitionLink href={`/products/${p.slug}`} stoneColor={gem.swatch} data-cursor="view">
                  <div className={styles.img}>
                    <ProductImage product={p} sizes="(max-width: 900px) 100vw, 33vw" />
                  </div>
                  <span className="micro muted">{p.type === 'bracelet' ? 'Kada' : p.type === 'pendant' ? 'Pendant' : 'Ring'}</span>
                  <span className="h3">{p.name}</span>
                </TransitionLink>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="container" style={{ paddingBottom: 'clamp(80px, 10vw, 140px)' }} aria-label="Other gemstones">
        <div className={styles.pager}>
          <TransitionLink href={`/gemstones/${prev.slug}`} stoneColor={prev.swatch}>
            <span className="micro muted">Previous</span>
            <span className="h3">{prev.name}</span>
          </TransitionLink>
          <TransitionLink href={`/gemstones/${next.slug}`} stoneColor={next.swatch} style={{ textAlign: 'right' }}>
            <span className="micro muted">Next</span>
            <span className="h3">{next.name}</span>
          </TransitionLink>
        </div>
        <p className="small muted" style={{ marginTop: 40, maxWidth: '46em' }}>
          Gemstone associations shown here reflect traditional astrological practices and are not scientific or medical claims.
        </p>
      </nav>
    </article>
  );
}
