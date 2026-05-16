import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { parseJson } from '@/lib/http/validation';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const schema = z.object({
  reason: z.string().min(1).max(500),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const csrf = validateCsrfOrigin(request as any);
  if (csrf.ok === false) {
    return NextResponse.json({ error: `CSRF: ${csrf.reason}` }, { status: 403 });
  }

  const ctx = await requireHotelAccess(null, ['owner', 'admin', 'manager', 'accounting', 'accounting_manager']);
  if (ctx.error) return ctx.error;
  if (!ctx.profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;
  const { reason } = parsed.data;

  const admin = createAdminClient();

  const { data: invoice, error: fetchErr } = await admin
    .from('invoices')
    .select('id, hotel_id, invoice_number, status, total_amount')
    .eq('id', id)
    .single();

  if (fetchErr || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Verify hotel ownership
  const { data: hotel } = await admin
    .from('hotels')
    .select('organization_id')
    .eq('id', invoice.hotel_id)
    .single();

  if (!hotel || hotel.organization_id !== ctx.profile.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (invoice.status === 'cancelled') {
    return NextResponse.json({ error: 'Invoice is already voided' }, { status: 409 });
  }

  if (invoice.status === 'paid') {
    return NextResponse.json({ error: 'Cannot void a paid invoice — issue a credit note instead' }, { status: 409 });
  }

  const { error: updateErr } = await admin
    .from('invoices')
    .update({
      status: 'cancelled',
      // Store void reason in etax_response field (available in schema)
      etax_response: { void_reason: reason, voided_at: new Date().toISOString(), voided_by: ctx.user!.id },
    })
    .eq('id', id);

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to void invoice' }, { status: 500 });
  }

  await admin.from('audit_logs').insert({
    hotel_id: invoice.hotel_id,
    user_id: ctx.user!.id,
    action: 'invoice.voided',
    entity_type: 'invoice',
    entity_id: id,
    changes: {
      invoice_number: invoice.invoice_number,
      total_amount: invoice.total_amount,
      reason,
      voided_at: new Date().toISOString(),
    },
  });

  return NextResponse.json({ success: true, invoiceId: id });
}
