import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

// PATCH /api/maintenance/requests/[id]
// General-purpose update for maintenance request fields:
// claim:    { assigned_to, status, started_at }
// complete: { status: 'completed', completed_at }
// escalate: { priority: 'urgent' }
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

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) return NextResponse.json({ error: 'No hotel' }, { status: 404 });

  // Confirm the request belongs to this hotel before updating
  const { data: existing } = await supabase
    .from('maintenance_requests')
    .select('id')
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  // Strip undefined / non-column keys
  const {
    assigned_to,
    status,
    priority,
    started_at,
    completed_at,
    parts_used,
    title,
    description,
  } = body;

  const updates: Record<string, any> = {};
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (started_at !== undefined) updates.started_at = started_at;
  if (completed_at !== undefined) updates.completed_at = completed_at;
  if (parts_used !== undefined) updates.parts_used = parts_used;
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('maintenance_requests')
    .update(updates)
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json(data);
}
