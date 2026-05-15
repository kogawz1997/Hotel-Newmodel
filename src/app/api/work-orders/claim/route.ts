import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CLAIM_LOCK_SECONDS = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { taskId } = await req.json();
  if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 });

  const now = new Date();
  const lockExpires = new Date(now.getTime() + CLAIM_LOCK_SECONDS * 1000);

  // Atomic claim: only succeed if task is unclaimed or lock expired
  const { data: task } = await supabase
    .from('work_orders')
    .select('id, status, assigned_to, claimed_at, claim_expires_at')
    .eq('id', taskId)
    .single();

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const lockActive = task.claim_expires_at && new Date(task.claim_expires_at) > now;
  const alreadyClaimed = task.assigned_to && task.assigned_to !== user.id;

  if (lockActive && alreadyClaimed) {
    return NextResponse.json({ error: 'Task is already claimed by another staff', locked: true }, { status: 409 });
  }

  const { data: updated, error } = await supabase
    .from('work_orders')
    .update({
      assigned_to:      user.id,
      status:           'assigned',
      claimed_at:       now.toISOString(),
      claim_expires_at: lockExpires.toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ task: updated, lockExpiresIn: CLAIM_LOCK_SECONDS });
}
