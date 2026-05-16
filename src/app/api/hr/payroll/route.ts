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

export async function GET() {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel } = ctx;

  const { data, error } = await admin
    .from('payroll_periods')
    .select('*, approver:approved_by(id, full_name)')
    .eq('hotel_id', hotel.id)
    .order('period_start', { ascending: false });

  if (error) return apiError(error);
  return NextResponse.json({ periods: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel, user } = ctx;

  const body = await req.json();
  const { period_start, period_end } = body as { period_start: string; period_end: string };

  if (!period_start || !period_end) {
    return NextResponse.json({ error: 'กรุณาระบุวันที่เริ่มต้นและสิ้นสุดรอบ' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('payroll_periods')
    .insert({
      hotel_id: hotel.id,
      period_start,
      period_end,
      status: 'draft',
      total_amount: 0,
    })
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ period: data }, { status: 201 });
}
