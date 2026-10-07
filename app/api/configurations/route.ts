import { getConfigurations } from '@/lib/services/catalog';

export async function GET() {
  return Response.json(await getConfigurations());
}
