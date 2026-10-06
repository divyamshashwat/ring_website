import type { Metadata } from 'next';
import StudioClient from './StudioClient';

export const metadata: Metadata = { title: 'Studio', robots: { index: false, follow: false } };

/** Internal render studio: /studio?product=moonga-ring — used by `npm run renders` and QA. */
export default async function StudioPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return <StudioClient params={params} />;
}
