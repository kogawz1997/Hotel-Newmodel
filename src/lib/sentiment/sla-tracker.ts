import type { SupabaseClient } from '@supabase/supabase-js'

export interface SLAViolation {
  conversation_id: string
  assigned_role: string
  overdue_minutes: number
  sentiment: string
  guest_name: string
}

export async function checkSLAViolations(
  hotelId: string,
  supabase: SupabaseClient
): Promise<SLAViolation[]> {
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('conversations')
    .select('id, assigned_role, sla_deadline, sentiment, guest_name')
    .eq('hotel_id', hotelId)
    .neq('status', 'resolved')
    .lt('sla_deadline', now)
    .not('sla_deadline', 'is', null)

  if (!data) return []

  const nowMs = Date.now()

  return data.map((row: any) => ({
    conversation_id: row.id,
    assigned_role: row.assigned_role ?? '',
    overdue_minutes: Math.floor((nowMs - new Date(row.sla_deadline).getTime()) / 60_000),
    sentiment: row.sentiment ?? 'unknown',
    guest_name: row.guest_name ?? 'Unknown Guest',
  }))
}
