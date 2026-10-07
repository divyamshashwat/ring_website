import type { Metadata } from 'next';
import Checkout from '@/components/commerce/Checkout';
import PageIntro from '@/components/ui/PageIntro';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <PageIntro lines={['Almost yours.']} compact lead="Three short steps. Nothing is charged until your stone is confirmed." />
      <div className="container" style={{ paddingBottom: 'clamp(100px, 12vw, 180px)' }}>
        <Checkout />
      </div>
    </>
  );
}
