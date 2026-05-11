type AlertLevel = 'info' | 'warning' | 'critical';
type AlertCategory = 'payment' | 'ota' | 'cron' | 'booking' | 'security' | 'system';

interface AlertInput {
  level: AlertLevel;
  title: string;
  message: string;
  category?: AlertCategory;
  context?: Record<string, unknown>;
}

function resolveWebhookUrl(category?: AlertCategory, level?: AlertLevel): string | undefined {
  // Category-specific webhooks take priority over the generic one
  if (category === 'payment' && process.env.OPS_ALERT_PAYMENT_WEBHOOK_URL) {
    return process.env.OPS_ALERT_PAYMENT_WEBHOOK_URL;
  }
  if (category === 'ota' && process.env.OPS_ALERT_OTA_WEBHOOK_URL) {
    return process.env.OPS_ALERT_OTA_WEBHOOK_URL;
  }
  if (level === 'critical' && process.env.OPS_ALERT_CRITICAL_WEBHOOK_URL) {
    return process.env.OPS_ALERT_CRITICAL_WEBHOOK_URL;
  }
  return process.env.OPS_ALERT_WEBHOOK_URL;
}

function buildSlackPayload(input: AlertInput & { app: string; at: string }) {
  const emoji = input.level === 'critical' ? '🚨' : input.level === 'warning' ? '⚠️' : 'ℹ️';
  return {
    text: `${emoji} *[${input.level.toUpperCase()}]* ${input.title}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${emoji} ${input.title}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Level:*\n${input.level}` },
          { type: 'mrkdwn', text: `*Category:*\n${input.category || 'system'}` },
          { type: 'mrkdwn', text: `*App:*\n${input.app}` },
          { type: 'mrkdwn', text: `*Time:*\n${input.at}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: input.message },
      },
      ...(input.context && Object.keys(input.context).length > 0 ? [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '```' + JSON.stringify(input.context, null, 2).slice(0, 1500) + '```',
        },
      }] : []),
    ],
  };
}

export async function sendOpsAlert(input: AlertInput): Promise<{ delivered: boolean; reason?: string; status?: number }> {
  const webhookUrl = resolveWebhookUrl(input.category, input.level);
  const at = new Date().toISOString();
  const app = 'maitri-pms';

  const payload = {
    level: input.level,
    title: input.title,
    message: input.message,
    category: input.category || 'system',
    context: input.context || {},
    app,
    at,
  };

  if (!webhookUrl) {
    console.warn('[ops-alert]', JSON.stringify(payload));
    return { delivered: false, reason: 'OPS_ALERT_WEBHOOK_URL not configured' };
  }

  // Detect Slack webhook and send rich payload
  const body = webhookUrl.includes('hooks.slack.com')
    ? JSON.stringify(buildSlackPayload({ ...payload, app, at }))
    : JSON.stringify(payload);

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    return { delivered: res.ok, status: res.status };
  } catch (err) {
    console.error('[ops-alert] delivery failed:', err);
    return { delivered: false, reason: String(err) };
  }
}

export async function alertPaymentFailure(opts: {
  hotelId: string;
  reservationId?: string;
  amount: number;
  gateway: string;
  error: string;
}) {
  return sendOpsAlert({
    level: 'critical',
    category: 'payment',
    title: 'Payment Failed',
    message: `Gateway: ${opts.gateway} | Amount: ${opts.amount} THB | Error: ${opts.error}`,
    context: { hotelId: opts.hotelId, reservationId: opts.reservationId, amount: opts.amount, gateway: opts.gateway },
  });
}

export async function alertOtaFailure(opts: {
  channel: string;
  operation: string;
  error: string;
  hotelId?: string;
}) {
  return sendOpsAlert({
    level: 'warning',
    category: 'ota',
    title: `OTA Sync Failed — ${opts.channel}`,
    message: `Operation: ${opts.operation} | Error: ${opts.error}`,
    context: { channel: opts.channel, operation: opts.operation, hotelId: opts.hotelId },
  });
}

export async function alertCronFailure(opts: {
  cronPath: string;
  error: string;
  context?: Record<string, unknown>;
}) {
  return sendOpsAlert({
    level: 'warning',
    category: 'cron',
    title: `Cron Job Failed — ${opts.cronPath}`,
    message: opts.error,
    context: { cronPath: opts.cronPath, ...opts.context },
  });
}
