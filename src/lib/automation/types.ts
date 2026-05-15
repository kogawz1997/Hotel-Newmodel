// ─── Automation Engine Types ───────────────────────────────────────────────────

export type TriggerType =
  | 'guest_checkin'
  | 'guest_checkout'
  | 'request_created'
  | 'task_completed'
  | 'task_status_changed'
  | 'sla_breach'
  | 'sla_warning'          // X minutes before breach
  | 'new_review'
  | 'room_status_changed'
  | 'time_of_day'          // cron-style: "08:00"
  | 'payment_received'
  | 'low_stock';

export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';

export interface Condition {
  field: string;            // e.g. "request.type", "review.rating", "room.floor"
  operator: ConditionOperator;
  value: unknown;
}

export type ActionType =
  | 'create_task'
  | 'assign_staff'
  | 'send_notification'     // push / LINE / email / SMS
  | 'send_line'
  | 'escalate'
  | 'update_room_status'
  | 'post_charge'
  | 'update_task_priority'
  | 'create_announcement'
  | 'webhook_call';

export interface Action {
  type: ActionType;
  params: Record<string, unknown>;
  delay_seconds?: number;   // หน่วงเวลาก่อน execute
}

export interface AutomationRule {
  id: string;
  hotel_id: string;
  name: string;
  enabled: boolean;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  conditions: Condition[];
  actions: Action[];
  retry_count: number;
}

export interface TriggerPayload {
  type: TriggerType;
  hotel_id: string;
  data: Record<string, unknown>;
  triggered_at: Date;
}
