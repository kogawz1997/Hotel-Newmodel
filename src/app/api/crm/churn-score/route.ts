import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { getChurnRiskGuests } from '@/lib/crm/segment-engine';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const hotelId = sp.get('hotel_id');
  const thresholdDays = parseInt(sp.get('threshold_days') || '180', 10);

  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const guests = await getChurnRiskGuests(ctx.hotelId, ctx.supabase, thresholdDays);

  return NextResponse.json({
    at_risk_guests: guests,
    total: guests.length,
    threshold_days: thresholdDays,
  });
}
