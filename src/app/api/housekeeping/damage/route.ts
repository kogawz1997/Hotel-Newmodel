/**
 * POST /api/housekeeping/damage — report room damage
 * GET  /api/housekeeping/damage?hotelId= — list damage reports
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { queueNotification } from '@/lib/notifications';
import { MGMT_ROLES } from '@/lib/auth/roles';

const createSchema = z.object({
  hotelId:     z.string().uuid(),
  roomId:      z.string().uuid(),
  description: z.string().min(5).max(1000),
  severity:    z.enum(['minor', 'moderate', 'severe']).default('minor'),
  photoUrls:   z.array(z.string().url()).max(5).default([]),
  estimatedCost: z.number().min(0).optional(),
});

export async function GET(req: NextRequest) {
  const hotelId = new URL(req.url).searchParams.get('hotelId');
  const ctx = await requireHotelAccess(hotelId, [...MGMT_ROLES, 'housekeeping_manager']);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();
  const { data } = await admin
    .from('operational_incidents')
    .select('*, room:room_id(room_number), reporter:reported_by(full_name)')
    .eq('hotel_id', ctx.hotelId)
    .eq('department', 'housekeeping')
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ reports: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const ctx = await requireHotelAccess(parsed.data.hotelId, [
    ...MGMT_ROLES, 'housekeeping_manager', 'housekeeping', 'housekeeper', 'room_inspector',
  ]);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();
  const { data: incident, error } = await admin
    .from('operational_incidents')
    .insert({
      hotel_id:    ctx.hotelId,
      title:       `ความเสียหายในห้อง — ${parsed.data.severity}`,
      description: parsed.data.description,
      severity:    parsed.data.severity === 'severe' ? 'high' : parsed.data.severity === 'moderate' ? 'medium' : 'low',
      department:  'housekeeping',
      room_id:     parsed.data.roomId,
      reported_by: ctx.user.id,
      metadata:    { photo_urls: parsed.data.photoUrls, estimated_cost: parsed.data.estimatedCost },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    hotelId:    ctx.hotelId,
    actorId:    ctx.user.id,
    action:     'damage_reported',
    entityType: 'room',
    entityId:   parsed.data.roomId,
    metadata:   { severity: parsed.data.severity, incident_id: incident.id },
  });

  if (parsed.data.severity !== 'minor') {
    await queueNotification({
      hotelId:  ctx.hotelId,
      type:     'damage_reported',
      priority: parsed.data.severity === 'severe' ? 'high' : 'normal',
      roles:    [...MGMT_ROLES, 'housekeeping_manager', 'maintenance_manager'],
      title:    `รายงานความเสียหาย (${parsed.data.severity})`,
      body:     parsed.data.description.slice(0, 100),
      deepLink: '/dashboard/housekeeping',
      metadata: { incident_id: incident.id, room_id: parsed.data.roomId },
    });
  }

  return NextResponse.json({ incident }, { status: 201 });
}
