import type { Metadata } from 'next';
import { ConsultationForm } from '@/components/commerce/Forms';
import PageIntro from '@/components/ui/PageIntro';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Book a Consultation',
  description: 'Speak with a gemmologist — and, if you wish, a Jyotish astrologer — by video, by telephone or at the atelier.',
  path: '/consultation',
});

export default function ConsultationPage() {
  return (
    <>
      <PageIntro
        eyebrow="Consultation"
        lines={['A conversation,', <em key="e">not a sale.</em>]}
        lead="Forty-five minutes with a gemmologist to look at stones together, by video or at the atelier. If you would like a traditional reading, an astrologer can join — share your birth details below."
      />
      <div className="container" style={{ paddingBottom: 'clamp(100px, 12vw, 180px)' }}>
        <div style={{ maxWidth: 820 }}>
          <ConsultationForm />
        </div>
      </div>
    </>
  );
}
