import { createAdminClient } from '@/lib/supabase/server';

export interface ARIPayload {
  roomTypeId: string;
  roomTypeCode?: string;
  availability?: number;
  rate?: number;
  minStay?: number;
  maxStay?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
}

export interface ARIResult {
  provider: string;
  success: boolean;
  dates: string[];
  errors?: string[];
  retriesUsed?: number;
}

type ProviderFormatter = (
  hotelId: string,
  dates: string[],
  rooms: ARIPayload[],
  rateCalendar: RateCalendarRow[],
  roomRows: RoomRow[],
) => unknown;

interface RateCalendarRow {
  date: string;
  room_type_id: string;
  rate?: number | null;
  min_stay?: number | null;
  max_stay?: number | null;
  availability?: number | null;
  closed_to_arrival?: boolean | null;
  closed_to_departure?: boolean | null;
}

interface RoomRow {
  id: string;
  room_type_id: string;
  status: string;
}

function formatBookingCom(
  hotelId: string,
  dates: string[],
  rooms: ARIPayload[],
  rateCalendar: RateCalendarRow[],
): unknown {
  const calendarMap = new Map<string, RateCalendarRow>();
  for (const row of rateCalendar) {
    calendarMap.set(`${row.room_type_id}:${row.date}`, row);
  }

  return {
    hotel_id: hotelId,
    property_id: process.env.BOOKING_COM_PROPERTY_ID ?? hotelId,
    availability_updates: dates.flatMap((date) =>
      rooms.map((room) => {
        const cal = calendarMap.get(`${room.roomTypeId}:${date}`);
        return {
          room_type_code: room.roomTypeCode ?? room.roomTypeId,
          date,
          availability: cal?.availability ?? room.availability ?? 0,
          rate: cal?.rate ?? room.rate ?? 0,
          min_stay: cal?.min_stay ?? room.minStay ?? 1,
          max_stay: cal?.max_stay ?? room.maxStay ?? undefined,
          closed_to_arrival: cal?.closed_to_arrival ?? room.closedToArrival ?? false,
          closed_to_departure: cal?.closed_to_departure ?? room.closedToDeparture ?? false,
        };
      })
    ),
  };
}

function formatAgoda(
  hotelId: string,
  dates: string[],
  rooms: ARIPayload[],
  rateCalendar: RateCalendarRow[],
): unknown {
  const calendarMap = new Map<string, RateCalendarRow>();
  for (const row of rateCalendar) {
    calendarMap.set(`${row.room_type_id}:${row.date}`, row);
  }

  return {
    hotel_id: hotelId,
    updates: dates.flatMap((date) =>
      rooms.map((room) => {
        const cal = calendarMap.get(`${room.roomTypeId}:${date}`);
        return {
          room_type_id: room.roomTypeCode ?? room.roomTypeId,
          date,
          allotment: cal?.availability ?? room.availability ?? 0,
          selling_price: cal?.rate ?? room.rate ?? 0,
          min_los: cal?.min_stay ?? room.minStay ?? 1,
          max_los: cal?.max_stay ?? room.maxStay ?? undefined,
          stop_sell: (cal?.availability ?? room.availability ?? 0) === 0,
        };
      })
    ),
  };
}

function formatAirbnb(
  hotelId: string,
  dates: string[],
  rooms: ARIPayload[],
  rateCalendar: RateCalendarRow[],
): unknown {
  const calendarMap = new Map<string, RateCalendarRow>();
  for (const row of rateCalendar) {
    calendarMap.set(`${row.room_type_id}:${row.date}`, row);
  }

  return {
    listing_id: hotelId,
    calendar_operations: dates.flatMap((date) =>
      rooms.map((room) => {
        const cal = calendarMap.get(`${room.roomTypeId}:${date}`);
        const avail = cal?.availability ?? room.availability ?? 0;
        return {
          listing_id: room.roomTypeCode ?? room.roomTypeId,
          date,
          availability: avail > 0 ? 'available' : 'unavailable',
          nightly_price: cal?.rate ?? room.rate ?? 0,
          min_nights: cal?.min_stay ?? room.minStay ?? 1,
          max_nights: cal?.max_stay ?? room.maxStay ?? undefined,
        };
      })
    ),
  };
}

