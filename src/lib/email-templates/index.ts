import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL || 'noreply@maitri.co',
  name: process.env.SENDGRID_FROM_NAME || 'Maitri',
};

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif;color:#2A2522;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <!-- Header -->
      <tr><td style="background:#2A2522;border-radius:12px 12px 0 0;padding:24px 32px;">
        <span style="color:#FAF7F2;font-size:22px;font-weight:700;letter-spacing:-0.5px;">🪷 Maitri</span>
      </td></tr>
      <!-- Body -->
      <tr><td style="background:#fff;padding:32px;border-left:1px solid #eee;border-right:1px solid #eee;">
        ${body}
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#F5F2ED;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#888;">Powered by Maitri PMS · Built in Thailand 🇹🇭</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#888;width:140px;">${label}</td>
    <td style="padding:6px 0;font-size:13px;font-weight:600;color:#2A2522;">${value}</td>
  </tr>`;
}

function btn(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#C66A30;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">${text}</a>`;
}

// ─── 1. Booking Confirmation ─────────────────────────────────────────────────

interface BookingConfirmationData {
  to: string;
  guestName: string;
  reservationCode: string;
  hotelName: string;
  hotelPhone?: string;
  hotelEmail?: string;
  hotelAddress?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  numAdults: number;
  totalAmount: string;
  checkInTime?: string;
  checkOutTime?: string;
  specialRequests?: string;
  appUrl?: string;
}

export async function sendBookingConfirmation(data: BookingConfirmationData) {
  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#2A2522;">จองสำเร็จแล้ว! 🎉</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">สวัสดีคุณ ${data.guestName} ขอขอบคุณที่เลือกพักกับเรา</p>

    <!-- Code box -->
    <div style="background:#FAF7F2;border:2px dashed #C66A30;border-radius:10px;padding:16px 24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">รหัสการจอง</p>
      <p style="margin:0;font-family:monospace;font-size:28px;font-weight:700;color:#C66A30;letter-spacing:4px;">${data.reservationCode}</p>
    </div>

    <!-- Details table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;margin-bottom:24px;">
      ${row('🏨 โรงแรม', data.hotelName)}
      ${row('🛏 ประเภทห้อง', data.roomType)}
      ${row('📅 เช็คอิน', `${data.checkIn} · หลัง ${data.checkInTime || '14:00'} น.`)}
      ${row('📅 เช็คเอาท์', `${data.checkOut} · ก่อน ${data.checkOutTime || '12:00'} น.`)}
      ${row('🌙 จำนวนคืน', `${data.nights} คืน`)}
      ${row('👤 จำนวนผู้เข้าพัก', `${data.numAdults} คน`)}
      ${row('💰 ยอดรวม (รวม VAT)', data.totalAmount)}
    </table>

    ${data.specialRequests ? `
    <div style="background:#FFF8F5;border-left:3px solid #C66A30;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;color:#C66A30;">คำขอพิเศษ</p>
      <p style="margin:0;font-size:13px;color:#555;">${data.specialRequests}</p>
    </div>` : ''}

    ${data.hotelPhone || data.hotelAddress ? `
    <div style="background:#F8F8F8;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;color:#888;">ติดต่อโรงแรม</p>
      ${data.hotelPhone ? `<p style="margin:0 0 4px;font-size:13px;">📞 ${data.hotelPhone}</p>` : ''}
      ${data.hotelEmail ? `<p style="margin:0 0 4px;font-size:13px;">✉️ ${data.hotelEmail}</p>` : ''}
      ${data.hotelAddress ? `<p style="margin:0;font-size:13px;">📍 ${data.hotelAddress}</p>` : ''}
    </div>` : ''}

    ${data.appUrl ? `<p style="text-align:center;margin:0;">${btn('ดูการจองของฉัน', `${data.appUrl}/portal/bookings`)}</p>` : ''}
  `;

  await sgMail.send({
    to: data.to,
    from: FROM,
    subject: `✅ ยืนยันการจอง ${data.reservationCode} — ${data.hotelName}`,
    html: base(`ยืนยันการจอง ${data.reservationCode}`, body),
    text: `จองสำเร็จ! รหัส: ${data.reservationCode} | ${data.hotelName} | เช็คอิน: ${data.checkIn} | ยอดรวม: ${data.totalAmount}`,
  });
}

// ─── 2. Cancellation ─────────────────────────────────────────────────────────

interface CancellationData {
  to: string;
  guestName: string;
  reservationCode: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  reason?: string;
  appUrl?: string;
}

export async function sendCancellationEmail(data: CancellationData) {
  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#2A2522;">ยกเลิกการจองเรียบร้อย</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">สวัสดีคุณ ${data.guestName}</p>

    <div style="background:#FFF5F5;border:1px solid #FCA5A5;border-radius:10px;padding:16px 24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;">รหัสที่ยกเลิก</p>
      <p style="margin:0;font-family:monospace;font-size:24px;font-weight:700;color:#DC2626;letter-spacing:3px;text-decoration:line-through;">${data.reservationCode}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;margin-bottom:24px;">
      ${row('🏨 โรงแรม', data.hotelName)}
      ${row('📅 เช็คอิน (เดิม)', data.checkIn)}
      ${row('📅 เช็คเอาท์ (เดิม)', data.checkOut)}
      ${data.reason ? row('📝 เหตุผล', data.reason) : ''}
    </table>

    <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:24px;">
      หากคุณต้องการจองใหม่ สามารถเข้าไปที่เว็บไซต์ของเราได้เลย
      หากมีข้อสงสัยกรุณาติดต่อโรงแรมโดยตรง
    </p>

    ${data.appUrl ? `<p style="text-align:center;margin:0;">${btn('จองใหม่', `${data.appUrl}`)}</p>` : ''}
  `;

  await sgMail.send({
    to: data.to,
    from: FROM,
    subject: `❌ ยกเลิกการจอง ${data.reservationCode} — ${data.hotelName}`,
    html: base(`ยกเลิกการจอง ${data.reservationCode}`, body),
    text: `ยกเลิกการจองสำเร็จ รหัส: ${data.reservationCode}`,
  });
}

