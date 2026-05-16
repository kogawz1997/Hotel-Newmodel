/**
 * GET /api/notifications — fetch staff_notifications for current user
 * Query params: ?unread=true&limit=50
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

  const admin = createAdminClient();

  let query = admin
    .from('staff_notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', ctx.user!.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unreadCount = unreadOnly ? count ?? 0 : (data ?? []).filter(n => !n.is_read).length;

  return NextResponse.json({ notifications: data ?? [], unread_count: unreadCount });
}
