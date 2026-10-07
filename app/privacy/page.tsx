import type { Metadata } from 'next';
import InfoPage from '@/components/ui/InfoPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({ title: 'Privacy', description: 'How VYOMA handles your personal information.', path: '/privacy' });

export default function PrivacyPage() {
  return (
    <InfoPage
      title={['Privacy.']}
      lead="Draft for review by counsel before launch."
      sections={[
        { id: 'what', heading: 'What we collect', body: <p>The details you give us to place an order or book a consultation: name, contact details, delivery address, and — only if you choose to share them — birth details for a traditional reading.</p> },
        { id: 'device', heading: 'On your device', body: <p>Your bag and wishlist are stored in your own browser. The date of birth you enter in Find Your Stone is processed in your browser and is not sent to us.</p> },
        { id: 'use', heading: 'How we use it', body: <p>To make and deliver your piece, to arrange consultations, and to reply to you. We do not sell personal information.</p> },
        { id: 'payments', heading: 'Payments', body: <p>Payments are handled by a regulated payment gateway. We never see or store card details.</p> },
        { id: 'rights', heading: 'Your rights', body: <p>You can ask to see, correct or delete the information we hold about you by writing to us, in line with the Digital Personal Data Protection Act, 2023.</p> },
      ]}
    />
  );
}
