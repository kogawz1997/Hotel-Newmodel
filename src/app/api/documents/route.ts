import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

const MANAGER_ROLES = ['owner', 'admin', 'manager'];

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();
  if (!hotel) return NextResponse.json([], { status: 200 });

  const url = new URL(req.url);
  const category = url.searchParams.get('category');

  let q = supabase
    .from('documents')
    .select('*, uploader:user_profiles!uploaded_by(id, full_name, role)')
    .eq('hotel_id', hotel.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (category) q = q.eq('category', category);

  const { data, error } = await q;
  if (error) return apiError(error);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  if (!MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Permission denied. Manager or above required.' }, { status: 403 });
  }

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();
  if (!hotel) return NextResponse.json({ error: 'No hotel found' }, { status: 400 });

  const body = await req.json();
  const { title, category, description, file_url, file_type, file_size, version, target_roles } = body;

  if (!title || !category || !file_url) {
    return NextResponse.json({ error: 'title, category and file_url are required' }, { status: 422 });
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      hotel_id: hotel.id,
      title,
      category,
      description: description ?? null,
      file_url,
      file_type: file_type ?? null,
      file_size: file_size ?? null,
      version: version ?? '1.0',
      target_roles: target_roles ?? [],
      uploaded_by: user.id,
      is_active: true,
    })
    .select('*, uploader:user_profiles!uploaded_by(id, full_name, role)')
    .single();

  if (error) return apiError(error);
  return NextResponse.json(data, { status: 201 });
}