function formatExpedia(
  hotelId: string,
  dates: string[],
  rooms: ARIPayload[],
  rateCalendar: RateCalendarRow[],
): unknown {
  const calendarMap = new Map<string, RateCalendarRow>();
  for (const row of rateCalendar) {
    calendarMap.set(`${row.room_type_id}:${row.date}`, row);
  }

  return {
    hotel_id: hotelId,
    expedia_hotel_id: process.env.EXPEDIA_HOTEL_ID ?? hotelId,
    room_availability_updates: dates.flatMap((date) =>
      rooms.map((room) => {
        const cal = calendarMap.get(`${room.roomTypeId}:${date}`);
        const avail = cal?.availability ?? room.availability ?? 0;
        return {
          room_type_id: room.roomTypeCode ?? room.roomTypeId,
          date,
          count_available: avail,
          rate_amount: cal?.rate ?? room.rate ?? 0,
          min_los: cal?.min_stay ?? room.minStay ?? 1,
          max_los: cal?.max_stay ?? room.maxStay ?? undefined,
          cta: cal?.closed_to_arrival ?? room.closedToArrival ?? false,
          ctd: cal?.closed_to_departure ?? room.closedToDeparture ?? false,
        };
      })
    ),
  };
}

function formatTripCom(
  hotelId: string,
  dates: string[],
  rooms: ARIPayload[],
  rateCalendar: RateCalendarRow[],
): unknown {
  const calendarMap = new Map<string, RateCalendarRow>();
  for (const row of rateCalendar) {
    calendarMap.set(`${row.room_type_id}:${row.date}`, row);
  }

  return {
    hotel_id: hotelId,
    updates: dates.flatMap((date) =>
      rooms.map((room) => {
        const cal = calendarMap.get(`${room.roomTypeId}:${date}`);
        return {
          room_type_id: room.roomTypeCode ?? room.roomTypeId,
          date,
          allotment: cal?.availability ?? room.availability ?? 0,
          selling_price: cal?.rate ?? room.rate ?? 0,
          min_los: cal?.min_stay ?? room.minStay ?? 1,
          max_los: cal?.max_stay ?? room.maxStay ?? undefined,
          stop_sell: (cal?.availability ?? room.availability ?? 0) === 0,
        };
      })
    ),
  };
}

function formatHostelworld(
  hotelId: string,
  dates: string[],
  rooms: ARIPayload[],
  rateCalendar: RateCalendarRow[],
): unknown {
  const calendarMap = new Map<string, RateCalendarRow>();
  for (const row of rateCalendar) {
    calendarMap.set(`${row.room_type_id}:${row.date}`, row);
  }

  return {
    property_id: hotelId,
    rate_updates: dates.flatMap((date) =>
      rooms.map((room) => {
        const cal = calendarMap.get(`${room.roomTypeId}:${date}`);
        return {
          bed_type_id: room.roomTypeCode ?? room.roomTypeId,
          date,
          availability: cal?.availability ?? room.availability ?? 0,
          price: cal?.rate ?? room.rate ?? 0,
          min_stay: cal?.min_stay ?? room.minStay ?? 1,
        };
      })
    ),
  };
}

const FORMATTERS: Record<string, ProviderFormatter> = {
  booking_com: (hotelId, dates, rooms, rateCalendar) =>
    formatBookingCom(hotelId, dates, rooms, rateCalendar),
  agoda: (hotelId, dates, rooms, rateCalendar) =>
    formatAgoda(hotelId, dates, rooms, rateCalendar),
  airbnb: (hotelId, dates, rooms, rateCalendar) =>
    formatAirbnb(hotelId, dates, rooms, rateCalendar),
  expedia: (hotelId, dates, rooms, rateCalendar) =>
    formatExpedia(hotelId, dates, rooms, rateCalendar),
  trip_com: (hotelId, dates, rooms, rateCalendar) =>
    formatTripCom(hotelId, dates, rooms, rateCalendar),
  hostelworld: (hotelId, dates, rooms, rateCalendar) =>
    formatHostelworld(hotelId, dates, rooms, rateCalendar),
};

