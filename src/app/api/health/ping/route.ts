import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Lightweight ping endpoint for uptime monitors (Checkly, Better Uptime, UptimeRobot)
// Returns HTTP 200 when healthy, 503 when DB unreachable
export async function GET() {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('organizations').select('id').limit(1);
    if (error) throw new Error(error.message);

    return NextResponse.json(
      { ok: true, ts: Date.now() },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'DB unreachable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
