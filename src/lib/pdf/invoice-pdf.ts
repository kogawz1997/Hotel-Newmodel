import path from 'path';
import PDFDocument from 'pdfkit';

const FONT_PATH = path.join(process.cwd(), 'public/fonts/NotoSansThai-Regular.ttf');

const DARK = '#2A2522';
const ACCENT = '#C66A30';
const MUTED = '#666666';
const LIGHT_BG = '#FAF7F2';
const BORDER = '#E8DDD0';

function formatTHB(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB');
  } catch {
    return dateStr;
  }
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  invoiceType: string;
  issueDate: string;
  dueDate?: string;
  hotel: {
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    taxId?: string;
  };
  buyer: {
    name?: string;
    address?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    passportNumber?: string;
  };
  reservation?: {
    code: string;
    checkIn: string;
    checkOut: string;
    nights: number;
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount?: number;
  status: string;
  isEtax?: boolean;
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: `${data.invoiceType} ${data.invoiceNumber}`,
        Author: data.hotel.name,
        Subject: `Invoice for ${data.buyer.name || 'Guest'}`,
      },
    });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font(FONT_PATH);

    const pageW = doc.page.width;
    const headerH = 130;

    // Header background
    doc.rect(0, 0, pageW, headerH).fill(DARK);

    // Hotel name
    doc.fillColor('#FFFFFF').fontSize(22).font(FONT_PATH)
      .text(data.hotel.name || 'Hotel', 48, 36, { width: 300 });

    let hotelInfoY = 68;
    doc.fillColor('rgba(255,255,255,0.65)').fontSize(10);
    if (data.hotel.address) {
      doc.text(data.hotel.address, 48, hotelInfoY, { width: 300 });
      hotelInfoY += 14;
    }
    if (data.hotel.city) {
      doc.text(data.hotel.city, 48, hotelInfoY, { width: 300 });
      hotelInfoY += 14;
    }
    if (data.hotel.phone) {
      doc.text(`Tel: ${data.hotel.phone}`, 48, hotelInfoY, { width: 300 });
      hotelInfoY += 14;
    }
    if (data.hotel.taxId) {
      doc.text(`Tax ID: ${data.hotel.taxId}`, 48, hotelInfoY, { width: 300 });
    }

    // Invoice type + number (top right)
    doc.fillColor('rgba(255,255,255,0.5)').fontSize(9)
      .text(data.invoiceType.toUpperCase(), pageW - 220, 38, { width: 180, align: 'right' });
    doc.fillColor(ACCENT).fontSize(18)
      .text(data.invoiceNumber, pageW - 220, 54, { width: 180, align: 'right' });
    doc.fillColor('rgba(255,255,255,0.6)').fontSize(10)
      .text(`Date: ${formatDate(data.issueDate)}`, pageW - 220, 84, { width: 180, align: 'right' });
    if (data.dueDate) {
      doc.text(`Due: ${formatDate(data.dueDate)}`, pageW - 220, 100, { width: 180, align: 'right' });
    }

    let y = headerH + 32;

    // Parties section
    const halfW = (pageW - 96) / 2;

    // From
    doc.fillColor(MUTED).fontSize(8).text('FROM', 48, y);
    y += 14;
    doc.fillColor(DARK).fontSize(13).text(data.hotel.name || '', 48, y, { width: halfW });
    y += 18;
    doc.fillColor(MUTED).fontSize(10);
    if (data.hotel.address) { doc.text(data.hotel.address, 48, y, { width: halfW }); y += 14; }
    if (data.hotel.taxId) { doc.text(`Tax ID: ${data.hotel.taxId}`, 48, y, { width: halfW }); y += 14; }

    const billToX = 48 + halfW + 32;
    let billY = headerH + 32;
    doc.fillColor(MUTED).fontSize(8).text('BILL TO', billToX, billY);
    billY += 14;
    doc.fillColor(DARK).fontSize(13).text(data.buyer.name || '—', billToX, billY, { width: halfW });
    billY += 18;
    doc.fillColor(MUTED).fontSize(10);
    if (data.buyer.email) { doc.text(data.buyer.email, billToX, billY, { width: halfW }); billY += 14; }
    if (data.buyer.phone) { doc.text(`Tel: ${data.buyer.phone}`, billToX, billY, { width: halfW }); billY += 14; }
    if (data.buyer.passportNumber) { doc.text(`Passport: ${data.buyer.passportNumber}`, billToX, billY, { width: halfW }); billY += 14; }
    if (data.buyer.taxId) { doc.text(`Tax ID: ${data.buyer.taxId}`, billToX, billY, { width: halfW }); billY += 14; }

    y = Math.max(y, billY) + 24;

    // Stay info bar (if reservation present)
    if (data.reservation) {
      doc.rect(48, y, pageW - 96, 56).fill(LIGHT_BG).stroke(BORDER);
      const colW = (pageW - 96) / 4;
      const cells = [
        { label: 'RESERVATION', value: data.reservation.code },
        { label: 'CHECK-IN', value: formatDate(data.reservation.checkIn) },
        { label: 'CHECK-OUT', value: formatDate(data.reservation.checkOut) },
        { label: 'NIGHTS', value: String(data.reservation.nights) },
      ];
      cells.forEach((cell, i) => {
        const cx = 48 + i * colW + 16;
        doc.fillColor(MUTED).fontSize(8).text(cell.label, cx, y + 12, { width: colW - 32 });
        doc.fillColor(DARK).fontSize(12).text(cell.value, cx, y + 26, { width: colW - 32 });
      });
      y += 56 + 24;
    }

    // Table header
    const cols = { desc: 48, qty: pageW - 250, unit: pageW - 190, total: pageW - 120 };
    const tableW = pageW - 96;
    doc.rect(48, y, tableW, 28).fill(DARK);
    doc.fillColor('#FFFFFF').fontSize(9);
    doc.text('DESCRIPTION', cols.desc + 8, y + 9, { width: cols.qty - cols.desc - 16 });
    doc.text('QTY', cols.qty, y + 9, { width: 50, align: 'right' });
    doc.text('UNIT PRICE', cols.unit, y + 9, { width: 60, align: 'right' });
    doc.text('AMOUNT', cols.total, y + 9, { width: 68, align: 'right' });
    y += 28;

    // Table rows
    data.lineItems.forEach((item, i) => {
      const rowH = 28;
      if (i % 2 === 1) doc.rect(48, y, tableW, rowH).fill('#FAFAFA');
      doc.moveTo(48, y + rowH).lineTo(48 + tableW, y + rowH).stroke(BORDER);
      doc.fillColor(DARK).fontSize(10);
      doc.text(item.description, cols.desc + 8, y + 9, { width: cols.qty - cols.desc - 16 });
      doc.text(String(item.quantity), cols.qty, y + 9, { width: 50, align: 'right' });
      doc.text(`${formatTHB(item.unitPrice)}`, cols.unit, y + 9, { width: 60, align: 'right' });
      doc.text(`${formatTHB(item.amount)}`, cols.total, y + 9, { width: 68, align: 'right' });
      y += rowH;
    });

    y += 20;

    // Totals block (right-aligned)
    const totalsX = pageW - 250;
    const totalsW = 202;

    const drawTotalRow = (label: string, value: string, bold = false) => {
      if (bold) {
        doc.moveTo(totalsX, y).lineTo(totalsX + totalsW, y).lineWidth(2).stroke(DARK);
        y += 8;
        doc.fillColor(DARK).fontSize(14).text(label, totalsX, y, { width: totalsW * 0.55 });
        doc.fillColor(ACCENT).fontSize(14).text(value, totalsX + totalsW * 0.55, y, { width: totalsW * 0.45, align: 'right' });
        y += 22;
      } else {
        doc.fillColor(MUTED).fontSize(10).text(label, totalsX, y, { width: totalsW * 0.55 });
        doc.fillColor(DARK).fontSize(10).text(value, totalsX + totalsW * 0.55, y, { width: totalsW * 0.45, align: 'right' });
        y += 16;
      }
    };

    drawTotalRow('Subtotal (excl. VAT)', `THB ${formatTHB(data.subtotal)}`);
    drawTotalRow(`VAT ${Math.round(data.vatRate * 100)}%`, `THB ${formatTHB(data.vatAmount)}`);
    y += 4;
    drawTotalRow('TOTAL', `THB ${formatTHB(data.totalAmount)}`, true);

    // Payment status badge
    const paid = Number(data.paidAmount || 0);
    let badgeColor = '#FEF2F2';
    let badgeText = 'UNPAID';
    let badgeTextColor = '#991B1B';
    if (paid >= data.totalAmount) {
      badgeColor = '#ECFDF5'; badgeText = 'PAID IN FULL'; badgeTextColor = '#065F46';
    } else if (paid > 0) {
      badgeColor = '#FFFBEB'; badgeText = `PARTIAL (THB ${formatTHB(paid)})`; badgeTextColor = '#92400E';
    }
    y += 8;
    doc.rect(totalsX, y, totalsW, 22).fill(badgeColor);
    doc.fillColor(badgeTextColor).fontSize(9).text(badgeText, totalsX, y + 7, { width: totalsW, align: 'center' });
    y += 30;

    // Footer
    y = Math.max(y, doc.page.height - 100);
    doc.moveTo(48, y).lineTo(pageW - 48, y).lineWidth(1).stroke(BORDER);
    y += 12;
    doc.fillColor(MUTED).fontSize(9)
      .text('Thank you for your stay. This document is generated by Maitri PMS.', 48, y, { width: pageW - 96, align: 'center' });
    if (data.isEtax) {
      y += 14;
      doc.fillColor(MUTED).fontSize(9)
        .text('This is a certified e-Tax Invoice.', 48, y, { width: pageW - 96, align: 'center' });
    }

    // Signature block
    const sigX = pageW - 220;
    const sigY = doc.page.height - 90;
    doc.rect(sigX, sigY, 170, 60).stroke(BORDER);
    doc.fillColor(MUTED).fontSize(8).text('Authorized Signature', sigX, sigY + 44, { width: 170, align: 'center' });
    doc.moveTo(sigX + 16, sigY + 40).lineTo(sigX + 154, sigY + 40).stroke(BORDER);
    doc.fillColor(MUTED).fontSize(8).text(data.hotel.name || '', sigX, sigY + 54, { width: 170, align: 'center' });

    doc.end();
  });
}
