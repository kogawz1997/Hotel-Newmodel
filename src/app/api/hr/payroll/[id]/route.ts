import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

const ALLOWED_ROLES = ['owner', 'admin', 'manager', 'hr_manager', 'hr_staff', 'general_manager'];

async function getContext(periodId: string) {
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

  const { data: period } = await admin
    .from('payroll_periods')
    .select('*')
    .eq('id', periodId)
    .eq('hotel_id', hotel.id)
    .single();

  if (!period) return { error: NextResponse.json({ error: 'Period not found' }, { status: 404 }) };

  return { user, profile, hotel, admin, period };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getContext(id);
  if ('error' in ctx) return ctx.error;
  const { admin, hotel, period } = ctx;

  const { data: items, error } = await admin
    .from('payroll_items')
    .select('*, staff:staff_id(id, full_name, role)')
    .eq('period_id', period.id)
    .eq('hotel_id', hotel.id)
    .order('created_at');

  if (error) return apiError(error);

  return NextResponse.json({ period, items: items ?? [] });
}

// POST: generate or upsert payroll items for staff
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getContext(id);
  if ('error' in ctx) return ctx.error;
  const { admin, hotel, period } = ctx;

  const body = await req.json();

  // Body can be { items: PayrollItemInput[] } for bulk upsert
  // or { generate: true } to auto-generate from staff list
  if (body.generate) {
    const { data: staff } = await admin
      .from('user_profiles')
      .select('id, full_name, role')
      .eq('hotel_id', hotel.id);

    if (!staff?.length) {
      return NextResponse.json({ error: 'ไม่พบพนักงาน' }, { status: 400 });
    }

    const rows = staff.map((s: any) => ({
      period_id: period.id,
      hotel_id: hotel.id,
      staff_id: s.id,
      base_salary: 0,
      ot_hours: 0,
      ot_amount: 0,
      allowances: 0,
      deductions: 0,
      tax_amount: 0,
      net_pay: 0,
      attendance_days: 0,
      leave_days: 0,
    }));

    const { error } = await admin
      .from('payroll_items')
      .upsert(rows, { onConflict: 'period_id,staff_id', ignoreDuplicates: true });

    if (error) return apiError(error);
    return NextResponse.json({ ok: true });
  }

  // Upsert individual items
  const items = body.items as Array<{
    id?: string;
    staff_id: string;
    base_salary: number;
    ot_hours: number;
    ot_amount: number;
    allowances: number;
    deductions: number;
    tax_amount: number;
    net_pay: number;
    attendance_days: number;
    leave_days: number;
    notes?: string;
  }>;

  if (!items?.length) {
    return NextResponse.json({ error: 'กรุณาส่ง items' }, { status: 400 });
  }

  const rows = items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    period_id: period.id,
    hotel_id: hotel.id,
    staff_id: item.staff_id,
    base_salary: item.base_salary ?? 0,
    ot_hours: item.ot_hours ?? 0,
    ot_amount: item.ot_amount ?? 0,
    allowances: item.allowances ?? 0,
    deductions: item.deductions ?? 0,
    tax_amount: item.tax_amount ?? 0,
    net_pay: item.net_pay ?? 0,
    attendance_days: item.attendance_days ?? 0,
    leave_days: item.leave_days ?? 0,
    notes: item.notes ?? null,
  }));

  const { error } = await admin
    .from('payroll_items')
    .upsert(rows, { onConflict: 'period_id,staff_id' });

  if (error) return apiError(error);

  // Update total_amount on the period
  const { data: allItems } = await admin
    .from('payroll_items')
    .select('net_pay')
    .eq('period_id', period.id);

  const total = (allItems ?? []).reduce((s: number, i: any) => s + (i.net_pay ?? 0), 0);
  await admin
    .from('payroll_periods')
    .update({ total_amount: total })
    .eq('id', period.id);

  return NextResponse.json({ ok: true });
}

// PATCH: update period status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getContext(id);
  if ('error' in ctx) return ctx.error;
  const { admin, user, profile, period } = ctx;

  const APPROVER_ROLES = ['owner', 'admin', 'manager', 'hr_manager', 'general_manager'];
  if (!APPROVER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เปลี่ยนสถานะ' }, { status: 403 });
  }

  const body = await req.json();
  const { status } = body as { status: 'processing' | 'approved' | 'paid' };

  const validTransitions: Record<string, string[]> = {
    draft: ['processing'],
    processing: ['approved'],
    approved: ['paid'],
  };

  if (!validTransitions[period.status]?.includes(status)) {
    return NextResponse.json({ error: `ไม่สามารถเปลี่ยนจาก ${period.status} เป็น ${status} ได้` }, { status: 400 });
  }

  const updates: Record<string, unknown> = { status };
  if (status === 'approved') {
    updates.approved_by = user.id;
    updates.approved_at = new Date().toISOString();
  }

  const { data, error } = await admin
    .from('payroll_periods')
    .update(updates)
    .eq('id', period.id)
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ period: data });
}
