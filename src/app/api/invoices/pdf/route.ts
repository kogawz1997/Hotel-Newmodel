import { NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { rateLimit } from '@/lib/security/rate-limit';
import { generateInvoicePdf } from '@/lib/pdf/invoice-pdf';

export async function GET(request: Request) {
  const limited = await rateLimit(request, 'invoices.pdf', 20, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const reservationId = searchParams.get('reservationId');
  if (!reservationId) return NextResponse.json({ error: 'reservationId required' }, { status: 400 });

  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;
  if (!ctx.hotelId) {
    return NextResponse.json({ error: 'Hotel access denied' }, { status: 403 });
  }

  const { data: reservation, error } = await ctx.supabase
    .from('reservations')
    .select(`
      *,
      guests(first_name, last_name, email, phone, nationality, passport_number),
      room_types(name, base_rate),
      rooms(room_number),
      folios(*, folio_items(*)),
      hotels(name, address, city, phone, email, tax_id, vat_rate, currency)
    `)
    .eq('id', reservationId)
    .eq('hotel_id', ctx.hotelId)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  const hotel = reservation.hotels as any;
  const guest = reservation.guests as any;
  const folio = Array.isArray(reservation.folios) ? reservation.folios[0] : (reservation.folios as any);
  const folioItems: any[] = folio?.folio_items || [];

  const vatRate = Number(hotel?.vat_rate || 0.07);
  const totalAmount = Number(reservation.total_amount || 0);
  const subtotal = totalAmount / (1 + vatRate);
  const vatAmount = totalAmount - subtotal;

  const invoiceNumber = `RCP-${reservation.reservation_code}`;
  const issueDate = new Date().toISOString().slice(0, 10);

  const lineItems = folioItems.length > 0
    ? folioItems.map((item: any) => ({
        description: item.description || 'Room charge',
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unit_price || item.amount || 0),
        amount: Number(item.amount || 0),
      }))
    : [{
        description: `${reservation.room_types?.name || 'Room'} (${reservation.nights || 1} night${(reservation.nights || 1) > 1 ? 's' : ''})`,
        quantity: Number(reservation.nights || 1),
        unitPrice: subtotal / Number(reservation.nights || 1),
        amount: subtotal,
      }];

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber,
    invoiceType: 'Receipt / ใบเสร็จรับเงิน',
    issueDate,
    hotel: {
      name: hotel?.name,
      address: hotel?.address,
      city: hotel?.city,
      phone: hotel?.phone,
      email: hotel?.email,
      taxId: hotel?.tax_id,
    },
    buyer: {
      name: guest ? `${guest.first_name || ''} ${guest.last_name || ''}`.trim() : undefined,
      email: guest?.email,
      phone: guest?.phone,
      passportNumber: guest?.passport_number,
    },
    reservation: {
      code: reservation.reservation_code,
      checkIn: reservation.check_in,
      checkOut: reservation.check_out,
      nights: Number(reservation.nights || 1),
    },
    lineItems,
    subtotal,
    vatRate,
    vatAmount,
    totalAmount,
    paidAmount: Number(reservation.paid_amount || 0),
    status: reservation.status,
  });

  const filename = `receipt-${reservation.reservation_code}.pdf`;
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
