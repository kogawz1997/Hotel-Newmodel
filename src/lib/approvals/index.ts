/**
 * Approval Engine — P1.4 / P2.9
 *
 * Creates, resolves, and escalates approval requests.
 * Every action writes to approval_logs + audit_logs + staff_notifications.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { queueNotification } from '@/lib/notifications';
import { APPROVAL_PERMISSIONS } from '@/lib/auth/roles';
import type { StaffRole } from '@/lib/auth/roles';

export type ApprovalType = keyof typeof APPROVAL_PERMISSIONS;

export interface CreateApprovalInput {
  hotelId:       string;
  type:          ApprovalType;
  title:         string;
  description?:  string;
  amount?:       number;
  currency?:     string;
  requestedBy:   string;
  referenceType?: string;
  referenceId?:   string;
  slaMinutes?:   number;
}

export async function createApproval(input: CreateApprovalInput) {
  const admin = createAdminClient();

  const slaMinutes = input.slaMinutes ?? 60;
  const dueAt = new Date(Date.now() + slaMinutes * 60_000).toISOString();

  const { data: approval, error } = await admin
    .from('approvals')
    .insert({
      hotel_id:       input.hotelId,
      type:           input.type,
      title:          input.title,
      description:    input.description ?? null,
      amount:         input.amount ?? null,
      currency:       input.currency ?? 'THB',
      requested_by:   input.requestedBy,
      reference_type: input.referenceType ?? null,
      reference_id:   input.referenceId ?? null,
      sla_minutes:    slaMinutes,
      due_at:         dueAt,
      status:         'pending',
    })
    .select()
    .single();

  if (error || !approval) throw new Error(error?.message ?? 'Failed to create approval');

  await admin.from('approval_logs').insert({
    approval_id: approval.id,
    actor_id:    input.requestedBy,
    action:      'created',
    note:        input.title,
  });

  await writeAuditLog({
    hotelId:    input.hotelId,
    actorId:    input.requestedBy,
    action:     'approval_created',
    entityType: 'approval',
    entityId:   approval.id,
    metadata:   { type: input.type, amount: input.amount },
  });

  // Notify approvers
  const approverRoles = APPROVAL_PERMISSIONS[input.type] as StaffRole[];
  await queueNotification({
    hotelId:   input.hotelId,
    type:      'approval_requested',
    priority:  'high',
    roles:     approverRoles,
    title:     `ขออนุมัติ: ${input.title}`,
    body:      input.description ?? input.title,
    deepLink:  '/dashboard/notifications',
    metadata:  { approval_id: approval.id, type: input.type, amount: input.amount },
  });

  return approval;
}

export async function resolveApproval(
  approvalId: string,
  actorId: string,
  decision: 'approved' | 'rejected',
  note?: string
) {
  const admin = createAdminClient();

  const { data: approval } = await admin
    .from('approvals')
    .select('*, hotels(id, organization_id)')
    .eq('id', approvalId)
    .single();

  if (!approval) throw new Error('Approval not found');

  // Verify actor has permission
  const { data: actor } = await admin
    .from('user_profiles')
    .select('role, organization_id')
    .eq('id', actorId)
    .single();

  const allowedRoles = APPROVAL_PERMISSIONS[approval.type as ApprovalType] as StaffRole[];
  if (!actor || !allowedRoles.includes(actor.role as StaffRole)) {
    throw new Error('Insufficient permissions to resolve this approval');
  }

  if ((approval.hotels as any)?.organization_id !== actor.organization_id) {
    throw new Error('Cross-tenant access denied');
  }

  await admin
    .from('approvals')
    .update({
      status:      decision,
      approved_by: actorId,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', approvalId);

  await admin.from('approval_logs').insert({
    approval_id: approvalId,
    actor_id:    actorId,
    action:      decision,
    note:        note ?? null,
  });

  await writeAuditLog({
    hotelId:    approval.hotel_id,
    actorId:    actorId,
    action:     `approval_${decision}`,
    entityType: 'approval',
    entityId:   approvalId,
    metadata:   { type: approval.type, note },
  });

  // Notify requester of the outcome
  await queueNotification({
    hotelId:   approval.hotel_id,
    type:      `approval_${decision}`,
    priority:  decision === 'approved' ? 'normal' : 'high',
    roles:     [] as StaffRole[],             // notify specific user below
    title:     `${decision === 'approved' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}: ${approval.title}`,
    body:      note ?? (decision === 'approved' ? 'คำขออนุมัติของคุณได้รับการอนุมัติ' : 'คำขออนุมัติของคุณถูกปฏิเสธ'),
    deepLink:  '/dashboard/notifications',
    actorId:   actorId,
    metadata:  { approval_id: approvalId, decision },
  });

  return { ok: true, decision };
}
