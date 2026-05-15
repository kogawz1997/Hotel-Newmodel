import type { Action, TriggerPayload } from './types';
import { createClient } from '@/lib/supabase/server';

// ─── Action Handlers ───────────────────────────────────────────────────────────
// แต่ละ action type มี handler ของตัวเอง
// เพิ่ม handler ใหม่ตรงนี้เมื่อต้องการ action type เพิ่ม

export async function executeAction(action: Action, payload: TriggerPayload): Promise<void> {
  const supabase = await createClient();

  switch (action.type) {
    case 'create_task': {
      const p = action.params as {
        type: string; title: string; priority?: string; assigned_role?: string;
      };
      await supabase.from('work_orders').insert({
        hotel_id:    payload.hotel_id,
        type:        p.type,
        title:       p.title,
        priority:    p.priority ?? 'normal',
        status:      'pending',
        source:      'auto',
        auto_routed: true,
        // task router will pick up pending auto_routed tasks
      });
      break;
    }

    case 'send_notification': {
      const p = action.params as { channel: string; recipient: string; message: string };
      await supabase.from('notification_queue').insert({
        hotel_id:  payload.hotel_id,
        channel:   p.channel,
        recipient: p.recipient,
        message:   p.message,
        status:    'pending',
      });
      break;
    }

    case 'update_room_status': {
      const p = action.params as { room_id: string; status: string };
      await supabase.from('rooms').update({ status: p.status }).eq('id', p.room_id);
      break;
    }

    case 'escalate': {
      const p = action.params as { task_id: string; escalate_to_role: string; note?: string };
      await supabase.from('work_orders')
        .update({ priority: 'urgent', notes: p.note ?? 'Auto-escalated' })
        .eq('id', p.task_id);
      break;
    }

    case 'create_announcement': {
      const p = action.params as { title: string; body: string; target_roles?: string[] };
      await supabase.from('announcements').insert({
        hotel_id:     payload.hotel_id,
        title:        p.title,
        body:         p.body,
        type:         'general',
        target_roles: p.target_roles ?? null,
        is_active:    true,
      });
      break;
    }

    case 'webhook_call': {
      const p = action.params as { url: string; method?: string; headers?: Record<string, string> };
      await fetch(p.url, {
        method:  p.method ?? 'POST',
        headers: { 'Content-Type': 'application/json', ...(p.headers ?? {}) },
        body:    JSON.stringify({ trigger: payload.type, data: payload.data }),
      }).catch((e) => console.error('[AutomationEngine] webhook_call failed', e));
      break;
    }

    default:
      console.warn(`[AutomationEngine] unknown action type: ${action.type}`);
  }
}
