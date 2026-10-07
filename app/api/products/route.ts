import { getProducts } from '@/lib/services/catalog';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const products = await getProducts({
    gemstone: searchParams.get('gemstone') ?? undefined,
    type: type === 'ring' || type === 'pendant' || type === 'bracelet' ? type : undefined,
  });
  return Response.json({ products });
}
