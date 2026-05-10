# P1 Execution Tracker — 2026-05-09 (UTC)

สถานะ: **เริ่ม P1 แล้ว**

อ้างอิงจาก `docs/MASTER_REALITY_CHECK_2026-05-09.md` และแตกงาน P1 เป็น backlog ที่ติดตามได้จริง

## P1 Scope Baseline
- P1 ทั้งหมด: 22 งาน
- ปิดแล้ว: 2
- กำลังทำ: 0
- คงเหลือ: 20

## Started Now (P1.1 Booking Integrity)
- [x] Idempotency key boundary สำหรับ create reservation (header `x-idempotency-key`)
- [ ] Transaction/locking design note (ต่อรอบถัดไป)
- [ ] Hold-timeout release strategy (ต่อรอบถัดไป)

## P1 Checklist Breakdown (for tracking)

### P1.1 Booking Integrity (6)
- [ ] DB transaction-safe reservation flow
- [ ] Row/inventory locking ครบทุกเส้นทางจอง
- [x] Idempotency key สำหรับ create booking/payment attach
- [ ] Reservation hold + timeout worker
- [x] Duplicate booking prevention
- [ ] Race-condition/concurrent booking tests

### P1.2 Payment Integrity (5)
- [ ] Webhook signature verification ครบทุก provider route
- [ ] Retry-safe + duplicate-safe webhook processing
- [ ] Event replay handling + idempotent ledger writes
- [ ] Payment reconciliation (provider vs DB) + mismatch recovery
- [ ] Refund/partial refund/dispute lifecycle end-to-end

### P1.3 Tenant Isolation + RBAC (4)
- [ ] Query scoping audit ทุก tenant-facing table/API
- [ ] Route-level permission tests (API + UI)
- [ ] Upload/signed URL isolation by tenant
- [ ] Enforcement matrix สำหรับ owner/admin/staff roles

### P1.4 OTA Reliability (4)
- [ ] Durable retry + DLQ + retry policy
- [ ] Worker coverage ที่ยังค้าง (Booking.com/Agoda/Airbnb)
- [ ] Webhook reconciliation + inventory reconciliation
- [ ] Conflict resolution flow + manual override path

### P1.5 Monitoring / Incident (3)
- [ ] Payment/OTA/cron/webhook failure monitors
- [ ] Alert routing + severity policy
- [ ] Incident timeline + replay/retry tooling (minimum viable)

---

## Remaining by Phase (snapshot)
- P1: เหลือ 20/22 งาน (ปิดแล้ว 2)
- P2: เหลือ 13/13 งาน
- P3: เหลือ 12/12 งาน
- P4: เหลือ 6/6 งาน

รวมทุก Phase: เหลือ 51/53 งาน

## Progress Log
- 2026-05-09: เพิ่ม guard test สำหรับ reservation idempotency (`tests/unit/reservation-idempotency-guard.test.mjs`) และผูกเข้า `npm run test:unit` เพื่อกัน regression.
- 2026-05-09: บังคับ public booking ต้องส่ง `x-idempotency-key` และเพิ่ม key-length guard (8-128) เพื่อลด duplicate/replay risk เพิ่มเติม.
- 2026-05-09: เพิ่ม duplicate booking prevention ใน `/api/reservations` (ตรวจ guest/room_type/date/status ก่อน insert แล้วตีกลับ 409 หากซ้ำ).
- 2026-05-09: เพิ่ม DB-level unique index สำหรับ active reservation duplicates (`pending_payment`,`confirmed`) เพื่อกันซ้ำที่ชั้นฐานข้อมูล.
