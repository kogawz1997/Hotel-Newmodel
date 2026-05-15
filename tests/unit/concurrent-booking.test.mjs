/**
 * Race condition / concurrent booking guard tests
 * These are static-analysis tests verifying the advisory lock is in place.
 * True concurrency tests require a live DB — run with: npm run test:e2e (when configured)
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const pass = (m) => console.log(`✅ ${m}`);
const fail = (m) => { console.error(`❌ ${m}`); process.exitCode = 1; };

// 1. Advisory lock function must exist
const lockLib = read('src/lib/booking/availability-lock.ts');
if (!lockLib.includes('pg_try_advisory_lock')) {
  fail('availability-lock must use pg_try_advisory_lock for race prevention');
} else pass('availability-lock uses pg_try_advisory_lock');

// 2. checkAndReserve must be called in reservation POST
const reservationsRoute = read('src/app/api/reservations/route.ts');
if (!reservationsRoute.includes('checkAndReserve')) {
  fail('reservations POST must call checkAndReserve (advisory lock)');
} else pass('reservations POST calls checkAndReserve');

// 3. Atomic RPC must exist
if (!reservationsRoute.includes('create_reservation_atomic')) {
  fail('reservations POST must use atomic RPC for DB write');
} else pass('reservations POST uses create_reservation_atomic RPC');

// 4. Migration must define the RPC function
const migration = read('supabase/migrations/20260511041344_p1_create_reservation_rpc.sql');
if (!migration.includes('CREATE OR REPLACE FUNCTION create_reservation_atomic')) {
  fail('migration must define create_reservation_atomic function');
} else pass('migration defines create_reservation_atomic');

// 5. RPC must handle idempotency inside transaction
if (!migration.includes('reservation_idempotency_keys')) {
  fail('create_reservation_atomic must check idempotency inside transaction');
} else pass('create_reservation_atomic handles idempotency atomically');

// 6. expirePendingPayments must exist for timeout enforcement
if (!lockLib.includes('expirePendingPayments')) {
  fail('availability-lock must export expirePendingPayments for 15-min hold enforcement');
} else pass('expirePendingPayments exported for reservation hold timeout');

// 7. Cron must run every 15 minutes (not daily)
const vercelJson = JSON.parse(read('vercel.json'));
const expireCron = vercelJson.crons?.find((c) => c.path === '/api/cron/expire-pending');
if (!expireCron) {
  fail('vercel.json must schedule /api/cron/expire-pending');
} else if (!expireCron.schedule.startsWith('*/15')) {
  fail(`expire-pending cron schedule must be */15 * * * * (got: ${expireCron.schedule})`);
} else pass('expire-pending cron runs every 15 minutes');

if (!process.exitCode) pass('concurrent booking guard checks passed');
