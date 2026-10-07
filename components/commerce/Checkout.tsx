'use client';

import { useState } from 'react';
import { TransitionLink } from '@/components/layout/PageTransition';
import { configurationName } from '@/components/configurator/Configurator';
import { formatPrice } from '@/lib/data/pricing';
import { bagTotal, useBag } from '@/lib/store/bag';
import { lineDescription } from './BagView';
import styles from './commerce.module.css';
import { useMounted } from './useMounted';

/**
 * Deliberately simple checkout: who you are, where it goes, review. Because
 * every piece is made to order around a specific stone, the order is placed
 * first and payment is collected by secure link once the stone is confirmed.
 */
export default function Checkout() {
  const mounted = useMounted();
  const items = useBag((s) => s.items);
  const clear = useBag((s) => s.clear);
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', postcode: '', country: 'India' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!mounted) return <div style={{ minHeight: '40vh' }} />;
  if (state === 'done') {
    return (
      <div className={styles.done} role="status">
        <p className="eyebrow">Order received</p>
        <p className="h2">Thank you, {form.name.split(' ')[0]}.</p>
        <p className="body">
          Your order number is <strong>{orderId}</strong>. A gemmologist will contact you at {form.email} within one working day to confirm your stone and share its laboratory report, followed by a secure payment link.
        </p>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <TransitionLink href="/track-order" className="link">
            Track your order
          </TransitionLink>
          <TransitionLink href="/" className="link link--quiet">
            Return home
          </TransitionLink>
        </div>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p className="lead">There is nothing to check out yet.</p>
        <TransitionLink href="/collections" className="btn btn--solid">
          Discover the collection
        </TransitionLink>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          shipping: { address: form.address, city: form.city, postcode: form.postcode, country: form.country },
          lines: items.map((i) => ({ productSlug: i.productSlug, configuration: i.configuration, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong.');
      setOrderId(data.order.id);
      clear();
      setState('done');
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setState('idle');
    }
  };

  const total = bagTotal(items);
  return (
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={submit} noValidate>
        <fieldset className={styles.fieldset}>
          <legend className="eyebrow">01 · Contact</legend>
          <div className="field">
            <label htmlFor="co-name">Full name</label>
            <input id="co-name" autoComplete="name" required value={form.name} onChange={set('name')} />
          </div>
          <div className={styles.two}>
            <div className="field">
              <label htmlFor="co-email">Email</label>
              <input id="co-email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
            </div>
            <div className="field">
              <label htmlFor="co-phone">Phone (optional)</label>
              <input id="co-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend className="eyebrow">02 · Delivery</legend>
          <div className="field">
            <label htmlFor="co-address">Address</label>
            <input id="co-address" autoComplete="street-address" required value={form.address} onChange={set('address')} />
          </div>
          <div className={styles.two}>
            <div className="field">
              <label htmlFor="co-city">City</label>
              <input id="co-city" autoComplete="address-level2" required value={form.city} onChange={set('city')} />
            </div>
            <div className="field">
              <label htmlFor="co-postcode">PIN code</label>
              <input id="co-postcode" autoComplete="postal-code" inputMode="numeric" required value={form.postcode} onChange={set('postcode')} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="co-country">Country</label>
            <input id="co-country" autoComplete="country-name" required value={form.country} onChange={set('country')} />
          </div>
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend className="eyebrow">03 · Payment</legend>
          <p className="body small">
            Once a gemmologist has confirmed your stone and shared its report, we send a secure payment link (cards, UPI, net banking) through an RBI-regulated payment gateway. Nothing is charged today.
          </p>
        </fieldset>
        {error && (
          <p className={`${styles.error} small`} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--solid" disabled={state === 'sending'}>
          {state === 'sending' ? 'Placing order…' : 'Place order'}
        </button>
      </form>
      <aside className={styles.summary} aria-label="Order summary">
        <p className="eyebrow">Your order</p>
        {items.map((i) => (
          <div key={i.key} className={styles.row} style={{ alignItems: 'baseline' }}>
            <span>
              {i.name || configurationName(i.configuration)} {i.quantity > 1 ? `× ${i.quantity}` : ''}
              <span className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>
                {lineDescription(i)}
              </span>
            </span>
            <span>{formatPrice(i.price * i.quantity)}</span>
          </div>
        ))}
        <div className={styles.total}>
          <span className="eyebrow">Total</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <p className="small muted">Including GST and insured delivery. Each stone is accompanied by an independent laboratory report.</p>
      </aside>
    </div>
  );
}
