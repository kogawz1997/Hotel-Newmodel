// ─── Integration Registry ──────────────────────────────────────────────────────
// To activate a real provider:
//   1. Create src/lib/integrations/providers/<name>.ts
//   2. Uncomment the import below
//   3. Swap mock → real in the export

import type {
  ChannelManagerAdapter,
  PaymentAdapter,
  SMSAdapter,
  KeyCardAdapter,
  POSAdapter,
  AccountingAdapter,
  ReviewPlatformAdapter,
  MarketDataAdapter,
} from './types';

import { MockChannelManager }  from './mock/channel-manager.mock';
import { MockPayment }         from './mock/payment.mock';
import { MockSMS }             from './mock/sms.mock';
import { MockKeyCard }         from './mock/keycard.mock';
import { MockPOS }             from './mock/pos.mock';
import { MockAccounting }      from './mock/accounting.mock';
import { MockReviewPlatform }  from './mock/review-platform.mock';
import { MockMarketData }      from './mock/market-data.mock';

// import { SiteMinderAdapter }   from './providers/siteminder';       // Channel Manager
// import { OmiseAdapter }        from './providers/omise';            // Payment (ไทย)
// import { TwilioAdapter }       from './providers/twilio';           // SMS
// import { AssaAbloyAdapter }    from './providers/assa-abloy';       // Key Card
// import { OracleMicrosAdapter } from './providers/oracle-micros';    // POS
// import { XeroAdapter }         from './providers/xero';             // Accounting
// import { GoogleBusinessAdapter }from './providers/google-business'; // Reviews
// import { STRAdapter }          from './providers/str';              // Market Data

export const channelManager: ChannelManagerAdapter = new MockChannelManager();
export const payment: PaymentAdapter               = new MockPayment();
export const sms: SMSAdapter                       = new MockSMS();
export const keyCard: KeyCardAdapter               = new MockKeyCard();
export const pos: POSAdapter                       = new MockPOS();
export const accounting: AccountingAdapter         = new MockAccounting();
export const reviewPlatform: ReviewPlatformAdapter = new MockReviewPlatform();
export const marketData: MarketDataAdapter         = new MockMarketData();

export type { ChannelManagerAdapter, PaymentAdapter, SMSAdapter, KeyCardAdapter,
              POSAdapter, AccountingAdapter, ReviewPlatformAdapter, MarketDataAdapter };
