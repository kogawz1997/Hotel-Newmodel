import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson, dbError } from '@/lib/http/validation';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

const photoSchema = z.object({
  photo_url: z.string().url(),
  photo_type: z.enum(['before', 'after', 'proof']).optional().default('after'),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: task } = await admin
    .from('housekeeping_tasks')
    .select('id, hotel_id, photo_urls')
    .eq('id', id)
    .single();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const ctx = await requireHotelAccess(task.hotel_id);
  if (ctx.error) return ctx.error;

  return NextResponse.json({ photo_urls: task.photo_urls || [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const parsed = await parseJson(request, photoSchema);
  if (parsed.error) return parsed.error;

  const { photo_url } = parsed.data;

  const admin = createAdminClient();

  const { data: task } = await admin
    .from('housekeeping_tasks')
    .select('id, hotel_id, photo_urls')
    .eq('id', id)
    .single();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const ctx = await requireHotelAccess(task.hotel_id, [
    'owner',
    'admin',
    'manager',
    'housekeeping',
    'staff',
  ] as any[]);
  if (ctx.error) return ctx.error;

  const currentUrls: string[] = Array.isArray(task.photo_urls)
    ? task.photo_urls
    : [];

  if (currentUrls.includes(photo_url)) {
    return NextResponse.json({ photo_urls: currentUrls });
  }

  const updatedUrls = [...currentUrls, photo_url];

  const { data, error } = await admin
    .from('housekeeping_tasks')
    .update({ photo_urls: updatedUrls })
    .eq('id', id)
    .eq('hotel_id', ctx.hotelId)
    .select('id, photo_urls')
    .single();

  if (error || !data) return dbError(error || new Error('Update failed'));

  return NextResponse.json({ photo_urls: data.photo_urls || [] });
}
