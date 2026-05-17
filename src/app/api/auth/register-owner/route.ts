import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { parseJson } from '@/lib/http/validation';
import { rateLimit } from '@/lib/security/rate-limit';

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
});

export async function POST(request: Request) {
  const limited = await rateLimit(request, 'auth.register-owner', 5, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;
  const { fullName } = parsed.data;

  const sessionSupabase = await createClient();
  const { data: { user }, error: authError } = await sessionSupabase.auth.getUser();
  if (authError || !user?.id || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error: upsertError } = await admin.from('user_profiles').upsert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    role: 'owner',
    active: true,
    onboarding_completed: false,
  }, { onConflict: 'id' });

  if (upsertError) {
    console.error('[register-owner] upsert error', upsertError);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
