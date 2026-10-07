import type { Metadata } from 'next';
import Wishlist from '@/components/commerce/Wishlist';
import PageIntro from '@/components/ui/PageIntro';

export const metadata: Metadata = { title: 'Wishlist', robots: { index: false } };

export default function WishlistPage() {
  return (
    <>
      <PageIntro eyebrow="Wishlist" lines={['Kept for later.']} compact />
      <div className="container" style={{ paddingBottom: 'clamp(100px, 12vw, 180px)' }}>
        <Wishlist />
      </div>
    </>
  );
}
