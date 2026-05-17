-- ============================================================
-- SCHEMA 01 · Core Foundation
-- Organizations, hotels, users, rooms, reservations, payments,
-- guests, booking engine, loyalty, messaging, OTA connections,
-- audit, privacy, go-live checks, review requests
-- ============================================================


-- ============================================================
-- Merged from: 00001_initial_schema.sql
-- ============================================================

-- ============================================
-- Hotel PMS Database Schema
-- Multi-tenant, covers all features in feature list
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ORGANIZATIONS & USERS (Multi-tenant)
-- ============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'standard', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('hotel', 'hostel', 'pool_villa', 'serviced_apartment', 'resort', 'boutique')),
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Thailand',
  timezone TEXT DEFAULT 'Asia/Bangkok',
  currency TEXT DEFAULT 'THB',
  phone TEXT,
  email TEXT,
  website TEXT,
  check_in_time TIME DEFAULT '14:00',
  check_out_time TIME DEFAULT '12:00',
  tax_id TEXT, -- เลขประจำตัวผู้เสียภาษี
  vat_rate DECIMAL DEFAULT 0.07,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'manager', 'front_desk', 'housekeeping', 'staff')),
  language TEXT DEFAULT 'th',
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROOMS & RATES
-- ============================================

CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "ห้องดีลักซ์", "Deluxe", "Suite"
  code TEXT, -- DLX, STD, SUITE
  description TEXT,
  max_occupancy INT DEFAULT 2,
  base_rate DECIMAL NOT NULL,
  amenities JSONB DEFAULT '[]', -- ["wifi", "tv", "balcony"]
  size_sqm INT,
  bed_type TEXT, -- "king", "queen", "twin"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES room_types(id),
  room_number TEXT NOT NULL,
  floor INT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance', 'blocked')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, room_number)
);

CREATE TABLE rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES room_types(id),
  name TEXT NOT NULL, -- "Standard", "Non-refundable", "Breakfast Included"
  rate_modifier DECIMAL DEFAULT 1.0, -- multiplier on base_rate
  includes_breakfast BOOLEAN DEFAULT false,
  cancellation_policy TEXT,
  active BOOLEAN DEFAULT true
);

CREATE TABLE rate_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES room_types(id),
  rate_plan_id UUID REFERENCES rate_plans(id),
  date DATE NOT NULL,
  rate DECIMAL NOT NULL,
  available_count INT,
  min_stay INT DEFAULT 1,
  max_stay INT,
  closed_to_arrival BOOLEAN DEFAULT false,
  closed_to_departure BOOLEAN DEFAULT false,
  UNIQUE(hotel_id, room_type_id, rate_plan_id, date)
);

-- ============================================
-- GUESTS & RESERVATIONS
-- ============================================

CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  nationality TEXT,
  passport_number TEXT,
  id_card_number TEXT,
  date_of_birth DATE,
  preferred_language TEXT DEFAULT 'en',
  preferences JSONB DEFAULT '{}', -- { "pillow": "soft", "allergies": [...] }
  vip_status BOOLEAN DEFAULT false,
  loyalty_points INT DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'bronze',
  notes TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  total_stays INT DEFAULT 0,
  total_revenue DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id),
  room_id UUID REFERENCES rooms(id),
  room_type_id UUID REFERENCES room_types(id),
  rate_plan_id UUID REFERENCES rate_plans(id),
  reservation_code TEXT UNIQUE NOT NULL DEFAULT 'BK' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)),
  
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INT GENERATED ALWAYS AS (check_out - check_in) STORED,
  
  num_adults INT DEFAULT 1,
  num_children INT DEFAULT 0,
  
  status TEXT DEFAULT 'confirmed' CHECK (status IN (
    'pending', 'confirmed', 'checked_in', 'checked_out', 
    'cancelled', 'no_show', 'on_hold'
  )),
  
  source TEXT DEFAULT 'direct' CHECK (source IN (
    'direct', 'website', 'walk_in', 'phone',
    'booking_com', 'agoda', 'expedia', 'airbnb', 
    'trip_com', 'traveloka', 'hostelworld', 
    'line', 'whatsapp', 'wechat', 'instagram',
    'tiktok', 'facebook', 'other'
  )),
  external_id TEXT, -- ID จาก OTA
  
  total_amount DECIMAL NOT NULL,
  paid_amount DECIMAL DEFAULT 0,
  balance_amount DECIMAL GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  
  special_requests TEXT,
  internal_notes TEXT,
  
  -- Group booking
  group_booking_id UUID,
  is_group_master BOOLEAN DEFAULT false,
  
  -- Compliance
  tm30_reported BOOLEAN DEFAULT false, -- ทร.30 reported
  tm30_reported_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

CREATE INDEX idx_reservations_hotel ON reservations(hotel_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX idx_reservations_room ON reservations(room_id);
CREATE INDEX idx_reservations_guest ON reservations(guest_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Folio (กระดาษคำนวณค่าใช้จ่ายแขก)
CREATE TABLE folios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES hotels(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'transferred')),
  total_charges DECIMAL DEFAULT 0,
  total_payments DECIMAL DEFAULT 0,
  balance DECIMAL DEFAULT 0,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE folio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id UUID REFERENCES folios(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('room', 'tax', 'fb', 'spa', 'minibar', 'service', 'damage', 'discount', 'payment', 'refund')),
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  quantity INT DEFAULT 1,
  posted_by UUID REFERENCES user_profiles(id),
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  reference_id UUID, -- link to fb_order, spa_booking, etc.
  reference_type TEXT
);

-- ============================================
-- HOUSEKEEPING
-- ============================================

