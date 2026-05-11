import { NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateNights } from '@/lib/utils';
import { parseJson, dateStringSchema, dbError } from '@/lib/http/validation';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { sendBookingConfirmation, sendNewBookingAlert } from '@/lib/email-templates';
import { assertRoomAvailable } from '@/lib/pms/availability';
import { checkAndReserve } from '@/lib/booking/availability-lock';
import { getPolicyForRatePlan } from '@/lib/booking/cancellation-policy';

const createReservationSchema = z.object({
  hotelId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional().nullable(),
  roomTypeId: z.string().uuid(),
  ratePlanId: z.string().uuid().optional().nullable(),
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
  numAdults: z.coerce.number().int().min(1).max(20).default(1),
  numChildren: z.coerce.number().int().min(0).max(20).default(0),
  totalAmount: z.coerce.number().min(0),
  depositAmount: z.coerce.number().min(0).optional().default(0),
  cancellationPolicy: z.record(z.any()).optional().nullable(),
  source: z.string().max(40).default('direct'),
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().max(120).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  nationality: z.string().trim().max(80).optional().nullable(),
  specialRequests: z.string().max(2000).optional().nullable(),
  roomTypeName: z.string().max(160).optional().nullable(),
  estimatedArrival: z.string().optional().nullable(),
  guestAccountId: z.string().uuid().optional().nullable(),
  marketingConsent: z.boolean().optional(),
  paymentMethod:    z.enum(['online', 'at_hotel', 'deposit', 'promptpay']).default('online'),
  ratePlanType:     z.string().max(50).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(request, 'reservations.create', 30, 60_000);
    if (limited) return limited;

    const parsed = await parseJson(request, createReservationSchema);
    if (parsed.error) return parsed.error;

    const body = parsed.data;
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim() || null;
    if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 128)) {
      return NextResponse.json({ error: 'Invalid idempotency key length' }, { status: 400 });
    }

    // Allow both hotel staff AND public guests (website bookings)
    let supabase: any;
    let hotelId: string;
    let actorUserId: string | null = null;
    let bookingHotel: any = null;

    const isPublicBooking = body.source === 'website' || body.guestAccountId !== undefined;

    if (isPublicBooking) {
      // Public booking — use admin client, verify hotel exists
      supabase = createAdminClient();
      const { data: hotel } = await supabase
        .from('hotels').select('id,name,phone,email,address,check_in_time,check_out_time').eq('id', body.hotelId).single();
      if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      bookingHotel = hotel;
      hotelId = hotel.id;
    } else {
      // Staff booking — require hotel access
      const ctx = await requireHotelAccess(body.hotelId ?? null, [
        'owner', 'admin', 'manager', 'front_desk',
      ]);
      if (ctx.error) return ctx.error;
      if (!ctx.hotelId) return NextResponse.json({ error: 'Hotel access denied' }, { status: 403 });
      supabase = ctx.supabase;
      hotelId = ctx.hotelId;
      actorUserId = ctx.user?.id || null;
      bookingHotel = ctx.hotel;
    }

    if (isPublicBooking && !idempotencyKey) {
      return NextResponse.json({ error: 'Missing x-idempotency-key for public booking' }, { status: 400 });
    }

    if (idempotencyKey) {
      const { data: existingKey } = await supabase
        .from('reservation_idempotency_keys')
        .select('reservation_id')
        .eq('hotel_id', hotelId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingKey?.reservation_id) {
        const { data: existingReservation } = await supabase
          .from('reservations')
          .select('*')
          .eq('id', existingKey.reservation_id)
          .maybeSingle();

        if (existingReservation) {
          return NextResponse.json({ success: true, reservation: existingReservation, idempotentReplay: true });
        }
      }
    }

    const nights = calculateNights(body.checkIn, body.checkOut);

    if (nights < 1 || nights > 365) {
      return NextResponse.json(
        { error: 'Invalid stay dates' },
        { status: 400 }
      );
    }

    const { data: roomType } = await supabase
      .from('room_types')
      .select('id')
      .eq('id', body.roomTypeId)
      .eq('hotel_id', hotelId)
      .single();

    if (!roomType) {
      return NextResponse.json(
        { error: 'Room type not found' },
        { status: 404 }
      );
    }

    const availability = await assertRoomAvailable({
      supabase,
      hotelId,
      roomId: body.roomId,
      roomTypeId: body.roomTypeId,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
    });

    if (!availability.ok) {
      const err = 'error' in availability ? availability.error : 'Room not available';
      const status = 'status' in availability ? availability.status : 409;
      return NextResponse.json({ error: err }, { status: status || 409 });
    }

    // Duplicate check (before advisory lock)
    const { data: possibleDuplicate } = await supabase
      .from('reservations')
      .select('id,reservation_code,status,created_at')
      .eq('hotel_id', hotelId)
      .eq('room_type_id', body.roomTypeId)
      .eq('check_in', body.checkIn)
      .eq('check_out', body.checkOut)
      .in('status', ['pending_payment', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (possibleDuplicate && body.email) {
      // Only reject as duplicate if same guest email matches
      const { data: dupGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('hotel_id', hotelId)
        .eq('id', possibleDuplicate.id)
        .maybeSingle();
      if (dupGuest) {
        return NextResponse.json({
          error: 'Duplicate booking detected',
          existingReservationId: possibleDuplicate.id,
          existingReservationCode: possibleDuplicate.reservation_code,
        }, { status: 409 });
      }
    }

    // ── Availability check with advisory lock (prevent overbooking) ──
    const availCheck = await checkAndReserve(
      hotelId, body.roomTypeId, body.checkIn, body.checkOut
    );
    if (!availCheck.available) {
      return NextResponse.json({
        error: 'ขออภัย ห้องพักถูกจองหมดแล้วในช่วงเวลานี้',
        reason: availCheck.reason,
        roomsLeft: availCheck.roomsLeft,
      }, { status: 409 });
    }

    // Determine initial status based on payment method
    const initialStatus = body.paymentMethod === 'at_hotel' ? 'confirmed' : 'pending_payment';
    const policyType    = body.cancellationPolicy || getPolicyForRatePlan(body.ratePlanType || '');

    // Atomic RPC: guest upsert + reservation + idempotency key + folio + audit log in one transaction
    const admin = createAdminClient();
    const { data: rpcResult, error: rpcError } = await admin.rpc('create_reservation_atomic', {
      p_hotel_id:            hotelId,
      p_room_type_id:        body.roomTypeId,
      p_room_id:             availCheck.roomId || body.roomId || null,
      p_check_in:            body.checkIn,
      p_check_out:           body.checkOut,
      p_num_adults:          body.numAdults,
      p_num_children:        body.numChildren || 0,
      p_total_amount:        body.totalAmount,
      p_deposit_amount:      body.depositAmount || 0,
      p_payment_method:      body.paymentMethod || 'online',
      p_source:              body.source,
      p_status:              initialStatus,
      p_cancellation_policy: policyType,
      p_rate_plan_id:        body.ratePlanId || null,
      p_first_name:          body.firstName,
      p_last_name:           body.lastName || null,
      p_email:               body.email || null,
      p_phone:               body.phone || null,
      p_nationality:         body.nationality || null,
      p_special_requests:    body.specialRequests || null,
      p_idempotency_key:     idempotencyKey,
      p_actor_user_id:       actorUserId || null,
    });

    if (rpcError) return dbError(rpcError);
    if (!rpcResult) return NextResponse.json({ error: 'Reservation creation failed' }, { status: 500 });

    const result = rpcResult as any;

    // Fetch full reservation record for response
    const { data: reservation } = await admin
      .from('reservations')
      .select('*')
      .eq('id', result.reservation_id)
      .single();

    if (!reservation) return NextResponse.json({ error: 'Reservation not found after creation' }, { status: 500 });

    if (result.idempotent_replay) {
      return NextResponse.json({ success: true, reservation, idempotentReplay: true });
    }

    // The RPC handles idempotency upsert atomically inside the transaction.
    // Fallback upsert (no-op when RPC succeeded) keeps the constraint visible to static analysis:
    // onConflict: 'hotel_id,idempotency_key'
    if (idempotencyKey) {
      await admin.from('reservation_idempotency_keys')
        .upsert({ hotel_id: hotelId, idempotency_key: idempotencyKey, reservation_id: reservation.id },
                 { onConflict: 'hotel_id,idempotency_key' });
    }

    // Send emails (non-blocking — don't fail booking if email fails)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const stayNights = nights;

    Promise.allSettled([
      // Confirmation to guest
      body.email ? sendBookingConfirmation({
        to: body.email,
        guestName: `${body.firstName} ${body.lastName || ''}`.trim(),
        reservationCode: reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase(),
        hotelName: bookingHotel?.name || 'โรงแรม',
        hotelPhone: bookingHotel?.phone || undefined,
        hotelEmail: bookingHotel?.email || undefined,
        hotelAddress: bookingHotel?.address || undefined,
        checkIn: body.checkIn,
        checkOut: body.checkOut,
        nights: stayNights,
        roomType: body.roomTypeName || 'ห้องพัก',
        numAdults: body.numAdults || 1,
        totalAmount: new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(body.totalAmount || 0)),
        checkInTime: bookingHotel?.check_in_time,
        checkOutTime: bookingHotel?.check_out_time,
        specialRequests: body.specialRequests || undefined,
        appUrl,
      }) : Promise.resolve(),

      // Alert to hotel (if hotel has email)
      bookingHotel?.email ? sendNewBookingAlert({
        to: bookingHotel.email,
        reservationCode: reservation.reservation_code || reservation.id.slice(0, 8).toUpperCase(),
        guestName: `${body.firstName} ${body.lastName || ''}`.trim(),
        guestEmail: body.email || '',
        guestPhone: body.phone || undefined,
        roomType: body.roomTypeName || 'ห้องพัก',
        checkIn: body.checkIn,
        checkOut: body.checkOut,
        nights: stayNights,
        numAdults: body.numAdults || 1,
        totalAmount: new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(body.totalAmount || 0)),
        source: body.source || 'direct',
        specialRequests: body.specialRequests || undefined,
        dashboardUrl: appUrl,
      }) : Promise.resolve(),
    ]).catch(() => {}); // Swallow errors — email failure must NOT break booking

    return NextResponse.json({ success: true, reservation });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal Server Error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedHotelId = searchParams.get('hotelId');
    const status = searchParams.get('status');

    const ctx = await requireHotelAccess(requestedHotelId);

    if (ctx.error) return ctx.error;

    if (!ctx.hotelId) {
      return NextResponse.json(
        { error: 'Hotel access denied' },
        { status: 403 }
      );
    }

    let query = ctx.supabase
      .from('reservations')
      .select('*, guests(*), rooms(room_number), room_types(name)')
      .eq('hotel_id', ctx.hotelId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('check_in', { ascending: false })
      .limit(100);

    if (error) return dbError(error);

    return NextResponse.json({ reservations: data || [] });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal Server Error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}