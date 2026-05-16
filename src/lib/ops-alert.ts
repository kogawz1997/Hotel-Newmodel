/**
 * Send operational alerts to a Slack/Discord-compatible webhook.
 * Set OPS_ALERT_WEBHOOK_URL in env to enable.
 * No-ops silently when URL is not configured.
 */

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export interface OpsAlert {
  level: AlertLevel;
  title: string;
  message: string;
  context?: Record<string, unknown>;
}

const COLORS: Record<AlertLevel, number> = {
  info: 0x3b82f6,
  warning: 0xf59e0b,
  error: 0xef4444,
  critical: 0x7c3aed,
};

export async function sendOpsAlert(alert: OpsAlert): Promise<void> {
  const url = process.env.OPS_ALERT_WEBHOOK_URL;
  if (!url) return;

  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'unknown';
  const contextLines = alert.context
    ? Object.entries(alert.context)
        .map(([k, v]) => `**${k}**: \`${String(v)}\``)
        .join('\n')
    : '';

  const body = JSON.stringify({
    embeds: [
      {
        title: `[${alert.level.toUpperCase()}] ${alert.title}`,
        description: [alert.message, contextLines].filter(Boolean).join('\n\n'),
        color: COLORS[alert.level],
        footer: { text: `Maitri PMS · ${env} · ${new Date().toISOString()}` },
      },
    ],
  });

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch {
    // Never throw — alerts should never break primary flows
  }
}
