export interface RoutingRule {
  id: string
  hotel_id: string
  name: string
  sentiment: 'negative' | 'neutral' | 'positive' | 'any'
  emotion_score_lt?: number
  assign_to_role: string
  sla_minutes: number
  escalate_after_minutes?: number
  is_active: boolean
}

const DEFAULT_RULE: RoutingRule = {
  id: 'default',
  hotel_id: '',
  name: 'Default Negative',
  sentiment: 'negative',
  emotion_score_lt: 4,
  assign_to_role: 'manager',
  sla_minutes: 120,
  is_active: true,
}

export function matchRoutingRule(
  sentiment: string,
  emotionScore: number,
  rules: RoutingRule[]
): RoutingRule | null {
  const active = rules.filter((r) => r.is_active)

  const sentimentMatch = (rule: RoutingRule): boolean => {
    if (rule.sentiment === 'any') return true
    return rule.sentiment === sentiment
  }

  const scoreMatch = (rule: RoutingRule): boolean => {
    if (rule.emotion_score_lt === undefined) return true
    return emotionScore < rule.emotion_score_lt
  }

  const candidates = active.filter((r) => sentimentMatch(r) && scoreMatch(r))

  if (candidates.length === 0) {
    if (sentimentMatch(DEFAULT_RULE) && scoreMatch(DEFAULT_RULE)) {
      return DEFAULT_RULE
    }
    return null
  }

  candidates.sort((a, b) => {
    const aScore = a.emotion_score_lt ?? Infinity
    const bScore = b.emotion_score_lt ?? Infinity
    return aScore - bScore
  })

  return candidates[0]
}
