import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: guest } = await supabase
    .from('guest_accounts')
    .select('email, first_name')
    .eq('id', user.id)
    .single();

  if (!guest?.email) return NextResponse.json({ error: 'No email on file' }, { status: 400 });

  // Record the email request so hotel staff can send the actual receipt
  await supabase.from('work_orders').insert({
    guest_account_id: user.id,
    type: 'other',
    title: 'ขอใบเสร็จทางอีเมล',
    description: `ส่งใบเสร็จไปที่: ${guest.email}`,
    status: 'pending',
  }).maybeSingle();

  return NextResponse.json({ ok: true });
}
