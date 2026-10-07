'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { TransitionLink } from '@/components/layout/PageTransition';
import { gemstoneBySlug, gemstones, NAVRATNA_ORDER } from '@/lib/data/gemstones';
import { METAL_OPTIONS, PURITY_OPTIONS, purityAvailable, RING_SIZES, STONE_SIZE_OPTIONS, STYLE_OPTIONS } from '@/lib/data/options';
import { caratsFor, estimatePrice, formatPrice } from '@/lib/data/pricing';
import type { Configuration, MetalId } from '@/lib/data/types';
import { useBag } from '@/lib/store/bag';
import { configToSearch, useConfigurator } from '@/lib/store/configurator';
import styles from './Configurator.module.css';

const ConfiguratorScene = dynamic(() => import('./ConfiguratorScene'), { ssr: false });

const METAL_SWATCH: Record<MetalId, string> = {
  'yellow-gold': 'linear-gradient(135deg, #f7dc8c, #c99a3b 55%, #8a6420)',
  'rose-gold': 'linear-gradient(135deg, #f6cdb8, #c98b6d 55%, #8d5a44)',
  'white-gold': 'linear-gradient(135deg, #f4f3ef, #c9c7c0 55%, #8d8b85)',
};

const TYPES: { id: Configuration['type']; label: string }[] = [
  { id: 'ring', label: 'Ring' },
  { id: 'pendant', label: 'Pendant' },
  { id: 'bracelet', label: 'Kada' },
];

type Tab = 'stone' | 'metal' | 'size' | 'style';

const ordered = [...NAVRATNA_ORDER.map((s) => gemstones.find((g) => g.slug === s)!), ...gemstones.filter((g) => g.group === 'uparatna')];

export const configurationName = (c: Configuration) => {
  const gem = gemstoneBySlug(c.stone)!;
  const type = c.type === 'bracelet' ? 'Kada' : c.type === 'pendant' ? 'Pendant' : 'Ring';
  return `${gem.name} ${type}`;
};

/**
 * The configurator: every choice changes the actual 3D object — geometry,
 * physically based metal, gemstone material — through animated transitions.
 * State lives in a store and is mirrored to the URL so a configuration can be shared.
 */
