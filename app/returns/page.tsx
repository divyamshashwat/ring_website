import type { Metadata } from 'next';
import InfoPage from '@/components/ui/InfoPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'Returns', description: 'Returns, exchanges and resizing.', path: '/returns' });

export default function ReturnsPage() {
  return (
    <InfoPage
      eyebrow="Client care"
      title={['Returns.']}
      sections={[
        { id: 'collection', heading: 'Pieces from the collection', body: <p>Unworn pieces from the collection may be returned within 15 days of delivery, with their report and certificate, for a full refund.</p> },
        { id: 'custom', heading: 'Made-to-order pieces', body: <p>Pieces made to your specification cannot be returned, because the stone and setting were chosen for you. We will always show you the stone and its report before setting.</p> },
        { id: 'resizing', heading: 'Resizing', body: <p>A complimentary resize is available within the first year. Some styles and stones limit how far a ring can be resized; we will advise before taking it in.</p> },
        { id: 'how', heading: 'How to return', body: <p>Write to us with your order number. We arrange an insured collection.</p> },
      ]}
    />
  );
}
