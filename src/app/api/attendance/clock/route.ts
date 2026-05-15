import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json();
  // action: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'

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

  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  // Get or create today's record
  const { data: existing } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('staff_id', user.id)
    .eq('work_date', today)
    .single();

  if (action === 'clock_in') {
    if (existing?.clock_in_at) {
      return NextResponse.json({ error: 'Already clocked in' }, { status: 400 });
    }
    const record = existing
      ? await supabase.from('attendance_records').update({ clock_in_at: now, status: 'clocked_in' }).eq('id', existing.id).select().single()
      : await supabase.from('attendance_records').insert({
          hotel_id: hotel.id, staff_id: user.id,
          work_date: today, clock_in_at: now, status: 'clocked_in',
        }).select().single();
    return NextResponse.json(record.data);
  }

  if (!existing) return NextResponse.json({ error: 'No attendance record found' }, { status: 400 });

  if (action === 'clock_out') {
    const { data } = await supabase.from('attendance_records')
      .update({ clock_out_at: now, status: 'clocked_out' })
      .eq('id', existing.id).select().single();
    return NextResponse.json(data);
  }

  if (action === 'break_start') {
    const { data } = await supabase.from('attendance_records')
      .update({ break_start: now, status: 'on_break' })
      .eq('id', existing.id).select().single();
    return NextResponse.json(data);
  }

  if (action === 'break_end') {
    const { data } = await supabase.from('attendance_records')
      .update({ break_end: now, status: 'clocked_in' })
      .eq('id', existing.id).select().single();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
