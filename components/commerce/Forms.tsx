'use client';

import { useState } from 'react';
import { TransitionLink } from '@/components/layout/PageTransition';
import { WHATSAPP_URL } from '@/components/layout/navigation';
import styles from './commerce.module.css';

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.');
  return data;
}

const MODES = [
  { id: 'video', label: 'Video call' },
  { id: 'boutique', label: 'At the atelier' },
  { id: 'phone', label: 'Telephone' },
] as const;

export function ConsultationForm() {
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('video');
  const [form, setForm] = useState({ name: '', email: '', phone: '', preferredDate: '', birthDetails: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (state === 'done') {
    return (
      <div className={styles.done} role="status">
        <p className="label">Request received</p>
        <p className="h2">We will be in touch within one working day.</p>
        <p className="body">A member of the atelier will write to {form.email} to confirm a time.</p>
      </div>
    );
  }
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setState('sending');
        setError('');
        try {
          await post('/api/consultations', { ...form, mode });
          setState('done');
        } catch (err) {
          setError((err as Error).message);
          setState('idle');
        }
      }}
    >
      <fieldset className={styles.fieldset}>
        <legend className="label">How would you like to meet?</legend>
        <div className={styles.options} role="radiogroup" aria-label="Consultation format">
          {MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className={styles.option} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className={styles.two}>
        <div className="field">
          <label htmlFor="cs-name">Name</label>
          <input id="cs-name" autoComplete="name" value={form.name} onChange={set('name')} />
        </div>
        <div className="field">
          <label htmlFor="cs-email">Email</label>
          <input id="cs-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
        </div>
      </div>
      <div className={styles.two}>
        <div className="field">
          <label htmlFor="cs-phone">Phone (optional)</label>
          <input id="cs-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="field">
          <label htmlFor="cs-date">Preferred date (optional)</label>
          <input id="cs-date" type="date" value={form.preferredDate} onChange={set('preferredDate')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="cs-birth">Birth date, time and place (optional, for a reading)</label>
        <input id="cs-birth" value={form.birthDetails} onChange={set('birthDetails')} placeholder="e.g. 14 April 1990, 06:20, Jaipur" />
      </div>
      <div className="field">
        <label htmlFor="cs-message">What would you like to discuss?</label>
        <textarea id="cs-message" value={form.message} onChange={set('message')} />
      </div>
      {error && (
        <p className={`${styles.error} small`} role="alert">
          {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn--solid" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Request a consultation'}
        </button>
        <a href={WHATSAPP_URL} className="link link--quiet" target="_blank" rel="noreferrer">
          Or message us on WhatsApp
        </a>
      </div>
    </form>
  );
}

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  if (state === 'done') {
    return (
      <div className={styles.done} role="status">
        <p className="h2">Thank you. We will reply within one working day.</p>
      </div>
    );
  }
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setState('sending');
        setError('');
        try {
          await post('/api/contact', form);
          setState('done');
        } catch (err) {
          setError((err as Error).message);
          setState('idle');
        }
      }}
    >
      <div className={styles.two}>
        <div className="field">
          <label htmlFor="ct-name">Name</label>
          <input id="ct-name" autoComplete="name" value={form.name} onChange={set('name')} />
        </div>
        <div className="field">
          <label htmlFor="ct-email">Email</label>
          <input id="ct-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="ct-message">Message</label>
        <textarea id="ct-message" value={form.message} onChange={set('message')} />
      </div>
      {error && (
        <p className={`${styles.error} small`} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--solid" disabled={state === 'sending'} style={{ justifySelf: 'start' }}>
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}

const STATUS: Record<string, string> = {
  received: 'Order received — a gemmologist will contact you shortly.',
  'stone-selected': 'Your stone has been selected and sent for certification.',
  'in-workshop': 'Your piece is being made in the workshop.',
  certified: 'Finished, certified and being prepared for dispatch.',
  dispatched: 'Dispatched — insured and tracked.',
  delivered: 'Delivered.',
};

export function TrackOrderForm() {
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<{ id: string; status: string; createdAt: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 48 }}>
      <form
        className={styles.form}
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          setResult(null);
          try {
            const res = await fetch(`/api/orders/${encodeURIComponent(id.trim())}?email=${encodeURIComponent(email.trim())}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'We could not find that order.');
            setResult(data.order);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className={styles.two}>
          <div className="field">
            <label htmlFor="tr-id">Order number</label>
            <input id="tr-id" value={id} onChange={(e) => setId(e.target.value)} placeholder="VY-…" />
          </div>
          <div className="field">
            <label htmlFor="tr-email">Email</label>
            <input id="tr-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        {error && (
          <p className={`${styles.error} small`} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--solid" disabled={busy} style={{ justifySelf: 'start' }}>
          {busy ? 'Looking…' : 'Track order'}
        </button>
      </form>
      {result && (
        <div className={styles.done} role="status">
          <p className="label">Order {result.id}</p>
          <p className="h3">{STATUS[result.status] ?? result.status}</p>
          <p className="small muted">Placed {new Date(result.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      )}
      <p className="small muted">
        Need help? <TransitionLink href="/contact">Contact the atelier</TransitionLink>.
      </p>
    </div>
  );
}
