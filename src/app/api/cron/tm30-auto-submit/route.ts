import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { tm30Service } from '@/lib/compliance';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const { data: pending, error } = await admin
    .from('reservations')
    .select('id, hotel_id, guest_id, check_in, check_out, guests(*), hotels(name,address)')
    .eq('check_in', yesterday)
    .in('status', ['checked_in', 'checked_out'])
    .or('tm30_reported.is.null,tm30_reported.eq.false');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let submitted = 0;
  let failed = 0;

  for (const r of pending || []) {
    const nationality = String((r as any).guests?.nationality || '').trim();
    if (!nationality || ['TH', 'THA', 'Thai', 'Thailand'].includes(nationality)) continue;
    const passport = (r as any).guests?.passport_number;
    if (!passport) { failed++; continue; }

    const result = await tm30Service.submit({
      passportNumber: passport,
      nationality,
      fullName: `${(r as any).guests?.first_name || ''} ${(r as any).guests?.last_name || ''}`.trim(),
      arrivalDate: (r as any).check_in,
      hotelName: (r as any).hotels?.name || 'Hotel',
      hotelAddress: (r as any).hotels?.address || '',
    });

    await admin.from('tm30_reports').insert({
      hotel_id: (r as any).hotel_id,
      guest_id: (r as any).guest_id,
      reservation_id: (r as any).id,
      passport_number: passport,
      nationality,
      arrival_date: (r as any).check_in,
      departure_date: (r as any).check_out,
      status: result.success ? 'submitted' : 'pending',
      submitted_at: result.success ? new Date().toISOString() : null,
      confirmation_number: result.confirmationNumber,
      response_data: result,
    });

    if (result.success) {
      submitted++;
      await admin.from('reservations').update({ tm30_reported: true, tm30_reported_at: new Date().toISOString() }).eq('id', (r as any).id);
    } else failed++;
  }

  return NextResponse.json({ date: yesterday, pending: pending?.length || 0, submitted, failed });
}
