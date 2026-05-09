# Production Handoff 4P

Updated: 2026-05-09

This handoff closes the 36 open `MASTER_4P_TASKS.md` items from the repository side. Items that require live vendor dashboards are marked as code-closed with explicit production evidence required before go-live.

## Final local/CI commands

```bash
nvm use 20
npm ci
npm run check:env
npm run check:strict
npm run security-check
npm run build
npm run deploy:check
BASE_URL=https://your-production-domain.com npm run smoke
npm run go-live:check
npm run go-live:evidence:strict
```

## Vendor activation checklist

| Area | Required production action | Evidence |
|---|---|---|
| Supabase Auth | Enable email confirmation, OAuth providers, redirect URLs, SMTP | screenshot + login smoke test |
| Stripe/Omise | Live keys, webhook endpoint, price IDs, refund test | webhook delivery + test payment/refund receipt |
| SendGrid | Verified domain/sender and templates | delivered email headers |
| Upstash Redis | REST URL/token for rate limits and queue locks | health/readiness response |
| Sentry | DSN/project/alert rules | captured staging error |
| Booking.com/Agoda/Expedia/Airbnb | API base URLs/tokens, room/rate mappings, webhook secret | vendor sandbox sync logs |
| Supabase DB | Apply migrations through `20260509090000_master_4p_completion.sql` | migration history screenshot |
| Backup/restore | Run `node scripts/restore-drill.mjs --record` after a real backup restore | restore drill evidence file |

## Handoff status

- Code anchors exist for all previously open items.
- `MASTER_4P_TASKS.md` has no remaining `[ ]` item.
- The external setup tasks are not hidden; they are converted into production evidence requirements.
- Do not mark go-live signed off until the commands and evidence above pass on the real production environment.


## Sandbox build note

In this ChatGPT sandbox, dependencies were available through a staged `node_modules` symlink and Node is `v22.16.0`, while the project pins Node `20.x`. `npm run type-check`, `npm run lint`, `npm run check:strict`, static integration checks, deploy checks, uptime checks, and security audit were run successfully. Full `next build` was attempted but the sandbox killed the optimization process due resource limits, so final `npm ci` + `npm run build` must be executed on the real Node 20 CI/hosting environment before go-live sign-off.
