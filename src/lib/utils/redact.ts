const PII_KEYS = new Set([
  'password', 'password_hash', 'token', 'secret', 'api_key',
  'card_number', 'cvv', 'passport_number', 'id_card_number',
  'email', 'phone', 'date_of_birth', 'nationality',
]);

export function redactPii(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => redactPii(v, depth + 1));
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = PII_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : redactPii(value, depth + 1);
  }
  return result;
}
