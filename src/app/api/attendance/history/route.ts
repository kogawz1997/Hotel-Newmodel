import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get('staff_id') || user.id;
  const days = parseInt(searchParams.get('days') || '14');

  const from = new Date();
  from.setDate(from.getDate() - days);

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*, shifts(name, start_time, end_time)')
    .eq('staff_id', staffId)
    .gte('work_date', from.toISOString().slice(0, 10))
    .order('work_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
