import type { Metadata } from 'next';
import { TrackOrderForm } from '@/components/commerce/Forms';
import PageIntro from '@/components/ui/PageIntro';

export const metadata: Metadata = { title: 'Track an Order', robots: { index: false } };

export default function TrackOrderPage() {
  return (
    <>
      <PageIntro eyebrow="Order tracking" lines={['Where your piece is.']} compact />
      <div className="container" style={{ paddingBottom: 'clamp(100px, 12vw, 180px)' }}>
        <div style={{ maxWidth: 820 }}>
          <TrackOrderForm />
        </div>
      </div>
    </>
  );
}
