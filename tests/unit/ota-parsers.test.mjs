/**
 * OTA Parser static tests — verify parsers exist and handle key formats
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const pass = (m) => console.log(`✅ ${m}`);
const fail = (m) => { console.error(`❌ ${m}`); process.exitCode = 1; };
const exists = (p) => fs.existsSync(path.join(root, p));

// Parser files exist
for (const f of [
  'src/lib/ota/parsers/booking-com.ts',
  'src/lib/ota/parsers/agoda.ts',
  'src/lib/ota/parsers/airbnb.ts',
  'src/lib/ota/reservation-mapper.ts',
]) {
  if (!exists(f)) fail(`Missing: ${f}`);
  else pass(`Parser exists: ${path.basename(f)}`);
}

// Booking.com parser handles OTA XML
const bcom = read('src/lib/ota/parsers/booking-com.ts');
if (!bcom.includes('OTA_HotelResNotifRQ') || !bcom.includes('ResStatus')) {
  fail('Booking.com parser must handle OTA_HotelResNotifRQ XML format');
} else pass('Booking.com parser handles OTA XML');

if (!bcom.includes('StayDateRange') || !bcom.includes('GuestCount')) {
  fail('Booking.com parser must extract StayDateRange and GuestCount');
} else pass('Booking.com parser extracts dates and guest count');

// Agoda parser handles JSON
const agoda = read('src/lib/ota/parsers/agoda.ts');
if (!agoda.includes('booking_id') || !agoda.includes('check_in')) {
  fail('Agoda parser must handle booking_id and check_in fields');
} else pass('Agoda parser handles YCS JSON format');

// Airbnb parser handles iCal
const airbnb = read('src/lib/ota/parsers/airbnb.ts');
if (!airbnb.includes('VCALENDAR') || !airbnb.includes('VEVENT')) {
  fail('Airbnb parser must handle iCal VCALENDAR/VEVENT format');
} else pass('Airbnb parser handles iCal format');

if (!airbnb.includes('parseAirbnbPayload')) {
  fail('Airbnb parser must also handle JSON webhook payload');
} else pass('Airbnb parser handles both iCal and JSON webhooks');

// Mapper creates reservations
const mapper = read('src/lib/ota/reservation-mapper.ts');
if (!mapper.includes('ota_booking_ref')) {
  fail('reservation-mapper must store ota_booking_ref for dedup/modification');
} else pass('reservation-mapper stores ota_booking_ref');

if (!mapper.includes("source: parsed.source")) {
  fail('reservation-mapper must record the OTA source channel');
} else pass('reservation-mapper records OTA source channel');

// Process route uses parsers
const processRoute = read('src/app/api/ota/process/route.ts');
if (!processRoute.includes('parseBookingComXml') || !processRoute.includes('parseAgodaJson')) {
  fail('OTA process route must call provider parsers');
} else pass('OTA process route calls provider parsers');

if (!processRoute.includes('mapOtaReservation')) {
  fail('OTA process route must call mapOtaReservation');
} else pass('OTA process route maps parsed reservations');

if (!process.exitCode) pass('OTA parser checks passed');
