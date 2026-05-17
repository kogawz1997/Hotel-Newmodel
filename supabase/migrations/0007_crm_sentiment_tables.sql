-- ============================================================
-- P1.5 CRM Segment Definitions, Members, and Conversation Routing
-- Tables: crm_segment_definitions, crm_segment_members,
--         conversation_routing_rules
-- ============================================================

-- ─── CRM Segment Definitions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_segment_definitions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN (
               'vip', 'repeat_guest', 'high_spender', 'new_guest',
               'loyalty_member', 'at_risk_churn', 'win_back', 'custom'
             )),
  rules      JSONB NOT NULL DEFAULT '[]',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_segments_hotel ON crm_segment_definitions(hotel_id, is_active, is_deleted);

-- ─── CRM Segment Members ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_segment_members (
  segment_id UUID NOT NULL REFERENCES crm_segment_definitions(id) ON DELETE CASCADE,
  guest_id   UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  score      NUMERIC,
  PRIMARY KEY (segment_id, guest_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_segment_members_segment ON crm_segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_crm_segment_members_guest   ON crm_segment_members(guest_id);

-- ─── Conversation Routing Rules ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversation_routing_rules (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id                UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  sentiment               TEXT NOT NULL CHECK (sentiment IN ('negative', 'neutral', 'positive', 'any')),
  emotion_score_lt        NUMERIC,
  assign_to_role          TEXT NOT NULL,
  sla_minutes             INTEGER NOT NULL DEFAULT 120,
  escalate_after_minutes  INTEGER,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routing_rules_hotel ON conversation_routing_rules(hotel_id, is_active);

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

ALTER TABLE crm_segment_definitions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_segment_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_routing_rules ENABLE ROW LEVEL SECURITY;

-- crm_segment_definitions: hotel-scoped CRUD
CREATE POLICY crm_segments_select ON crm_segment_definitions FOR SELECT
  USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid() AND p.active = true
  ));

CREATE POLICY crm_segments_insert ON crm_segment_definitions FOR INSERT
  WITH CHECK (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid() AND p.active = true
  ));

CREATE POLICY crm_segments_update ON crm_segment_definitions FOR UPDATE
  USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid() AND p.active = true
  ));

CREATE POLICY crm_segments_delete ON crm_segment_definitions FOR DELETE
  USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid() AND p.active = true
  ));

-- crm_segment_members: scoped via segment's hotel
CREATE POLICY crm_segment_members_select ON crm_segment_members FOR SELECT
  USING (segment_id IN (
    SELECT id FROM crm_segment_definitions
  ));

CREATE POLICY crm_segment_members_insert ON crm_segment_members FOR INSERT
  WITH CHECK (segment_id IN (
    SELECT id FROM crm_segment_definitions
  ));

CREATE POLICY crm_segment_members_update ON crm_segment_members FOR UPDATE
  USING (segment_id IN (
    SELECT id FROM crm_segment_definitions
  ));

CREATE POLICY crm_segment_members_delete ON crm_segment_members FOR DELETE
  USING (segment_id IN (
    SELECT id FROM crm_segment_definitions
  ));

-- conversation_routing_rules: hotel-scoped CRUD
CREATE POLICY routing_rules_select ON conversation_routing_rules FOR SELECT
  USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid() AND p.active = true
  ));

CREATE POLICY routing_rules_insert ON conversation_routing_rules FOR INSERT
  WITH CHECK (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid() AND p.active = true
  ));

CREATE POLICY routing_rules_update ON conversation_routing_rules FOR UPDATE
  USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid() AND p.active = true
  ));

CREATE POLICY routing_rules_delete ON conversation_routing_rules FOR DELETE
  USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid() AND p.active = true
  ));
