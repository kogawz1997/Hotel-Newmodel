import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/it/tickets/[id]
// Supports: assign (assigned_to), resolve (resolution + status=resolved), or general status update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) return NextResponse.json({ error: 'No hotel' }, { status: 404 });

  const body = await req.json();
  const { action, assigned_to, resolution, status } = body;

  // Build update payload
  const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };

  if (action === 'assign' || assigned_to !== undefined) {
    updatePayload.assigned_to = assigned_to ?? null;
    updatePayload.status = 'in_progress';
  }

  if (action === 'resolve' || resolution !== undefined) {
    updatePayload.resolution = resolution ?? null;
    updatePayload.resolved_at = new Date().toISOString();
    updatePayload.resolved_by = user.id;
    updatePayload.status = 'resolved';
  }

  if (status !== undefined && action !== 'assign' && action !== 'resolve') {
    updatePayload.status = status;
  }

  const { data, error } = await admin
    .from('support_tickets_internal')
    .update(updatePayload)
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .select(
      '*, requester:user_profiles!requester_id(id, full_name), assignee:user_profiles!assigned_to(id, full_name)'
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
