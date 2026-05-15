import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const MANAGER_ROLES = ['owner', 'admin', 'manager', 'hr_manager', 'department_head', 'general_manager', 'operations_manager', 'front_office_manager', 'housekeeping_manager', 'fb_manager', 'maintenance_manager'];

export async function GET(req: NextRequest) {
  // Use admin client so managers can see all staff requests without RLS blocking
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  const { data: hotel } = await admin
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status');
  const staffIdFilter = url.searchParams.get('staff_id');
  const fromDate = url.searchParams.get('from_date');
  const toDate = url.searchParams.get('to_date');

  const isManager = MANAGER_ROLES.includes(profile.role);

  let query = admin
    .from('leave_requests')
    .select('*, staff:staff_id(id, full_name, role), approver:approved_by(id, full_name)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(200);

  // Non-managers can only see their own requests
  if (!isManager) {
    query = query.eq('staff_id', user.id);
  } else if (staffIdFilter) {
    query = query.eq('staff_id', staffIdFilter);
  }

  if (statusFilter) query = query.eq('status', statusFilter);
  if (fromDate) query = query.gte('start_date', fromDate);
  if (toDate) query = query.lte('end_date', toDate);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ requests: data ?? [], isManager, userId: user.id });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  const body = await req.json();
  const { type, start_date, end_date, reason } = body;

  const VALID_TYPES = ['sick', 'vacation', 'personal', 'maternity', 'paternity', 'ordination', 'unpaid', 'other'];
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'ประเภทการลาไม่ถูกต้อง' }, { status: 400 });
  }
  if (!start_date || !end_date) {
    return NextResponse.json({ error: 'กรุณาระบุวันที่เริ่มและสิ้นสุด' }, { status: 400 });
  }
  if (new Date(end_date) < new Date(start_date)) {
    return NextResponse.json({ error: 'วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      hotel_id: hotel.id,
      staff_id: user.id,
      type,
      start_date,
      end_date,
      reason: reason ?? null,
      status: 'pending',
    })
    .select('*, staff:staff_id(id, full_name, role)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data, { status: 201 });
}
