// NOTE: ctx objects passed to logger may contain PII (email, phone, etc.).
// Callers are responsible for redacting sensitive fields before logging.
// Use redactPii() from @/lib/utils/redact for untrusted/user-supplied data.
type LogLevel = 'info' | 'warn' | 'error';

function write(level: LogLevel, msg: string, ctx?: Record<string, unknown>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...ctx });
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

export const logger = {
  info:  (msg: string, ctx?: Record<string, unknown>) => write('info',  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => write('warn',  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => write('error', msg, ctx),
};
