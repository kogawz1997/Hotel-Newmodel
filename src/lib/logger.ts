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
