import type { Metadata } from 'next';
import ConfigureClient from './ConfigureClient';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Create Your Ring',
  description: 'Configure a natural, certified astrological gemstone ring in 18K or 22K gold — stone, metal, size and setting, in real-time 3D.',
  path: '/configure',
});

export default function ConfigurePage() {
  return <ConfigureClient />;
}
