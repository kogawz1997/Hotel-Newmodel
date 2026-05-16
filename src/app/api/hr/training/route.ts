import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

const ALLOWED_ROLES = ['owner', 'admin', 'manager', 'hr_manager', 'hr_staff', 'general_manager'];

async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const { data: hotel } = await admin
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) return { error: NextResponse.json({ error: 'Hotel not found' }, { status: 404 }) };

  return { user, profile, hotel, admin };
}

export async function GET(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel } = ctx;

  const url = new URL(req.url);
  const staffId = url.searchParams.get('staff_id');
  const category = url.searchParams.get('category');

  let query = admin
    .from('training_records')
    .select('*, staff:staff_id(id, full_name, role)')
    .eq('hotel_id', hotel.id)
    .order('start_date', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return apiError(error);
  return NextResponse.json({ records: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel } = ctx;

  const body = await req.json();
  const {
    staff_id,
    course_name,
    category,
    trainer,
    start_date,
    end_date,
    hours,
    passed,
    certificate_url,
    notes,
  } = body;

  if (!staff_id || !course_name || !start_date) {
    return NextResponse.json({ error: 'กรุณาระบุพนักงาน ชื่อหลักสูตร และวันที่เริ่ม' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('training_records')
    .insert({
      hotel_id: hotel.id,
      staff_id,
      course_name,
      category: category ?? null,
      trainer: trainer ?? null,
      start_date,
      end_date: end_date ?? null,
      hours: hours ?? null,
      passed: passed ?? null,
      certificate_url: certificate_url ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ record: data }, { status: 201 });
}
