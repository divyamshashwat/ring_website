import { getOrder } from '@/lib/services/orders';
import { isEmail } from '@/lib/validation';

/** Order tracking: requires the order number and the email it was placed with. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const email = new URL(request.url).searchParams.get('email');
  if (!isEmail(email)) return Response.json({ error: 'Please enter the email address used for the order.' }, { status: 400 });
  const order = await getOrder((await params).id, email);
  if (!order) return Response.json({ error: 'We could not find an order with those details.' }, { status: 404 });
  return Response.json({ order: { id: order.id, status: order.status, createdAt: order.createdAt, total: order.total, lines: order.lines.length } });
}
