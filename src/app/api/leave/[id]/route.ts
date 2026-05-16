import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

const MANAGER_ROLES = ['owner', 'admin', 'manager', 'hr_manager', 'department_head', 'general_manager', 'operations_manager', 'front_office_manager', 'housekeeping_manager', 'fb_manager', 'maintenance_manager'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  // Fetch the leave request to verify hotel ownership
  const { data: leaveRequest } = await admin
    .from('leave_requests')
    .select('*, hotels!inner(organization_id)')
    .eq('id', id)
    .single();

  if (!leaveRequest) {
    return NextResponse.json({ error: 'ไม่พบใบลา' }, { status: 404 });
  }

  // Ensure the leave request belongs to the user's organization
  if (leaveRequest.hotels?.organization_id !== profile.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { action, reject_note } = body as { action: 'approve' | 'reject' | 'cancel'; reject_note?: string };

  const isManager = MANAGER_ROLES.includes(profile.role);
  const isOwner = leaveRequest.staff_id === user.id;

  if (action === 'approve' || action === 'reject') {
    if (!isManager) {
      return NextResponse.json({ error: 'เฉพาะผู้จัดการเท่านั้นที่อนุมัติ/ปฏิเสธได้' }, { status: 403 });
    }
    if (leaveRequest.status !== 'pending') {
      return NextResponse.json({ error: 'ใบลานี้ไม่อยู่ในสถานะรออนุมัติ' }, { status: 400 });
    }
  }

  if (action === 'cancel') {
    if (!isOwner && !isManager) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ยกเลิกใบลานี้' }, { status: 403 });
    }
    if (leaveRequest.status !== 'pending') {
      return NextResponse.json({ error: 'ยกเลิกได้เฉพาะใบลาที่รออนุมัติเท่านั้น' }, { status: 400 });
    }
  }

  let updates: Record<string, unknown> = {};

  if (action === 'approve') {
    updates = {
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      reject_note: null,
    };
  } else if (action === 'reject') {
    if (!reject_note?.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุเหตุผลในการปฏิเสธ' }, { status: 400 });
    }
    updates = {
      status: 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      reject_note: reject_note.trim(),
    };
  } else if (action === 'cancel') {
    updates = { status: 'cancelled' };
  } else {
    return NextResponse.json({ error: 'action ไม่ถูกต้อง' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('leave_requests')
    .update(updates)
    .eq('id', id)
    .select('*, staff:staff_id(id, full_name, role), approver:approved_by(id, full_name)')
    .single();

  if (error) return apiError(error);

  return NextResponse.json(data);
}
