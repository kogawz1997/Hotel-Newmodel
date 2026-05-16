import { isThaiHoliday, isThaiLongWeekend } from '@/lib/pms/thai-holidays';

function clampRate(suggested: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, suggested));
}

function getLeadTimeBucket(checkInDate: Date, bookingDate: Date): string {
  const leadDays = Math.max(0, Math.round((checkInDate.getTime() - bookingDate.getTime()) / 86400000));
  if (leadDays <= 7) return 'lead_1_7';
  if (leadDays <= 30) return 'lead_8_30';
  return 'lead_31_plus';
}

describe('Dynamic Pricing', () => {

  describe('Thai holiday detection', () => {
    it('identifies Songkran 2025-04-13 as a Thai holiday', () => {
      expect(isThaiHoliday('2025-04-13')).toBe(true);
    });

    it('identifies Songkran 2025-04-14 as a Thai holiday', () => {
      expect(isThaiHoliday('2025-04-14')).toBe(true);
    });

    it('identifies Songkran 2025-04-15 as a Thai holiday', () => {
      expect(isThaiHoliday('2025-04-15')).toBe(true);
    });

    it('identifies New Year Day 2025-01-01 as a Thai holiday', () => {
      expect(isThaiHoliday('2025-01-01')).toBe(true);
    });

    it('identifies a regular weekday as not a Thai holiday', () => {
      expect(isThaiHoliday('2025-03-17')).toBe(false);
    });

    it('identifies 2025-06-15 (ordinary Sunday) as not a Thai holiday', () => {
      expect(isThaiHoliday('2025-06-15')).toBe(false);
    });

    it('identifies bridge holidays as long weekends', () => {
      expect(isThaiLongWeekend('2025-05-02')).toBe(true);
    });

    it('regular holidays are not long weekend bridges', () => {
      expect(isThaiLongWeekend('2025-04-13')).toBe(false);
    });
  });

  describe('Rate min/max clamping', () => {
    it('clamps suggested rate above max down to max', () => {
      expect(clampRate(5000, 0, 3000)).toBe(3000);
    });

    it('clamps suggested rate below min up to min', () => {
      expect(clampRate(500, 800, 5000)).toBe(800);
    });

    it('passes through rate within range unchanged', () => {
      expect(clampRate(2000, 800, 3000)).toBe(2000);
    });

    it('returns max when suggested equals max', () => {
      expect(clampRate(3000, 800, 3000)).toBe(3000);
    });

    it('returns min when suggested equals min', () => {
      expect(clampRate(800, 800, 3000)).toBe(800);
    });

    it('handles max = Infinity (no upper bound)', () => {
      expect(clampRate(99999, 800, Infinity)).toBe(99999);
    });
  });

  describe('Lead time bucketing', () => {
    it('booking made 3 days before arrival maps to lead_1_7', () => {
      const checkIn = new Date('2025-07-10');
      const bookingDate = new Date('2025-07-07');
      expect(getLeadTimeBucket(checkIn, bookingDate)).toBe('lead_1_7');
    });

    it('booking made 1 day before arrival maps to lead_1_7', () => {
      const checkIn = new Date('2025-07-10');
      const bookingDate = new Date('2025-07-09');
      expect(getLeadTimeBucket(checkIn, bookingDate)).toBe('lead_1_7');
    });

    it('booking made 7 days before arrival maps to lead_1_7', () => {
      const checkIn = new Date('2025-07-14');
      const bookingDate = new Date('2025-07-07');
      expect(getLeadTimeBucket(checkIn, bookingDate)).toBe('lead_1_7');
    });

    it('booking made 8 days before arrival maps to lead_8_30', () => {
      const checkIn = new Date('2025-07-15');
      const bookingDate = new Date('2025-07-07');
      expect(getLeadTimeBucket(checkIn, bookingDate)).toBe('lead_8_30');
    });

    it('booking made 20 days before arrival maps to lead_8_30', () => {
      const checkIn = new Date('2025-08-01');
      const bookingDate = new Date('2025-07-12');
      expect(getLeadTimeBucket(checkIn, bookingDate)).toBe('lead_8_30');
    });

    it('booking made 45 days before arrival maps to lead_31_plus', () => {
      const checkIn = new Date('2025-09-01');
      const bookingDate = new Date('2025-07-17');
      expect(getLeadTimeBucket(checkIn, bookingDate)).toBe('lead_31_plus');
    });

    it('booking made 90 days before arrival maps to lead_31_plus', () => {
      const checkIn = new Date('2025-10-01');
      const bookingDate = new Date('2025-07-03');
      expect(getLeadTimeBucket(checkIn, bookingDate)).toBe('lead_31_plus');
    });
  });
});
