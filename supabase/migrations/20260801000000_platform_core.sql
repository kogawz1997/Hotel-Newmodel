-- Platform Core: billing subscriptions, invoices, credits, add-ons

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('starter','standard','pro','enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','trialing','past_due','cancelled','paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_id)
);

CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','paid','void','uncollectible')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  stripe_invoice_id TEXT,
  description TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT,
  issued_by UUID REFERENCES user_profiles(id),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  addon_type TEXT NOT NULL CHECK (addon_type IN ('extra_hotels','extra_seats','ai_boost','sms_pack','white_label','api_access')),
  quantity INT DEFAULT 1,
  price_per_unit NUMERIC(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_invoices_org_idx ON billing_invoices(org_id, status);
CREATE INDEX IF NOT EXISTS billing_credits_org_idx ON billing_credits(org_id);
CREATE INDEX IF NOT EXISTS platform_addons_org_idx ON platform_addons(org_id);
