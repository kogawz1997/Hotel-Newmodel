import type { SupabaseClient } from '@supabase/supabase-js';

export type SegmentType =
  | 'vip'
  | 'repeat_guest'
  | 'high_spender'
  | 'new_guest'
  | 'loyalty_member'
  | 'at_risk_churn'
  | 'win_back'
  | 'custom';

export interface SegmentRule {
  field: 'total_stays' | 'total_spent' | 'days_since_last_stay' | 'loyalty_tier' | 'is_vip' | 'nationality';
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'in';
  value: number | string | string[];
}

export interface SegmentDefinition {
  id: string;
  hotel_id: string;
  name: string;
  type: SegmentType;
  rules: SegmentRule[];
  is_active: boolean;
}

export interface GuestSegmentMembership {
  guest_id: string;
  segment_id: string;
  entered_at: Date;
  score?: number;
}

export interface ChurnRiskGuest {
  guest_id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  total_stays: number;
  days_since_last_stay: number;
  churn_risk_score: number;
  recommended_action: string;
}

function applyOperator(fieldValue: number | string, operator: SegmentRule['operator'], ruleValue: SegmentRule['value']): boolean {
  if (operator === 'in') {
    return Array.isArray(ruleValue) && ruleValue.includes(String(fieldValue));
  }
  const numField = Number(fieldValue);
  const numRule = Number(ruleValue);
  switch (operator) {
    case 'gt':  return numField > numRule;
    case 'lt':  return numField < numRule;
    case 'gte': return numField >= numRule;
    case 'lte': return numField <= numRule;
    case 'eq':  return String(fieldValue) === String(ruleValue);
    default:    return false;
  }
}

function computeDaysSinceLastStay(lastStayDate: string | null): number {
  if (!lastStayDate) return 9999;
  const diff = Date.now() - new Date(lastStayDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function calculateSegmentMembers(
  definition: SegmentDefinition,
  supabase: SupabaseClient,
): Promise<string[]> {
  const { data: guests, error } = await supabase
    .from('guests')
    .select('id, total_stays, total_revenue, loyalty_tier, vip_status, nationality, updated_at')
    .eq('hotel_id', definition.hotel_id);

  if (error || !guests) return [];

  const { data: lastStays } = await supabase
    .from('reservations')
    .select('guest_id, check_out')
    .eq('hotel_id', definition.hotel_id)
    .in('status', ['checked_out', 'completed'])
    .order('check_out', { ascending: false });

  const lastStayByGuest: Record<string, string> = {};
  for (const row of lastStays || []) {
    if (row.guest_id && !lastStayByGuest[row.guest_id]) {
      lastStayByGuest[row.guest_id] = row.check_out;
    }
  }

  const matched: string[] = [];

  for (const guest of guests) {
    const daysSince = computeDaysSinceLastStay(lastStayByGuest[guest.id] || null);

    const fieldMap: Record<SegmentRule['field'], number | string> = {
      total_stays:          guest.total_stays ?? 0,
      total_spent:          Number(guest.total_revenue ?? 0),
      days_since_last_stay: daysSince,
      loyalty_tier:         guest.loyalty_tier ?? '',
      is_vip:               guest.vip_status ? '1' : '0',
      nationality:          guest.nationality ?? '',
    };

    const allMatch = definition.rules.every(rule =>
      applyOperator(fieldMap[rule.field], rule.operator, rule.value),
    );

    if (allMatch) matched.push(guest.id);
  }

  return matched;
}

export async function getChurnRiskGuests(
  hotelId: string,
  supabase: SupabaseClient,
  thresholdDays = 180,
): Promise<ChurnRiskGuest[]> {
  const { data: guests, error } = await supabase
    .from('guests')
    .select('id, first_name, last_name, email, total_stays')
    .eq('hotel_id', hotelId)
    .gt('total_stays', 0);

  if (error || !guests) return [];

  const { data: lastStays } = await supabase
    .from('reservations')
    .select('guest_id, check_out')
    .eq('hotel_id', hotelId)
    .in('status', ['checked_out', 'completed'])
    .order('check_out', { ascending: false });

  const lastStayByGuest: Record<string, string> = {};
  for (const row of lastStays || []) {
    if (row.guest_id && !lastStayByGuest[row.guest_id]) {
      lastStayByGuest[row.guest_id] = row.check_out;
    }
  }

  const results: ChurnRiskGuest[] = [];

  for (const guest of guests) {
    const daysSince = computeDaysSinceLastStay(lastStayByGuest[guest.id] || null);
    if (daysSince < thresholdDays) continue;

    const baseScore = Math.min(100, daysSince / 3);
    const frequencyMultiplier = guest.total_stays >= 5 ? 1.2 : guest.total_stays >= 3 ? 1.1 : 1.0;
    const churn_risk_score = Math.min(100, Math.round(baseScore * frequencyMultiplier));

    let recommended_action = 'Send re-engagement email';
    if (churn_risk_score >= 80) recommended_action = 'Personal outreach + win-back offer';
    else if (churn_risk_score >= 60) recommended_action = 'Send exclusive discount';

    results.push({
      guest_id: guest.id,
      first_name: guest.first_name,
      last_name: guest.last_name,
      email: guest.email,
      total_stays: guest.total_stays ?? 0,
      days_since_last_stay: daysSince,
      churn_risk_score,
      recommended_action,
    });
  }

  return results.sort((a, b) => b.churn_risk_score - a.churn_risk_score);
}

export async function getWinBackCandidates(
  hotelId: string,
  supabase: SupabaseClient,
): Promise<any[]> {
  const { data: guests, error } = await supabase
    .from('guests')
    .select('id, first_name, last_name, email, total_stays, loyalty_tier, nationality')
    .eq('hotel_id', hotelId)
    .gte('total_stays', 3);

  if (error || !guests) return [];

  const { data: lastStays } = await supabase
    .from('reservations')
    .select('guest_id, check_out')
    .eq('hotel_id', hotelId)
    .in('status', ['checked_out', 'completed'])
    .order('check_out', { ascending: false });

  const lastStayByGuest: Record<string, string> = {};
  for (const row of lastStays || []) {
    if (row.guest_id && !lastStayByGuest[row.guest_id]) {
      lastStayByGuest[row.guest_id] = row.check_out;
    }
  }

  return guests
    .filter(g => computeDaysSinceLastStay(lastStayByGuest[g.id] || null) >= 180)
    .map(g => ({
      ...g,
      days_since_last_stay: computeDaysSinceLastStay(lastStayByGuest[g.id] || null),
      last_stay_date: lastStayByGuest[g.id] || null,
    }));
}

export async function calculateGuestLTV(
  guestId: string,
  supabase: SupabaseClient,
): Promise<number> {
  const { data: reservations } = await supabase
    .from('reservations')
    .select('total_amount')
    .eq('guest_id', guestId)
    .in('status', ['checked_out', 'completed']);

  if (!reservations) return 0;
  return reservations.reduce((sum, r) => sum + Number(r.total_amount ?? 0), 0);
}