CREATE TABLE housekeeping_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  assigned_to UUID REFERENCES user_profiles(id),
  task_type TEXT CHECK (task_type IN ('cleaning', 'turnover', 'deep_cleaning', 'inspection', 'maintenance', 'lost_found')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'failed_inspection')),
  notes TEXT,
  estimated_duration_min INT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  reported_by UUID REFERENCES user_profiles(id),
  assigned_to UUID REFERENCES user_profiles(id),
  category TEXT, -- "plumbing", "electrical", "ac", "tv", "other"
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNICATION (Multi-channel Inbox)
-- ============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id),
  reservation_id UUID REFERENCES reservations(id),
  
  channel TEXT NOT NULL CHECK (channel IN (
    'line', 'whatsapp', 'wechat', 'kakaotalk', 
    'messenger', 'instagram', 'email', 'sms', 
    'webchat', 'booking_com', 'agoda', 'airbnb', 
    'expedia', 'phone'
  )),
  channel_user_id TEXT NOT NULL, -- ID จาก channel นั้น
  channel_thread_id TEXT, -- thread/conversation ID
  
  guest_language TEXT DEFAULT 'en',
  guest_name TEXT,
  
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'snoozed', 'closed', 'spam')),
  assigned_to UUID REFERENCES user_profiles(id),
  
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  unread_count INT DEFAULT 0,
  
  ai_handling BOOLEAN DEFAULT true, -- AI ตอบเองได้มั้ย
  needs_human BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(hotel_id, channel, channel_user_id)
);

CREATE INDEX idx_conversations_hotel ON conversations(hotel_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT CHECK (sender_type IN ('guest', 'staff', 'ai', 'system')),
  sender_id UUID, -- user_profile id ถ้า sender_type='staff'
  
  -- Original message (ภาษาแขก)
  original_text TEXT,
  original_language TEXT,
  
  -- Translated (สำหรับ unified inbox - แสดงเป็นไทย)
  translated_text TEXT,
  
  -- Voice / media
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'location', 'sticker', 'template')),
  media_url TEXT,
  media_metadata JSONB,
  
  -- Channel-specific
  channel_message_id TEXT, -- ID ของ message ที่ channel
  
  -- AI processing
  ai_generated BOOLEAN DEFAULT false,
  ai_confidence DECIMAL,
  ai_reviewed_by UUID REFERENCES user_profiles(id), -- ถ้าคนตรวจก่อนส่ง
  
  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- Quick reply templates
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Check-in instructions", "WiFi info"
  category TEXT, -- "pre_arrival", "during_stay", "post_stay"
  content_th TEXT NOT NULL,
  translations JSONB DEFAULT '{}', -- { "en": "...", "zh": "...", "ja": "..." }
  variables JSONB DEFAULT '[]', -- ["guest_name", "check_in_date"]
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHANNEL MANAGER (OTA Sync)
-- ============================================

CREATE TABLE channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- 'booking_com', 'agoda', 'airbnb', 'expedia'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disabled')),
  external_property_id TEXT,
  credentials JSONB, -- encrypted
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, channel)
);

CREATE TABLE channel_room_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_connection_id UUID REFERENCES channel_connections(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES room_types(id),
  rate_plan_id UUID REFERENCES rate_plans(id),
  external_room_id TEXT,
  external_rate_id TEXT,
  active BOOLEAN DEFAULT true
);

CREATE TABLE channel_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_connection_id UUID REFERENCES channel_connections(id),
  sync_type TEXT, -- 'inventory', 'rate', 'booking_pull', 'booking_push'
  status TEXT,
  records_processed INT,
  errors JSONB,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  folio_id UUID REFERENCES folios(id),
  
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'THB',
  
  payment_method TEXT CHECK (payment_method IN (
    'cash', 'credit_card', 'debit_card', 
    'promptpay', 'truemoney', 'shopeepay', 
    'rabbit_linepay', 'kbank_k_plus', 'scb_easy',
    'bank_transfer', 'ota_paid', 'voucher', 'other'
  )),
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded')),
  
  gateway TEXT, -- 'omise', 'stripe', '2c2p'
  gateway_transaction_id TEXT,
  gateway_response JSONB,
  
  installment_months INT, -- ผ่อน 0%
  
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_amount DECIMAL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLIANCE & ACCOUNTING (Thai Tax)
-- ============================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  guest_id UUID REFERENCES guests(id),
  
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type TEXT CHECK (invoice_type IN ('tax_invoice', 'receipt', 'credit_note', 'debit_note')),
  
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  subtotal DECIMAL NOT NULL,
  vat_amount DECIMAL NOT NULL,
  total_amount DECIMAL NOT NULL,
  
  -- Buyer info (สำหรับใบกำกับภาษี)
  buyer_name TEXT,
  buyer_tax_id TEXT,
  buyer_address TEXT,
  buyer_branch TEXT,
  
  -- e-Tax Invoice
  is_etax BOOLEAN DEFAULT false,
  etax_status TEXT, -- 'draft', 'submitted', 'approved', 'rejected'
  etax_signed_xml TEXT,
  etax_pdf_url TEXT,
  etax_submitted_at TIMESTAMPTZ,
  etax_response JSONB,
  
  status TEXT DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'sent', 'paid', 'cancelled')),
  
  pdf_url TEXT,
  sent_to_email TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL DEFAULT 1,
  unit_price DECIMAL NOT NULL,
  discount DECIMAL DEFAULT 0,
  vat_rate DECIMAL DEFAULT 0.07,
  amount DECIMAL NOT NULL
);

-- ทร.30 (Foreign guest report)
CREATE TABLE tm30_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id),
  reservation_id UUID REFERENCES reservations(id),
  passport_number TEXT NOT NULL,
  nationality TEXT NOT NULL,
  arrival_date DATE NOT NULL,
  departure_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'confirmed', 'failed')),
  submitted_at TIMESTAMPTZ,
  confirmation_number TEXT,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax filings (ภพ.30, ภงด.)
CREATE TABLE tax_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  filing_type TEXT CHECK (filing_type IN ('por_por_30', 'por_ngor_dor_1', 'por_ngor_dor_3', 'por_ngor_dor_53', 'por_ngor_dor_50', 'por_ngor_dor_51')),
  period_year INT NOT NULL,
  period_month INT,
  total_revenue DECIMAL,
  total_vat DECIMAL,
  total_withholding DECIMAL,
  status TEXT DEFAULT 'draft',
  filed_at TIMESTAMPTZ,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounting integration
