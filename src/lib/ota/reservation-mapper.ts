/**
 * OTA Reservation Mapper
 * Maps a ParsedOtaReservation → our reservations table row
 * Creates/updates guest + reservation + folio atomically
 */
import { createAdminClient } from '@/lib/supabase/server';
import type { ParsedOtaReservation } from './parsers/booking-com';
import { alertOtaFailure } from '@/lib/ops/alerts';

export type MapResult =
  | { ok: true;  action: 'created' | 'updated' | 'cancelled'; reservationId: string }
  | { ok: false; reason: string };

export async function mapOtaReservation(
  parsed: ParsedOtaReservation,
  hotelId: string,
): Promise<MapResult> {
  const admin = createAdminClient();

  try {
    // ── Handle cancellation ──────────────────────────────────────────────
    if (parsed.status === 'cancelled') {
      const { data: existing } = await admin
        .from('reservations')
        .select('id, status')
        .eq('hotel_id', hotelId)
        .eq('ota_booking_ref', parsed.externalId)
        .maybeSingle();

      if (existing && !['cancelled', 'checked_out'].includes(existing.status)) {
        await admin.from('reservations').update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: `OTA cancellation from ${parsed.source}`,
        }).eq('id', existing.id);

        await admin.from('audit_logs').insert({
          hotel_id: hotelId,
          action: 'reservation.ota_cancelled',
          entity_type: 'reservation',
          entity_id: existing.id,
          changes: { source: parsed.source, externalId: parsed.externalId },
        });

        return { ok: true, action: 'cancelled', reservationId: existing.id };
      }
      return { ok: false, reason: 'No matching active reservation to cancel' };
    }

    // ── Upsert guest ─────────────────────────────────────────────────────
    let guestId: string;
    const { data: existingGuest } = await admin
      .from('guests')
      .select('id')
      .eq('hotel_id', hotelId)
      .eq('email', parsed.email ?? '')
      .maybeSingle();

    if (existingGuest) {
      guestId = existingGuest.id;
    } else {
      const { data: newGuest, error: gErr } = await admin
        .from('guests')
        .insert({
          hotel_id:    hotelId,
          first_name:  parsed.firstName,
          last_name:   parsed.lastName,
          email:       parsed.email   ?? null,
          phone:       parsed.phone   ?? null,
          nationality: parsed.nationality ?? null,
          source:      parsed.source,
        })
        .select('id')
        .single();
      if (gErr || !newGuest) throw new Error(`Guest insert failed: ${gErr?.message}`);
      guestId = newGuest.id;
    }

    // ── Find matching room type by OTA code ───────────────────────────────
    let roomTypeId: string | null = null;
    if (parsed.roomTypeCode) {
      const { data: rt } = await admin
        .from('room_types')
        .select('id')
        .eq('hotel_id', hotelId)
        .eq('ota_room_type_code', parsed.roomTypeCode)
        .maybeSingle();
      roomTypeId = rt?.id ?? null;
    }

    // Fallback: first room type of hotel
    if (!roomTypeId) {
      const { data: rt } = await admin
        .from('room_types')
        .select('id')
        .eq('hotel_id', hotelId)
        .limit(1)
        .maybeSingle();
      roomTypeId = rt?.id ?? null;
    }

    if (!roomTypeId) {
      return { ok: false, reason: 'No room type found for hotel' };
    }

    // ── Check for existing reservation (modification) ─────────────────────
    const { data: existing } = await admin
      .from('reservations')
      .select('id, status')
      .eq('hotel_id', hotelId)
      .eq('ota_booking_ref', parsed.externalId)
      .maybeSingle();

    if (existing) {
      // Update existing (modification)
      await admin.from('reservations').update({
        check_in:         parsed.checkIn,
        check_out:        parsed.checkOut,
        num_adults:       parsed.numAdults,
        num_children:     parsed.numChildren,
        total_amount:     parsed.totalAmount,
        special_requests: parsed.specialRequests ?? null,
        updated_at:       new Date().toISOString(),
      }).eq('id', existing.id);

      await admin.from('audit_logs').insert({
        hotel_id:    hotelId,
        action:      'reservation.ota_modified',
        entity_type: 'reservation',
        entity_id:   existing.id,
        changes:     { source: parsed.source, externalId: parsed.externalId },
      });

      return { ok: true, action: 'updated', reservationId: existing.id };
    }

    // ── Create new reservation ────────────────────────────────────────────
    const { data: reservation, error: rErr } = await admin
      .from('reservations')
      .insert({
        hotel_id:         hotelId,
        guest_id:         guestId,
        room_type_id:     roomTypeId,
        check_in:         parsed.checkIn,
        check_out:        parsed.checkOut,
        num_adults:       parsed.numAdults,
        num_children:     parsed.numChildren,
        total_amount:     parsed.totalAmount,
        deposit_amount:   0,
        currency:         parsed.currency,
        payment_method:   'online',
        payment_status:   'paid',       // OTA bookings are pre-paid via platform
        status:           'confirmed',
        source:           parsed.source,
        ota_booking_ref:  parsed.externalId,
        special_requests: parsed.specialRequests ?? null,
      })
      .select('id')
      .single();

    if (rErr || !reservation) throw new Error(`Reservation insert failed: ${rErr?.message}`);

    // Create folio
    await admin.from('folios').insert({
      reservation_id: reservation.id,
      hotel_id:       hotelId,
      status:         'open',
      total_charges:  parsed.totalAmount,
      balance:        0,               // Pre-paid via OTA
    });

    await admin.from('audit_logs').insert({
      hotel_id:    hotelId,
      action:      'reservation.ota_created',
      entity_type: 'reservation',
      entity_id:   reservation.id,
      changes:     { source: parsed.source, externalId: parsed.externalId, amount: parsed.totalAmount },
    });

    return { ok: true, action: 'created', reservationId: reservation.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await alertOtaFailure({ channel: parsed.source, operation: 'map_reservation', error: msg, hotelId });
    return { ok: false, reason: msg };
  }
}
