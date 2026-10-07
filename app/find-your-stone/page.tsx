import type { Metadata } from 'next';
import FindYourStone from '@/components/finder/FindYourStone';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Find Your Stone — Your Traditional Vedic Gemstone',
  description: 'A first indication of your traditional gemstone from your date of birth, based on the Vedic association between your sidereal Sun sign and its ruling planet.',
  path: '/find-your-stone',
});

export default function FindYourStonePage() {
  return (
    <div style={{ paddingTop: 'var(--header-h)' }}>
      <FindYourStone headingLevel="h1" eyebrow="Find your stone" />
    </div>
  );
}
