-- Master 4P production completion migration
-- Safe additive schema for the final 36 checklist items.

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id uuid not null,
  role text not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.setup_checklists (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  section text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (hotel_id, section)
);

create table if not exists public.cms_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  type text not null check (type in ('blog','knowledge_base')),
  title text not null,
  excerpt text,
  body text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_addons (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  code text not null,
  name text not null,
  price numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hotel_id, code)
);

create table if not exists public.reservation_timeline_events (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null,
  hotel_id uuid not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists reservation_timeline_events_reservation_idx on public.reservation_timeline_events(reservation_id, created_at desc);

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  room_type_id uuid,
  guest_id uuid,
  check_in date not null,
  check_out date not null,
  status text not null default 'open',
  priority int not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  room_id uuid,
  equipment_id uuid,
  vendor_id uuid,
  title text not null,
  description text,
  priority text not null default 'normal',
  status text not null default 'open',
  sla_due_at timestamptz,
  escalated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ota_channel_mappings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  provider text not null,
  external_property_id text,
  external_room_type_id text,
  external_rate_plan_id text,
  room_type_id uuid,
  rate_plan_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hotel_id, provider, external_room_type_id, external_rate_plan_id)
);

create table if not exists public.ota_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid,
  provider text not null,
  job_type text not null,
  status text not null default 'queued',
  attempts int not null default 0,
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ota_sync_jobs_queue_idx on public.ota_sync_jobs(status, next_attempt_at);

create table if not exists public.enterprise_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  key_hash text not null unique,
  scopes text[] not null default '{}',
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  url text not null,
  events text[] not null default '{}',
  secret_hint text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.restore_drill_results (
  id uuid primary key default gen_random_uuid(),
  environment text not null,
  backup_id text,
  rpo_minutes int,
  rto_minutes int,
  status text not null default 'planned',
  evidence_url text,
  created_at timestamptz not null default now()
);
