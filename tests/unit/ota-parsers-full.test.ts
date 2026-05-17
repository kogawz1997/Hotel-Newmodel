import { parseBookingComXml } from '@/lib/ota/parsers/booking-com';
import { parseAgodaJson } from '@/lib/ota/parsers/agoda';
import { parseExpediaReservation } from '@/lib/ota/parsers/expedia';
import { parseTripComReservation } from '@/lib/ota/parsers/trip-com';
import { parseHostelworldReservation } from '@/lib/ota/parsers/hostelworld';

describe('OTA Parsers', () => {

  describe('Booking.com XML parser', () => {
    const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResNotifRQ ResStatus="New" xmlns="http://www.opentravel.org/OTA/2003/05">
  <HotelReservations>
    <HotelReservation>
      <UniqueID Type="14" ID="BDC-12345678"/>
      <RoomStays>
        <RoomStay>
          <RoomTypes>
            <RoomType RoomTypeCode="STD"/>
          </RoomTypes>
          <RoomRates>
            <RoomRate RoomTypeCode="STD">
              <Rates>
                <Rate AmountAfterTax="4500.00" CurrencyCode="THB"/>
              </Rates>
            </RoomRate>
          </RoomRates>
          <GuestCounts>
            <GuestCount AgeQualifyingCode="10" Count="2"/>
            <GuestCount AgeQualifyingCode="8" Count="1"/>
          </GuestCounts>
          <TimeSpan>
            <StayDateRange Start="2025-06-15" End="2025-06-18"/>
          </TimeSpan>
        </RoomStay>
      </RoomStays>
      <ResGuests>
        <ResGuest>
          <Profiles>
            <ProfileInfo>
              <Profile>
                <Customer>
                  <PersonName>
                    <GivenName>Somchai</GivenName>
                    <Surname>Jaidee</Surname>
                  </PersonName>
                  <Email>somchai@example.com</Email>
                  <Telephone PhoneNumber="+66891234567"/>
                  <CountryName Code="TH"/>
                </Customer>
              </Profile>
            </ProfileInfo>
          </Profiles>
        </ResGuest>
      </ResGuests>
      <SpecialRequests>Late check-in requested</SpecialRequests>
    </HotelReservation>
  </HotelReservations>
</OTA_HotelResNotifRQ>`;

    it('parses valid payload into correct NormalizedReservation fields', () => {
      const result = parseBookingComXml(validXml);
      expect(result).not.toBeNull();
      expect(result!.externalId).toBe('BDC-12345678');
      expect(result!.status).toBe('new');
      expect(result!.checkIn).toBe('2025-06-15');
      expect(result!.checkOut).toBe('2025-06-18');
      expect(result!.numAdults).toBe(2);
      expect(result!.numChildren).toBe(1);
      expect(result!.totalAmount).toBe(4500);
      expect(result!.currency).toBe('THB');
      expect(result!.roomTypeCode).toBe('STD');
      expect(result!.firstName).toBe('Somchai');
      expect(result!.lastName).toBe('Jaidee');
      expect(result!.email).toBe('somchai@example.com');
      expect(result!.phone).toBe('+66891234567');
      expect(result!.nationality).toBe('TH');
      expect(result!.specialRequests).toBe('Late check-in requested');
      expect(result!.source).toBe('booking_com');
    });

    it('returns status cancelled for cancellation notification', () => {
      const cancelXml = validXml.replace('ResStatus="New"', 'ResStatus="Cancelled"');
      const result = parseBookingComXml(cancelXml);
      expect(result).not.toBeNull();
      expect(result!.status).toBe('cancelled');
    });

    it('returns null when check-in or check-out dates are missing', () => {
      const noDateXml = `<OTA_HotelResNotifRQ ResStatus="New">
        <UniqueID Type="14" ID="BDC-99"/>
        <PersonName><GivenName>Test</GivenName><Surname>Guest</Surname></PersonName>
      </OTA_HotelResNotifRQ>`;
      const result = parseBookingComXml(noDateXml);
      expect(result).toBeNull();
    });

    it('uses defaults for missing optional fields', () => {
      const minimalXml = `<OTA_HotelResNotifRQ ResStatus="New">
        <UniqueID Type="14" ID="BDC-MIN-001"/>
        <StayDateRange Start="2025-07-01" End="2025-07-03"/>
      </OTA_HotelResNotifRQ>`;
      const result = parseBookingComXml(minimalXml);
      expect(result).not.toBeNull();
      expect(result!.numAdults).toBe(1);
      expect(result!.numChildren).toBe(0);
      expect(result!.firstName).toBe('Booking.com');
      expect(result!.lastName).toBe('Guest');
      expect(result!.currency).toBe('THB');
      expect(result!.email).toBeUndefined();
    });

    it('handles malformed XML without throwing', () => {
      const result = parseBookingComXml('<broken><xml');
      expect(result).toBeNull();
    });
  });

  describe('Agoda JSON parser', () => {
    const validPayload = {
      booking_id: 'AGD-987654',
      hotel_id: 'HTL001',
      check_in: '2025-08-10',
      check_out: '2025-08-13',
      status: 'confirmed',
      currency: 'THB',
      total_price: 9800,
      room_type_code: 'DLX',
      special_requests: 'High floor preferred',
      guest: {
        first_name: 'Nipa',
        last_name: 'Wongdee',
        email: 'nipa@example.com',
        phone: '+66812345678',
        nationality: 'TH',
        num_adults: 2,
        num_children: 0,
      },
    };

    it('parses valid payload into correct fields', () => {
      const result = parseAgodaJson(validPayload);
      expect(result).not.toBeNull();
      expect(result!.externalId).toBe('AGD-987654');
      expect(result!.status).toBe('new');
      expect(result!.checkIn).toBe('2025-08-10');
      expect(result!.checkOut).toBe('2025-08-13');
      expect(result!.numAdults).toBe(2);
      expect(result!.numChildren).toBe(0);
      expect(result!.totalAmount).toBe(9800);
      expect(result!.currency).toBe('THB');
      expect(result!.roomTypeCode).toBe('DLX');
      expect(result!.firstName).toBe('Nipa');
      expect(result!.lastName).toBe('Wongdee');
      expect(result!.email).toBe('nipa@example.com');
      expect(result!.phone).toBe('+66812345678');
      expect(result!.nationality).toBe('TH');
      expect(result!.specialRequests).toBe('High floor preferred');
      expect(result!.source).toBe('agoda');
    });

    it('maps cancellation status correctly', () => {
      const result = parseAgodaJson({ ...validPayload, status: 'cancelled' });
      expect(result!.status).toBe('cancelled');
    });

    it('handles flat (non-nested) guest fields', () => {
      const flatPayload = {
        booking_id: 'AGD-FLAT-001',
        check_in: '2025-09-01',
        check_out: '2025-09-03',
        first_name: 'Flat',
        last_name: 'Guest',
        email: 'flat@example.com',
        num_adults: 1,
        total_amount: 3000,
      };
      const result = parseAgodaJson(flatPayload);
      expect(result).not.toBeNull();
      expect(result!.firstName).toBe('Flat');
      expect(result!.lastName).toBe('Guest');
      expect(result!.numAdults).toBe(1);
    });

    it('returns null when check-in or check-out are missing', () => {
      const result = parseAgodaJson({ booking_id: 'AGD-NODATE' } as any);
      expect(result).toBeNull();
    });

    it('falls back to selling_price if total_price absent', () => {
      const result = parseAgodaJson({ ...validPayload, total_price: undefined as any, selling_price: 5500 });
      expect(result!.totalAmount).toBe(5500);
    });
  });

  describe('Expedia EQC XML parser', () => {
    const validExpediaXml = `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResNotifRQ ResStatus="New">
  <HotelReservations>
    <HotelReservation>
      <UniqueID Type="14" ID="EXP-55667788"/>
      <RoomStays>
        <RoomStay>
          <RoomTypes>
            <RoomType RoomTypeCode="KING"/>
          </RoomTypes>
          <RoomRates>
            <RoomRate RoomTypeCode="KING" RatePlanCode="EXP-RP-001">
              <Rates>
                <Rate AmountAfterTax="7200.00" CurrencyCode="USD"/>
              </Rates>
            </RoomRate>
          </RoomRates>
          <GuestCounts>
            <GuestCount AgeQualifyingCode="10" Count="2"/>
          </GuestCounts>
          <TimeSpan>
            <StayDateRange Start="2025-09-20" End="2025-09-23"/>
          </TimeSpan>
        </RoomStay>
      </RoomStays>
      <ResGuests>
        <ResGuest>
          <Profiles>
            <ProfileInfo>
              <Profile>
                <Customer>
                  <PersonName>
                    <GivenName>John</GivenName>
                    <Surname>Smith</Surname>
                  </PersonName>
                  <Email>john.smith@example.com</Email>
                  <Telephone PhoneNumber="+12025551234"/>
                </Customer>
              </Profile>
            </ProfileInfo>
          </Profiles>
        </ResGuest>
      </ResGuests>
    </HotelReservation>
  </HotelReservations>
</OTA_HotelResNotifRQ>`;

    it('parses valid EQC XML into correct fields', () => {
      const result = parseExpediaReservation(validExpediaXml);
      expect(result).not.toBeNull();
      expect(result!.externalId).toBe('EXP-55667788');
      expect(result!.status).toBe('new');
      expect(result!.checkIn).toBe('2025-09-20');
      expect(result!.checkOut).toBe('2025-09-23');
      expect(result!.numAdults).toBe(2);
      expect(result!.numChildren).toBe(0);
      expect(result!.totalAmount).toBe(7200);
      expect(result!.currency).toBe('USD');
      expect(result!.roomTypeCode).toBe('KING');
      expect(result!.firstName).toBe('John');
      expect(result!.lastName).toBe('Smith');
      expect(result!.email).toBe('john.smith@example.com');
      expect(result!.source).toBe('expedia');
    });

    it('parses cancellation notification with cancelled status', () => {
      const cancelXml = validExpediaXml.replace('ResStatus="New"', 'ResStatus="Cancelled"');
      const result = parseExpediaReservation(cancelXml);
      expect(result).not.toBeNull();
      expect(result!.status).toBe('cancelled');
    });

    it('parses Expedia JSON payload', () => {
      const jsonPayload = {
        booking_id: 'EXP-JSON-001',
        check_in: '2025-10-05',
        check_out: '2025-10-08',
        status: 'new',
        currency: 'USD',
        total_amount: 6300,
        room_type_id: 'SUITE-01',
        guest: {
          first_name: 'Alice',
          last_name: 'Traveler',
          email: 'alice@example.com',
          adults: 2,
          children: 1,
        },
      };
      const result = parseExpediaReservation(jsonPayload);
      expect(result).not.toBeNull();
      expect(result!.externalId).toBe('EXP-JSON-001');
      expect(result!.checkIn).toBe('2025-10-05');
      expect(result!.totalAmount).toBe(6300);
      expect(result!.firstName).toBe('Alice');
      expect(result!.numChildren).toBe(1);
      expect(result!.source).toBe('expedia');
    });

    it('returns null for payload with missing dates', () => {
      const result = parseExpediaReservation({ booking_id: 'EXP-NODATE' });
      expect(result).toBeNull();
    });

    it('returns null for null/undefined input', () => {
      expect(parseExpediaReservation(null)).toBeNull();
      expect(parseExpediaReservation(undefined)).toBeNull();
    });
  });

  describe('Trip.com JSON parser', () => {
    const validPayload = {
      order_id: 'TC-20250801-001',
      hotel_id: 'HTLTC001',
      room_type_id: 'DLX-KING',
      check_in_date: '2025-10-10',
      check_out_date: '2025-10-13',
      order_status: 'confirmed',
      currency: 'THB',
      total_price: 12000,
      adult_count: 2,
      child_count: 1,
      special_requests: 'Quiet room please',
      guest_info: {
        first_name: 'Wei',
        last_name: 'Zhang',
        email: 'wei.zhang@example.com',
        mobile: '+8613912345678',
      },
    };

    it('parses valid JSON payload into correct fields', () => {
      const result = parseTripComReservation(validPayload);
      expect(result).not.toBeNull();
      expect(result!.externalId).toBe('TC-20250801-001');
      expect(result!.status).toBe('new');
      expect(result!.checkIn).toBe('2025-10-10');
      expect(result!.checkOut).toBe('2025-10-13');
      expect(result!.numAdults).toBe(2);
      expect(result!.numChildren).toBe(1);
      expect(result!.totalAmount).toBe(12000);
      expect(result!.currency).toBe('THB');
      expect(result!.roomTypeCode).toBe('DLX-KING');
      expect(result!.firstName).toBe('Wei');
      expect(result!.lastName).toBe('Zhang');
      expect(result!.email).toBe('wei.zhang@example.com');
      expect(result!.phone).toBe('+8613912345678');
      expect(result!.specialRequests).toBe('Quiet room please');
      expect(result!.source).toBe('trip_com');
    });

    it('parses guest.name as single field and splits into first/last', () => {
      const payload = {
        order_id: 'TC-NAME-001',
        check_in_date: '2025-11-01',
        check_out_date: '2025-11-03',
        guest: { name: 'Li Mei', email: 'li@example.com', phone: '+86-100' },
        total_price: 5000,
        currency: 'CNY',
      };
      const result = parseTripComReservation(payload);
      expect(result).not.toBeNull();
      expect(result!.firstName).toBe('Li');
      expect(result!.lastName).toBe('Mei');
      expect(result!.email).toBe('li@example.com');
    });

    it('uses booking_id fallback when order_id absent', () => {
      const result = parseTripComReservation({
        booking_id: 'TC-BID-999',
        check_in_date: '2025-12-01',
        check_out_date: '2025-12-04',
      });
      expect(result).not.toBeNull();
      expect(result!.externalId).toBe('TC-BID-999');
    });

    it('defaults currency to THB when absent', () => {
      const result = parseTripComReservation({
        order_id: 'TC-CUR-001',
        check_in_date: '2025-12-01',
        check_out_date: '2025-12-02',
      });
      expect(result!.currency).toBe('THB');
    });

    it('returns null when check-in or check-out dates are missing', () => {
      expect(parseTripComReservation({ order_id: 'TC-NODATE' })).toBeNull();
      expect(parseTripComReservation({ order_id: 'TC-PARTIAL', check_in_date: '2025-10-01' })).toBeNull();
    });

    it('returns null for non-object input', () => {
      expect(parseTripComReservation(null)).toBeNull();
      expect(parseTripComReservation('invalid')).toBeNull();
    });
  });

  describe('Hostelworld JSON parser', () => {
    const validPayload = {
      booking_id: 'HW-20250901-042',
      property_id: 'PROP-BKK-01',
      bed_type_id: 'DORM-6BED',
      arrival_date: '2025-11-15',
      departure_date: '2025-11-18',
      status: 'confirmed',
      currency_code: 'THB',
      total_sell_price: 1800,
      num_guests: 1,
      special_requirements: 'Bottom bunk preferred',
      customer: {
        first_name: 'Emma',
        last_name: 'Backpacker',
        email: 'emma@example.com',
        phone: '+447890123456',
      },
    };

    it('parses valid JSON payload into correct fields', () => {
      const result = parseHostelworldReservation(validPayload);
      expect(result).not.toBeNull();
      expect(result!.externalId).toBe('HW-20250901-042');
      expect(result!.status).toBe('new');
      expect(result!.checkIn).toBe('2025-11-15');
      expect(result!.checkOut).toBe('2025-11-18');
      expect(result!.numAdults).toBe(1);
      expect(result!.numChildren).toBe(0);
      expect(result!.totalAmount).toBe(1800);
      expect(result!.currency).toBe('THB');
      expect(result!.roomTypeCode).toBe('DORM-6BED');
      expect(result!.firstName).toBe('Emma');
      expect(result!.lastName).toBe('Backpacker');
      expect(result!.email).toBe('emma@example.com');
      expect(result!.phone).toBe('+447890123456');
      expect(result!.specialRequests).toBe('Bottom bunk preferred');
      expect(result!.source).toBe('hostelworld');
    });

    it('maps cancelled status correctly', () => {
      const result = parseHostelworldReservation({ ...validPayload, status: 'cancelled' });
      expect(result).not.toBeNull();
      expect(result!.status).toBe('cancelled');
    });

    it('falls back to room_id when bed_type_id absent', () => {
      const result = parseHostelworldReservation({
        booking_id: 'HW-ROOM-001',
        arrival_date: '2025-12-01',
        departure_date: '2025-12-03',
        room_id: 'PRIVATE-TWIN',
        total: 2400,
      });
      expect(result).not.toBeNull();
      expect(result!.roomTypeCode).toBe('PRIVATE-TWIN');
    });

    it('uses total fallback when total_sell_price absent', () => {
      const result = parseHostelworldReservation({
        booking_id: 'HW-TOT-001',
        arrival_date: '2025-12-01',
        departure_date: '2025-12-02',
        total: 900,
      });
      expect(result!.totalAmount).toBe(900);
    });

    it('uses guest_count fallback when num_guests absent', () => {
      const result = parseHostelworldReservation({
        booking_id: 'HW-GC-001',
        arrival_date: '2025-12-05',
        departure_date: '2025-12-07',
        guest_count: 3,
      });
      expect(result!.numAdults).toBe(3);
    });

    it('returns null when arrival or departure dates are missing', () => {
      expect(parseHostelworldReservation({ booking_id: 'HW-NODATE' })).toBeNull();
    });

    it('returns null for non-object input', () => {
      expect(parseHostelworldReservation(null)).toBeNull();
      expect(parseHostelworldReservation(42)).toBeNull();
    });
  });
});
