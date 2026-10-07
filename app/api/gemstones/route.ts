import { getGemstones } from '@/lib/services/catalog';

export async function GET(request: Request) {
  const group = new URL(request.url).searchParams.get('group');
  return Response.json({ gemstones: await getGemstones(group === 'navratna' || group === 'uparatna' ? group : undefined) });
}
