import type { Metadata } from 'next';
import BagView from '@/components/commerce/BagView';
import PageIntro from '@/components/ui/PageIntro';

export const metadata: Metadata = { title: 'Your Bag', robots: { index: false } };

export default function BagPage() {
  return (
    <>
      <PageIntro eyebrow="Your bag" lines={['Your selection.']} compact />
      <div className="container" style={{ paddingBottom: 'clamp(100px, 12vw, 180px)' }}>
        <BagView />
      </div>
    </>
  );
}
