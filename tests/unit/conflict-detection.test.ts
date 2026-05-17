import { handleChannelConflict } from '@/lib/channel-manager/conflict';

function makeMockAdmin(reservations: any[]) {
  return {
    from: (_table: string) => ({
      select: (_cols: string) => ({
        eq: function (this: any, _col: string, _val: any) { return this; },
        in: function (this: any, _col: string, _vals: any[]) { return this; },
        lt: function (this: any, _col: string, _val: any) { return this; },
        gt: function (this: any, _col: string, _val: any) {
          return { data: reservations, error: null };
        },
      }),
    }),
  } as any;
}

function makeAdminWithRoomFilter(reservations: any[], matchRoomId?: string) {
  const builder = {
    reservations,
    _roomId: undefined as string | undefined,
    select(_cols: string) { return this; },
    eq(col: string, val: any) {
      if (col === 'room_id') this._roomId = val;
      return this;
    },
    in(_col: string, _vals: any[]) { return this; },
    lt(_col: string, _val: any) { return this; },
    gt(_col: string, _val: any) {
      return { data: matchRoomId && this._roomId !== matchRoomId ? [] : this.reservations, error: null };
    },
  };
  return {
    from: (_table: string) => ({ ...builder }),
  } as any;
}

describe('Conflict Detection', () => {

  it('same external_id returns existing reservation without duplicate detection at mapper level', async () => {
    const existing = {
      id: 'res-abc',
      reservation_code: 'RC001',
      source: 'booking_com',
      status: 'confirmed',
      check_in: '2025-07-01',
      check_out: '2025-07-05',
    };
    const admin = makeMockAdmin([existing]);

    const result = await handleChannelConflict(admin, 'hotel-1', {
      id: 'new-booking',
      checkIn: '2025-07-02',
      checkOut: '2025-07-06',
      channel: 'agoda',
    });

    expect(result.hasConflict).toBe(true);
    expect(result.existingReservationId).toBe('res-abc');
  });

  it('different guest same dates detects overlap conflict', async () => {
    const conflicting = {
      id: 'res-xyz',
      reservation_code: 'RC002',
      source: 'direct',
      status: 'confirmed',
      check_in: '2025-08-10',
      check_out: '2025-08-15',
    };
    const admin = makeMockAdmin([conflicting]);

    const result = await handleChannelConflict(admin, 'hotel-1', {
      id: 'new-ota-booking',
      checkIn: '2025-08-12',
      checkOut: '2025-08-17',
      channel: 'booking_com',
    });

    expect(result.hasConflict).toBe(true);
    expect(result.existingReservationId).toBe('res-xyz');
    expect(result.resolution).toBe('reject_new');
  });

  it('non-overlapping dates produce no conflict', async () => {
    const admin = makeMockAdmin([]);

    const result = await handleChannelConflict(admin, 'hotel-1', {
      id: 'non-overlap',
      checkIn: '2025-09-01',
      checkOut: '2025-09-05',
      channel: 'agoda',
    });

    expect(result.hasConflict).toBe(false);
    expect(result.existingReservationId).toBeUndefined();
  });

  it('back-to-back reservations (check-out = check-in) produce no conflict', async () => {
    const admin = makeMockAdmin([]);

    const result = await handleChannelConflict(admin, 'hotel-1', {
      id: 'back-to-back',
      checkIn: '2025-10-10',
      checkOut: '2025-10-13',
      channel: 'expedia',
    });

    expect(result.hasConflict).toBe(false);
  });

  it('two OTA sources conflicting leads to manual resolution', async () => {
    const existing = {
      id: 'res-agoda',
      reservation_code: 'RC003',
      source: 'agoda',
      status: 'confirmed',
      check_in: '2025-11-01',
      check_out: '2025-11-04',
    };
    const admin = makeMockAdmin([existing]);

    const result = await handleChannelConflict(admin, 'hotel-1', {
      id: 'exp-booking',
      checkIn: '2025-11-02',
      checkOut: '2025-11-06',
      channel: 'expedia',
    });

    expect(result.hasConflict).toBe(true);
    expect(result.resolution).toBe('manual');
  });

  it('direct booking takes priority over OTA when conflict arises', async () => {
    const existing = {
      id: 'res-direct',
      reservation_code: 'RC004',
      source: 'direct',
      status: 'confirmed',
      check_in: '2025-12-20',
      check_out: '2025-12-25',
    };
    const admin = makeMockAdmin([existing]);

    const result = await handleChannelConflict(admin, 'hotel-1', {
      id: 'ota-incoming',
      checkIn: '2025-12-22',
      checkOut: '2025-12-27',
      channel: 'booking_com',
    });

    expect(result.hasConflict).toBe(true);
    expect(result.resolution).toBe('reject_new');
    expect(result.reason).toContain('RC004');
  });
});
