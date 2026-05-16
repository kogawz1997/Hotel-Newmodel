import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireCronSecret } from '@/lib/auth/guards';
import { decideStuckJobAction, normalizeAttempts, shouldMoveToDeadLetter } from '@/lib/reliability/sweep.js';
import { sendOpsAlert } from '@/lib/ops-alert';

const STUCK_MINUTES = Number(process.env.RELIABILITY_STUCK_MINUTES || 15);
const MAX_ATTEMPTS = Number(process.env.RELIABILITY_MAX_ATTEMPTS || 5);

export async function GET(request: Request) {
  const denied = requireCronSecret(request);
  if (denied) return denied;

  const admin = createAdminClient();
  const stuckBefore = new Date(Date.now() - STUCK_MINUTES * 60_000).toISOString();

  const { data: stuckJobs, error: stuckError } = await admin
    .from('ota_sync_queue')
    .select('id, attempts, updated_at')
    .eq('status', 'processing')
    .lt('updated_at', stuckBefore)
    .limit(200);

  if (stuckError) return apiError(stuckError);

  let requeued = 0;
  let movedToDlq = 0;

  for (const job of stuckJobs || []) {
    const attempts = normalizeAttempts(job);
    if (decideStuckJobAction(attempts, MAX_ATTEMPTS) === 'failed') {
      await admin.from('ota_sync_queue').update({ status: 'failed', updated_at: new Date().toISOString(), last_error: `stuck processing > ${STUCK_MINUTES}m` }).eq('id', job.id);
    } else {
      await admin.from('ota_sync_queue').update({ status: 'retry', updated_at: new Date().toISOString(), last_error: `auto-retry after ${STUCK_MINUTES}m timeout` }).eq('id', job.id);
      requeued += 1;
    }
  }

  const { data: failedJobs, error: failedError } = await admin
    .from('ota_sync_queue')
    .select('id, provider, payload, last_error, attempts')
    .eq('status', 'failed')
    .gte('attempts', MAX_ATTEMPTS)
    .limit(200);

  if (failedError) return apiError(failedError);

  for (const job of failedJobs || []) {
    const { error: dlqError } = await admin
      .from('dead_letter_queue')
      .insert({
        source_table: 'ota_sync_queue',
        source_id: job.id,
        source_provider: job.provider,
        failure_reason: job.last_error || 'max attempts exceeded',
        payload: job.payload || {},
        attempts: normalizeAttempts(job),
      });

    if (!dlqError && shouldMoveToDeadLetter(normalizeAttempts(job), MAX_ATTEMPTS)) {
      await admin.from('ota_sync_queue').update({ status: 'skipped', updated_at: new Date().toISOString(), last_error: 'moved to dead_letter_queue' }).eq('id', job.id);
      movedToDlq += 1;
    }
  }

  // Send alert if significant DLQ activity
  if (movedToDlq > 0) {
    await sendOpsAlert({
      level: movedToDlq >= 5 ? 'critical' : 'warning',
      title: 'OTA Sync Jobs Moved to Dead Letter Queue',
      message: `${movedToDlq} jobs exhausted max retry attempts and were moved to dead_letter_queue.`,
      context: { movedToDlq, requeued, maxAttempts: MAX_ATTEMPTS },
    });
  }

  return NextResponse.json({
    success: true,
    thresholds: { stuckMinutes: STUCK_MINUTES, maxAttempts: MAX_ATTEMPTS },
    scanned: { stuckJobs: (stuckJobs || []).length, failedJobs: (failedJobs || []).length },
    actions: { requeued, movedToDlq },
  });
}
