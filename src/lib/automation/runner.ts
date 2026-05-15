import type { AutomationRule, Condition, TriggerPayload } from './types';
import { executeAction } from './actions';
import { createClient } from '@/lib/supabase/server';

// ─── Condition Evaluator ───────────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function evaluateCondition(condition: Condition, data: Record<string, unknown>): boolean {
  const val = getNestedValue(data, condition.field);
  switch (condition.operator) {
    case 'eq':       return val === condition.value;
    case 'neq':      return val !== condition.value;
    case 'gt':       return (val as number) > (condition.value as number);
    case 'lt':       return (val as number) < (condition.value as number);
    case 'gte':      return (val as number) >= (condition.value as number);
    case 'lte':      return (val as number) <= (condition.value as number);
    case 'contains': return String(val).includes(String(condition.value));
    case 'in':       return Array.isArray(condition.value) && condition.value.includes(val);
    default:         return false;
  }
}

// ─── Main Runner ───────────────────────────────────────────────────────────────

export async function runAutomation(payload: TriggerPayload): Promise<void> {
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('hotel_id', payload.hotel_id)
    .eq('trigger_type', payload.type)
    .eq('enabled', true);

  if (!rules?.length) return;

  for (const rule of rules as AutomationRule[]) {
    // Evaluate all conditions (AND logic)
    const allPassed = rule.conditions.every((c) => evaluateCondition(c, payload.data));
    if (!allPassed) continue;

    // Execute action chain
    for (const action of rule.actions) {
      try {
        if (action.delay_seconds) {
          await new Promise((r) => setTimeout(r, action.delay_seconds! * 1000));
        }
        await executeAction(action, payload);
      } catch (err) {
        console.error(`[AutomationEngine] rule=${rule.id} action=${action.type} failed`, err);
        await supabase.from('automation_runs').insert({
          rule_id:      rule.id,
          trigger_data: payload.data,
          status:       'failed',
          error:        String(err),
        });
        continue;
      }
    }

    // Log success
    await supabase.from('automation_runs').insert({
      rule_id:      rule.id,
      trigger_data: payload.data,
      status:       'success',
    });

    // Update run stats
    await supabase.from('automation_rules')
      .update({ last_run_at: new Date().toISOString(), run_count: (rule as any).run_count + 1 })
      .eq('id', rule.id);
  }
}

// ─── Convenience Trigger Functions ────────────────────────────────────────────
// ใช้ใน API routes / server actions เพื่อ fire trigger

export const trigger = {
  guestCheckin:      (hotelId: string, data: Record<string, unknown>) =>
    runAutomation({ type: 'guest_checkin',       hotel_id: hotelId, data, triggered_at: new Date() }),
  guestCheckout:     (hotelId: string, data: Record<string, unknown>) =>
    runAutomation({ type: 'guest_checkout',      hotel_id: hotelId, data, triggered_at: new Date() }),
  requestCreated:    (hotelId: string, data: Record<string, unknown>) =>
    runAutomation({ type: 'request_created',     hotel_id: hotelId, data, triggered_at: new Date() }),
  taskCompleted:     (hotelId: string, data: Record<string, unknown>) =>
    runAutomation({ type: 'task_completed',      hotel_id: hotelId, data, triggered_at: new Date() }),
  slaBreach:         (hotelId: string, data: Record<string, unknown>) =>
    runAutomation({ type: 'sla_breach',          hotel_id: hotelId, data, triggered_at: new Date() }),
  newReview:         (hotelId: string, data: Record<string, unknown>) =>
    runAutomation({ type: 'new_review',          hotel_id: hotelId, data, triggered_at: new Date() }),
  roomStatusChanged: (hotelId: string, data: Record<string, unknown>) =>
    runAutomation({ type: 'room_status_changed', hotel_id: hotelId, data, triggered_at: new Date() }),
};
