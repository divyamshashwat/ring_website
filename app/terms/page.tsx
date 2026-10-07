import type { Metadata } from 'next';
import InfoPage from '@/components/ui/InfoPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'Terms', description: 'Terms of sale and use.', path: '/terms' });

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title={['Terms.']}
      lead="Draft for review by counsel before launch."
      sections={[
        { id: 'pieces', heading: 'Our pieces', body: <p>Every stone is natural unless stated otherwise and is described exactly as its independent laboratory report describes it. Natural stones vary; weights and dimensions shown before a stone is selected are indicative.</p> },
        { id: 'prices', heading: 'Prices', body: <p>Prices are in Indian rupees and include GST. Prices for configured and made-to-order pieces are indicative until your stone is confirmed.</p> },
        { id: 'tradition', heading: 'Traditional associations', body: <p>Associations between gemstones, planets and qualities reflect traditional astrological practice. They are not scientific, medical, financial or other claims, and no outcome is promised.</p> },
        { id: 'orders', heading: 'Orders', body: <p>An order is accepted when we confirm your stone and you complete payment through the secure link we send.</p> },
      ]}
    />
  );
}
