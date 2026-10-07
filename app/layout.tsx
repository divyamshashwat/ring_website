import type { Metadata, Viewport } from 'next';
import BagNotice from '@/components/layout/BagNotice';
import Cursor from '@/components/layout/Cursor';
import Diagnostics from '@/components/layout/Diagnostics';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import Loader from '@/components/layout/Loader';
import MobileMenu from '@/components/layout/MobileMenu';
import { TransitionLayer } from '@/components/layout/PageTransition';
import Search from '@/components/layout/Search';
import SmoothScroll from '@/components/layout/SmoothScroll';
import { cormorant, jost } from '@/lib/fonts';
import { JsonLd, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'VYOMA — Astrological Gemstone Jewellery, Handcrafted in India', template: '%s — VYOMA' },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, locale: 'en_IN', type: 'website', images: [{ url: '/og/vyoma.jpg', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#f8f7f3',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
};

const organization = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  priceRange: '₹₹₹',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll>
          <Header />
          <MobileMenu />
          <Search />
          <main id="main">{children}</main>
          <Footer />
          <BagNotice />
          <TransitionLayer />
          <Loader />
          <Cursor />
          <Diagnostics />
        </SmoothScroll>
        <JsonLd data={organization} />
      </body>
    </html>
  );
}
