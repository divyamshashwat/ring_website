import type { Metadata } from 'next';
import { TransitionLink } from '@/components/layout/PageTransition';
import Heritage from '@/components/sections/Heritage';
import Trust from '@/components/sections/Trust';
import PageIntro from '@/components/ui/PageIntro';
import Placeholder from '@/components/ui/Placeholder';
import { MaskReveal, Reveal } from '@/components/ui/Reveal';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Our Story',
  description: 'VYOMA — a house of astrological gemstone jewellery that keeps tradition and verifiable fact clearly apart.',
  path: '/our-story',
});

export default function OurStoryPage() {
  return (
    <>
      <PageIntro lines={['Vyoma —', <em key="e">the open sky.</em>]} lead="In Sanskrit, vyoma is the sky, the space in which the planets move. We named the house for it." />
      <section className="container" style={{ paddingBottom: 'clamp(90px, 11vw, 160px)' }}>
        <div className="grid" style={{ rowGap: 56, alignItems: 'center' }}>
          <MaskReveal style={{ gridColumn: '1 / span 6' }} className="story-img">
            <Placeholder label="The atelier — commissioned photograph" ratio="4 / 5" tone="sand" />
          </MaskReveal>
          <Reveal className="story-text" style={{ gridColumn: '8 / span 5', display: 'grid', gap: 24 }}>
            <p className="lead">We began with a simple frustration: astrological jewellery was either beautiful or honest, rarely both.</p>
            <p className="body">
              Stones were sold with promises they could not keep, and with too little said about what they actually were. We wanted to make pieces worthy of the tradition — and to describe every stone exactly as its laboratory report does.
            </p>
            <p className="body">
              So the house works to two rules. Tradition is presented as tradition: with respect, and without claims. And everything that can be verified — species, treatment, weight, purity — is verified, documented and handed to you.
            </p>
            <TransitionLink href="/consultation" className="link" style={{ justifySelf: 'start', marginTop: 8 }}>
              Visit the atelier
            </TransitionLink>
          </Reveal>
        </div>
        <style>{`@media (max-width: 900px) { .story-img, .story-text { grid-column: 1 / -1 !important; } }`}</style>
      </section>
      <Heritage />
      <Trust />
    </>
  );
}
