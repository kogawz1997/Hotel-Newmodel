/**
 * POST /api/ota/failed-alert
 * Called by OTA sync workers when a sync fails.
 * Queues notification to revenue_manager and creates audit log.
 *
 * GET /api/ota/failed-alert?hotelId= — list recent failures
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { queueNotification } from '@/lib/notifications';
import { writeAuditLog } from '@/lib/audit';

const alertSchema = z.object({
  hotelId:   z.string().uuid(),
  provider:  z.string().max(50),            // 'agoda', 'booking_com', etc.
  syncType:  z.enum(['availability','rates','reservation','inventory']),
  errorCode: z.string().max(100).optional(),
  message:   z.string().max(500),
  retryable: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = alertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const ctx = await requireHotelAccess(parsed.data.hotelId);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();
  const { provider, syncType, message, errorCode, retryable } = parsed.data;

  // Log to OTA sync failures table
  await admin.from('ota_sync_logs').insert({
    hotel_id:    ctx.hotelId,
    provider,
    sync_type:   syncType,
    status:      'failed',
    error_code:  errorCode ?? null,
    message,
    retryable,
    created_at:  new Date().toISOString(),
  }).maybeSingle(); // ignore if table missing

  await writeAuditLog({
    hotelId:    ctx.hotelId,
    action:     'ota_sync_failed',
    entityType: 'ota_sync',
    metadata:   { provider, syncType, errorCode, message, retryable },
  });

  await queueNotification({
    hotelId:  ctx.hotelId,
    type:     'ota_sync_failed',
    priority: 'high',
    roles:    ['owner', 'admin', 'manager', 'revenue_manager'],
    title:    `OTA Sync ล้มเหลว — ${provider}`,
    body:     `${syncType}: ${message}`,
    deepLink: '/dashboard/ota',
    metadata: { provider, syncType, errorCode, retryable },
  });

  return NextResponse.json({ ok: true, notified: true });
}

export async function GET(req: NextRequest) {
  const hotelId = new URL(req.url).searchParams.get('hotelId');
  const ctx = await requireHotelAccess(hotelId, ['owner', 'admin', 'manager', 'revenue_manager']);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();
  const { data } = await admin
    .from('ota_sync_logs')
    .select('*')
    .eq('hotel_id', ctx.hotelId)
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ failures: data ?? [] });
}
