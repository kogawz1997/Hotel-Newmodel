// Thai Hotel Compliance: ทร.30 + e-Tax Invoice
// 
// SETUP REQUIRED:
//
// 1. ทร.30 (Foreign Guest Report)
//    - Coordinate with local Immigration Bureau
//    - Some provinces have online API, others require manual upload
//    - Register your hotel as a "thi pak" (สถานประกอบการที่พัก) first
//    - https://extranet.immigration.go.th
//
// 2. e-Tax Invoice
//    - Choose certified service provider:
//      * INET (https://etax.inet.co.th)
//      * Frank.co.th
//      * leceipt.com
//    - Get digital certificate from CA
//    - Process: 1-3 months
//    - Government docs: https://etax.rd.go.th
//
// 3. ภพ.30 / ภงด. (Tax filings)
//    - Sync to PEAK / FlowAccount which handles e-filing

export interface TM30Submission {
  passportNumber: string;
  nationality: string;
  fullName: string;
  arrivalDate: string;
  hotelName: string;
  hotelAddress: string;
  roomNumber?: string;
}

export interface TM30Response {
  success: boolean;
  confirmationNumber?: string;
  errors?: string[];
}

export class TM30Service {
  // Most provinces still don't have public API.
  // Bangkok has https://extranet.immigration.go.th/tm30
  // Other provinces: contact local immigration

  async submit(report: TM30Submission): Promise<TM30Response> {
    if (!process.env.IMMIGRATION_API_KEY) {
      console.warn('[TM30] API not configured. Manual submission required.');
      // Generate a manual submission file the staff can upload
      return {
        success: false,
        errors: ['Manual submission required. Check docs/TM30_SETUP.md'],
      };
    }

    // Requires immigration.go.th API key from https://extranet.immigration.go.th
    // Contact the Immigration Bureau to obtain API credentials for your province.
    const response = await fetch('https://extranet.immigration.go.th/api/tm30/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.IMMIGRATION_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        passport_number: report.passportNumber,
        nationality: report.nationality,
        full_name: report.fullName,
        arrival_date: report.arrivalDate,
        accommodation_name: report.hotelName,
        accommodation_address: report.hotelAddress,
        room_number: report.roomNumber || null,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { success: false, errors: [body?.message || `HTTP ${response.status}`] };
    }

    const result = await response.json();
    return {
      success: true,
      confirmationNumber: result.confirmation_number || result.ref_no || `TM30-${Date.now()}`,
    };
  }

  // Generate Excel/CSV file for manual upload (fallback)
  generateBatchFile(reports: TM30Submission[]): string {
    const headers = ['Passport', 'Nationality', 'Name', 'Arrival', 'Hotel', 'Address'];
    const rows = reports.map(r => [
      r.passportNumber, r.nationality, r.fullName,
      r.arrivalDate, r.hotelName, r.hotelAddress,
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  }
}

// e-Tax Invoice
export interface ETaxInvoice {
  invoiceNumber: string;
  issueDate: string;
  sellerTaxId: string;
  sellerName: string;
  sellerAddress: string;
  buyerTaxId?: string;
  buyerName: string;
  buyerAddress?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    vatRate: number;
  }>;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
}

export interface ETaxResult {
  status: 'submitted' | 'approved' | 'rejected';
  documentId?: string;
  pdfUrl?: string;
  xmlContent?: string;
  errors?: string[];
}

export class ETaxService {
  private provider: string;

  constructor(provider: string = 'inet') {
    this.provider = provider;
  }

  async submit(invoice: ETaxInvoice): Promise<ETaxResult> {
    if (!process.env.ETAX_USERNAME) {
      console.warn('[e-Tax] Not configured. Setup required.');
      return {
        status: 'rejected',
        errors: ['e-Tax provider not configured. See docs/ETAX_SETUP.md'],
      };
    }

    // Requires an approved e-Tax provider account (INET, Frank, leceipt) and digital certificate.
    // See https://etax.rd.go.th for government documentation and provider list.
    const xml = this.buildXML(invoice);

    const response = await fetch(`https://api.etax.inet.co.th/v1/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.ETAX_USERNAME}:${process.env.ETAX_PASSWORD || ''}`).toString('base64')}`,
        'Content-Type': 'application/xml',
        'Accept': 'application/json',
      },
      body: xml,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { status: 'rejected', errors: [body?.message || `HTTP ${response.status}`] };
    }

    const result = await response.json();
    return {
      status: 'submitted',
      documentId: result.document_id || `ETAX-${invoice.invoiceNumber}`,
      pdfUrl: result.pdf_url,
    };
  }

  // Generate XML in Thai government format (TH e-Tax XML schema)
  buildXML(invoice: ETaxInvoice): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <ID>${invoice.invoiceNumber}</ID>
  <IssueDate>${invoice.issueDate}</IssueDate>
  <AccountingSupplierParty>
    <Party>
      <PartyTaxScheme><CompanyID>${invoice.sellerTaxId}</CompanyID></PartyTaxScheme>
      <PartyName><Name>${invoice.sellerName}</Name></PartyName>
    </Party>
  </AccountingSupplierParty>
  <AccountingCustomerParty>
    <Party>
      ${invoice.buyerTaxId ? `<PartyTaxScheme><CompanyID>${invoice.buyerTaxId}</CompanyID></PartyTaxScheme>` : ''}
      <PartyName><Name>${invoice.buyerName}</Name></PartyName>
    </Party>
  </AccountingCustomerParty>
  ${invoice.items.map((item, i) => `
  <InvoiceLine>
    <ID>${i + 1}</ID>
    <InvoicedQuantity>${item.quantity}</InvoicedQuantity>
    <LineExtensionAmount>${item.quantity * item.unitPrice}</LineExtensionAmount>
    <Item><Description>${item.description}</Description></Item>
  </InvoiceLine>`).join('')}
  <LegalMonetaryTotal>
    <TaxExclusiveAmount>${invoice.subtotal}</TaxExclusiveAmount>
    <TaxInclusiveAmount>${invoice.totalAmount}</TaxInclusiveAmount>
  </LegalMonetaryTotal>
</Invoice>`;
  }
}

export const tm30Service = new TM30Service();
export const etaxService = new ETaxService(process.env.ETAX_PROVIDER || 'inet');
