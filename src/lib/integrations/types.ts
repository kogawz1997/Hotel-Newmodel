// ─── Integration Adapter Interfaces ───────────────────────────────────────────
// เมื่อได้ API key จาก provider → implement concrete adapter แล้ว swap ใน index.ts

export interface RatePush {
  roomTypeId: string;
  dateFrom: string;   // YYYY-MM-DD
  dateTo: string;
  rate: number;
  availability: number;
}

export interface AvailabilityPush {
  roomTypeId: string;
  date: string;
  available: number;
  stopSell: boolean;
}

export interface OTAReservation {
  otaBookingId: string;
  platform: string;
  guestName: string;
  guestEmail: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalAmount: number;
  currency: string;
  specialRequests?: string;
  status: string;
  rawPayload: Record<string, unknown>;
}

export interface ChannelManagerAdapter {
  pushRates(hotelId: string, rates: RatePush[]): Promise<void>;
  pushAvailability(hotelId: string, avail: AvailabilityPush[]): Promise<void>;
  fetchReservations(hotelId: string, since: Date): Promise<OTAReservation[]>;
  testConnection(config: Record<string, string>): Promise<boolean>;
}

// ─── Payment ───────────────────────────────────────────────────────────────────

export interface PaymentResult {
  chargeId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface RefundResult {
  refundId: string;
  status: 'success' | 'failed';
  amount: number;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
}

export interface PaymentAdapter {
  charge(amount: number, currency: string, source: string, metadata?: Record<string, unknown>): Promise<PaymentResult>;
  refund(chargeId: string, amount?: number): Promise<RefundResult>;
  getTransaction(id: string): Promise<Transaction>;
  createQRPromptPay(amount: number, ref: string): Promise<{ qrData: string; expiresAt: Date }>;
  testConnection(config: Record<string, string>): Promise<boolean>;
}

// ─── SMS ───────────────────────────────────────────────────────────────────────

export interface SMSResult {
  messageId: string;
  status: 'sent' | 'failed';
  to: string;
}

export interface SMSAdapter {
  send(to: string, message: string, senderId?: string): Promise<SMSResult>;
  sendBulk(recipients: string[], message: string): Promise<SMSResult[]>;
  testConnection(config: Record<string, string>): Promise<boolean>;
}

// ─── Key Card / Digital Key ────────────────────────────────────────────────────

export interface KeyIssueParams {
  roomNo: string;
  validFrom: Date;
  validUntil: Date;
  guestName?: string;
}

export interface KeyCardAdapter {
  issueKey(params: KeyIssueParams): Promise<{ keyToken: string; cardUid?: string; qrData?: string }>;
  revokeKey(keyToken: string): Promise<void>;
  extendKey(keyToken: string, until: Date): Promise<void>;
  testConnection(config: Record<string, string>): Promise<boolean>;
}

// ─── POS ───────────────────────────────────────────────────────────────────────

export interface POSOrder {
  posOrderId: string;
  tableNo?: string;
  roomNo?: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
  currency: string;
  createdAt: Date;
}

export interface POSAdapter {
  fetchOrders(hotelId: string, since: Date): Promise<POSOrder[]>;
  postRoomCharge(roomNo: string, amount: number, description: string, reference: string): Promise<void>;
  testConnection(config: Record<string, string>): Promise<boolean>;
}

// ─── Accounting Export ─────────────────────────────────────────────────────────

export interface JournalEntry {
  date: string;
  account: string;
  debit: number;
  credit: number;
  description: string;
  reference?: string;
}

export interface AccountingAdapter {
  exportJournalEntries(from: Date, to: Date, entries: JournalEntry[]): Promise<{ url?: string }>;
  syncInvoice(invoiceId: string, data: Record<string, unknown>): Promise<void>;
  testConnection(config: Record<string, string>): Promise<boolean>;
}

// ─── Review Platform ───────────────────────────────────────────────────────────

export interface Review {
  reviewId: string;
  platform: string;
  guestName: string;
  rating: number;
  title?: string;
  body: string;
  publishedAt: Date;
  replied: boolean;
}

export interface ReviewPlatformAdapter {
  fetchNewReviews(hotelId: string, since: Date): Promise<Review[]>;
  postReply(reviewId: string, reply: string): Promise<void>;
  testConnection(config: Record<string, string>): Promise<boolean>;
}

// ─── Market Data ───────────────────────────────────────────────────────────────

export interface MarketRate {
  date: string;
  competitor: string;
  roomType: string;
  rate: number;
  occupancyPct?: number;
  source: string;
}

export interface MarketDataAdapter {
  fetchCompetitorRates(hotelId: string, dates: string[]): Promise<MarketRate[]>;
  testConnection(config: Record<string, string>): Promise<boolean>;
}
