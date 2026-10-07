import type { Metadata } from 'next';
import { ContactForm } from '@/components/commerce/Forms';
import { WHATSAPP_URL } from '@/components/layout/navigation';
import PageIntro from '@/components/ui/PageIntro';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'Contact', description: 'Write to the VYOMA atelier, or message us on WhatsApp.', path: '/contact' });

export default function ContactPage() {
  return (
    <>
      <PageIntro lines={['Write to us.']} compact />
      <div className="container" style={{ paddingBottom: 'clamp(100px, 12vw, 180px)' }}>
        <div className="grid" style={{ rowGap: 56 }}>
          <div style={{ gridColumn: '1 / span 7' }} className="ct-form">
            <ContactForm />
          </div>
          <aside style={{ gridColumn: '9 / span 4', display: 'grid', gap: 28, alignContent: 'start' }} className="ct-aside">
            <div>
              <p className="label" style={{ marginBottom: 10 }}>
                WhatsApp
              </p>
              <a href={WHATSAPP_URL} className="link" target="_blank" rel="noreferrer">
                Message the atelier
              </a>
            </div>
            <div>
              <p className="label" style={{ marginBottom: 10 }}>
                Email
              </p>
              <p className="body" style={{ userSelect: 'all' }}>
                atelier@vyoma.example
              </p>
            </div>
            <div>
              <p className="label" style={{ marginBottom: 10 }}>
                Hours
              </p>
              <p className="body">Monday – Saturday, 10:00 – 19:00 IST</p>
            </div>
          </aside>
        </div>
        <style>{`@media (max-width: 900px) { .ct-form, .ct-aside { grid-column: 1 / -1 !important; } }`}</style>
      </div>
    </>
  );
}
