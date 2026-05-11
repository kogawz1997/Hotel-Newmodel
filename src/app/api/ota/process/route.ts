import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { readWebhookToken, verifyBearerOrHeaderToken } from '@/lib/security/webhook';
import { rateLimit } from '@/lib/security/rate-limit';
import { parseBookingComXml } from '@/lib/ota/parsers/booking-com';
import { parseAgodaJson } from '@/lib/ota/parsers/agoda';
import { parseAirbnbIcal, parseAirbnbPayload } from '@/lib/ota/parsers/airbnb';
import { mapOtaReservation } from '@/lib/ota/reservation-mapper';
import { alertOtaFailure } from '@/lib/ops/alerts';

async function parseJobPayload(job: any) {
  const payload = job.payload || {};
  const provider: string = job.provider || '';

  if (provider.includes('booking_com') || provider.includes('booking-com')) {
    // Booking.com sends XML in payload.xml or raw body
    const xml = payload.xml ?? payload.body ?? JSON.stringify(payload);
    return parseBookingComXml(typeof xml === 'string' ? xml : JSON.stringify(xml));
  }

  if (provider.includes('agoda')) {
    return parseAgodaJson(payload as any);
  }

  if (provider.includes('airbnb')) {
    // Check if iCal text is stored
    if (typeof payload.ical === 'string' || typeof payload.body === 'string') {
      const icalText = payload.ical ?? payload.body;
      const events = parseAirbnbIcal(icalText as string);
      return events[0] ?? null;
    }
    return parseAirbnbPayload(payload as any);
  }

  return null;
}

async function processQueue(request: Request) {
  const limited = await rateLimit(request, 'ota.sync.process', 30, 60_000);
  if (limited) return limited;
  const token = readWebhookToken(request);
  if (!verifyBearerOrHeaderToken(token, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: jobs, error } = await admin
    .from('ota_sync_queue')
    .select('*')
    .in('status', ['pending', 'retry'])
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let processed = 0;
  let failed = 0;
  let duplicates = 0;
  let mapped = 0;

  for (const job of jobs || []) {
    const started = Date.now();
    await admin.from('ota_sync_queue').update({
      status: 'processing',
      attempts: (job.attempts || 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', job.id);

    try {
      // ── Dedup check ───────────────────────────────────────────────────
      const externalReservationId =
        job.payload?.external_reservation_id ||
        job.payload?.reservation_id ||
        job.payload?.booking_id ||
        job.payload?.id;

      if (job.type === 'reservations' && externalReservationId) {
        const { data: existing } = await admin
          .from('ota_reservation_events')
          .select('id, duplicate_count')
          .eq('hotel_id', job.hotel_id)
          .eq('provider', job.provider)
          .eq('external_reservation_id', String(externalReservationId))
          .maybeSingle();

        if (existing) {
          duplicates += 1;
          await admin.from('ota_reservation_events').update({
            duplicate_count: Number(existing.duplicate_count || 0) + 1,
            last_seen_at: new Date().toISOString(),
            payload: job.payload || {},
          }).eq('id', existing.id);
          await admin.from('ota_sync_queue').update({
            status: 'done',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', job.id);
          await admin.from('ota_sync_logs').insert({
            hotel_id: job.hotel_id, connection_id: job.connection_id,
            provider: job.provider, direction: job.direction,
            status: 'duplicate_ignored',
            payload: { queue_id: job.id, externalReservationId },
            duration_ms: Date.now() - started,
          });
          processed += 1;
          continue;
        }
      }

      // ── Parse provider-specific format ─────────────────────────────────
      const parsed = await parseJobPayload(job);

      if (parsed && job.hotel_id) {
        // Record the event
        await admin.from('ota_reservation_events').insert({
          hotel_id: job.hotel_id,
          provider: job.provider,
          external_reservation_id: parsed.externalId,
          status: 'received',
          payload: job.payload || {},
        }).maybeSingle();

        // Map to our reservation
        const result = await mapOtaReservation(parsed, job.hotel_id);
        if (result.ok) {
          mapped += 1;
          await admin.from('ota_reservation_events')
            .update({ status: result.action === 'cancelled' ? 'cancelled' : 'imported', reservation_id: result.reservationId })
            .eq('hotel_id', job.hotel_id)
            .eq('provider', job.provider)
            .eq('external_reservation_id', parsed.externalId);
        } else {
          const failReason = (result as { ok: false; reason: string }).reason;
          await alertOtaFailure({
            channel: job.provider,
            operation: 'map_reservation',
            error: failReason,
            hotelId: job.hotel_id,
          });
        }
      }

      await admin.from('ota_sync_logs').insert({
        hotel_id: job.hotel_id, connection_id: job.connection_id,
        provider: job.provider, direction: job.direction,
        status: 'success',
        payload: { queue_id: job.id, type: job.type, parsed: !!parsed, mapped: parsed ? mapped : 0 },
        duration_ms: Date.now() - started,
      });
      await admin.from('ota_sync_queue').update({
        status: 'done',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', job.id);
      processed += 1;
    } catch (e) {
      failed += 1;
      const attempts = Number(job.attempts || 0) + 1;
      const nextStatus = attempts >= 5 ? 'failed' : 'retry';
      const errMsg = e instanceof Error ? e.message : String(e);
      await admin.from('ota_sync_queue').update({
        status: nextStatus,
        last_error: errMsg,
        updated_at: new Date().toISOString(),
      }).eq('id', job.id);
      await admin.from('ota_sync_logs').insert({
        hotel_id: job.hotel_id, connection_id: job.connection_id,
        provider: job.provider, direction: job.direction,
        status: nextStatus,
        errors: { message: errMsg },
        duration_ms: Date.now() - started,
      });
      if (attempts >= 5) {
        await alertOtaFailure({ channel: job.provider, operation: 'process_job', error: errMsg, hotelId: job.hotel_id });
      }
    }
  }

  return NextResponse.json({ ok: true, processed, failed, duplicates, mapped });
}

export async function POST(request: Request) { return processQueue(request); }
export async function GET(request: Request)  { return processQueue(request); }
