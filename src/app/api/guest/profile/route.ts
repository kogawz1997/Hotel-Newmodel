import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

const schema = z.object({
  firstName: z.string().max(120).optional(),
  lastName: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  preferences: z.record(z.unknown()).optional().default({}),
});

export async function GET() {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const { data: guest } = await ctx.supabase.from('guests').select('*, reservations(id,check_in,check_out,status,total_amount)').eq('email', ctx.user?.email || '').limit(1).maybeSingle();
  return NextResponse.json({ guest: guest || null, stayHistory: guest?.reservations || [] });
}

export async function PATCH(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  const { data, error } = await ctx.supabase.from('guests').upsert({ email: ctx.user?.email || '', first_name: parsed.data.firstName, last_name: parsed.data.lastName, phone: parsed.data.phone, preferences: parsed.data.preferences }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guest: data });
}
