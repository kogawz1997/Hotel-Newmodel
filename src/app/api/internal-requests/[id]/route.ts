import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MANAGER_ROLES = ['owner', 'admin', 'manager'];

type Action = 'review' | 'approve' | 'reject' | 'complete';

const ACTION_STATUS: Record<Action, string> = {
  review: 'reviewing',
  approve: 'approved',
  reject: 'rejected',
  complete: 'completed',
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  if (!MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Permission denied. Manager or above required.' }, { status: 403 });
  }

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();
  if (!hotel) return NextResponse.json({ error: 'No hotel found' }, { status: 400 });

  const body = await req.json();
  const { action, reject_note } = body as { action: Action; reject_note?: string };

  if (!action || !ACTION_STATUS[action]) {
    return NextResponse.json({ error: 'Invalid action. Must be: review, approve, reject, complete' }, { status: 422 });
  }

  if (action === 'reject' && !reject_note) {
    return NextResponse.json({ error: 'reject_note is required when rejecting' }, { status: 422 });
  }

  const updates: Record<string, any> = {
    status: ACTION_STATUS[action],
    updated_at: new Date().toISOString(),
  };

  if (action === 'approve') {
    updates.approved_by = user.id;
    updates.approved_at = new Date().toISOString();
  }

  if (action === 'reject') {
    updates.reject_note = reject_note;
    updates.approved_by = user.id;
    updates.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('internal_requests')
    .update(updates)
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .select('*, requester:user_profiles!requester_id(id, full_name, role), approver:user_profiles!approved_by(id, full_name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  return NextResponse.json(data);
}
