import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('platform_config').select('key, value');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch platform config' }, { status: 500 });
    }

    const config: Record<string, unknown> = {};
    for (const row of data ?? []) {
      config[row.key] = row.value;
    }

    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { key, value } = body as { key: string; value: unknown };

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "key" field' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('platform_config')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ error: 'Failed to save platform config' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