CREATE TABLE accounting_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  provider TEXT CHECK (provider IN ('peak', 'flowaccount', 'express', 'acccloud', 'xero')),
  entity_type TEXT, -- 'invoice', 'payment', 'expense'
  entity_id UUID,
  external_id TEXT,
  status TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  error TEXT
);

-- OTA Reconciliation
CREATE TABLE ota_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  ota_channel TEXT NOT NULL,
  expected_amount DECIMAL NOT NULL,
  ota_invoiced_amount DECIMAL,
  ota_paid_amount DECIMAL,
  commission_amount DECIMAL,
  variance DECIMAL,
  status TEXT, -- 'matched', 'discrepancy', 'unpaid'
  reconciled_at TIMESTAMPTZ,
  notes TEXT
);

-- ============================================
-- F&B (Food & Beverage)
-- ============================================

CREATE TABLE fb_outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Main Restaurant", "Pool Bar"
  type TEXT, -- 'restaurant', 'bar', 'room_service', 'banquet'
  active BOOLEAN DEFAULT true
);

CREATE TABLE fb_menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID REFERENCES fb_outlets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0
);

CREATE TABLE fb_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID REFERENCES fb_outlets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES fb_menu_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  cost DECIMAL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  tags JSONB DEFAULT '[]', -- ['vegan', 'spicy', 'gluten_free']
  translations JSONB DEFAULT '{}'
);

CREATE TABLE fb_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  outlet_id UUID REFERENCES fb_outlets(id),
  reservation_id UUID REFERENCES reservations(id),
  table_number TEXT,
  order_number TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'preparing', 'served', 'paid', 'cancelled')),
  subtotal DECIMAL DEFAULT 0,
  service_charge DECIMAL DEFAULT 0,
  tax DECIMAL DEFAULT 0,
  total DECIMAL DEFAULT 0,
  payment_method TEXT, -- 'room_charge', 'cash', 'card'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fb_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES fb_orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES fb_menu_items(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL NOT NULL,
  modifiers JSONB DEFAULT '[]',
  notes TEXT,
  amount DECIMAL NOT NULL
);

-- ============================================
-- SPA & WELLNESS
-- ============================================

CREATE TABLE spa_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_min INT NOT NULL,
  price DECIMAL NOT NULL,
  category TEXT, -- 'massage', 'facial', 'body_treatment'
  active BOOLEAN DEFAULT true
);

CREATE TABLE spa_therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialties JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true
);

CREATE TABLE spa_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  guest_id UUID REFERENCES guests(id),
  service_id UUID REFERENCES spa_services(id),
  therapist_id UUID REFERENCES spa_therapists(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'booked',
  amount DECIMAL,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MICE / EVENTS
-- ============================================

CREATE TABLE event_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT,
  size_sqm INT,
  hourly_rate DECIMAL,
  daily_rate DECIMAL,
  amenities JSONB DEFAULT '[]'
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  space_id UUID REFERENCES event_spaces(id),
  name TEXT NOT NULL,
  organizer_name TEXT,
  organizer_contact TEXT,
  event_type TEXT, -- 'wedding', 'meeting', 'conference', 'banquet'
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  num_attendees INT,
  total_amount DECIMAL,
  status TEXT DEFAULT 'inquiry',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOYALTY PROGRAM
-- ============================================

CREATE TABLE loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_points INT NOT NULL,
  benefits JSONB DEFAULT '[]',
  multiplier DECIMAL DEFAULT 1.0
);

CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id),
  reservation_id UUID REFERENCES reservations(id),
  type TEXT CHECK (type IN ('earn', 'redeem', 'expire', 'adjust')),
  points INT NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MARKETING
-- ============================================

CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT, -- 'email', 'sms', 'line_broadcast', 'whatsapp_broadcast'
  status TEXT DEFAULT 'draft',
  audience_filter JSONB,
  template_id UUID,
  scheduled_at TIMESTAMPTZ,
  sent_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  guest_id UUID REFERENCES guests(id),
  source TEXT, -- 'google', 'booking_com', 'agoda', 'tripadvisor', 'direct'
  rating INT CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  content TEXT,
  language TEXT,
  sentiment TEXT, -- 'positive', 'neutral', 'negative' (from AI)
  ai_response_draft TEXT,
  response_text TEXT,
  responded_at TIMESTAMPTZ,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI & AUTOMATION
-- ============================================

CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  task_type TEXT, -- 'translate', 'reply', 'review_response', 'sentiment'
  input_text TEXT,
  output_text TEXT,
  model TEXT,
  input_tokens INT,
  output_tokens INT,
  cost_usd DECIMAL,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id),
  rating INT, -- 1-5
  feedback TEXT,
  evaluator_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base for RAG
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  category TEXT, -- 'faq', 'policy', 'amenity', 'local_info'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'th',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE folio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's organization
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Generic RLS policy: data accessible only by users in same org
CREATE POLICY "org_isolation_select" ON hotels FOR SELECT
  USING (organization_id = public.user_organization_id());
CREATE POLICY "org_isolation_insert" ON hotels FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());
CREATE POLICY "org_isolation_update" ON hotels FOR UPDATE
  USING (organization_id = public.user_organization_id());

-- Apply same pattern to all tables (simplified - in production write per-table)
CREATE POLICY "hotel_data_isolation" ON reservations FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

CREATE POLICY "hotel_data_isolation" ON guests FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

CREATE POLICY "hotel_data_isolation" ON conversations FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

CREATE POLICY "messages_via_conversation" ON messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM conversations WHERE hotel_id IN (
      SELECT id FROM hotels WHERE organization_id = public.user_organization_id()
    )
  ));

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at,
      last_message_preview = SUBSTRING(COALESCE(NEW.translated_text, NEW.original_text), 1, 100),
      unread_count = CASE 
        WHEN NEW.direction = 'inbound' THEN unread_count + 1 
        ELSE unread_count 
      END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();


