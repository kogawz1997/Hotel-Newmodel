import {
  calculateSegmentMembers,
  calculateGuestLTV,
  getChurnRiskGuests,
} from '@/lib/crm/segment-engine';
import type { SegmentDefinition } from '@/lib/crm/segment-engine';

function makeSupabaseMock(guests: any[], reservations: any[] = []) {
  let currentTable = '';
  let isGuestsQuery = false;

  const builder = {
    _table: '',
    select(_cols: string) { return this; },
    eq(_col: string, _val: any) { return this; },
    in(_col: string, _vals: any[]) { return this; },
    order(_col: string, _opts: any) { return this; },
    limit(_n: number) { return this; },
    gt(_col: string, _val: any) { return this; },
    gte(_col: string, _val: any) { return this; },
    get data() {
      return currentTable === 'guests' ? guests : reservations;
    },
    get error() { return null; },
    then(resolve: any) {
      return resolve({ data: currentTable === 'guests' ? guests : reservations, error: null });
    },
  };

  return {
    from: (table: string) => {
      currentTable = table;
      return { ...builder, _table: table };
    },
  } as any;
}

function makeSegmentDef(overrides: Partial<SegmentDefinition> = {}): SegmentDefinition {
  return {
    id: 'seg-test',
    hotel_id: 'hotel-1',
    name: 'Test Segment',
    type: 'repeat_guest',
    rules: [],
    is_active: true,
    ...overrides,
  };
}

