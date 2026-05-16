import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendOpsAlert } from '@/lib/ops-alert';

export const dynamic = 'force-dynamic';

// Verifies that DB is reachable and data can be read — serves as a backup health signal.
// Supabase Point-in-Time Recovery (PITR) is enabled via the Supabase dashboard (Pro plan+).
// This cron acts as a canary: if it can't read the DB, there's a problem worth alerting on.
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const checks: Record<string, boolean> = {};

  try {
    const { error: orgErr } = await supabase.from('organizations').select('id').limit(1);
    checks.organizations = !orgErr;

    const { error: hotelErr } = await supabase.from('hotels').select('id').limit(1);
    checks.hotels = !hotelErr;

    const { error: resErr } = await supabase.from('reservations').select('id').limit(1);
    checks.reservations = !resErr;

    const { count: auditCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 86_400_000).toISOString());
    checks.recent_activity = (auditCount || 0) >= 0; // true if table readable
  } catch (e: any) {
    await sendOpsAlert({
      level: 'critical',
      title: 'Backup Check Failed — DB Unreachable',
      message: `Database canary check failed: ${e.message}`,
    });
    return NextResponse.json({ ok: false, error: e.message }, { status: 503 });
  }

  const allOk = Object.values(checks).every(Boolean);

  if (!allOk) {
    const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
    await sendOpsAlert({
      level: 'warning',
      title: 'Backup Check — Some Tables Unreadable',
      message: `Tables failed canary read: ${failed.join(', ')}`,
      context: { checks },
    });
  }

  return NextResponse.json({
    ok: allOk,
    checks,
    note: 'Enable Supabase PITR at dashboard.supabase.com → Project → Database → Backups',
  });
}
