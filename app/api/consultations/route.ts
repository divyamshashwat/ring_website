import { createConsultation } from '@/lib/services/orders';
import { bad, isEmail, isText, optionalText } from '@/lib/validation';

export async function POST(request: Request) {
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return bad('Invalid request');
  if (!isText(b.name, 120)) return bad('Please enter your name.');
  if (!isEmail(b.email)) return bad('Please enter a valid email address.');
  const mode = b.mode === 'boutique' || b.mode === 'phone' ? b.mode : 'video';
  const phone = optionalText(b.phone, 30);
  const preferredDate = optionalText(b.preferredDate, 30);
  const message = optionalText(b.message, 2000);
  const birthDetails = optionalText(b.birthDetails, 300);
  if (phone === null || preferredDate === null || message === null || birthDetails === null) return bad('Some details are too long.');
  const request_ = await createConsultation({ name: b.name, email: b.email, mode, phone, preferredDate, message, birthDetails });
  return Response.json({ id: request_.id }, { status: 201 });
}
