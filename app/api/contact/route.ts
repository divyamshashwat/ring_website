import { createEnquiry } from '@/lib/services/orders';
import { bad, isEmail, isText } from '@/lib/validation';

export async function POST(request: Request) {
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return bad('Invalid request');
  if (!isText(b.name, 120)) return bad('Please enter your name.');
  if (!isEmail(b.email)) return bad('Please enter a valid email address.');
  if (!isText(b.message, 4000)) return bad('Please write a message.');
  const enquiry = await createEnquiry({ name: b.name, email: b.email, message: b.message });
  return Response.json({ id: enquiry.id }, { status: 201 });
}
