import { gemstoneBySlug } from '@/lib/data/gemstones';
import { estimatePrice } from '@/lib/data/pricing';
import type { Configuration } from '@/lib/data/types';
import { createOrder } from '@/lib/services/orders';
import { bad, isEmail, isText } from '@/lib/validation';

interface Body {
  name?: unknown;
  email?: unknown;
  shipping?: { address?: unknown; city?: unknown; postcode?: unknown; country?: unknown };
  lines?: { productSlug?: string; configuration?: Configuration; quantity?: number }[];
}

/**
 * Creates an order. Prices are recomputed on the server from the configuration —
 * never trusted from the client. Payment is collected through a secure payment
 * link once a gemmologist has confirmed the stone (made-to-order flow).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body) return bad('Invalid request');
  if (!isText(body.name, 120)) return bad('Please enter your name.');
  if (!isEmail(body.email)) return bad('Please enter a valid email address.');
  const s = body.shipping ?? {};
  if (!isText(s.address, 400) || !isText(s.city, 80) || !isText(s.postcode, 12) || !isText(s.country, 60)) return bad('Please complete your delivery address.');
  if (!Array.isArray(body.lines) || body.lines.length === 0 || body.lines.length > 20) return bad('Your bag is empty.');
  const lines = [];
  for (const line of body.lines) {
    const c = line.configuration;
    if (!c || !gemstoneBySlug(c.stone)) return bad('A piece in your bag is no longer available.');
    const quantity = Math.max(1, Math.min(5, Math.floor(Number(line.quantity) || 1)));
    lines.push({ productSlug: line.productSlug, configuration: c, quantity, price: estimatePrice(c) });
  }
  const order = await createOrder({
    name: body.name,
    email: body.email,
    shipping: { address: s.address as string, city: s.city as string, postcode: s.postcode as string, country: s.country as string },
    lines,
    total: lines.reduce((n, l) => n + l.price * l.quantity, 0),
  });
  return Response.json({ order: { id: order.id, total: order.total, status: order.status } }, { status: 201 });
}
