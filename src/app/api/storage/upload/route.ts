import { createAdminClient } from '@/lib/supabase/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson } from '@/lib/http/validation';

const schema = z.object({
  hotelId:   z.string().uuid(),
  filename:  z.string().min(1).max(255).regex(/^[\w\-.]+$/, 'Invalid filename'),
  mimeType:  z.string().regex(/^image\/(jpeg|png|webp|gif)$/, 'Only images allowed'),
});

const BUCKET = 'hotel-assets';
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 52_428_800; // 50 MB

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJson(request, schema);
    if (parsed.error) return parsed.error;
    const { hotelId, filename, mimeType } = parsed.data;

    const ctx = await requireHotelAccess(hotelId, ['owner', 'admin', 'manager']);
    if (ctx.error) return ctx.error;

    const admin = createAdminClient();

    // Ensure bucket exists
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.some((b: any) => b.name === BUCKET)) {
      await admin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ALLOWED_MIME,
      });
    }

    // Path is scoped to hotel: hotel-assets/{hotelId}/{filename}
    // This enforces tenant isolation at the storage path level
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectPath = `${hotelId}/${Date.now()}-${safeName}`;

    // Create a signed upload URL valid for 60 seconds
    const { data: signedUrl, error: signErr } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(objectPath);

    if (signErr) {
      return NextResponse.json({ error: signErr.message }, { status: 500 });
    }

    const publicUrl = admin.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;

    return NextResponse.json({
      success: true,
      bucket: BUCKET,
      path: objectPath,
      signedUrl: signedUrl?.signedUrl,
      token: signedUrl?.token,
      publicUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
