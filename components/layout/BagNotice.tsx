'use client';

import { useEffect } from 'react';
import { formatPrice } from '@/lib/data/pricing';
import { useBag } from '@/lib/store/bag';
import { TransitionLink } from './PageTransition';

/** A quiet confirmation after adding to bag – no modal, no confetti. */
export default function BagNotice() {
  const lastAdded = useBag((s) => s.lastAdded);
  const item = useBag((s) => s.items.find((i) => i.key === s.lastAdded));
  const dismiss = useBag((s) => s.dismissAdded);

  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(dismiss, 6000);
    return () => clearTimeout(t);
  }, [lastAdded, dismiss]);

  if (!item) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 'var(--margin)',
        top: 'calc(var(--header-h) + 12px)',
        zIndex: 600,
        width: 'min(360px, calc(100vw - 2 * var(--margin)))',
        background: 'var(--porcelain)',
        border: '1px solid var(--hairline)',
        padding: '22px 24px',
        display: 'grid',
        gap: 14,
        animation: 'drop 0.8s var(--ease) both',
      }}
    >
      <p className="eyebrow">Added to your bag</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span className="h3" style={{ fontSize: '1.4rem' }}>
          {item.name}
        </span>
        <span className="small">{formatPrice(item.price)}</span>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <TransitionLink href="/bag" className="link" onClick={dismiss}>
          View bag
        </TransitionLink>
        <button type="button" className="link link--quiet" onClick={dismiss}>
          Continue
        </button>
      </div>
      <style>{`@keyframes drop { from { opacity: 0; transform: translateY(-10px); } }`}</style>
    </div>
  );
}
