import { getProductBySlug } from '@/lib/services/catalog';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ product });
}
