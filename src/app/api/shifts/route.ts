import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

  const { data: profile } = await supabase.from('user_profiles')
    .select('organization_id').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels')
    .select('id').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) return NextResponse.json([]);

  const { data } = await supabase
    .from('shift_assignments')
    .select('*, shifts(name, start_time, end_time, color), user_profiles(id, full_name, role, avatar_url)')
    .eq('hotel_id', hotel.id)
    .eq('work_date', date)
    .order('created_at');

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  // body: { staff_id, shift_id, work_date, notes? }

  const { data: profile } = await supabase.from('user_profiles')
    .select('organization_id').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels')
    .select('id').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('shift_assignments')
    .upsert({ hotel_id: hotel.id, ...body }, { onConflict: 'staff_id,work_date' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
