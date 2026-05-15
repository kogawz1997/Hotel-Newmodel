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

  // Managers only
  const isManager = ['owner', 'admin', 'manager', 'hotel_owner', 'general_manager', 'operations_manager', 'accounting_manager'].includes(profile.role);
  if (!isManager) return NextResponse.json({ error: 'Forbidden — managers only' }, { status: 403 });

  const body = await request.json();
  const action = body.action as 'approve' | 'reject';
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 422 });
  }

  const { data, error } = await admin
    .from('expense_items')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, expense: data });
}
