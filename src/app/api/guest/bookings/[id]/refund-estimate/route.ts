import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateCancellation } from '@/lib/booking/cancellation-policy';
import type { CancellationPolicy, PolicyType } from '@/lib/booking/cancellation-policy';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, status, check_in, total_amount, paid_amount, guest_account_id, cancellation_policy, room_types(cancellation_policy)')
    .eq('id', id)
    .single();

  if (!reservation || reservation.guest_account_id !== user.id) {
    return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 });
  }

  if (!['confirmed', 'pending', 'pending_payment'].includes(reservation.status)) {
    return NextResponse.json({ error: 'ไม่สามารถยกเลิกการจองนี้ได้' }, { status: 400 });
  }

  const paidAmount = Number(reservation.paid_amount || reservation.total_amount || 0);

  const roomTypePolicy = (reservation.room_types as any)?.cancellation_policy;
  const policy: CancellationPolicy | PolicyType =
    reservation.cancellation_policy || roomTypePolicy || 'flexible';

  const result = calculateCancellation(policy, reservation.check_in, paidAmount);

  return NextResponse.json({
    checkIn: reservation.check_in,
    paidAmount,
    totalAmount: Number(reservation.total_amount || 0),
    ...result,
  });
}
