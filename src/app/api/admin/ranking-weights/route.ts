import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { DEFAULT_WEIGHTS } from '@/lib/ranking';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;

  const supabase = createAdminClient();
  try {
    const { data } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', 'ranking_weights')
      .single();
    return NextResponse.json({ weights: data?.value ?? DEFAULT_WEIGHTS });
  } catch {
    return NextResponse.json({ weights: DEFAULT_WEIGHTS });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.error) return auth.error;

  const supabase = createAdminClient();
  const body = await req.json();
  const weights = { ...DEFAULT_WEIGHTS, ...body };

  await supabase.from('platform_config').upsert(
    { key: 'ranking_weights', value: weights },
    { onConflict: 'key' }
  );

  return NextResponse.json({ ok: true, weights });
}
