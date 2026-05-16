import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

const ALLOWED_ROLES = ['owner', 'admin', 'manager', 'hr_manager', 'hr_staff', 'general_manager'];

async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const { data: hotel } = await admin
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) return { error: NextResponse.json({ error: 'Hotel not found' }, { status: 404 }) };

  return { user, profile, hotel, admin };
}

export async function GET(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel } = ctx;

  const url = new URL(req.url);
  const staffId = url.searchParams.get('staff_id');
  const status = url.searchParams.get('status');

  let query = admin
    .from('performance_reviews')
    .select('*, staff:staff_id(id, full_name, role), reviewer:reviewer_id(id, full_name)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false });

  if (staffId) query = query.eq('staff_id', staffId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return apiError(error);
  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel, user } = ctx;

  const body = await req.json();
  const { staff_id, period, scores, overall, strengths, improvements } = body as {
    staff_id: string;
    period: string;
    scores: Record<string, number>;
    overall: number;
    strengths?: string;
    improvements?: string;
  };

  if (!staff_id || !period) {
    return NextResponse.json({ error: 'กรุณาระบุพนักงานและรอบการประเมิน' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('performance_reviews')
    .insert({
      hotel_id: hotel.id,
      staff_id,
      reviewer_id: user.id,
      period,
      scores: scores ?? {},
      overall: overall ?? 0,
      strengths: strengths ?? null,
      improvements: improvements ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ review: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel, user } = ctx;

  const url = new URL(req.url);
  const reviewId = url.searchParams.get('id');
  if (!reviewId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await req.json();
  const { action } = body as { action: 'submit' | 'acknowledge' };

  const updates: Record<string, unknown> = {};
  if (action === 'submit') {
    updates.status = 'submitted';
    updates.submitted_at = new Date().toISOString();
  } else if (action === 'acknowledge') {
    updates.status = 'acknowledged';
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('performance_reviews')
    .update(updates)
    .eq('id', reviewId)
    .eq('hotel_id', hotel.id)
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ review: data });
}
