/**
 * POST /api/notifications/[id]/read — mark notification as read
 * POST /api/notifications/all/read — mark all as read (id = "all")
 */
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  const { id } = await params;
  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (id === 'all') {
    await admin
      .from('staff_notifications')
      .update({ is_read: true, read_at: now })
      .eq('user_id', ctx.user!.id)
      .eq('is_read', false);
  } else {
    await admin
      .from('staff_notifications')
      .update({ is_read: true, read_at: now })
      .eq('id', id)
      .eq('user_id', ctx.user!.id);
  }

  return NextResponse.json({ ok: true });
}