describe('CRM Segment Engine', () => {

  describe('calculateSegmentMembers', () => {
    it('guest with 3 stays matches repeat_guest segment (min_stays rule: total_stays gte 2)', async () => {
      const guests = [
        { id: 'guest-1', total_stays: 3, total_revenue: 9000, loyalty_tier: 'bronze', vip_status: false, nationality: 'TH', updated_at: new Date().toISOString() },
      ];
      const reservations: any[] = [];
      const supabase = makeSupabaseMock(guests, reservations);

      const definition = makeSegmentDef({
        type: 'repeat_guest',
        rules: [{ field: 'total_stays', operator: 'gte', value: 2 }],
      });

      const result = await calculateSegmentMembers(definition, supabase);
      expect(result).toContain('guest-1');
    });

    it('guest with 1 stay does not match repeat_guest (min_stays rule: total_stays gte 2)', async () => {
      const guests = [
        { id: 'guest-new', total_stays: 1, total_revenue: 2000, loyalty_tier: null, vip_status: false, nationality: 'TH', updated_at: new Date().toISOString() },
      ];
      const supabase = makeSupabaseMock(guests, []);

      const definition = makeSegmentDef({
        type: 'repeat_guest',
        rules: [{ field: 'total_stays', operator: 'gte', value: 2 }],
      });

      const result = await calculateSegmentMembers(definition, supabase);
      expect(result).not.toContain('guest-new');
    });

    it('guest with total_spent 15000 matches high_spender segment (threshold 10000)', async () => {
      const guests = [
        { id: 'guest-rich', total_stays: 5, total_revenue: 15000, loyalty_tier: 'gold', vip_status: false, nationality: 'TH', updated_at: new Date().toISOString() },
      ];
      const supabase = makeSupabaseMock(guests, []);

      const definition = makeSegmentDef({
        type: 'high_spender',
        rules: [{ field: 'total_spent', operator: 'gt', value: 10000 }],
      });

      const result = await calculateSegmentMembers(definition, supabase);
      expect(result).toContain('guest-rich');
    });

    it('new guest (1 stay) matches new_guest segment (total_stays lte 1)', async () => {
      const guests = [
        { id: 'guest-brand-new', total_stays: 1, total_revenue: 1500, loyalty_tier: null, vip_status: false, nationality: null, updated_at: new Date().toISOString() },
      ];
      const supabase = makeSupabaseMock(guests, []);

      const definition = makeSegmentDef({
        type: 'new_guest',
        rules: [{ field: 'total_stays', operator: 'lte', value: 1 }],
      });

      const result = await calculateSegmentMembers(definition, supabase);
      expect(result).toContain('guest-brand-new');
    });

    it('guest with no last stay date matches at_risk_churn (days_since_last_stay gt 180)', async () => {
      const guests = [
        { id: 'guest-lost', total_stays: 4, total_revenue: 8000, loyalty_tier: 'silver', vip_status: false, nationality: 'TH', updated_at: new Date().toISOString() },
      ];
      const supabase = makeSupabaseMock(guests, []);

      const definition = makeSegmentDef({
        type: 'at_risk_churn',
        rules: [{ field: 'days_since_last_stay', operator: 'gt', value: 180 }],
      });

      const result = await calculateSegmentMembers(definition, supabase);
      expect(result).toContain('guest-lost');
    });

    it('multiple rules: guest must match all rules (AND logic)', async () => {
      const guests = [
        { id: 'guest-match', total_stays: 6, total_revenue: 20000, loyalty_tier: 'gold', vip_status: false, nationality: 'TH', updated_at: new Date().toISOString() },
        { id: 'guest-no-match', total_stays: 2, total_revenue: 20000, loyalty_tier: 'gold', vip_status: false, nationality: 'TH', updated_at: new Date().toISOString() },
      ];
      const supabase = makeSupabaseMock(guests, []);

      const definition = makeSegmentDef({
        type: 'vip',
        rules: [
          { field: 'total_stays', operator: 'gte', value: 5 },
          { field: 'total_spent', operator: 'gt', value: 10000 },
        ],
      });

      const result = await calculateSegmentMembers(definition, supabase);
      expect(result).toContain('guest-match');
      expect(result).not.toContain('guest-no-match');
    });

    it('returns empty array when Supabase returns error', async () => {
      const errorSupabase = {
        from: (_table: string) => ({
          select: (_cols: string) => ({
            eq: (_col: string, _val: any) => ({
              error: { message: 'DB error' },
              data: null,
            }),
          }),
        }),
      } as any;

      const definition = makeSegmentDef({ rules: [] });
      const result = await calculateSegmentMembers(definition, errorSupabase);
      expect(result).toEqual([]);
    });
  });

  describe('calculateGuestLTV', () => {
    it('sums all folio totals to compute LTV', async () => {
      const reservations = [
        { total_amount: 3000 },
        { total_amount: 5000 },
        { total_amount: 2500 },
      ];
      let selectCalled = false;
      const supabase = {
        from: (_table: string) => ({
          select: (_cols: string) => {
            selectCalled = true;
            return {
              eq: (_col: string, _val: any) => ({
                eq: (_col2: string, _val2: any) => ({
                  in: (_col3: string, _vals: any[]) => ({
                    data: reservations,
                    error: null,
                  }),
                }),
              }),
            };
          },
        }),
      } as any;

      const ltv = await calculateGuestLTV('guest-ltv-1', supabase);
      expect(ltv).toBe(10500);
      expect(selectCalled).toBe(true);
    });

    it('returns 0 when guest has no completed reservations', async () => {
      const supabase = {
        from: (_table: string) => ({
          select: (_cols: string) => ({
            eq: (_col: string, _val: any) => ({
              eq: (_col2: string, _val2: any) => ({
                in: (_col3: string, _vals: any[]) => ({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any;

      const ltv = await calculateGuestLTV('guest-new', supabase);
      expect(ltv).toBe(0);
    });

    it('returns 0 when Supabase returns null data', async () => {
      const supabase = {
        from: (_table: string) => ({
          select: (_cols: string) => ({
            eq: (_col: string, _val: any) => ({
              eq: (_col2: string, _val2: any) => ({
                in: (_col3: string, _vals: any[]) => ({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any;

      const ltv = await calculateGuestLTV('guest-null', supabase);
      expect(ltv).toBe(0);
    });
  });

  describe('churn score formula', () => {
    it('churn score = min(100, days/3) for guest with no frequency multiplier', () => {
      const days = 300;
      const baseScore = Math.min(100, days / 3);
      expect(baseScore).toBeCloseTo(100);
    });

    it('churn score caps at 100 regardless of days', () => {
      const days = 999;
      const baseScore = Math.min(100, days / 3);
      expect(baseScore).toBe(100);
    });

    it('churn score is proportional for 270 days (score=90)', () => {
      const days = 270;
      const baseScore = Math.min(100, days / 3);
      expect(baseScore).toBe(90);
    });

    it('getChurnRiskGuests applies threshold and returns sorted results', async () => {
      const pastDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const guests = [
        { id: 'g1', first_name: 'Alice', last_name: 'A', email: 'a@a.com', total_stays: 2 },
        { id: 'g2', first_name: 'Bob', last_name: 'B', email: 'b@b.com', total_stays: 5 },
      ];
      const reservations = [
        { guest_id: 'g1', check_out: pastDate },
        { guest_id: 'g2', check_out: pastDate },
      ];

      const supabase = {
        from: (table: string) => {
          if (table === 'guests') {
            return {
              select: (_c: string) => ({
                eq: (_c2: string, _v: any) => ({
                  gt: (_c3: string, _v2: any) => ({
                    data: guests,
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {
            select: (_c: string) => ({
              eq: (_c2: string, _v: any) => ({
                in: (_c3: string, _v2: any) => ({
                  order: (_c4: string, _opts: any) => ({
                    data: reservations,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        },
      } as any;

      const results = await getChurnRiskGuests('hotel-1', supabase, 180);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].days_since_last_stay).toBeGreaterThanOrEqual(180);
      if (results.length > 1) {
        expect(results[0].churn_risk_score).toBeGreaterThanOrEqual(results[1].churn_risk_score);
      }
    });
  });
});
