/**
 * POST /api/housekeeping/photos
 * Upload a before/after/inspection photo for a housekeeping task.
 * Accepts multipart/form-data: { taskId, hotelId, photoType, file }
 * Stores in Supabase Storage and appends URL to housekeeping_tasks.photo_urls
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';

const BUCKET = 'hotel-assets';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'housekeeping.photos', 30, 60_000);
  if (limited) return limited;

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });

  const taskId = formData.get('taskId') as string | null;
  const hotelId = formData.get('hotelId') as string | null;
  const photoType = (formData.get('photoType') as string | null) || 'proof';
  const file = formData.get('file') as File | null;

  if (!taskId || !hotelId || !file) {
    return NextResponse.json({ error: 'taskId, hotelId, and file are required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
  }

  const ctx = await requireHotelAccess(hotelId, [
    'owner', 'admin', 'manager',
    'housekeeping', 'housekeeping_manager', 'housekeeper', 'room_inspector',
  ]);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();

  // Verify task belongs to this hotel
  const { data: task } = await admin
    .from('housekeeping_tasks')
    .select('id, hotel_id, photo_urls')
    .eq('id', taskId)
    .eq('hotel_id', hotelId)
    .single();

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  // Ensure bucket exists
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((b: any) => b.name === BUCKET)) {
    await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES });
  }

  const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
  const filename = `housekeeping/${hotelId}/${taskId}/${photoType}-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(filename, bytes, { contentType: file.type, upsert: false });

  if (uploadErr) {
    return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(filename);

  // Append URL to photo_urls array
  const existingUrls: string[] = task.photo_urls || [];
  const { error: updateErr } = await admin
    .from('housekeeping_tasks')
    .update({ photo_urls: [...existingUrls, publicUrl] })
    .eq('id', taskId);

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update task photos' }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl, photoType });
}
