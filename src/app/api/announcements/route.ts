import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/http/errors';

const MANAGER_ROLES = ['owner', 'admin', 'manager'] as const;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const hotelId = url.searchParams.get('hotel_id');
  const typeFilter = url.searchParams.get('type');

  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const { supabase, hotelId: resolvedHotelId, profile } = ctx;
  const isManager = (MANAGER_ROLES as readonly string[]).includes(profile.role);
  const now = new Date().toISOString();

  let query = supabase
    .from('announcements')
    .select('*, creator:created_by(full_name)')
    .eq('hotel_id', resolvedHotelId)
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false });

  if (typeFilter) {
    query = query.eq('type', typeFilter);
  }

  const { data, error } = await query;
  if (error) return apiError(error);

  // Staff: filter by target_roles — only show announcements targeting their role
  // or announcements with no target restriction (null/empty array)
  let filtered = (data ?? []).filter((a: any) => {
    if (isManager) return true;
    const roles: string[] | null = a.target_roles;
    if (!roles || roles.length === 0) return true;
    return roles.includes(profile.role);
  });

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const ctx = await requireHotelAccess(null, [...MANAGER_ROLES]);
  if (ctx.error) return ctx.error;

  const { supabase, hotelId, user } = ctx;
  const body = await req.json();

  const { title, body: bodyText, type, target_roles, expires_at } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  if (!bodyText?.trim()) {
    return NextResponse.json({ error: 'Body is required' }, { status: 400 });
  }

  const VALID_TYPES = ['general', 'urgent', 'policy', 'event', 'other'];
  if (type && !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      hotel_id: hotelId,
      title: title.trim(),
      body: bodyText.trim(),
      type: type ?? 'general',
      target_roles: Array.isArray(target_roles) && target_roles.length > 0 ? target_roles : null,
      expires_at: expires_at || null,
      created_by: user.id,
      is_active: true,
    })
    .select('*, creator:created_by(full_name)')
    .single();

  if (error) return apiError(error);
  return NextResponse.json(data, { status: 201 });
}
