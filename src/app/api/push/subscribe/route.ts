import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({ auth: z.string(), p256dh: z.string() }),
  }),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });

  const { subscription } = parsed.data;

  // Upsert — one subscription per endpoint per user
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    auth: subscription.keys.auth,
    p256dh: subscription.keys.p256dh,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint } = await request.json();
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });

  await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint);
  return NextResponse.json({ ok: true });
}