// ─── 3. New Booking Alert (to hotel staff) ───────────────────────────────────

interface NewBookingAlertData {
  to: string;
  reservationCode: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  numAdults: number;
  totalAmount: string;
  source: string;
  specialRequests?: string;
  dashboardUrl?: string;
}

export async function sendNewBookingAlert(data: NewBookingAlertData) {
  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#2A2522;">มีการจองใหม่! 🔔</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">รหัส <strong>${data.reservationCode}</strong> จากช่องทาง ${data.source}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;margin-bottom:24px;">
      ${row('👤 แขก', `${data.guestName}`)}
      ${row('✉️ อีเมล', data.guestEmail)}
      ${data.guestPhone ? row('📞 โทร', data.guestPhone) : ''}
      ${row('🛏 ห้อง', data.roomType)}
      ${row('📅 เช็คอิน', data.checkIn)}
      ${row('📅 เช็คเอาท์', data.checkOut)}
      ${row('🌙 คืน', `${data.nights} คืน · ${data.numAdults} คน`)}
      ${row('💰 ยอดรวม', data.totalAmount)}
      ${data.specialRequests ? row('📝 คำขอพิเศษ', data.specialRequests) : ''}
    </table>

    ${data.dashboardUrl ? `<p style="text-align:center;margin:0;">${btn('ดูใน Dashboard', `${data.dashboardUrl}/dashboard/reservations`)}</p>` : ''}
  `;

  await sgMail.send({
    to: data.to,
    from: FROM,
    subject: `🔔 จองใหม่ ${data.reservationCode} — ${data.guestName} (${data.checkIn})`,
    html: base(`จองใหม่ ${data.reservationCode}`, body),
    text: `จองใหม่ รหัส: ${data.reservationCode} แขก: ${data.guestName} เช็คอิน: ${data.checkIn}`,
  });
}

// ─── 4. Check-in Reminder (24h before) ──────────────────────────────────────

interface CheckInReminderData {
  to: string;
  guestName: string;
  reservationCode: string;
  hotelName: string;
  hotelAddress?: string;
  hotelPhone?: string;
  checkIn: string;
  checkInTime?: string;
  checkOut: string;
  roomType: string;
  specialRequests?: string;
  appUrl?: string;
}

export async function sendCheckInReminder(data: CheckInReminderData) {
  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#2A2522;">เตือนเช็คอินพรุ่งนี้ 🌅</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">สวัสดีคุณ ${data.guestName} เตรียมพร้อมสำหรับการพักผ่อนได้เลย!</p>

    <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;padding:16px 24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#16A34A;font-weight:600;">📅 เช็คอินพรุ่งนี้ ${data.checkIn}</p>
      <p style="margin:0;font-size:13px;color:#555;">สามารถเช็คอินได้ตั้งแต่ ${data.checkInTime || '14:00'} น.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;margin-bottom:24px;">
      ${row('🏨 โรงแรม', data.hotelName)}
      ${row('🛏 ห้องพัก', data.roomType)}
      ${row('📅 เช็คอิน', `${data.checkIn} · ${data.checkInTime || '14:00'} น.`)}
      ${row('📅 เช็คเอาท์', data.checkOut)}
      ${data.hotelAddress ? row('📍 ที่อยู่', data.hotelAddress) : ''}
      ${data.hotelPhone ? row('📞 โทร', data.hotelPhone) : ''}
      ${row('🔖 รหัสจอง', data.reservationCode)}
    </table>

    <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:24px;">
      กรุณาแสดงรหัสการจองที่ reception เมื่อถึงที่พัก
      หากมีการเปลี่ยนแปลงกรุณาแจ้งล่วงหน้า
    </p>

    ${data.appUrl ? `<p style="text-align:center;margin:0;">${btn('ดูรายละเอียดการจอง', `${data.appUrl}/portal/bookings`)}</p>` : ''}
  `;

  await sgMail.send({
    to: data.to,
    from: FROM,
    subject: `🌅 เตือนเช็คอินพรุ่งนี้ — ${data.hotelName}`,
    html: base('เตือนเช็คอิน', body),
    text: `เตือนเช็คอินพรุ่งนี้ที่ ${data.hotelName} รหัส: ${data.reservationCode}`,
  });
}

