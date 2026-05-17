import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { calculateSegmentMembers } from '@/lib/crm/segment-engine';

export async function GET(request: NextRequest) {
  const hotelId = request.nextUrl.searchParams.get('hotel_id');
  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const { data: segments, error } = await ctx.supabase
    .from('crm_segment_definitions')
    .select('*')
    .eq('hotel_id', ctx.hotelId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ segments: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const memberCounts: Record<string, number> = {};
  const segmentIds = (segments || []).map((s: any) => s.id);
  if (segmentIds.length > 0) {
    const { data: counts } = await ctx.supabase
      .from('crm_segment_members')
      .select('segment_id')
      .in('segment_id', segmentIds);

    for (const row of counts || []) {
      memberCounts[row.segment_id] = (memberCounts[row.segment_id] || 0) + 1;
    }
  }

  const result = (segments || []).map((s: any) => ({
    ...s,
    member_count: memberCounts[s.id] || 0,
  }));

  return NextResponse.json({ segments: result });
}

export async function POST(request: NextRequest) {
  const hotelId = request.nextUrl.searchParams.get('hotel_id');
  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const body = await request.json();
  const { name, type, rules, is_active = true } = body;

  if (!name || !type || !Array.isArray(rules)) {
    return NextResponse.json({ error: 'name, type, and rules are required' }, { status: 400 });
  }

  const { data: segment, error: insertError } = await ctx.supabase
    .from('crm_segment_definitions')
    .insert({
      hotel_id: ctx.hotelId,
      name,
      type,
      rules,
      is_active,
      is_deleted: false,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '42P01') {
      return NextResponse.json({ error: 'Segments table not yet created. Run migrations.' }, { status: 500 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const definition = { id: segment.id, hotel_id: ctx.hotelId, name, type, rules, is_active };
  const guestIds = await calculateSegmentMembers(definition, ctx.supabase);

  if (guestIds.length > 0) {
    const rows = guestIds.map(gid => ({
      segment_id: segment.id,
      guest_id: gid,
      entered_at: new Date().toISOString(),
    }));
    await ctx.supabase.from('crm_segment_members').upsert(rows, { onConflict: 'segment_id,guest_id' });
  }

  return NextResponse.json({ segment: { ...segment, member_count: guestIds.length } }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const hotelId = request.nextUrl.searchParams.get('hotel_id');
  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const body = await request.json();
  const { id, name, type, rules, is_active } = body;

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { data: existing } = await ctx.supabase
    .from('crm_segment_definitions')
    .select('id')
    .eq('id', id)
    .eq('hotel_id', ctx.hotelId)
    .single();

  if (!existing) return NextResponse.json({ error: 'Segment not found' }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;
  if (rules !== undefined) updates.rules = rules;
  if (is_active !== undefined) updates.is_active = is_active;
  updates.updated_at = new Date().toISOString();

  const { data: segment, error: updateError } = await ctx.supabase
    .from('crm_segment_definitions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const definition = {
    id: segment.id,
    hotel_id: ctx.hotelId,
    name: segment.name,
    type: segment.type,
    rules: segment.rules,
    is_active: segment.is_active,
  };
  const guestIds = await calculateSegmentMembers(definition, ctx.supabase);

  await ctx.supabase.from('crm_segment_members').delete().eq('segment_id', id);

  if (guestIds.length > 0) {
    const rows = guestIds.map(gid => ({
      segment_id: id,
      guest_id: gid,
      entered_at: new Date().toISOString(),
    }));
    await ctx.supabase.from('crm_segment_members').insert(rows);
  }

  return NextResponse.json({ segment: { ...segment, member_count: guestIds.length } });
}

export async function DELETE(request: NextRequest) {
  const hotelId = request.nextUrl.searchParams.get('hotel_id');
  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await ctx.supabase
    .from('crm_segment_definitions')
    .update({ is_deleted: true, is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('hotel_id', ctx.hotelId);

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ error: 'Table not found' }, { status: 500 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