function getProviderEndpoint(provider: string): string | null {
  const key = `${provider.toUpperCase().replace(/-/g, '_')}_ARI_ENDPOINT`;
  return process.env[key] ?? null;
}

function getProviderApiKey(provider: string): string | null {
  const key = `${provider.toUpperCase().replace(/-/g, '_')}_API_KEY`;
  return process.env[key] ?? null;
}

async function dispatchToProvider(
  provider: string,
  endpoint: string,
  apiKey: string | null,
  body: unknown,
): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${provider} ARI push failed: HTTP ${res.status} — ${text.slice(0, 200)}`);
  }
}

async function pushWithRetry(
  provider: string,
  endpoint: string,
  apiKey: string | null,
  body: unknown,
  maxRetries = 3,
): Promise<{ retriesUsed: number }> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await dispatchToProvider(provider, endpoint, apiKey, body);
      return { retriesUsed: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      }
    }
  }
  throw lastError ?? new Error(`${provider} ARI push failed after ${maxRetries} attempts`);
}

export async function pushARIToProvider(
  hotelId: string,
  provider: string,
  dates: string[],
  rooms: ARIPayload[],
): Promise<ARIResult> {
  const normalizedProvider = provider.toLowerCase().replace(/-/g, '_');
  const formatter = FORMATTERS[normalizedProvider];

  if (!formatter) {
    return {
      provider,
      success: false,
      dates,
      errors: [`Unsupported provider: ${provider}`],
    };
  }

  const admin = createAdminClient();
  const roomTypeIds = [...new Set(rooms.map((r) => r.roomTypeId))];

  const [{ data: rateCalendar, error: rcErr }, { data: roomRows, error: rErr }] =
    await Promise.all([
      admin
        .from('rate_calendar')
        .select('date, room_type_id, rate, min_stay, max_stay, availability, closed_to_arrival, closed_to_departure')
        .eq('hotel_id', hotelId)
        .in('room_type_id', roomTypeIds)
        .in('date', dates),
      admin
        .from('rooms')
        .select('id, room_type_id, status')
        .eq('hotel_id', hotelId)
        .in('room_type_id', roomTypeIds),
    ]);

  const errors: string[] = [];
  if (rcErr) errors.push(`rate_calendar fetch error: ${rcErr.message}`);
  if (rErr) errors.push(`rooms fetch error: ${rErr.message}`);

  const body = formatter(
    hotelId,
    dates,
    rooms,
    (rateCalendar as RateCalendarRow[]) ?? [],
    (roomRows as RoomRow[]) ?? [],
  );

  const endpoint = getProviderEndpoint(normalizedProvider);
  if (!endpoint) {
    await admin.from('ota_sync_logs').insert({
      hotel_id: hotelId,
      provider: normalizedProvider,
      direction: 'outbound',
      status: 'skipped',
      payload: { reason: 'no_endpoint_configured', dates, roomCount: rooms.length },
    });
    return {
      provider,
      success: false,
      dates,
      errors: [`${provider} ARI endpoint not configured`],
    };
  }

  const apiKey = getProviderApiKey(normalizedProvider);
  const started = Date.now();

  try {
    const { retriesUsed } = await pushWithRetry(normalizedProvider, endpoint, apiKey, body);

    await admin.from('ota_sync_logs').insert({
      hotel_id: hotelId,
      provider: normalizedProvider,
      direction: 'outbound',
      status: 'success',
      payload: { dates, roomCount: rooms.length, retriesUsed },
      duration_ms: Date.now() - started,
    });

    return { provider, success: true, dates, retriesUsed };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    errors.push(errMsg);

    await admin.from('ota_sync_logs').insert({
      hotel_id: hotelId,
      provider: normalizedProvider,
      direction: 'outbound',
      status: 'failed',
      errors: { message: errMsg },
      payload: { dates, roomCount: rooms.length },
      duration_ms: Date.now() - started,
    });

    return { provider, success: false, dates, errors };
  }
}
