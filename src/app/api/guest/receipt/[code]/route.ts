import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: res } = await supabase
    .from('reservations')
    .select(`
      reservation_code, status, check_in, check_out, nights,
      total_amount, paid_amount, payment_status, num_adults, num_children,
      special_requests, created_at,
      room_types(name, base_rate),
      rooms(room_number),
      guests(first_name, last_name, email),
      hotels(name, address, city, phone, email, tax_id, logo_url, currency, vat_rate),
      folio_items(description, amount, item_type, quantity)
    `)
    .eq('reservation_code', code.toUpperCase())
    .eq('guest_account_id', user.id)
    .single();

  if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const hotel = res.hotels as any;
  const guest = res.guests as any;
  const rt = res.room_types as any;
  const room = res.rooms as any;
  const items: any[] = (res.folio_items as any[]) || [];
  const vatRate = Number(hotel?.vat_rate || 0.07);
  const subtotal = Number(res.total_amount);
  const vatAmt = subtotal * vatRate / (1 + vatRate);
  const currency = hotel?.currency || 'THB';

  function fmt(n: number) {
    return `${currency} ${n.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
  }

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<title>ใบเสร็จ ${res.reservation_code}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 13px; color: #222; background: #fff; }
  .page { max-width: 680px; margin: 0 auto; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #222; padding-bottom: 20px; }
  .hotel-name { font-size: 22px; font-weight: 700; }
  .hotel-meta { font-size: 11px; color: #666; margin-top: 4px; line-height: 1.6; }
  .receipt-title { font-size: 18px; font-weight: 600; text-align: right; }
  .receipt-meta { font-size: 11px; color: #666; text-align: right; margin-top: 4px; line-height: 1.7; }
  .guest-section { margin-bottom: 24px; }
  .guest-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin-bottom: 8px; }
  .guest-section p { font-size: 13px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #f4f4f4; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; }
  td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
  .amount { text-align: right; }
  .totals { margin-left: auto; width: 280px; margin-top: 8px; }
  .totals tr td:first-child { color: #555; }
  .totals tr td:last-child { text-align: right; font-weight: 500; }
  .totals tr.total td { font-weight: 700; font-size: 14px; border-top: 2px solid #222; padding-top: 8px; }
  .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 16px; font-size: 11px; color: #888; text-align: center; }
  @media print { body { background: white; } .page { padding: 20px; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      ${hotel?.logo_url ? `<img src="${hotel.logo_url}" alt="${hotel?.name}" style="height:40px;margin-bottom:8px;" />` : ''}
      <div class="hotel-name">${hotel?.name || 'Hotel'}</div>
      <div class="hotel-meta">
        ${hotel?.address ? hotel.address + '<br>' : ''}
        ${hotel?.city || ''}<br>
        ${hotel?.phone ? `โทร: ${hotel.phone}` : ''}
        ${hotel?.email ? ` · ${hotel.email}` : ''}<br>
        ${hotel?.tax_id ? `เลขผู้เสียภาษี: ${hotel.tax_id}` : ''}
      </div>
    </div>
    <div>
      <div class="receipt-title">ใบเสร็จรับเงิน</div>
      <div class="receipt-meta">
        เลขที่: ${res.reservation_code}<br>
        วันที่ออก: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  </div>

  <div class="guest-section">
    <h3>รายละเอียดผู้เข้าพัก</h3>
    <p><strong>${guest?.first_name || ''} ${guest?.last_name || ''}</strong></p>
    ${guest?.email ? `<p>${guest.email}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>รายการ</th>
        <th>จำนวน</th>
        <th class="amount">ราคา</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${rt?.name || 'ห้องพัก'} (${res.check_in} → ${res.check_out})${room?.room_number ? ` · ห้อง ${room.room_number}` : ''}</td>
        <td>${res.nights} คืน</td>
        <td class="amount">${fmt(subtotal - items.reduce((s: number, i: any) => s + Number(i.amount || 0), 0))}</td>
      </tr>
      ${items.map(item => `
      <tr>
        <td>${item.description}</td>
        <td>${item.quantity || 1}</td>
        <td class="amount">${fmt(Number(item.amount))}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <table class="totals">
    <tbody>
      <tr><td>ราคาก่อน VAT</td><td>${fmt(subtotal - vatAmt)}</td></tr>
      <tr><td>VAT ${(vatRate * 100).toFixed(0)}%</td><td>${fmt(vatAmt)}</td></tr>
      <tr class="total"><td>รวมทั้งสิ้น</td><td>${fmt(subtotal)}</td></tr>
      <tr><td>ชำระแล้ว</td><td>${fmt(Number(res.paid_amount))}</td></tr>
    </tbody>
  </table>

  <div class="footer">
    ขอบคุณที่เลือกใช้บริการ ${hotel?.name || ''} · เอกสารนี้ออกโดยระบบอัตโนมัติ
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="receipt-${res.reservation_code}.html"`,
    },
  });
}