export default function Configurator({ initial, syncUrl = false, headingLevel = 'h2' }: { initial?: Configuration; syncUrl?: boolean; headingLevel?: 'h1' | 'h2' }) {
  const config = useConfigurator((s) => s.config);
  const set = useConfigurator((s) => s.set);
  const replace = useConfigurator((s) => s.replace);
  const add = useBag((s) => s.add);
  const [tab, setTab] = useState<Tab>('stone');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initial) replace(initial);
    // only on mount: the store owns the configuration afterwards
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!syncUrl) return;
    const qs = configToSearch(config);
    window.history.replaceState(window.history.state, '', `/configure${qs ? `?${qs}` : ''}`);
  }, [config, syncUrl]);

  const gem = gemstoneBySlug(config.stone)!;
  const price = useMemo(() => estimatePrice(config), [config]);
  const carats = caratsFor(gem, config.stoneSize, config.customCarats);
  const name = configurationName(config);
  const style = STYLE_OPTIONS.find((s) => s.id === config.style)!;
  const Heading = headingLevel;

  const share = async () => {
    const qs = configToSearch(config);
    const url = `${window.location.origin}/configure${qs ? `?${qs}` : ''}`;
    try {
      if (navigator.share) await navigator.share({ title: `${name} — VYOMA`, url });
      else await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {}
  };

  const group = (id: Tab | null) => ({ 'data-tab': id ?? undefined, 'data-open': id === null || tab === id ? 'true' : 'false' });

  return (
    <section className={styles.root} aria-labelledby="configurator-title">
      <div className={styles.stage}>
        <div className={styles.stageMeta} aria-hidden="true">
          <span className={styles.stageName}>{name}</span>
          <span className="small muted">
            {gem.englishName} · {config.purity.toUpperCase()} {METAL_OPTIONS.find((m) => m.id === config.metal)!.label.toLowerCase()} · {style.label}
          </span>
        </div>
        <div className={styles.stageInner}>
          <ConfiguratorScene config={config} label={`${name} in ${config.purity.toUpperCase()} ${config.metal.replace('-', ' ')}, interactive 3D model`} />
        </div>
      </div>

      <div className={styles.panel}>
        <Heading id="configurator-title" className="visually-hidden">
          Configure your {name}
        </Heading>

        <div className={styles.tabs} role="tablist" aria-label="Configuration">
          {(['stone', 'metal', 'size', 'style'] as Tab[]).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className={styles.group} {...group(null)}>
          <div className={styles.groupHead}>
            <span className="label">Piece</span>
          </div>
          <div className={styles.row} role="radiogroup" aria-label="Type of piece">
            {TYPES.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={config.type === t.id} className={styles.opt} onClick={() => set('type', t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.group} {...group('stone')}>
          <div className={styles.groupHead}>
            <span className="label">Stone</span>
            <span className={styles.value}>
              {gem.name} · {gem.englishName}
            </span>
          </div>
          <div className={styles.stones} role="radiogroup" aria-label="Gemstone">
            <span className={`${styles.subhead} small muted`}>Navratna</span>
            {ordered.map((g, i) => (
              <FragmentWithDivider key={g.slug} divider={i === 9}>
                <button type="button" role="radio" aria-checked={config.stone === g.slug} className={styles.stoneBtn} onClick={() => set('stone', g.slug)}>
                  <span className={styles.sw} style={{ ['--sw' as string]: g.swatch }} aria-hidden="true" />
                  <span>
                    {g.name}
                    <small>{g.englishName}</small>
                  </span>
                </button>
              </FragmentWithDivider>
            ))}
          </div>
          <p className={styles.note}>
            {gem.group === 'navratna' ? 'Navratna' : 'Uparatna'} · traditionally associated with {gem.planet.name}. {gem.cutLabel}.
          </p>
        </div>

        <div className={styles.group} {...group('metal')}>
          <div className={styles.groupHead}>
            <span className="label">Metal</span>
            <span className={styles.value}>{METAL_OPTIONS.find((m) => m.id === config.metal)!.label}</span>
          </div>
          <div className={styles.row} role="radiogroup" aria-label="Metal">
            {METAL_OPTIONS.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={config.metal === m.id} className={styles.opt} onClick={() => set('metal', m.id)}>
                <span className={styles.metalSw} style={{ background: METAL_SWATCH[m.id] }} aria-hidden="true" />
                {m.label}
              </button>
            ))}
          </div>
          <div className={styles.groupHead} style={{ marginTop: 22 }}>
            <span className="label">Purity</span>
          </div>
          <div className={styles.row} role="radiogroup" aria-label="Gold purity">
            {PURITY_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={config.purity === p.id}
                className={styles.opt}
                disabled={!purityAvailable(config.metal, p.id)}
                onClick={() => set('purity', p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className={styles.note}>{PURITY_OPTIONS.find((p) => p.id === config.purity)!.note}</p>
        </div>

        <div className={styles.group} {...group('size')}>
          <div className={styles.groupHead}>
            <span className="label">Stone size</span>
            <span className={styles.value}>approx. {carats.toFixed(2)} ct</span>
          </div>
          <div className={styles.row} role="radiogroup" aria-label="Stone size">
            {STONE_SIZE_OPTIONS.map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={config.stoneSize === o.id} className={styles.opt} onClick={() => set('stoneSize', o.id)}>
                {o.label}
              </button>
            ))}
          </div>
          {config.stoneSize === 'custom' && (
            <div className={`field ${styles.carats}`}>
              <label htmlFor="carats">Target weight (ct)</label>
              <input
                id="carats"
                type="number"
                min={1}
                max={20}
                step={0.25}
                value={config.customCarats ?? caratsFor(gem, 'medium')}
                onChange={(e) => set('customCarats', Math.max(0.5, Math.min(20, Number(e.target.value) || 1)))}
              />
            </div>
          )}
          <p className={styles.note}>
            {config.stoneSize === 'custom' ? 'Our gemmologist sources a stone to your specification and shares its report before setting.' : 'Weights are indicative; every stone is individual.'}
          </p>

          {config.type === 'ring' && (
            <>
              <div className={styles.groupHead} style={{ marginTop: 22 }}>
                <span className="label">Ring size</span>
                <TransitionLink href="/care#sizing" className="micro muted">
                  Size guide
                </TransitionLink>
              </div>
              <div className={styles.sizes} role="radiogroup" aria-label="Ring size">
                {RING_SIZES.map((r) => (
                  <button key={r.us} type="button" role="radio" aria-checked={config.size === r.us} className={styles.opt} onClick={() => set('size', r.us)}>
                    US {r.us}
                    <small>IN {r.india}</small>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className={styles.group} {...group('style')}>
          <div className={styles.groupHead}>
            <span className="label">Style</span>
            <span className={styles.value}>{style.label}</span>
          </div>
          <div className={styles.row} role="radiogroup" aria-label="Style">
            {STYLE_OPTIONS.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={config.style === s.id} className={styles.opt} onClick={() => set('style', s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <p className={styles.note}>{style.note}</p>
        </div>

        <div className={styles.group} {...group(null)}>
          <div className={styles.groupHead}>
            <span className="label">Certification</span>
          </div>
          <p className="small" style={{ color: 'var(--ink-soft)', fontWeight: 300 }}>
            Every stone is accompanied by an independent gemmological laboratory report stating species, weight, measurements and any treatment.
          </p>
        </div>

        <div className={styles.summary}>
          <div className={styles.price}>
            <span className="label">Indicative price</span>
            <strong>{formatPrice(price)}</strong>
          </div>
          <button type="button" className="btn btn--solid btn--block" onClick={() => add({ name, configuration: { ...config }, price })}>
            Add to bag
          </button>
          <div className={styles.secondary}>
            <TransitionLink href="/consultation" className="link">
              Book a consultation
            </TransitionLink>
            <button type="button" className="link link--quiet" onClick={share}>
              {copied ? 'Link copied' : 'Share this piece'}
            </button>
          </div>
          <p className={styles.note}>Final price is confirmed once your stone is selected. Made to order in 3–4 weeks.</p>
        </div>
      </div>
    </section>
  );
}

function FragmentWithDivider({ divider, children }: { divider: boolean; children: React.ReactNode }) {
  return (
    <>
      {divider && <span className={`${styles.subhead} small muted`}>Uparatna</span>}
      {children}
    </>
  );
}
