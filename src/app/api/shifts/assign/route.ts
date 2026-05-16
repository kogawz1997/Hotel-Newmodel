import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) return NextResponse.json({ error: 'No hotel' }, { status: 400 });
  const { staffId, shiftId, workDate, notes } = await req.json();
  const { data, error } = await supabase.from('shift_assignments').upsert({
    hotel_id: hotel.id, staff_id: staffId, shift_id: shiftId, work_date: workDate, notes: notes ?? null,
  }, { onConflict: 'staff_id,work_date' }).select().single();
  if (error) return apiError(error);
  return NextResponse.json(data);
}
