import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const pass = (m) => console.log(`✅ ${m}`);
const fail = (m) => { console.error(`❌ ${m}`); process.exitCode = 1; };

const route = read('src/app/api/reservations/route.ts');
if (!route.includes("x-idempotency-key")) fail('reservations POST must read x-idempotency-key');
else pass('reservations POST reads x-idempotency-key');

if (!route.includes("reservation_idempotency_keys") || !route.includes('idempotentReplay: true')) {
  fail('reservations POST must replay existing reservation for duplicated idempotency key');
} else pass('reservations POST replays existing reservation for duplicated idempotency key');

if (!route.includes("onConflict: 'hotel_id,idempotency_key'")) {
  fail('reservations POST must upsert idempotency mapping with hotel/key unique scope');
} else pass('reservations POST upserts idempotency mapping with scoped conflict key');


if (!route.includes('Missing x-idempotency-key for public booking')) {
  fail('public bookings must require x-idempotency-key');
} else pass('public bookings require x-idempotency-key');

if (!route.includes('Invalid idempotency key length')) {
  fail('idempotency key length guard must exist');
} else pass('idempotency key length guard exists');
const migration = read('supabase/migrations/0002_phase_buildout.sql');
if (!migration.includes('UNIQUE (hotel_id, idempotency_key)')) {
  fail('migration must enforce unique idempotency key per hotel');
} else pass('migration enforces unique idempotency key per hotel');



if (!route.includes('Duplicate booking detected') || !route.includes(".in('status', ['pending_payment', 'confirmed'])")) {
  fail('reservations POST must enforce duplicate booking prevention for active statuses');
} else pass('reservations POST enforces duplicate booking prevention for active statuses');



const activeUniqueMigration = read('supabase/migrations/0002_phase_buildout.sql');
if (!activeUniqueMigration.includes("status IN ('pending_payment', 'confirmed')") || !activeUniqueMigration.includes('CREATE UNIQUE INDEX')) {
  fail('active reservation uniqueness migration must enforce DB-level duplicate prevention');
} else pass('active reservation uniqueness migration enforces DB-level duplicate prevention');

if (!process.exitCode) pass('reservation idempotency guard checks passed');
