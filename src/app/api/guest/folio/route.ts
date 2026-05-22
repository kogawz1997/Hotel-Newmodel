import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find current checked-in reservation for this guest
  const { data: reservation, error } = await supabase
    .from('reservations')
    .select(`
      id, reservation_code, status, check_in, check_out,
      total_amount, paid_amount, payment_status, num_adults,
      room_types(name),
      rooms(room_number, floor),
      hotels(id, name, currency, check_out_time),
      folios(id, folio_items(id, description, amount, type, created_at, quantity))
    `)
    .eq('guest_account_id', user.id)
    .eq('status', 'checked_in')
    .order('check_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!reservation) return NextResponse.json({ reservation: null });

  const folio = Array.isArray(reservation.folios)
    ? (reservation.folios as any[])[0]
    : (reservation.folios as any) ?? null;
  const items: any[] = folio?.folio_items ?? [];
  const chargesTotal = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const roomCharge = Number(reservation.total_amount || 0);
  const paidAmount = Number(reservation.paid_amount || 0);
  const outstanding = Math.max(0, roomCharge + chargesTotal - paidAmount);

  return NextResponse.json({
    reservation: {
      ...reservation,
      folio_items: items,
      charges_total: chargesTotal,
      room_charge: roomCharge,
      paid_amount: paidAmount,
      outstanding,
    },
  });
}
