import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  // Fetch the session
  const { data: session, error: sessionError } = await admin
    .from('cashier_sessions')
    .select('id, staff_id, hotel_id, opening_balance, status')
    .eq('id', id)
    .single();

  if (sessionError || !session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  // Only session owner or manager can close
  const isManager = ['owner', 'admin', 'manager', 'hotel_owner', 'general_manager', 'operations_manager', 'accounting_manager'].includes(profile.role);
  if (session.staff_id !== user.id && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const closing_balance = Number(body.closing_balance ?? 0);
  const discrepancy = closing_balance - Number(session.opening_balance ?? 0);

  const { data, error } = await admin
    .from('cashier_sessions')
    .update({
      closing_balance,
      notes: body.notes ?? null,
      closed_at: new Date().toISOString(),
      status: 'closed',
      discrepancy,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, session: data });
}
