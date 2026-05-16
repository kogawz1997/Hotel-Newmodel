# Deployment Checklist

## Pre-Deploy: Code Quality

- [ ] `npm run type-check` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run build` → successful
- [ ] All new migrations have `IF NOT EXISTS` guards
- [ ] No `console.log` left in production paths
- [ ] No hardcoded secrets, API keys, or test credentials

## Pre-Deploy: Database Migrations

Apply in order in Supabase SQL editor or via `supabase db push`:

```
supabase/migrations/0001_*.sql
supabase/migrations/0002_*.sql
...
supabase/migrations/0006_workflow_engine.sql
```

Verify each:
- [ ] Tables created without error
- [ ] RLS enabled on all new tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Policies created for correct roles
- [ ] No breaking changes to existing tables

## Pre-Deploy: Environment Variables

### Required (App)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://yourdomain.com
CRON_SECRET=   # random 32+ char string for cron protection
```

### Payment
```
OMISE_PUBLIC_KEY=
OMISE_SECRET_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Notifications / Comms
```
SENDGRID_API_KEY=
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_API_TOKEN=
```

### AI
```
ANTHROPIC_API_KEY=
```

### Monitoring
```
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

### OTA
```
AGODA_API_KEY=
BOOKING_COM_API_KEY=
```

## Deploy Steps

1. **Merge PR** to `main` (ensure CI passes)
2. **Run DB migrations** in production Supabase (not auto-applied)
3. **Deploy to Vercel** (auto-deploy on main push if configured)
4. **Verify ENV vars** in Vercel dashboard match the list above
5. **Run smoke tests** (see below)

## Smoke Tests (Post-Deploy)

- [ ] Load `https://yourdomain.com` — landing page renders
- [ ] Load `https://yourdomain.com/auth/login` — login form appears
- [ ] Login as test staff account — redirect to `/dashboard`
- [ ] Dashboard loads without errors
- [ ] Check-in flow: create reservation → check in → room status = occupied
- [ ] Housekeeping flow: complete task → room = pending_inspection
- [ ] Notification: approve any pending approval → notification received
- [ ] OTA alert: POST `/api/ota/failed-alert` → appears in OTA dashboard
- [ ] Platform admin: login as platform admin → `/admin` loads
- [ ] Owner dashboard: login as hotel_owner → `/owner/overview` loads

## Rollback Plan

1. Revert Vercel deployment to previous deployment (Vercel dashboard → Deployments → Promote)
2. If migration is destructive: restore Supabase from point-in-time backup
3. Rollback migrations are in `supabase/migrations/rollback/` (manual SQL)

## Production Config Checks

- [ ] Supabase project is NOT paused
- [ ] Supabase connection pooling enabled (PgBouncer mode = Transaction)
- [ ] Vercel function timeout = 30s (not default 10s)
- [ ] Vercel Edge Middleware region = closest to users (Asia/Southeast Asia)
- [ ] Sentry error capture is live (test by throwing a manual error)
- [ ] SendGrid sender domain verified (check spam score)
- [ ] LINE webhook URL registered and verified
- [ ] Stripe webhook endpoint registered for all events
- [ ] Cron jobs registered in Vercel Cron or external scheduler

## Security Checklist

- [ ] Supabase RLS enabled on ALL tables (verify in Supabase dashboard)
- [ ] Service role key NOT exposed to client
- [ ] Admin routes require `is_platform_admin = true`
- [ ] Cron routes require `CRON_SECRET` header
- [ ] Webhook routes verify provider signatures
- [ ] No CORS wildcard on sensitive API routes
- [ ] Audit logs working (test with check-in action)
- [ ] Impersonation creates immutable audit trail

## Monitoring

- Sentry: configure alerts for error rate > 1% / 5 min
- Supabase: set up DB health alerts
- Vercel: enable deployment notifications on Slack/email
- OTA sync: `GET /api/ota/failed-alert?hotelId=` for recent failures
- SLA breaches: triggered automatically via cron every 30 min
