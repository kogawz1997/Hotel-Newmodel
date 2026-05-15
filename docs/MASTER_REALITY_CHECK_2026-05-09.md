# MASTER REALITY CHECK — 2026-05-09 (UTC)

เอกสารนี้ปรับใหม่ให้เป็น **ลิสต์งานแบบแยก P (P1-P4)** เพื่อใช้ execute ได้จริงทีละรอบ

---

## P1 — CRITICAL (ต้องปิดก่อน production claim)

### P1.1 Booking Integrity
- [ ] DB transaction-safe reservation flow
- [ ] Row/inventory locking ครบทุกเส้นทางจอง
- [ ] Idempotency key สำหรับ create booking/payment attach
- [ ] Reservation hold + timeout worker
- [ ] Duplicate booking prevention
- [ ] Race-condition/concurrent booking tests

### P1.2 Payment Integrity
- [ ] Webhook signature verification ครบทุก provider route
- [ ] Retry-safe + duplicate-safe webhook processing
- [ ] Event replay handling + idempotent ledger writes
- [ ] Payment reconciliation (provider vs DB) + mismatch recovery
- [ ] Refund/partial refund/dispute lifecycle end-to-end

### P1.3 Tenant Isolation + RBAC
- [ ] Query scoping audit ทุก tenant-facing table/API
- [ ] Route-level permission tests (API + UI)
- [ ] Upload/signed URL isolation by tenant
- [ ] Enforcement matrix สำหรับ owner/admin/staff roles

### P1.4 OTA Reliability
- [ ] Durable retry + DLQ + retry policy
- [ ] Worker coverage ที่ยังค้าง (Booking.com/Agoda/Airbnb)
- [ ] Webhook reconciliation + inventory reconciliation
- [ ] Conflict resolution flow + manual override path

### P1.5 Monitoring / Incident
- [ ] Payment/OTA/cron/webhook failure monitors
- [ ] Alert routing + severity policy
- [ ] Incident timeline + replay/retry tooling (minimum viable)

---

## P2 — STABILITY (ลดโอกาสพังใน production)

### P2.1 Queue/Worker Architecture
- [ ] Dedicated workers แยกจาก web runtime
- [ ] Heavy job isolation + retry orchestration
- [ ] Queue health dashboard (lag/failure/retry)

### P2.2 Type Safety & Contracts
- [ ] เปิด TypeScript strict mode แบบ incremental
- [ ] ลด unsafe `any` ตามโมดูลเสี่ยงก่อน (booking/payment/ota)
- [ ] Shared DTO/contracts ระหว่าง frontend/backend

### P2.3 Security Hardening
- [ ] Auth/payment endpoint rate-limit coverage 100%
- [ ] Brute-force + suspicious login detection
- [ ] Upload MIME/content validation + signed URL expiry policy
- [ ] จัดการ silent `catch {}` ให้ log/trace ได้

### P2.4 CI/CD + DR
- [ ] Merge-blocking quality gates (type/lint/tests/security)
- [ ] Staging smoke + rollback automation
- [ ] Backup verification + restore drill evidence cycle

---

## P3 — MARKET READY (แข่งขันได้จริง)

### P3.1 Guest Booking UX
- [ ] Sticky CTA + checkout optimization
- [ ] Room comparison + trust indicators
- [ ] Cancellation UX ที่ชัดเจน

### P3.2 Mobile Experience
- [ ] Thumb-first nav + sticky bottom actions
- [ ] Mobile booking flow optimization
- [ ] Motion/transitions ให้ native-feel

### P3.3 Guest Self-Service + Reputation
- [ ] Modify booking + partial cancellation + payment retry
- [ ] Invoice download + add-ons/upsell
- [ ] Ratings/reviews/moderation/reputation display

### P3.4 Owner SaaS Operations + Analytics
- [ ] Tenant health dashboard (sync/payment/quota/incidents)
- [ ] Billing lifecycle automation (failed recovery/suspension)
- [ ] Revenue + operations analytics (ADR/RevPAR/SLA/incidents)

---

## P4 — ENTERPRISE (ขยายองค์กรใหญ่)

### P4.1 Compliance / Identity
- [ ] SAML SSO complete flow (assertion/ACS/cert validation)
- [ ] TM30/e-Tax workflow ให้ลด manual-heavy

### P4.2 IoT / Keycard
- [ ] Keycard vendor adapters production-ready
- [ ] Access lifecycle + failure recovery

### P4.3 Advanced AI
- [ ] จาก assistant/template ไปสู่ autonomous workflows
- [ ] Predictive routing + forecasting models

---

## Current Evidence Notes (จากสถานะ repo)
- TypeScript strict mode ยังปิด (`"strict": false`)
- ยังมี unresolved checklist ใน `docs/TODO_3P_MAPPING.md`
- มีหลายจุดที่เป็น silent catch (`catch {}`) ซึ่งลด observability
- `npm run check` และ `npm run reality:check` ผ่าน แต่ยังไม่ใช่ตัวชี้วัด production readiness ครบมิติ

---

## Exit Criteria ก่อนใช้คำว่า “Production-ready”
- P1 ปิดครบทุกข้อ
- P2 ปิดครบอย่างน้อย 80% พร้อมหลักฐาน runbook/monitor/drill
- มี incident response path ที่ทดสอบได้จริง
- มี evidence-based signoff (ไม่ใช่แค่ README/phase close)