// ─── 5. Review Request (after checkout) ─────────────────────────────────────

interface ReviewRequestData {
  to: string;
  guestName: string;
  hotelName: string;
  reservationCode: string;
  checkOut: string;
  appUrl?: string;
}

export async function sendReviewRequest(data: ReviewRequestData) {
  const reviewUrl = `${data.appUrl || ''}/portal/bookings`;
  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#2A2522;">ขอบคุณที่มาพักกับเรา ⭐</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">สวัสดีคุณ ${data.guestName}</p>

    <p style="font-size:14px;color:#555;line-height:1.7;margin-bottom:24px;">
      ขอบคุณที่เลือกพักที่ <strong>${data.hotelName}</strong> (เช็คเอาท์ ${data.checkOut})<br/>
      รีวิวของคุณมีคุณค่ามากสำหรับเรา และช่วยให้แขกท่านอื่นตัดสินใจได้ง่ายขึ้น
    </p>

    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:16px 24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:14px;color:#92400E;">แบ่งปันประสบการณ์ของคุณ</p>
      <p style="margin:0;font-size:28px;">⭐⭐⭐⭐⭐</p>
    </div>

    <p style="text-align:center;margin:0 0 24px;">${btn('เขียนรีวิว', reviewUrl)}</p>

    <p style="font-size:12px;color:#aaa;text-align:center;">รหัสการจอง: ${data.reservationCode}</p>
  `;

  await sgMail.send({
    to: data.to,
    from: FROM,
    subject: `⭐ รบกวนขอรีวิวสักนิด — ${data.hotelName}`,
    html: base('ขอรีวิว', body),
    text: `ขอบคุณที่พักกับ ${data.hotelName} รบกวนเขียนรีวิวที่: ${reviewUrl}`,
  });
}

// ─── 6. Invoice / Tax Receipt ────────────────────────────────────────────────

interface InvoiceData {
  to: string;
  guestName: string;
  hotelName: string;
  hotelAddress?: string;
  hotelTaxId?: string;
  reservationCode: string;
  checkIn: string;
  checkOut: string;
  roomTypeName: string;
  lineItems: { description: string; amount: number }[];
  subtotal: number;
  vat: number;
  total: number;
  currency?: string;
  appUrl?: string;
}

export async function sendInvoiceEmail(data: InvoiceData) {
  const currency = data.currency || 'THB';
  const fmt = (n: number) => `${currency} ${n.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
  const lineRows = data.lineItems.map(li => row(li.description, fmt(li.amount))).join('');

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#2A2522;">ใบเสร็จรับเงิน / Tax Invoice 🧾</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">สวัสดีคุณ ${data.guestName}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${row('โรงแรม', data.hotelName)}
      ${data.hotelAddress ? row('ที่อยู่', data.hotelAddress) : ''}
      ${data.hotelTaxId ? row('เลขประจำตัวผู้เสียภาษี', data.hotelTaxId) : ''}
      ${row('รหัสการจอง', data.reservationCode)}
      ${row('เช็คอิน', data.checkIn)}
      ${row('เช็คเอาท์', data.checkOut)}
      ${row('ห้องพัก', data.roomTypeName)}
    </table>

    <div style="background:#FAF7F2;border-radius:10px;padding:16px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#2A2522;">รายการค่าใช้จ่าย</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${lineRows}
        <tr><td colspan="2" style="border-top:1px solid #E5E0DA;padding-top:8px;"></td></tr>
        ${row('ยอดรวมก่อนภาษี', fmt(data.subtotal))}
        ${row('VAT 7%', fmt(data.vat))}
        <tr>
          <td style="padding:8px 0;font-size:14px;font-weight:700;color:#2A2522;border-top:2px solid #2A2522;">รวมทั้งสิ้น</td>
          <td style="padding:8px 0;font-size:14px;font-weight:700;color:#C66A30;text-align:right;border-top:2px solid #2A2522;">${fmt(data.total)}</td>
        </tr>
      </table>
    </div>

    ${data.appUrl ? `<p style="text-align:center;margin:0;">${btn('ดาวน์โหลดใบเสร็จ', `${data.appUrl}/portal/folio`)}</p>` : ''}
  `;

  await sgMail.send({
    to: data.to,
    from: FROM,
    subject: `🧾 ใบเสร็จรับเงิน — ${data.hotelName} (${data.reservationCode})`,
    html: base('ใบเสร็จรับเงิน', body),
    text: `ใบเสร็จรับเงินสำหรับการเข้าพักที่ ${data.hotelName} รหัส: ${data.reservationCode} ยอดรวม: ${fmt(data.total)}`,
  });
}

// ─── 7. Payment Failed ───────────────────────────────────────────────────────

interface PaymentFailedData {
  to: string;
  guestName: string;
  hotelName: string;
  reservationCode: string;
  amount: number;
  currency?: string;
  retryUrl?: string;
}

export async function sendPaymentFailedEmail(data: PaymentFailedData) {
  const currency = data.currency || 'THB';
  const fmt = (n: number) => `${currency} ${n.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
  const retryUrl = data.retryUrl || '';

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#2A2522;">การชำระเงินไม่สำเร็จ ⚠️</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">สวัสดีคุณ ${data.guestName}</p>

    <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:10px;padding:16px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#DC2626;">การชำระเงินสำหรับการจองของคุณไม่สำเร็จ</p>
      <p style="margin:0;font-size:13px;color:#EF4444;">กรุณาตรวจสอบบัตร/บัญชีของคุณและลองอีกครั้ง</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${row('รหัสการจอง', data.reservationCode)}
      ${row('โรงแรม', data.hotelName)}
      ${row('ยอดชำระ', fmt(data.amount))}
    </table>

    <p style="font-size:13px;color:#555;line-height:1.7;margin-bottom:24px;">
      การจองของคุณ <strong>ยังคงถูกสำรองไว้ชั่วคราว</strong> กรุณาชำระภายใน 24 ชั่วโมง มิฉะนั้นระบบจะยกเลิกการจองอัตโนมัติ
    </p>

    ${retryUrl ? `<p style="text-align:center;margin:0 0 16px;">${btn('ลองชำระอีกครั้ง', retryUrl)}</p>` : ''}

    <p style="font-size:12px;color:#aaa;text-align:center;">หากต้องการความช่วยเหลือ กรุณาติดต่อโรงแรมโดยตรง</p>
  `;

  await sgMail.send({
    to: data.to,
    from: FROM,
    subject: `⚠️ การชำระเงินไม่สำเร็จ — ${data.hotelName}`,
    html: base('การชำระเงินไม่สำเร็จ', body),
    text: `การชำระเงินสำหรับการจอง ${data.reservationCode} ที่ ${data.hotelName} ไม่สำเร็จ กรุณาลองอีกครั้ง`,
  });
}

// ─── 8. Refund Confirmation ───────────────────────────────────────────────────

interface RefundConfirmationData {
  to: string;
  guestName: string;
  hotelName: string;
  reservationCode: string;
  refundAmount: number;
  currency?: string;
  refundMethod?: string;
  processingDays?: number;
  appUrl?: string;
}

export async function sendRefundConfirmationEmail(data: RefundConfirmationData) {
  const currency = data.currency || 'THB';
  const fmt = (n: number) => `${currency} ${n.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#2A2522;">การคืนเงินสำเร็จแล้ว ✅</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">สวัสดีคุณ ${data.guestName}</p>

    <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;padding:16px 24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#16A34A;">ยอดคืนเงิน</p>
      <p style="margin:0;font-size:32px;font-weight:800;color:#16A34A;">${fmt(data.refundAmount)}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${row('รหัสการจอง', data.reservationCode)}
      ${row('โรงแรม', data.hotelName)}
      ${data.refundMethod ? row('ช่องทางคืนเงิน', data.refundMethod) : ''}
      ${row('ระยะเวลา', `${data.processingDays ?? 5}–${(data.processingDays ?? 5) + 2} วันทำการ`)}
    </table>

    <p style="font-size:13px;color:#555;line-height:1.7;margin-bottom:24px;">
      เงินจะถูกโอนเข้าบัญชี/บัตรของคุณภายใน <strong>${data.processingDays ?? 5}–${(data.processingDays ?? 5) + 2} วันทำการ</strong><br/>
      หากไม่ได้รับเงินหลังจากระยะเวลานี้ กรุณาติดต่อโรงแรมหรือธนาคารของคุณ
    </p>

    ${data.appUrl ? `<p style="text-align:center;margin:0;">${btn('ดูประวัติการจอง', `${data.appUrl}/portal/bookings`)}</p>` : ''}
  `;

  await sgMail.send({
    to: data.to,
    from: FROM,
    subject: `✅ คืนเงินสำเร็จ ${fmt(data.refundAmount)} — ${data.hotelName}`,
    html: base('การคืนเงิน', body),
    text: `การคืนเงิน ${fmt(data.refundAmount)} สำหรับการจอง ${data.reservationCode} ที่ ${data.hotelName} ดำเนินการสำเร็จแล้ว`,
  });
}
