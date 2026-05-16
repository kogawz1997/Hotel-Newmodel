import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { generateInvoicePdf } from '@/lib/pdf/invoice-pdf';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  if (!ctx.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: invoice, error } = await admin
    .from('invoices')
    .select('*, invoice_items(*), hotels(name, address, city, phone, email, tax_id, vat_rate), reservations(reservation_code, check_in, check_out, nights)')
    .eq('id', id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const { data: hotel } = await admin
    .from('hotels')
    .select('organization_id')
    .eq('id', invoice.hotel_id)
    .single();

  if (!hotel || hotel.organization_id !== ctx.profile.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const h = invoice.hotels as any;
  const items: any[] = invoice.invoice_items || [];
  const vatRate = Number(h?.vat_rate || 0.07);
  const res = invoice.reservations as any;

  const lineItems = items.length > 0
    ? items.map((item: any) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        amount: Number(item.amount),
      }))
    : [{
        description: `Room charge${res ? ` (${res.reservation_code})` : ''}`,
        quantity: 1,
        unitPrice: Number(invoice.subtotal || invoice.total_amount),
        amount: Number(invoice.subtotal || invoice.total_amount),
      }];

  const typeLabel = invoice.invoice_type === 'tax_invoice' ? 'Tax Invoice / ใบกำกับภาษี' : 'Receipt / ใบเสร็จรับเงิน';

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber: invoice.invoice_number,
    invoiceType: typeLabel,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    hotel: {
      name: h?.name,
      address: h?.address,
      city: h?.city,
      phone: h?.phone,
      email: h?.email,
      taxId: h?.tax_id,
    },
    buyer: {
      name: invoice.buyer_name,
      address: invoice.buyer_address,
      taxId: invoice.buyer_tax_id,
    },
    reservation: res
      ? {
          code: res.reservation_code,
          checkIn: res.check_in,
          checkOut: res.check_out,
          nights: res.nights || 1,
        }
      : undefined,
    lineItems,
    subtotal: Number(invoice.subtotal),
    vatRate,
    vatAmount: Number(invoice.vat_amount),
    totalAmount: Number(invoice.total_amount),
    status: invoice.status,
    isEtax: invoice.is_etax,
  });

  const filename = `invoice-${invoice.invoice_number}.pdf`;
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
