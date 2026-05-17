export const THAI_HOLIDAYS: Record<string, string> = {
  // 2025
  '2025-01-01': "New Year's Day",
  '2025-02-12': 'Makha Bucha Day',
  '2025-04-06': 'Chakri Day',
  '2025-04-07': 'Chakri Day (Bridge)',
  '2025-04-13': 'Songkran Festival',
  '2025-04-14': 'Songkran Festival',
  '2025-04-15': 'Songkran Festival',
  '2025-05-01': 'Labour Day',
  '2025-05-05': 'Coronation Day',
  '2025-05-12': 'Royal Ploughing Ceremony',
  '2025-05-13': 'Visakha Bucha Day',
  '2025-07-10': 'Asanha Bucha Day',
  '2025-07-11': 'Buddhist Lent Day',
  '2025-07-28': "H.M. King's Birthday",
  '2025-08-12': "H.M. Queen's Birthday",
  '2025-10-13': 'King Bhumibol Memorial Day',
  '2025-10-23': 'Chulalongkorn Day',
  '2025-12-05': 'King Bhumibol Birthday',
  '2025-12-10': 'Constitution Day',
  '2025-12-31': "New Year's Eve",

  // 2025 long weekend bridges
  '2025-05-02': 'Labour Day (Long Weekend Bridge)',
  '2025-10-14': 'King Bhumibol Memorial (Long Weekend Bridge)',

  // 2026
  '2026-01-01': "New Year's Day",
  '2026-03-04': 'Makha Bucha Day',
  '2026-04-06': 'Chakri Day',
  '2026-04-13': 'Songkran Festival',
  '2026-04-14': 'Songkran Festival',
  '2026-04-15': 'Songkran Festival',
  '2026-05-01': 'Labour Day',
  '2026-05-04': 'Coronation Day (Bridge)',
  '2026-05-05': 'Coronation Day',
  '2026-05-20': 'Visakha Bucha Day',
  '2026-06-11': 'Royal Ploughing Ceremony',
  '2026-07-28': "H.M. King's Birthday",
  '2026-07-29': 'Asanha Bucha Day',
  '2026-07-30': 'Buddhist Lent Day',
  '2026-08-12': "H.M. Queen's Birthday",
  '2026-10-13': 'King Bhumibol Memorial Day',
  '2026-10-23': 'Chulalongkorn Day',
  '2026-12-05': 'King Bhumibol Birthday',
  '2026-12-07': 'King Bhumibol Birthday (Long Weekend Bridge)',
  '2026-12-10': 'Constitution Day',
  '2026-12-11': 'Constitution Day (Long Weekend Bridge)',
  '2026-12-31': "New Year's Eve",

  // 2027
  '2027-01-01': "New Year's Day",
  '2027-01-04': "New Year's Day (Long Weekend Bridge)",
  '2027-02-22': 'Makha Bucha Day',
  '2027-04-06': 'Chakri Day',
  '2027-04-13': 'Songkran Festival',
  '2027-04-14': 'Songkran Festival',
  '2027-04-15': 'Songkran Festival',
  '2027-05-01': 'Labour Day',
  '2027-05-03': 'Labour Day (Long Weekend Bridge)',
  '2027-05-05': 'Coronation Day',
  '2027-05-10': 'Visakha Bucha Day',
  '2027-07-06': 'Asanha Bucha Day',
  '2027-07-07': 'Buddhist Lent Day',
  '2027-07-12': 'Royal Ploughing Ceremony',
  '2027-07-28': "H.M. King's Birthday",
  '2027-08-12': "H.M. Queen's Birthday",
  '2027-10-13': 'King Bhumibol Memorial Day',
  '2027-10-23': 'Chulalongkorn Day',
  '2027-10-25': 'Chulalongkorn Day (Long Weekend Bridge)',
  '2027-12-05': 'King Bhumibol Birthday',
  '2027-12-06': 'King Bhumibol Birthday (Long Weekend Bridge)',
  '2027-12-10': 'Constitution Day',
  '2027-12-31': "New Year's Eve",
};

const LONG_WEEKEND_KEYWORDS = ['Long Weekend', 'Bridge'];

export function isThaiHoliday(date: string): boolean {
  return date in THAI_HOLIDAYS;
}

export function isThaiLongWeekend(date: string): boolean {
  const name = THAI_HOLIDAYS[date];
  if (!name) return false;
  return LONG_WEEKEND_KEYWORDS.some(kw => name.includes(kw));
}

export function getUpcomingHolidays(
  fromDate: string,
  days: number
): Array<{ date: string; name: string }> {
  const from = new Date(fromDate);
  const to = new Date(fromDate);
  to.setDate(to.getDate() + days);

  return Object.entries(THAI_HOLIDAYS)
    .filter(([date]) => {
      const d = new Date(date);
      return d >= from && d <= to;
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, name]) => ({ date, name }));
}
