import type { Metadata } from 'next';
import InfoPage from '@/components/ui/InfoPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'Shipping', description: 'Made-to-order timelines and fully insured delivery.', path: '/shipping' });

export default function ShippingPage() {
  return (
    <InfoPage
      eyebrow="Client care"
      title={['Shipping.']}
      lead="Every piece is made to order and delivered fully insured."
      sections={[
        { id: 'timeline', heading: 'Made to order', body: <p>Pieces are made in three to four weeks from the day your stone is confirmed. Custom stone specifications can take longer; we will tell you before you pay.</p> },
        { id: 'india', heading: 'Delivery in India', body: <p>Complimentary, fully insured delivery to most PIN codes, by secure courier. A signature and photo identification are required on delivery.</p> },
        { id: 'international', heading: 'International', body: <p>International delivery is available on request. Duties and import taxes are payable by the recipient and are shown before payment.</p> },
        { id: 'packaging', heading: 'What arrives', body: <p>Your piece, its independent laboratory report, the house certificate recording stone and metal weights, and care notes written for your stone.</p> },
      ]}
    />
  );
}
