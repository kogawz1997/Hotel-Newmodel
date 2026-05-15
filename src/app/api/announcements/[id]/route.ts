import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';

const MANAGER_ROLES = ['owner', 'admin', 'manager'] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireHotelAccess(null, [...MANAGER_ROLES]);
  if (ctx.error) return ctx.error;

  const { supabase, hotelId } = ctx;
  const { id } = await params;
  const body = await req.json();

  // Verify announcement belongs to this hotel
  const { data: existing } = await supabase
    .from('announcements')
    .select('id, hotel_id')
    .eq('id', id)
    .eq('hotel_id', hotelId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.body !== undefined) updates.body = body.body.trim();
  if (body.type !== undefined) updates.type = body.type;
  if (body.target_roles !== undefined) {
    updates.target_roles =
      Array.isArray(body.target_roles) && body.target_roles.length > 0
        ? body.target_roles
        : null;
  }
  if (body.expires_at !== undefined) updates.expires_at = body.expires_at || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select('*, creator:created_by(full_name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireHotelAccess(null, [...MANAGER_ROLES]);
  if (ctx.error) return ctx.error;

  const { supabase, hotelId } = ctx;
  const { id } = await params;

  // Verify ownership
  const { data: existing } = await supabase
    .from('announcements')
    .select('id, hotel_id')
    .eq('id', id)
    .eq('hotel_id', hotelId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
  }

  // Soft delete: set is_active = false
  const { error } = await supabase
    .from('announcements')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
