import type { Metadata } from 'next';
import { TransitionLink } from '@/components/layout/PageTransition';
import PageIntro from '@/components/ui/PageIntro';

export const metadata: Metadata = { title: 'Account', robots: { index: false } };

const LINKS = [
  { href: '/track-order', title: 'Track an order', body: 'With your order number and email.' },
  { href: '/wishlist', title: 'Wishlist', body: 'Pieces you have saved on this device.' },
  { href: '/consultation', title: 'Consultations', body: 'Book or change an appointment.' },
  { href: '/care', title: 'Care and resizing', body: 'Looking after your piece.' },
];

export default function AccountPage() {
  return (
    <>
      <PageIntro
        eyebrow="Account"
        lines={['Your account.']}
        compact
        lead="Client accounts — order history, certificates and saved configurations in one place — open shortly. Until then, everything below is available without signing in."
      />
      <div className="container" style={{ paddingBottom: 'clamp(100px, 12vw, 180px)' }}>
        <ul style={{ borderTop: '1px solid var(--hairline-strong)' }}>
          {LINKS.map((l) => (
            <li key={l.href} style={{ borderBottom: '1px solid var(--hairline)' }}>
              <TransitionLink href={l.href} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, padding: '28px 0', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span className="h3">{l.title}</span>
                <span className="small muted">{l.body}</span>
              </TransitionLink>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