-- ============================================
-- MAITRI HARDENING RLS PATCH
-- Complete hotel-scoped policies for core operational tables.
-- Keep service-role webhooks on the server only; browser clients stay isolated by organization.
-- ============================================

ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_room_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tm30_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE spa_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE spa_therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE spa_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_same_org_select" ON user_profiles FOR SELECT
  USING (organization_id = public.user_organization_id() OR id = auth.uid());
CREATE POLICY "profiles_self_update" ON user_profiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "organizations_member_select" ON organizations FOR SELECT
  USING (id = public.user_organization_id());
CREATE POLICY "organizations_owner_update" ON organizations FOR UPDATE
  USING (id = public.user_organization_id() AND EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('owner','admin')
  ));

CREATE POLICY "hotel_data_isolation" ON rooms FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON room_types FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON rate_plans FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON rate_calendar FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON folios FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "folio_items_via_folio" ON folio_items FOR ALL
  USING (folio_id IN (SELECT id FROM folios WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));
CREATE POLICY "hotel_data_isolation" ON invoices FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "invoice_items_via_invoice" ON invoice_items FOR ALL
  USING (invoice_id IN (SELECT id FROM invoices WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));
CREATE POLICY "hotel_data_isolation" ON payments FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON housekeeping_tasks FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON maintenance_requests FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON message_templates FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON channel_connections FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "channel_mapping_via_connection" ON channel_room_mappings FOR ALL
  USING (channel_connection_id IN (SELECT id FROM channel_connections WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));
CREATE POLICY "channel_log_via_connection" ON channel_sync_log FOR ALL
  USING (channel_connection_id IN (SELECT id FROM channel_connections WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));
CREATE POLICY "hotel_data_isolation" ON tm30_reports FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON tax_filings FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON accounting_sync_log FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

CREATE POLICY "hotel_data_isolation" ON fb_outlets FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "fb_categories_via_outlet" ON fb_menu_categories FOR ALL
  USING (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));

CREATE POLICY "fb_items_via_outlet" ON fb_menu_items FOR ALL
  USING (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())))
  WITH CHECK (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));
CREATE POLICY "hotel_data_isolation" ON fb_orders FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "fb_order_items_via_order" ON fb_order_items FOR ALL
  USING (order_id IN (SELECT id FROM fb_orders WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));
CREATE POLICY "hotel_data_isolation" ON spa_services FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

CREATE POLICY "hotel_data_isolation" ON spa_therapists FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

CREATE POLICY "hotel_data_isolation" ON spa_bookings FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

CREATE POLICY "hotel_data_isolation" ON loyalty_tiers FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

CREATE POLICY "hotel_data_isolation" ON loyalty_transactions FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON marketing_campaigns FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON reviews FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON ai_logs FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON ai_evaluations FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON knowledge_base FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
CREATE POLICY "hotel_data_isolation" ON audit_logs FOR SELECT
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));


-- ============================================================
-- Merged from: 00002_production_saas_hardening.sql
-- ============================================================

-- ============================================
-- Production SaaS Hardening Patch
-- Adds strict write checks, idempotency, and operational indexes.
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS payments_gateway_transaction_unique
  ON payments(gateway, gateway_transaction_id)
  WHERE gateway_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS reservations_availability_lookup_idx
  ON reservations(hotel_id, room_type_id, check_in, check_out, status);
CREATE INDEX IF NOT EXISTS rooms_availability_lookup_idx
  ON rooms(hotel_id, room_type_id, status);
CREATE INDEX IF NOT EXISTS channel_connections_lookup_idx
  ON channel_connections(channel, external_property_id, status);

ALTER POLICY "hotel_data_isolation" ON reservations
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
ALTER POLICY "hotel_data_isolation" ON guests
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
ALTER POLICY "hotel_data_isolation" ON conversations
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
ALTER POLICY "messages_via_conversation" ON messages
  USING (conversation_id IN (SELECT id FROM conversations WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())))
  WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));
ALTER POLICY "org_isolation_update" ON hotels
  USING (organization_id = public.user_organization_id())
  WITH CHECK (organization_id = public.user_organization_id());
ALTER POLICY "organizations_owner_update" ON organizations
  USING (id = public.user_organization_id() AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('owner','admin')))
  WITH CHECK (id = public.user_organization_id() AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('owner','admin')));

ALTER POLICY "folio_items_via_folio" ON folio_items
  USING (folio_id IN (SELECT id FROM folios WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())))
  WITH CHECK (folio_id IN (SELECT id FROM folios WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));
ALTER POLICY "invoice_items_via_invoice" ON invoice_items
  USING (invoice_id IN (SELECT id FROM invoices WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())))
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));
ALTER POLICY "channel_mapping_via_connection" ON channel_room_mappings
  USING (channel_connection_id IN (SELECT id FROM channel_connections WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())))
  WITH CHECK (channel_connection_id IN (SELECT id FROM channel_connections WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));
ALTER POLICY "channel_log_via_connection" ON channel_sync_log
  USING (channel_connection_id IN (SELECT id FROM channel_connections WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())))
  WITH CHECK (channel_connection_id IN (SELECT id FROM channel_connections WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));
ALTER POLICY "fb_categories_via_outlet" ON fb_menu_categories
  USING (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())))
  WITH CHECK (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));
ALTER POLICY "fb_order_items_via_order" ON fb_order_items
  USING (order_id IN (SELECT id FROM fb_orders WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())))
  WITH CHECK (order_id IN (SELECT id FROM fb_orders WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));

DROP POLICY IF EXISTS "audit_logs_server_insert" ON audit_logs;
CREATE POLICY "audit_logs_server_insert" ON audit_logs FOR INSERT
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));


-- ============================================================
-- Merged from: 00003_team_audit_improvements.sql
-- ============================================================

-- ============================================
-- Sprint 2: Team management & audit improvements
-- ============================================

