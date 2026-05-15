import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MANAGER_ROLES = ['owner', 'admin', 'manager'];

async function getContext(userId: string, supabase: any) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .single();
  if (!profile) return null;

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  return { profile, hotel };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getContext(user.id, supabase);
  if (!ctx) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  if (!MANAGER_ROLES.includes(ctx.profile.role)) {
    return NextResponse.json({ error: 'Permission denied. Manager or above required.' }, { status: 403 });
  }

  if (!ctx.hotel) return NextResponse.json({ error: 'No hotel found' }, { status: 400 });

  const body = await req.json();
  const allowed = ['title', 'category', 'description', 'file_url', 'file_type', 'file_size', 'version', 'target_roles'];
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .eq('hotel_id', ctx.hotel.id)
    .select('*, uploader:user_profiles!uploaded_by(id, full_name, role)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getContext(user.id, supabase);
  if (!ctx) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  if (!MANAGER_ROLES.includes(ctx.profile.role)) {
    return NextResponse.json({ error: 'Permission denied. Manager or above required.' }, { status: 403 });
  }

  if (!ctx.hotel) return NextResponse.json({ error: 'No hotel found' }, { status: 400 });

  const { error } = await supabase
    .from('documents')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('hotel_id', ctx.hotel.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
