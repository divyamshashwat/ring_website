'use client';

import { useEffect, useState, type RefObject } from 'react';
import { TransitionLink } from '@/components/layout/PageTransition';
import styles from './StickyBuy.module.css';

interface StickyBuyProps {
  /** the bar is offered only while this area is on screen */
  within: RefObject<HTMLElement | null>;
  /** …and while the page's own buy block is not */
  target: RefObject<HTMLElement | null>;
  name: string;
  price: string;
  onAdd?: () => void;
  /** a link instead of a button (e.g. to checkout) */
  href?: string;
  action?: string;
}

/** Phones: keeps the price and "Add to bag" within thumb reach while choosing. */
export default function StickyBuy({ within, target, name, price, onAdd, href, action = 'Add to bag' }: StickyBuyProps) {
  const [inside, setInside] = useState(false);
  const [targetShown, setTargetShown] = useState(false);

  useEffect(() => {
    const area = within.current;
    const own = target.current;
    if (!area || !own) return;
    const a = new IntersectionObserver(([e]) => setInside(e.isIntersecting), { rootMargin: '-30% 0px -30% 0px' });
    // any part of the page's own button in view (above the bar's own strip) hides the bar
    const t = new IntersectionObserver(([e]) => setTargetShown(e.isIntersecting), { rootMargin: '0px 0px -76px 0px' });
    a.observe(area);
    t.observe(own);
    return () => {
      a.disconnect();
      t.disconnect();
    };
  }, [within, target]);

  const shown = inside && !targetShown;
  return (
    <div className={styles.bar} data-shown={shown} aria-hidden={!shown}>
      <div className={styles.meta}>
        <span className={styles.name}>{name}</span>
        <strong className={styles.price}>{price}</strong>
      </div>
      {href ? (
        <TransitionLink href={href} className="btn btn--solid" tabIndex={shown ? 0 : -1}>
          {action}
        </TransitionLink>
      ) : (
        <button type="button" className="btn btn--solid" onClick={onAdd} tabIndex={shown ? 0 : -1}>
          {action}
        </button>
      )}
    </div>
  );
}
