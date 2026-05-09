# Delivery Handoff — 2026-05-09

อัปเดตนี้สรุปสิ่งที่ถูกปิดใน repo แล้ว, สิ่งที่ยัง blocked ด้วย environment ของรอบนี้, และสิ่งที่ต้องทำต่อในเครื่อง/production จริงก่อนส่งขึ้นโปรดักชัน

## ปิดแล้วในรอบนี้

- เพิ่ม `next-env.d.ts` เพื่อให้ Next.js type bootstrap พร้อมตั้งแต่ก่อน build แรก
- เพิ่ม Vercel cron ` /api/ota/process ` ให้ตรงกับ OTA queue worker และ static integration tests
- เพิ่ม Vercel cron ให้ background jobs ที่มีในโค้ดแล้ว: billing reconcile/retry, reliability sweep, abandoned booking recovery, OTA sync
- ขยาย CI ให้รัน `npm run check`, `npm run reality:check`, และ `npm run build` หลัง `npm ci`
- อัปเดตเอกสารหลักให้สะท้อนสถานะจริงของ snapshot นี้

## สิ่งที่ตรวจผ่านแล้ว

คำสั่งต่อไปนี้ผ่านใน environment ปัจจุบันโดยไม่ต้องติดตั้ง dependency เพิ่ม:

```bash
node tests/core-ops.test.mjs
node tests/saas-integrations.test.mjs
node tests/unit/go-live-hardening-regressions.test.mjs
node tests/final-hardening.test.mjs
```

## Blocker ที่ยังทำต่อใน container นี้ไม่ได้

`npm install` ล้มเหลวด้วย `403 Forbidden` จาก npm registry ของ environment นี้ ทำให้ยังทำสิ่งต่อไปนี้ไม่ได้ในรอบเดียวกัน:

- regenerate `package-lock.json` แบบจริง
- ยืนยัน `npm ci`
- ยืนยัน `npm run type-check`
- ยืนยัน `npm run build`
- ยืนยัน `npm run final:verify`

สรุปสั้น ๆ คือ snapshot นี้ถูกเตรียมจนพร้อมที่สุดในเชิงโค้ดและเอกสารแล้ว แต่ยังต้องมี “รอบ verify บนเครื่องที่ติดตั้ง package ได้จริง” อีกหนึ่งรอบก่อน sign-off

## ขั้นตอนถัดไปในเครื่องที่ต่อ npm ได้

ใช้ Node `20.x` แล้วรัน:

```bash
npm install --no-audit --no-fund --progress=false
npm ci
npm run type-check
npm run check
npm run reality:check
npm run build
npm run final:verify
```

เมื่อทั้งหมดผ่าน ให้เก็บ `package-lock.json` ที่ได้ใหม่ไว้ในโปรเจกต์ แล้ว deploy ต่อ

## ขั้นตอนถัดไปบน production จริง

1. ใส่ค่า env หลัก: Supabase, `CRON_SECRET`, `SENDGRID_FROM_EMAIL`, Upstash, Stripe และ Sentry ตามที่ใช้จริง
2. deploy พร้อม Vercel cron ล่าสุด
3. รัน `npm run smoke` และ `npm run go-live:evidence`
4. ตรวจ `/api/ops/readiness`
5. ปิด sign-off จากหลักฐานใน `docs/OPS_HANDOFF_GO_LIVE.md`
