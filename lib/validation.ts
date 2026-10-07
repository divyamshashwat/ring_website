/** Minimal server-side validation shared by the API routes. */
export const isEmail = (v: unknown): v is string => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length < 200;
export const isText = (v: unknown, max = 2000): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
export const optionalText = (v: unknown, max = 2000) => (v === undefined || v === null || v === '' ? undefined : typeof v === 'string' && v.length <= max ? v : null);

export function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
