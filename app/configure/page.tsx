import type { Metadata } from 'next';
import Configurator from '@/components/configurator/Configurator';
import { pageMetadata } from '@/lib/seo';
import { configFromSearch } from '@/lib/store/configurator';

export const metadata: Metadata = pageMetadata({
  title: 'Create Your Ring',
  description: 'Configure a natural, certified astrological gemstone ring in 18K or 22K gold — stone, metal, size and setting, in real-time 3D.',
  path: '/configure',
});

export default async function ConfigurePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const initial = configFromSearch(await searchParams);
  return <Configurator initial={initial} syncUrl headingLevel="h1" />;
}
