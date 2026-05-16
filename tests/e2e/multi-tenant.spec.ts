import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Multi-tenant Isolation', () => {

  test('authenticated Hotel A staff cannot access Hotel B reservations', async ({ request }) => {
    const hotelAId = process.env.TEST_HOTEL_A_ID || '';
    const hotelBId = process.env.TEST_HOTEL_B_ID || '';
    const staffACookie = process.env.TEST_STAFF_A_COOKIE || '';

    if (!hotelAId || !hotelBId || !staffACookie) {
      test.skip();
      return;
    }

    const res = await request.get(`${BASE}/api/reservations?hotelId=${hotelBId}`, {
      headers: { 'Cookie': staffACookie },
    });
    expect(res.status()).toBe(403);
  });

  test('API calls include hotel_id filter in response data', async ({ request }) => {
    const hotelAId = process.env.TEST_HOTEL_A_ID || '';
    const staffACookie = process.env.TEST_STAFF_A_COOKIE || '';

    if (!hotelAId || !staffACookie) {
      test.skip();
      return;
    }

    const res = await request.get(`${BASE}/api/reservations?hotelId=${hotelAId}`, {
      headers: { 'Cookie': staffACookie },
    });

    if (res.status() !== 200) return;

    const body = await res.json();
    for (const reservation of body.reservations || body.data || []) {
      expect(reservation.hotel_id).toBe(hotelAId);
    }
  });

  test('Hotel A staff cannot modify Hotel B room status', async ({ request }) => {
    const hotelBId = process.env.TEST_HOTEL_B_ID || '';
    const staffACookie = process.env.TEST_STAFF_A_COOKIE || '';

    if (!hotelBId || !staffACookie) {
      test.skip();
      return;
    }

    const res = await request.patch(`${BASE}/api/rooms/status`, {
      data: { hotelId: hotelBId, roomId: '00000000-0000-0000-0000-000000000000', status: 'dirty' },
      headers: { 'Cookie': staffACookie },
    });
    expect(res.status()).toBe(403);
  });

  test('guest from Hotel A cannot access Hotel B bookings in portal', async ({ request }) => {
    const hotelAGuestToken = process.env.TEST_GUEST_A_TOKEN || '';
    const hotelBId = process.env.TEST_HOTEL_B_ID || '';

    if (!hotelAGuestToken || !hotelBId) {
      test.skip();
      return;
    }

    const res = await request.get(`${BASE}/api/portal/bookings?hotelId=${hotelBId}`, {
      headers: { 'Authorization': `Bearer ${hotelAGuestToken}` },
    });
    expect([401, 403, 404]).toContain(res.status());
  });

  test('no cross-tenant data leakage in analytics endpoints', async ({ request }) => {
    const hotelAId = process.env.TEST_HOTEL_A_ID || '';
    const hotelBId = process.env.TEST_HOTEL_B_ID || '';
    const staffACookie = process.env.TEST_STAFF_A_COOKIE || '';

    if (!hotelAId || !hotelBId || !staffACookie) {
      test.skip();
      return;
    }

    const res = await request.get(`${BASE}/api/analytics/overview?hotelId=${hotelBId}`, {
      headers: { 'Cookie': staffACookie },
    });
    expect([403, 401]).toContain(res.status());
  });

  test('unauthenticated request to reservations returns 401', async ({ request }) => {
    const hotelId = process.env.TEST_HOTEL_A_ID || '00000000-0000-0000-0000-000000000000';
    const res = await request.get(`${BASE}/api/reservations?hotelId=${hotelId}`);
    expect(res.status()).toBe(401);
  });

  test('public search endpoint does not expose sensitive hotel fields', async ({ request }) => {
    const res = await request.get(`${BASE}/api/public/search?city=Bangkok`);
    if (res.status() !== 200) return;

    const body = await res.json();
    for (const hotel of body.hotels || []) {
      expect(hotel).not.toHaveProperty('omise_secret_key');
      expect(hotel).not.toHaveProperty('stripe_secret_key');
      expect(hotel).not.toHaveProperty('organization_id');
      expect(hotel).not.toHaveProperty('stripe_customer_id');
    }
  });

  test('staff dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForURL(/auth\/login|portal\/login/, { timeout: 5000 }).catch(() => {});
    expect(page.url()).toMatch(/login/);
  });

  test('Hotel A staff cannot access Hotel B OTA connections', async ({ request }) => {
    const hotelBId = process.env.TEST_HOTEL_B_ID || '';
    const staffACookie = process.env.TEST_STAFF_A_COOKIE || '';

    if (!hotelBId || !staffACookie) {
      test.skip();
      return;
    }

    const res = await request.get(`${BASE}/api/ota/connections?hotelId=${hotelBId}`, {
      headers: { 'Cookie': staffACookie },
    });
    expect([401, 403]).toContain(res.status());
  });
});
