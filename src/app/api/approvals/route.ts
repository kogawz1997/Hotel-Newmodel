/**
 * GET  /api/approvals — list approvals for hotel (role-filtered)
 * POST /api/approvals — create new approval request
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createApproval } from '@/lib/approvals';
import { createAdminClient } from '@/lib/supabase/server';
import { APPROVAL_PERMISSIONS, MGMT_ROLES } from '@/lib/auth/roles';
import type { StaffRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  hotelId:       z.string().uuid(),
  type:          z.enum(['refund','discount','void','compensation','out_of_order','purchasing','leave','late_checkout','early_checkin','other']),
  title:         z.string().min(1).max(200),
  description:   z.string().max(1000).optional(),
  amount:        z.number().positive().optional(),
  currency:      z.string().length(3).default('THB'),
  referenceType: z.string().optional(),
  referenceId:   z.string().uuid().optional(),
  slaMinutes:    z.number().int().min(5).max(1440).default(60),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  const status  = searchParams.get('status') ?? 'pending';

  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();
  const role  = ctx.profile.role as StaffRole;

  // Managers see all pending; staff see only their own
  const isManager = MGMT_ROLES.includes(role);

  let query = admin
    .from('approvals')
    .select('*, requester:requested_by(full_name,role), approver:approved_by(full_name)')
    .eq('hotel_id', ctx.hotelId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (status !== 'all') query = query.eq('status', status);
  if (!isManager)       query = query.eq('requested_by', ctx.user.id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ approvals: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const ctx = await requireHotelAccess(parsed.data.hotelId);
  if (ctx.error) return ctx.error;

  const approval = await createApproval({
    hotelId:       ctx.hotelId,
    type:          parsed.data.type,
    title:         parsed.data.title,
    description:   parsed.data.description,
    amount:        parsed.data.amount,
    currency:      parsed.data.currency,
    requestedBy:   ctx.user.id,
    referenceType: parsed.data.referenceType,
    referenceId:   parsed.data.referenceId,
    slaMinutes:    parsed.data.slaMinutes,
  });

  return NextResponse.json({ approval }, { status: 201 });
}
