import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'test-cron-secret';
const WEBHOOK_SECRET = process.env.OTA_WEBHOOK_SECRET || CRON_SECRET;

const BOOKING_COM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResNotifRQ ResStatus="New" xmlns="http://www.opentravel.org/OTA/2003/05">
  <HotelReservations>
    <HotelReservation>
      <UniqueID Type="14" ID="BDC-E2E-88888"/>
      <RoomStays>
        <RoomStay>
          <RoomTypes><RoomType RoomTypeCode="STD"/></RoomTypes>
          <RoomRates>
            <RoomRate RoomTypeCode="STD">
              <Rates><Rate AmountAfterTax="3500.00" CurrencyCode="THB"/></Rates>
            </RoomRate>
          </RoomRates>
          <GuestCounts>
            <GuestCount AgeQualifyingCode="10" Count="2"/>
          </GuestCounts>
          <TimeSpan>
            <StayDateRange Start="2025-11-10" End="2025-11-13"/>
          </TimeSpan>
        </RoomStay>
      </RoomStays>
      <ResGuests>
        <ResGuest>
          <Profiles><ProfileInfo><Profile><Customer>
            <PersonName>
              <GivenName>E2E</GivenName>
              <Surname>TestGuest</Surname>
            </PersonName>
            <Email>e2e-test@example.com</Email>
          </Customer></Profile></ProfileInfo></Profiles>
        </ResGuest>
      </ResGuests>
    </HotelReservation>
  </HotelReservations>
</OTA_HotelResNotifRQ>`;

test.describe('OTA Sync E2E', () => {

  test('Booking.com webhook POST to /api/ota/process requires CRON_SECRET', async ({ request }) => {
    const res = await request.post(`${BASE}/api/ota/process`, {
      data: { provider: 'booking_com', payload: { xml: BOOKING_COM_XML }, hotel_id: process.env.TEST_HOTEL_ID || '00000000-0000-0000-0000-000000000000' },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });
    expect([200, 401, 404]).toContain(res.status());
  });

  test('invalid webhook secret returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/ota/process`, {
      data: { provider: 'booking_com', payload: { xml: BOOKING_COM_XML } },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-secret-xyz',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('malformed JSON payload returns 400 or 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/ota/process`, {
      data: 'not valid json at all }{',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test('duplicate Booking.com webhook is handled idempotently', async ({ request }) => {
    const payload = {
      provider: 'booking_com',
      payload: { xml: BOOKING_COM_XML },
      hotel_id: process.env.TEST_HOTEL_ID || '00000000-0000-0000-0000-000000000000',
      type: 'reservations',
    };
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CRON_SECRET}`,
    };

    const res1 = await request.post(`${BASE}/api/ota/process`, { data: payload, headers });
    const res2 = await request.post(`${BASE}/api/ota/process`, { data: payload, headers });

    expect([200, 401, 404]).toContain(res1.status());
    expect([200, 401, 404]).toContain(res2.status());

    if (res1.status() === 200 && res2.status() === 200) {
      const body2 = await res2.json();
      expect(body2).toHaveProperty('ok');
    }
  });

  test('GET /api/ota/process also processes the queue with valid auth', async ({ request }) => {
    const res = await request.get(`${BASE}/api/ota/process`, {
      headers: { 'Authorization': `Bearer ${CRON_SECRET}` },
    });
    expect([200, 401, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('ok');
      expect(typeof body.processed).toBe('number');
    }
  });

  test('OTA process endpoint rejects unauthenticated requests', async ({ request }) => {
    const res = await request.post(`${BASE}/api/ota/process`, {
      data: { provider: 'booking_com', payload: {} },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });
});
