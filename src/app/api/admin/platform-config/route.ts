import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/platform-config
 *
 * Fetches all rows from the platform_config table and returns them as a
 * flat key→value map: { [key: string]: any }
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('platform_config')
      .select('key, value');

    if (error) {
      console.error('[platform-config] GET error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch platform config', details: error.message },
        { status: 500 }
      );
    }

    const config: Record<string, unknown> = {};
    for (const row of data ?? []) {
      config[row.key] = row.value;
    }

    return NextResponse.json(config);
  } catch (err) {
    console.error('[platform-config] GET unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/platform-config
 *
 * Body: { key: string; value: any }
 *
 * Upserts the given key/value pair into platform_config (conflict on key).
 * Returns { ok: true } on success.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body as { key: string; value: unknown };

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "key" field' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('platform_config')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) {
      console.error('[platform-config] POST error:', error);
      return NextResponse.json(
        { error: 'Failed to save platform config', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[platform-config] POST unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