-- Index for faster audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_hotel_created ON audit_logs(hotel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Index for team queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Reservation indexes for faster calendar queries
CREATE INDEX IF NOT EXISTS idx_reservations_checkin_checkout ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_hotel_dates ON reservations(hotel_id, check_in, check_out);

-- Invoice index
CREATE INDEX IF NOT EXISTS idx_invoices_hotel ON invoices(hotel_id, issue_date DESC);

-- Conversations index
CREATE INDEX IF NOT EXISTS idx_conversations_hotel_unread ON conversations(hotel_id, unread_count, status);


-- ============================================================
-- Merged from: 00004_hotel_gallery_and_branding.sql
-- ============================================================

-- Hotel gallery for branding
CREATE TABLE hotel_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add branding fields to hotels table if not exist
ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS featured_gallery_id UUID;

-- Enable RLS
ALTER TABLE hotel_gallery ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "hotel_staff_view_gallery" ON hotel_gallery FOR SELECT
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE organization_id = (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "hotel_staff_manage_gallery" ON hotel_gallery FOR ALL
  USING (
    hotel_id IN (
      SELECT id FROM hotels WHERE organization_id = (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    hotel_id IN (
      SELECT id FROM hotels WHERE organization_id = (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Index
CREATE INDEX hotel_gallery_hotel_idx ON hotel_gallery(hotel_id);
CREATE INDEX hotel_gallery_order_idx ON hotel_gallery(hotel_id, display_order);


-- ============================================================
-- Merged from: 00005_guest_portal.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────────
-- Guest Portal: customer-facing auth & booking management
-- ─────────────────────────────────────────────────────────────────

-- Guest accounts (separate from hotel staff)
CREATE TABLE guest_accounts (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT,
  phone         TEXT,
  nationality   TEXT,
  date_of_birth DATE,
  passport_number TEXT,
  preferred_language TEXT DEFAULT 'th',
  avatar_url    TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Booking reviews
CREATE TABLE booking_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_account_id UUID REFERENCES guest_accounts(id) ON DELETE SET NULL,
  reviewer_name  TEXT,
  rating         INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  rating_clean   INT CHECK (rating_clean >= 1 AND rating_clean <= 5),
  rating_service INT CHECK (rating_service >= 1 AND rating_service <= 5),
  rating_location INT CHECK (rating_location >= 1 AND rating_location <= 5),
  rating_value   INT CHECK (rating_value >= 1 AND rating_value <= 5),
  title          TEXT,
  comment        TEXT,
  reply_text     TEXT,
  replied_at     TIMESTAMPTZ,
  platform       TEXT DEFAULT 'direct',
  verified_stay  BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist / saved hotels
CREATE TABLE guest_wishlists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_account_id UUID NOT NULL REFERENCES guest_accounts(id) ON DELETE CASCADE,
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id  UUID REFERENCES room_types(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_account_id, hotel_id, room_type_id)
);

-- Special requests on bookings
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS guest_account_id UUID REFERENCES guest_accounts(id),
  ADD COLUMN IF NOT EXISTS special_requests TEXT,
  ADD COLUMN IF NOT EXISTS estimated_arrival TIME,
  ADD COLUMN IF NOT EXISTS room_preference TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','partial','paid','refunded')),
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- RLS
ALTER TABLE guest_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reviews   ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_wishlists   ENABLE ROW LEVEL SECURITY;

-- guest_accounts: own row only
CREATE POLICY "guest_own_account" ON guest_accounts FOR ALL
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Hotel staff can see guest accounts linked to their reservations
CREATE POLICY "hotel_staff_see_guest_accounts" ON guest_accounts FOR SELECT
  USING (
    id IN (
      SELECT guest_account_id FROM reservations r
      JOIN hotels h ON h.id = r.hotel_id
      JOIN user_profiles up ON up.organization_id = h.organization_id
      WHERE up.id = auth.uid()
    )
  );

-- booking_reviews: public read, guest write own
CREATE POLICY "public_read_reviews" ON booking_reviews FOR SELECT USING (true);
CREATE POLICY "guest_write_review" ON booking_reviews FOR INSERT
  WITH CHECK (guest_account_id = auth.uid());
CREATE POLICY "hotel_reply_review" ON booking_reviews FOR UPDATE
  USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN user_profiles up ON up.organization_id = h.organization_id
      WHERE up.id = auth.uid()
    )
  );

-- wishlists: own only
CREATE POLICY "guest_own_wishlist" ON guest_wishlists FOR ALL
  USING (guest_account_id = auth.uid()) WITH CHECK (guest_account_id = auth.uid());

-- Indexes
CREATE INDEX idx_guest_accounts_email ON guest_accounts(email);
CREATE INDEX idx_booking_reviews_hotel ON booking_reviews(hotel_id);
CREATE INDEX idx_booking_reviews_guest ON booking_reviews(guest_account_id);
CREATE INDEX idx_reservations_guest_account ON reservations(guest_account_id);
CREATE INDEX idx_guest_wishlists_guest ON guest_wishlists(guest_account_id);

-- Room type images
CREATE TABLE IF NOT EXISTS room_type_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  alt_text TEXT
);
ALTER TABLE room_type_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_room_images" ON room_type_images FOR SELECT USING (true);
CREATE POLICY "hotel_staff_manage_room_images" ON room_type_images FOR ALL
  USING (
    room_type_id IN (
      SELECT rt.id FROM room_types rt
      JOIN hotels h ON h.id = rt.hotel_id
      JOIN user_profiles up ON up.organization_id = h.organization_id
      WHERE up.id = auth.uid()
    )
  );
CREATE INDEX IF NOT EXISTS idx_room_type_images_rt ON room_type_images(room_type_id);

-- ─────────────────────────────────────────────────────────────────
-- Search & Performance indexes (Sprint 3)
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS latitude   DECIMAL,
  ADD COLUMN IF NOT EXISTS longitude  DECIMAL,
  ADD COLUMN IF NOT EXISTS star_rating INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS total_rooms INT DEFAULT 0;

-- Search indexes
CREATE INDEX IF NOT EXISTS hotels_city_idx        ON hotels(city);
CREATE INDEX IF NOT EXISTS hotels_type_idx        ON hotels(type);
CREATE INDEX IF NOT EXISTS hotels_slug_idx        ON hotels(slug);
CREATE INDEX IF NOT EXISTS hotels_country_idx     ON hotels(country);

-- Hot-path: availability
CREATE INDEX IF NOT EXISTS idx_res_checkin_checkout
  ON reservations(hotel_id, check_in, check_out, status);

-- Guest portal
CREATE INDEX IF NOT EXISTS idx_res_guest_account
  ON reservations(guest_account_id);
CREATE INDEX IF NOT EXISTS idx_reviews_hotel_rating
  ON booking_reviews(hotel_id, rating);


-- ============================================================
-- Merged from: 00006_performance_indexes.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 00006: Performance indexes for production scale
-- Run: supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- Hotel search (used in /api/public/search)
CREATE INDEX IF NOT EXISTS idx_hotels_city         ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_type         ON hotels(type);
CREATE INDEX IF NOT EXISTS idx_hotels_slug         ON hotels(slug);
CREATE INDEX IF NOT EXISTS idx_hotels_country      ON hotels(country);
CREATE INDEX IF NOT EXISTS idx_hotels_org          ON hotels(organization_id);

-- Hot path: availability check (used every booking search)
CREATE INDEX IF NOT EXISTS idx_res_availability
  ON reservations(hotel_id, check_in, check_out, status);

-- Hot path: dashboard reservation list
CREATE INDEX IF NOT EXISTS idx_res_hotel_checkin
  ON reservations(hotel_id, check_in DESC, status);

-- Guest portal
CREATE INDEX IF NOT EXISTS idx_res_guest_account
  ON reservations(guest_account_id);
CREATE INDEX IF NOT EXISTS idx_guest_accounts_email
  ON guest_accounts(email);

-- Reviews (used in hotel public page)
CREATE INDEX IF NOT EXISTS idx_reviews_hotel_rating
  ON booking_reviews(hotel_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_verified
  ON booking_reviews(hotel_id, verified_stay, created_at DESC);

-- Inbox / messaging
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_hotel
  ON conversations(hotel_id, status, last_message_at DESC);

-- Audit log (dashboard)
CREATE INDEX IF NOT EXISTS idx_audit_hotel_created
  ON audit_logs(hotel_id, created_at DESC);

-- Loyalty
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_guest
  ON loyalty_transactions(guest_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guests_hotel_email
  ON guests(hotel_id, email);

-- Rate calendar
CREATE INDEX IF NOT EXISTS idx_rate_calendar_lookup
  ON rate_calendar(hotel_id, room_type_id, date);

-- F&B
CREATE INDEX IF NOT EXISTS idx_fb_orders_hotel_status
  ON fb_orders(hotel_id, status, created_at DESC);

-- Spa
CREATE INDEX IF NOT EXISTS idx_spa_bookings_hotel_date
  ON spa_bookings(hotel_id, start_time);

-- Maintenance
CREATE INDEX IF NOT EXISTS idx_maintenance_hotel_status
  ON maintenance_requests(hotel_id, status, created_at DESC);

-- Wishlist (guest portal)
CREATE INDEX IF NOT EXISTS idx_wishlists_guest
  ON guest_wishlists(guest_account_id);

-- Full-text search on hotels (for /search)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hotels' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE hotels ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        to_tsvector('simple',
          coalesce(name, '') || ' ' ||
          coalesce(city, '') || ' ' ||
          coalesce(address, '') || ' ' ||
          coalesce(type, '')
        )
      ) STORED;
    CREATE INDEX idx_hotels_search ON hotels USING GIN(search_vector);
  END IF;
END $$;

-- Email log table for post-stay journey deduplication
CREATE TABLE IF NOT EXISTS email_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_id       UUID REFERENCES guests(id) ON DELETE SET NULL,
  type           TEXT NOT NULL, -- 'booking_confirmation', 'cancellation', 'review', 'return', 'winback', etc.
  email          TEXT,
  sent_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_reservation_type ON email_logs(reservation_id, type);
CREATE INDEX IF NOT EXISTS idx_email_logs_hotel ON email_logs(hotel_id, sent_at DESC);


-- ============================================================
-- Merged from: 00006_production_readiness_core.sql
-- ============================================================

-- ============================================
-- Production Readiness Core
-- PWA/PDPA support, billing identifiers, and hot-path indexes.
-- ============================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS organizations_stripe_customer_unique
  ON organizations(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS organizations_stripe_subscription_unique
  ON organizations(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- dashboard and availability hot paths
CREATE INDEX IF NOT EXISTS reservations_hotel_status_dates_idx
  ON reservations(hotel_id, status, check_in, check_out);
CREATE INDEX IF NOT EXISTS reservations_hotel_created_idx
  ON reservations(hotel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS folios_hotel_status_idx
  ON folios(hotel_id, status);
CREATE INDEX IF NOT EXISTS payments_hotel_status_paid_idx
  ON payments(hotel_id, status, paid_at DESC);
CREATE INDEX IF NOT EXISTS conversations_hotel_unread_idx
  ON conversations(hotel_id, status, unread_count, last_message_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_created_asc_idx
  ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS housekeeping_tasks_hotel_status_idx
  ON housekeeping_tasks(hotel_id, status, priority, created_at);
CREATE INDEX IF NOT EXISTS maintenance_requests_hotel_status_idx
  ON maintenance_requests(hotel_id, status, priority, created_at DESC);

-- lightweight privacy request ledger for PDPA operational follow-up
CREATE TABLE IF NOT EXISTS privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_account_id UUID REFERENCES guest_accounts(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete', 'rectify')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  fulfilled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_own_privacy_requests" ON privacy_requests FOR SELECT
  USING (guest_account_id = auth.uid());

CREATE INDEX IF NOT EXISTS privacy_requests_guest_idx
  ON privacy_requests(guest_account_id, created_at DESC);


-- ============================================================
-- Merged from: 00007_phase1_closure.sql
-- ============================================================

-- ============================================
-- Phase 1 Closure
-- Auth/onboarding durability, role-aware tenant isolation, and final hot-path indexes.
-- Safe to run after previous migrations.
-- ============================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Keep policy rewrites idempotent. Yes, SQL makes us do this dance like it's 1998.
DROP POLICY IF EXISTS "profiles_same_org_select" ON user_profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON user_profiles;
DROP POLICY IF EXISTS "profiles_org_admin_update" ON user_profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON user_profiles;

CREATE POLICY "profiles_same_org_select" ON user_profiles FOR SELECT
  USING (id = auth.uid() OR organization_id = public.user_organization_id());

CREATE POLICY "profiles_self_update" ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND organization_id = public.user_organization_id()
  );

CREATE POLICY "profiles_org_admin_update" ON user_profiles FOR UPDATE
  USING (
    organization_id = public.user_organization_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = public.user_organization_id()
        AND p.role IN ('owner', 'admin')
        AND p.active = true
    )
  )
  WITH CHECK (organization_id = public.user_organization_id());

-- Invited users may create/update their own profile only inside the org embedded in auth metadata.
CREATE POLICY "profiles_self_insert" ON user_profiles FOR INSERT
  WITH CHECK (
    id = auth.uid()
    AND organization_id::text = COALESCE(auth.jwt() -> 'user_metadata' ->> 'organization_id', organization_id::text)
  );

-- Tighten common hotel-data policies so writes cannot hop hotel_id across tenants.
DROP POLICY IF EXISTS "hotel_data_isolation" ON reservations;
CREATE POLICY "hotel_data_isolation" ON reservations FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON guests;
CREATE POLICY "hotel_data_isolation" ON guests FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON conversations;
CREATE POLICY "hotel_data_isolation" ON conversations FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "messages_via_conversation" ON messages;
CREATE POLICY "messages_via_conversation" ON messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM conversations WHERE hotel_id IN (
      SELECT id FROM hotels WHERE organization_id = public.user_organization_id()
    )
  ))
  WITH CHECK (conversation_id IN (
    SELECT id FROM conversations WHERE hotel_id IN (
      SELECT id FROM hotels WHERE organization_id = public.user_organization_id()
    )
  ));

-- Core uniqueness/performance guards for onboarding and dashboard.
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_email_org_unique
  ON user_profiles(organization_id, lower(email))
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_profiles_org_role_active_idx
  ON user_profiles(organization_id, role, active);

CREATE INDEX IF NOT EXISTS hotels_org_created_idx
  ON hotels(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS room_types_hotel_created_idx
  ON room_types(hotel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS rooms_hotel_status_type_idx
  ON rooms(hotel_id, status, room_type_id);

CREATE INDEX IF NOT EXISTS reservations_hotel_checkin_status_idx
  ON reservations(hotel_id, check_in, status);

CREATE INDEX IF NOT EXISTS reservations_hotel_checkout_status_idx
  ON reservations(hotel_id, check_out, status);

CREATE INDEX IF NOT EXISTS guests_hotel_email_phone_idx
  ON guests(hotel_id, lower(email), phone);


-- ============================================================
-- Merged from: 00007_phase10.sql
-- ============================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 00007: Phase 10 — Market Dominance
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Promo codes for IBE v2
CREATE TABLE IF NOT EXISTS promo_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID REFERENCES hotels(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  description   TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent', -- percent | fixed | free_night
  discount_value DECIMAL NOT NULL,               -- % หรือ THB หรือ จำนวนคืนฟรี
  min_nights    INT DEFAULT 1,
  min_amount    DECIMAL DEFAULT 0,
  valid_from    DATE,
  valid_until   DATE,
  max_uses      INT,                             -- NULL = unlimited
  used_count    INT DEFAULT 0,
  applies_to    TEXT DEFAULT 'all',              -- all | specific_room_types
  room_type_ids UUID[],
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, code)
);

-- 2. Group bookings
CREATE TABLE IF NOT EXISTS group_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID REFERENCES hotels(id) ON DELETE CASCADE,
  group_name      TEXT NOT NULL,
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  check_in        DATE NOT NULL,
  check_out       DATE NOT NULL,
  rooms_required  INT NOT NULL DEFAULT 1,
  total_guests    INT DEFAULT 1,
  status          TEXT DEFAULT 'inquiry', -- inquiry | confirmed | cancelled
  discount_pct    DECIMAL DEFAULT 0,
  notes           TEXT,
  reservation_ids UUID[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Mobile keys (NFC/BLE)
CREATE TABLE IF NOT EXISTS mobile_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id  UUID REFERENCES reservations(id) ON DELETE CASCADE,
  room_id         UUID REFERENCES rooms(id) ON DELETE CASCADE,
  guest_account_id UUID REFERENCES guest_accounts(id) ON DELETE CASCADE,
  key_token       TEXT NOT NULL UNIQUE,
  valid_from      TIMESTAMPTZ NOT NULL,
  valid_until     TIMESTAMPTZ NOT NULL,
  revoked         BOOLEAN DEFAULT false,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. IoT devices
CREATE TABLE IF NOT EXISTS iot_devices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_id     UUID REFERENCES rooms(id) ON DELETE SET NULL,
  device_type TEXT NOT NULL, -- ac | light | lock | sensor | thermostat
  device_id   TEXT NOT NULL, -- external device identifier
  name        TEXT,
  status      TEXT DEFAULT 'online', -- online | offline | error
  last_seen   TIMESTAMPTZ,
  config      JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, device_id)
);

CREATE TABLE IF NOT EXISTS iot_readings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   UUID REFERENCES iot_devices(id) ON DELETE CASCADE,
  metric      TEXT NOT NULL, -- temperature | humidity | power_kwh | motion | door_status
  value       DECIMAL,
  unit        TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Multi-property loyalty (cross-hotel points)
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  program_name    TEXT NOT NULL DEFAULT 'Loyalty Program',
  points_per_thb  DECIMAL DEFAULT 1,   -- 1 point per 1 THB spent
  thb_per_point   DECIMAL DEFAULT 0.5, -- 0.5 THB value per point when redeeming
  tiers           JSONB DEFAULT '[
    {"name":"Bronze","min_points":0,"benefits":["ยินดีต้อนรับ"]},
    {"name":"Silver","min_points":5000,"benefits":["ส่วนลด 5%","Late checkout"]},
    {"name":"Gold","min_points":15000,"benefits":["ส่วนลด 10%","Room upgrade","Early checkin"]},
    {"name":"Platinum","min_points":50000,"benefits":["ส่วนลด 15%","Suite upgrade","Personal concierge"]}
  ]',
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-hotel guest profile
CREATE TABLE IF NOT EXISTS loyalty_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  guest_account_id UUID REFERENCES guest_accounts(id) ON DELETE CASCADE,
  member_number   TEXT UNIQUE,
  total_points    INT DEFAULT 0,
  lifetime_points INT DEFAULT 0,
  tier            TEXT DEFAULT 'Bronze',
  total_stays     INT DEFAULT 0,
  total_spent     DECIMAL DEFAULT 0,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, guest_account_id)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id        UUID REFERENCES loyalty_members(id) ON DELETE CASCADE,
  hotel_id         UUID REFERENCES hotels(id) ON DELETE SET NULL,
  reservation_id   UUID REFERENCES reservations(id) ON DELETE SET NULL,
  type             TEXT NOT NULL, -- earn | redeem | expire | bonus | adjust
  points           INT NOT NULL,
  description      TEXT,
  balance_after    INT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GDS/Metasearch tracking
CREATE TABLE IF NOT EXISTS distribution_channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID REFERENCES hotels(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL, -- google_hotel_ads | tripadvisor | trivago | sabre | amadeus
  status      TEXT DEFAULT 'pending', -- pending | active | paused | error
  config      JSONB DEFAULT '{}',
  last_sync   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, channel)
);

-- 7. Revenue targets
CREATE TABLE IF NOT EXISTS revenue_targets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   UUID REFERENCES hotels(id) ON DELETE CASCADE,
  year       INT NOT NULL,
  month      INT NOT NULL,
  target_revenue  DECIMAL DEFAULT 0,
  target_occupancy DECIMAL DEFAULT 0,
  target_adr      DECIMAL DEFAULT 0,
  actual_revenue  DECIMAL DEFAULT 0,
  actual_occupancy DECIMAL DEFAULT 0,
  actual_adr      DECIMAL DEFAULT 0,
  UNIQUE(hotel_id, year, month)
);

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_targets ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_hotel_code ON promo_codes(hotel_id, code);
CREATE INDEX IF NOT EXISTS idx_mobile_keys_token ON mobile_keys(key_token);
CREATE INDEX IF NOT EXISTS idx_mobile_keys_res ON mobile_keys(reservation_id);
CREATE INDEX IF NOT EXISTS idx_iot_readings_device_time ON iot_readings(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_members_org_guest ON loyalty_members(organization_id, guest_account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_member ON loyalty_transactions(guest_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_targets_hotel ON revenue_targets(hotel_id, year, month);


-- ============================================================
-- Merged from: 00008_phase2_revenue_compliance.sql
-- ============================================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT, ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT, ADD COLUMN IF NOT EXISTS billing_email TEXT, ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS suspension_reason TEXT, ADD COLUMN IF NOT EXISTS billing_metadata JSONB DEFAULT '{}';
CREATE UNIQUE INDEX IF NOT EXISTS organizations_stripe_customer_unique ON organizations(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS organizations_stripe_subscription_unique ON organizations(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS subscription_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, provider TEXT NOT NULL DEFAULT 'stripe', provider_event_id TEXT UNIQUE, event_type TEXT NOT NULL, status TEXT, payload JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW());
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscription_events_same_org_select ON subscription_events;
CREATE POLICY subscription_events_same_org_select ON subscription_events FOR SELECT USING (organization_id = public.user_organization_id());
CREATE INDEX IF NOT EXISTS subscription_events_org_created_idx ON subscription_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_hotel_created_idx ON audit_logs(hotel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_gateway_tx_status_idx ON payments(gateway, gateway_transaction_id, status) WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS invoices_hotel_issue_date_idx ON invoices(hotel_id, issue_date DESC);
CREATE INDEX IF NOT EXISTS privacy_requests_email_created_idx ON privacy_requests(lower(email), created_at DESC);
CREATE TABLE IF NOT EXISTS backup_runs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), provider TEXT NOT NULL DEFAULT 'supabase', status TEXT NOT NULL CHECK (status IN ('started','completed','failed')), backup_url TEXT, checksum TEXT, size_bytes BIGINT, error TEXT, started_at TIMESTAMPTZ DEFAULT NOW(), finished_at TIMESTAMPTZ);
ALTER TABLE backup_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS backup_runs_owner_admin_select ON backup_runs;
CREATE POLICY backup_runs_owner_admin_select ON backup_runs FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role IN ('owner','admin') AND p.active = true));
CREATE INDEX IF NOT EXISTS backup_runs_status_started_idx ON backup_runs(status, started_at DESC);


-- ─── Review Requests (added 2026-09) ───────────────────────────────────────

-- Review Requests table for post-stay review solicitation
CREATE TABLE IF NOT EXISTS review_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_id      UUID REFERENCES guests(id) ON DELETE SET NULL,

  channel       TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'line', 'both')),
  email_sent    BOOLEAN DEFAULT false,
  line_sent     BOOLEAN DEFAULT false,
  review_link   TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Outcome tracking
  opened_at     TIMESTAMPTZ,
  reviewed_at   TIMESTAMPTZ,
  review_id     UUID REFERENCES booking_reviews(id) ON DELETE SET NULL,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (reservation_id)
);

CREATE INDEX IF NOT EXISTS review_requests_hotel_idx ON review_requests(hotel_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS review_requests_reservation_idx ON review_requests(reservation_id);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_data_isolation" ON review_requests
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN user_profiles up ON up.organization_id = h.organization_id
      WHERE up.id = auth.uid()
    )
  );
