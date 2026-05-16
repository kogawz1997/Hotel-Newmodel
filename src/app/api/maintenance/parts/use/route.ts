import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

// POST /api/maintenance/parts/use
// Body: { part_id, quantity_used, work_order_id?, notes? }
// Deducts from parts_inventory.quantity and logs to parts_usage_log
export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const { part_id, quantity_used, work_order_id, notes } = body;

  if (!part_id) return NextResponse.json({ error: 'part_id required' }, { status: 400 });
  if (!quantity_used || quantity_used <= 0)
    return NextResponse.json({ error: 'quantity_used must be > 0' }, { status: 400 });

  // Fetch current stock
  const { data: part, error: fetchErr } = await supabase
    .from('parts_inventory')
    .select('id, quantity, name')
    .eq('id', part_id)
    .eq('hotel_id', hotel.id)
    .single();

  if (fetchErr || !part)
    return NextResponse.json({ error: 'Part not found' }, { status: 404 });

  if ((part.quantity ?? 0) < quantity_used)
    return NextResponse.json(
      { error: `สต็อกไม่เพียงพอ (คงเหลือ ${part.quantity} ${part.name})` },
      { status: 409 }
    );

  const newQty = (part.quantity ?? 0) - quantity_used;

  // Deduct stock
  const { error: updateErr } = await supabase
    .from('parts_inventory')
    .update({ quantity: newQty, updated_at: new Date().toISOString() })
    .eq('id', part_id)
    .eq('hotel_id', hotel.id);

  if (updateErr)
    return apiError(updateErr);

  // Log usage
  const { data: log, error: logErr } = await supabase
    .from('parts_usage_log')
    .insert({
      hotel_id: hotel.id,
      part_id,
      work_order_id: work_order_id ?? null,
      used_by: user.id,
      quantity_used,
      used_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .select()
    .single();

  if (logErr)
    return apiError(logErr);

  return NextResponse.json(
    { log, remaining_quantity: newQty },
    { status: 201 }
  );
}
