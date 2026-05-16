import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

// GET /api/maintenance/requests/[id]/photos
// Returns { before_photos: string[], after_photos: string[] }
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('before_photos, after_photos')
    .eq('id', id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  return NextResponse.json({
    before_photos: data.before_photos ?? [],
    after_photos: data.after_photos ?? [],
  });
}

// POST /api/maintenance/requests/[id]/photos
// Body: { photo_url: string, photo_type: 'before' | 'after' }
// Appends the URL to the appropriate array column
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { photo_url, photo_type } = body;

  if (!photo_url) return NextResponse.json({ error: 'photo_url required' }, { status: 400 });
  if (photo_type !== 'before' && photo_type !== 'after')
    return NextResponse.json({ error: 'photo_type must be before or after' }, { status: 400 });

  // Fetch current arrays
  const { data: current, error: fetchErr } = await supabase
    .from('maintenance_requests')
    .select('before_photos, after_photos')
    .eq('id', id)
    .single();

  if (fetchErr || !current)
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const column = photo_type === 'before' ? 'before_photos' : 'after_photos';
  const existing: string[] = current[column] ?? [];
  const updated = [...existing, photo_url];

  const { data, error } = await supabase
    .from('maintenance_requests')
    .update({ [column]: updated })
    .eq('id', id)
    .select('before_photos, after_photos')
    .single();

  if (error) return apiError(error);

  return NextResponse.json(
    {
      before_photos: data.before_photos ?? [],
      after_photos: data.after_photos ?? [],
    },
    { status: 201 }
  );
}
