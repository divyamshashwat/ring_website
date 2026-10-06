'use client';

import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TransitionLink } from '@/components/layout/PageTransition';
import { MaskedLines } from '@/components/ui/Reveal';
import { findStone, isValidDate, type FinderResult } from '@/lib/astro/finder';
import { INTENTIONS } from '@/lib/data/options';
import { caratsFor } from '@/lib/data/pricing';
import { products } from '@/lib/data/products';
import type { Intention } from '@/lib/data/types';
import type { JewelleryType } from '@/lib/3d/geometry/jewellery';
import { prefersReducedMotion } from '@/lib/motion';
import { configToSearch, DEFAULT_CONFIGURATION } from '@/lib/store/configurator';
import styles from './Finder.module.css';

const GemstoneViewer = dynamic(() => import('@/components/3d/GemstoneViewer'), { ssr: false });

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const FORMS: { id: JewelleryType; label: string; line: string }[] = [
  { id: 'ring', label: 'A ring', line: 'The traditional way to wear a planetary stone' },
  { id: 'pendant', label: 'A pendant', line: 'Worn close to the heart' },
  { id: 'bracelet', label: 'A bracelet', line: 'An open kada, around the wrist' },
];

type Step = 0 | 1 | 2 | 3;

export default function FindYourStone({ headingLevel = 'h2', eyebrow = '03 — Find your stone' }: { headingLevel?: 'h1' | 'h2'; eyebrow?: string }) {
  const [step, setStep] = useState<Step>(0);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState<JewelleryType | null>(null);
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [result, setResult] = useState<FinderResult | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);

  // step transitions: the old answer rises away, the new question settles in
  const go = (next: Step) => {
    const el = wrap.current;
    if (!el || prefersReducedMotion()) {
      setStep(next);
      return;
    }
    gsap.to(el, {
      opacity: 0,
      y: -24,
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => {
        setStep(next);
        requestAnimationFrame(() => {
          gsap.fromTo(el, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out' });
          el.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true });
        });
      },
    });
  };

  useEffect(() => {
    if (step === 3) root.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }, [step]);

  const submitDate = () => {
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);
    if (!isValidDate(d, m, y)) {
      setError('Please enter a complete, valid date of birth.');
      return;
    }
    setError('');
    go(1);
  };

  const reveal = () => {
    setResult(findStone({ day: Number(day), month: Number(month), year: Number(year), intentions }));
    go(3);
  };

  const suggested = useMemo(() => {
    if (!result) return null;
    const t = form ?? 'ring';
    return products.find((p) => p.gemstone === result.primary.slug && p.type === t) ?? products.find((p) => p.gemstone === result.primary.slug) ?? null;
  }, [result, form]);

  const configureHref = useMemo(() => {
    if (!result) return '/configure';
    const t = form ?? 'ring';
    const qs = configToSearch({ ...DEFAULT_CONFIGURATION, type: t, stone: result.primary.slug, metal: 'yellow-gold', purity: '22k' });
    return `/configure${qs ? `?${qs}` : ''}`;
  }, [result, form]);

  const Heading = headingLevel;

  return (
    <section ref={root} className={styles.finder} aria-labelledby="finder-title" id="find-your-stone">
      <div className="container">
        <div className={styles.top}>
          <p className="eyebrow">{eyebrow}</p>
          <div className={styles.steps} aria-label={`Step ${step + 1} of 4`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} data-done={i <= step} />
            ))}
          </div>
        </div>

        {step === 0 && (
          <Heading id="finder-title" className="visually-hidden">
            Which stone is yours?
          </Heading>
        )}

        <div ref={wrap} className={styles.stepWrap}>
          {step === 0 && (
            <div className={styles.step}>
              <div className={styles.question}>
                <MaskedLines as="p" className="display" lines={['Which stone', <em key="i">is yours?</em>]} />
                <p className="body" style={{ marginTop: 28 }}>
                  A first indication, drawn from the traditional Vedic association between your Sun sign and its ruling planet. A full reading takes your birth time and place into account — we offer that in consultation.
                </p>
              </div>
              <form
                className={styles.answer}
                onSubmit={(e) => {
                  e.preventDefault();
                  submitDate();
                }}
              >
                <p className="h3" style={{ marginBottom: 32 }}>
                  <span className="muted">01</span>&nbsp;&nbsp;What were you born under?
                </p>
                <div className={styles.dob}>
                  <div className="field">
                    <label htmlFor="dob-day">Day</label>
                    <input id="dob-day" data-autofocus inputMode="numeric" autoComplete="bday-day" placeholder="DD" maxLength={2} value={day} onChange={(e) => setDay(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div className="field">
                    <label htmlFor="dob-month">Month</label>
                    <select id="dob-month" autoComplete="bday-month" value={month} onChange={(e) => setMonth(e.target.value)}>
                      <option value="">Month</option>
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="dob-year">Year</label>
                    <input id="dob-year" inputMode="numeric" autoComplete="bday-year" placeholder="YYYY" maxLength={4} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>
                {error && (
                  <p className={`${styles.error} small`} role="alert">
                    {error}
                  </p>
                )}
                <div className={styles.actions}>
                  <button type="submit" className="btn btn--solid">
                    Continue
                  </button>
                  <p className="micro muted">Your date of birth stays in your browser.</p>
                </div>
              </form>
            </div>
          )}

          {step === 1 && (
            <div className={styles.step}>
              <div className={styles.question}>
                <span className={`${styles.number} eyebrow`}>02 / 04</span>
                <h3 className="h1">Tell us your preference.</h3>
              </div>
              <div className={styles.answer} role="radiogroup" aria-label="Form of jewellery">
                <div className={styles.choices}>
                  {FORMS.map((f, i) => (
                    <button
                      key={f.id}
                      type="button"
                      role="radio"
                      aria-checked={form === f.id}
                      className={styles.choice}
                      data-autofocus={i === 0 ? '' : undefined}
                      onClick={() => {
                        setForm(f.id);
                        setTimeout(() => go(2), 380);
                      }}
                    >
                      <span className="micro muted">{String(i + 1).padStart(2, '0')}</span>
                      <span>
                        <strong>{f.label}</strong>
                        <span className="small muted" style={{ display: 'block', marginTop: 6 }}>
                          {f.line}
                        </span>
                      </span>
                      <span className={styles.mark} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <div className={styles.actions}>
                  <button type="button" className="link link--quiet" onClick={() => go(0)}>
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.step}>
              <div className={styles.question}>
                <span className={`${styles.number} eyebrow`}>03 / 04</span>
                <h3 className="h1">Your intention.</h3>
                <p className="body" style={{ marginTop: 24 }}>
                  Choose up to two. These are the qualities tradition associates with each stone — a way of choosing, not a promise of outcome.
                </p>
              </div>
              <div className={styles.answer}>
                <div className={styles.intentions}>
                  {INTENTIONS.map((it, i) => {
                    const on = intentions.includes(it.id);
                    return (
                      <button
                        key={it.id}
                        type="button"
                        aria-pressed={on}
                        className={styles.intention}
                        data-autofocus={i === 0 ? '' : undefined}
                        onClick={() => setIntentions((cur) => (on ? cur.filter((c) => c !== it.id) : [...cur, it.id].slice(-2)))}
                      >
                        <strong>{it.label}</strong>
                        <span className="small muted">{it.line}</span>
                      </button>
                    );
                  })}
                </div>
                <div className={styles.actions}>
                  <button type="button" className="btn btn--solid" onClick={reveal}>
                    Reveal my stone
                  </button>
                  <button type="button" className="link link--quiet" onClick={() => go(1)}>
                    Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && result && (
            <div className={styles.result}>
              <div className={styles.resultStone}>
                <GemstoneViewer slug={result.primary.slug} label={`${result.primary.englishName}, interactive 3D gemstone`} />
              </div>
              <div className={styles.resultText}>
                <p className="eyebrow">Your stone</p>
                <div>
                  <h3 className={styles.resultName}>{result.primary.name}</h3>
                  <p className="h3 italic" style={{ marginTop: 10 }}>
                    {result.primary.englishName}
                  </p>
                </div>
                <p className="lead">Traditionally associated with {result.primary.planet.name} ({result.primary.planet.vedic}).</p>
                <div className={`${styles.reasoning} small muted`}>
                  {result.reasoning.map((r) => (
                    <p key={r}>{r}</p>
                  ))}
                </div>
                <dl className={styles.facts}>
                  <div>
                    <dt>Suggested</dt>
                    <dd>{suggested ? <TransitionLink href={`/products/${suggested.slug}`}>{suggested.name}</TransitionLink> : 'Made to order'}</dd>
                  </div>
                  <div>
                    <dt>Available weights</dt>
                    <dd>
                      approx. {caratsFor(result.primary, 'small').toFixed(1)} · {caratsFor(result.primary, 'medium').toFixed(1)} · {caratsFor(result.primary, 'large').toFixed(1)} ct, or to your specification
                    </dd>
                  </div>
                  <div>
                    <dt>Certification</dt>
                    <dd>Independent laboratory report with every stone</dd>
                  </div>
                  <div>
                    <dt>Craftsmanship</dt>
                    <dd>Hand-finished bezel setting in 18K or 22K gold</dd>
                  </div>
                  {result.companion && (
                    <div>
                      <dt>Also traditional</dt>
                      <dd>
                        <TransitionLink href={`/gemstones/${result.companion.slug}`} stoneColor={result.companion.swatch}>
                          {result.companion.name} · {result.companion.englishName}
                        </TransitionLink>
                      </dd>
                    </div>
                  )}
                </dl>
                <div className={styles.actions} style={{ marginTop: 8 }}>
                  <TransitionLink href={configureHref} className="btn btn--solid" stoneColor={result.primary.swatch}>
                    Explore your {form ?? 'ring'}
                  </TransitionLink>
                  <TransitionLink href="/consultation" className="link">
                    Book a full reading
                  </TransitionLink>
                  <button
                    type="button"
                    className="link link--quiet"
                    onClick={() => {
                      setIntentions([]);
                      setForm(null);
                      go(0);
                    }}
                  >
                    Start again
                  </button>
                </div>
                <p className={styles.disclaimer}>Gemstone associations shown here reflect traditional astrological practices and are not scientific or medical claims.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
