import { matchRoutingRule } from '@/lib/sentiment/routing-rules';
import type { RoutingRule } from '@/lib/sentiment/routing-rules';

function makeRule(overrides: Partial<RoutingRule>): RoutingRule {
  return {
    id: 'rule-default',
    hotel_id: 'hotel-1',
    name: 'Test Rule',
    sentiment: 'negative',
    emotion_score_lt: 5,
    assign_to_role: 'manager',
    sla_minutes: 60,
    is_active: true,
    ...overrides,
  };
}

describe('Sentiment Routing Rules', () => {

  describe('matchRoutingRule', () => {
    it('negative sentiment with score 2 matches manager rule (score_lt=4)', () => {
      const rules: RoutingRule[] = [
        makeRule({ sentiment: 'negative', emotion_score_lt: 4, assign_to_role: 'manager', sla_minutes: 30 }),
      ];
      const result = matchRoutingRule('negative', 2, rules);
      expect(result).not.toBeNull();
      expect(result!.assign_to_role).toBe('manager');
    });

    it('positive sentiment returns null (no rule matches)', () => {
      const rules: RoutingRule[] = [
        makeRule({ sentiment: 'negative', emotion_score_lt: 4 }),
      ];
      const result = matchRoutingRule('positive', 8, rules);
      expect(result).toBeNull();
    });

    it('neutral sentiment with score 6 does not match negative-only escalation rule', () => {
      const rules: RoutingRule[] = [
        makeRule({ sentiment: 'negative', emotion_score_lt: 5 }),
      ];
      const result = matchRoutingRule('neutral', 6, rules);
      expect(result).toBeNull();
    });

    it('rule with emotion_score_lt=5 and sentiment=negative matches when score=3', () => {
      const rules: RoutingRule[] = [
        makeRule({ sentiment: 'negative', emotion_score_lt: 5, assign_to_role: 'supervisor' }),
      ];
      const result = matchRoutingRule('negative', 3, rules);
      expect(result).not.toBeNull();
      expect(result!.assign_to_role).toBe('supervisor');
    });

    it('rule with emotion_score_lt=5 does not match when score equals threshold (5)', () => {
      const rules: RoutingRule[] = [
        makeRule({ sentiment: 'negative', emotion_score_lt: 5 }),
      ];
      const result = matchRoutingRule('negative', 5, rules);
      expect(result).toBeNull();
    });

    it('multiple rules — returns highest priority (lowest score threshold)', () => {
      const rules: RoutingRule[] = [
        makeRule({ id: 'rule-1', sentiment: 'negative', emotion_score_lt: 7, assign_to_role: 'front_desk' }),
        makeRule({ id: 'rule-2', sentiment: 'negative', emotion_score_lt: 4, assign_to_role: 'manager' }),
        makeRule({ id: 'rule-3', sentiment: 'negative', emotion_score_lt: 10, assign_to_role: 'staff' }),
      ];
      const result = matchRoutingRule('negative', 3, rules);
      expect(result).not.toBeNull();
      expect(result!.assign_to_role).toBe('manager');
      expect(result!.id).toBe('rule-2');
    });

    it('inactive rules are excluded from matching', () => {
      const rules: RoutingRule[] = [
        makeRule({ sentiment: 'negative', emotion_score_lt: 4, is_active: false, assign_to_role: 'manager' }),
      ];
      const result = matchRoutingRule('negative', 2, rules);
      expect(result).toBeNull();
    });

    it('sentiment=any rule matches any sentiment', () => {
      const rules: RoutingRule[] = [
        makeRule({ sentiment: 'any', emotion_score_lt: 3, assign_to_role: 'duty_manager' }),
      ];
      const result = matchRoutingRule('positive', 2, rules);
      expect(result).not.toBeNull();
      expect(result!.assign_to_role).toBe('duty_manager');
    });

    it('rule without emotion_score_lt matches any score', () => {
      const rules: RoutingRule[] = [
        makeRule({ sentiment: 'negative', emotion_score_lt: undefined, assign_to_role: 'staff' }),
      ];
      const result = matchRoutingRule('negative', 9, rules);
      expect(result).not.toBeNull();
      expect(result!.assign_to_role).toBe('staff');
    });
  });

  describe('SLA deadline calculation', () => {
    it('rule with sla_minutes=60 yields deadline approximately now+60min', () => {
      const rule = makeRule({ sla_minutes: 60 });
      const before = Date.now();
      const deadline = new Date(before + rule.sla_minutes * 60 * 1000);
      const after = Date.now();

      expect(deadline.getTime()).toBeGreaterThanOrEqual(before + 59 * 60 * 1000);
      expect(deadline.getTime()).toBeLessThanOrEqual(after + 61 * 60 * 1000);
    });

    it('rule with sla_minutes=120 yields deadline approximately now+120min', () => {
      const rule = makeRule({ sla_minutes: 120 });
      const before = Date.now();
      const deadline = new Date(before + rule.sla_minutes * 60 * 1000);
      expect(deadline.getTime()).toBeGreaterThanOrEqual(before + 119 * 60 * 1000);
    });
  });

  describe('Default rule fallback', () => {
    it('falls back to default rule when no custom rules match (negative score<4)', () => {
      const result = matchRoutingRule('negative', 2, []);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('default');
      expect(result!.assign_to_role).toBe('manager');
    });

    it('does not fall back to default rule when sentiment is positive', () => {
      const result = matchRoutingRule('positive', 9, []);
      expect(result).toBeNull();
    });
  });
});
