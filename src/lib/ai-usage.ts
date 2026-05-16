import { createClient } from '@/lib/supabase/server';

// Anthropic pricing per million tokens (as of 2025)
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  'claude-sonnet-4-5': { input: 3.0, output: 15.0 },
  'default': { input: 3.0, output: 15.0 },
};

function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model] || PRICING['default'];
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

export async function logAiUsage(params: {
  hotelId?: string;
  userId?: string;
  model: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
}) {
  try {
    const supabase = await createClient();
    const costUsd = estimateCostUsd(params.model, params.inputTokens, params.outputTokens);
    await supabase.from('audit_logs').insert({
      hotel_id: params.hotelId || null,
      user_id: params.userId || null,
      action: 'ai_usage',
      entity_type: 'ai_call',
      changes: {
        model: params.model,
        feature: params.feature,
        input_tokens: params.inputTokens,
        output_tokens: params.outputTokens,
        cost_usd: costUsd,
      },
    });
  } catch {
    // non-critical, never throw
  }
}
