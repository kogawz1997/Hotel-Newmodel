import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateSegmentMembers } from '@/lib/crm/segment-engine';

export async function POST(request: NextRequest) {
  const authError = requireCronSecret(request);
  if (authError) return authError;

  const supabase = createAdminClient();

  const { data: segments, error: segError } = await supabase
    .from('crm_segment_definitions')
    .select('*')
    .eq('is_active', true)
    .eq('is_deleted', false);

  if (segError) {
    if (segError.code === '42P01') {
      return NextResponse.json({ segments_updated: 0, guests_processed: 0, message: 'Table not yet created' });
    }
    return NextResponse.json({ error: segError.message }, { status: 500 });
  }

  let segments_updated = 0;
  let guests_processed = 0;

  for (const segment of segments || []) {
    const definition = {
      id: segment.id,
      hotel_id: segment.hotel_id,
      name: segment.name,
      type: segment.type,
      rules: segment.rules || [],
      is_active: segment.is_active,
    };

    const guestIds = await calculateSegmentMembers(definition, supabase);

    await supabase.from('crm_segment_members').delete().eq('segment_id', segment.id);

    if (guestIds.length > 0) {
      const rows = guestIds.map(gid => ({
        segment_id: segment.id,
        guest_id: gid,
        entered_at: new Date().toISOString(),
      }));
      await supabase.from('crm_segment_members').insert(rows);
    }

    segments_updated += 1;
    guests_processed += guestIds.length;
  }

  return NextResponse.json({
    success: true,
    segments_updated,
    guests_processed,
    processed_at: new Date().toISOString(),
  });
}
