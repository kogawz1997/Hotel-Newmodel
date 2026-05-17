import type { SupabaseClient } from '@supabase/supabase-js'
import { matchRoutingRule, type RoutingRule } from './routing-rules'

export interface RoutingDecision {
  conversation_id: string
  assigned_role: string
  assigned_user_id?: string
  sla_deadline: Date
  rule_id: string
  sentiment: string
  score: number
}

export async function autoRouteConversation(
  conversationId: string,
  hotelId: string,
  sentiment: string,
  emotionScore: number,
  supabase: SupabaseClient
): Promise<RoutingDecision | null> {
  const { data: rules } = await supabase
    .from('conversation_routing_rules')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('is_active', true)

  const matchedRule = matchRoutingRule(sentiment, emotionScore, (rules as RoutingRule[]) ?? [])

  if (!matchedRule) return null

  const slaDeadline = new Date(Date.now() + matchedRule.sla_minutes * 60 * 1000)

  await supabase
    .from('conversations')
    .update({
      assigned_role: matchedRule.assign_to_role,
      sla_deadline: slaDeadline.toISOString(),
      routed_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  return {
    conversation_id: conversationId,
    assigned_role: matchedRule.assign_to_role,
    sla_deadline: slaDeadline,
    rule_id: matchedRule.id,
    sentiment,
    score: emotionScore,
  }
}
