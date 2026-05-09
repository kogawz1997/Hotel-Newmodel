# Scale and Restore Runbook

Updated: 2026-05-09

## Horizontal scaling readiness

- App is stateless and uses external Supabase/Postgres for data.
- Redis/Upstash should be enabled for production rate limiting, queue locking, and cross-instance coordination.
- Vercel/serverless deployments should use `npm ci` from `package-lock.json`.
- Background jobs are exposed through protected cron routes and can run across multiple instances safely when queue locks are enabled.

## Multi-region strategy

Primary region: `ap-southeast-1`
Replica/failover region: `ap-southeast-2`
Target RPO: 15 minutes
Target RTO: 60 minutes

## Restore drill

1. Take a production backup or use latest verified backup.
2. Restore into isolated staging database.
3. Run migrations and readiness checks.
4. Run smoke tests against staging URL.
5. Record result with `node scripts/restore-drill.mjs --record`.
6. Attach evidence to release ticket.

## Rollback

- Revert application deployment to previous Vercel/hosting build.
- Keep DB migrations additive when possible.
- For destructive DB changes, take a fresh backup before migration and keep rollback SQL in release notes.
