import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function generateCode() {
  return `MTR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('referral_codes')
    .select('id, code, reward_type, reward_value, active, created_at')
    .eq('owner_guest_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ referrals: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any = {};
  try { body = await request.json(); } catch {}

  if (body.action === 'create') {
    const { count } = await supabase
      .from('referral_codes')
      .select('id', { count: 'exact', head: true })
      .eq('owner_guest_id', user.id)
      .eq('active', true);

    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: 'มีโค้ดที่ใช้งานได้ครบ 5 โค้ดแล้ว' }, { status: 422 });
    }

    const { data, error } = await supabase
      .from('referral_codes')
      .insert({
        code:           generateCode(),
        owner_guest_id: user.id,
        reward_type:    body.rewardType || 'percent',
        reward_value:   Number(body.rewardValue || 10),
        active:         true,
      })
      .select('id, code')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, referral: data });
  }

  if (body.action === 'apply') {
    const referralCode = String(body.code || '').trim().toUpperCase();
    if (!referralCode) return NextResponse.json({ valid: false, error: 'กรุณาใส่โค้ด' }, { status: 400 });

    const { data: referral, error } = await supabase
      .from('referral_codes')
      .select('id, code, reward_type, reward_value, active, owner_guest_id')
      .eq('code', referralCode)
      .eq('active', true)
      .maybeSingle();

    if (error) return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
    if (!referral) return NextResponse.json({ valid: false, error: 'โค้ดไม่ถูกต้องหรือหมดอายุแล้ว' }, { status: 404 });
    if (referral.owner_guest_id === user.id) {
      return NextResponse.json({ valid: false, error: 'ไม่สามารถใช้โค้ดของตัวเองได้' }, { status: 422 });
    }

    return NextResponse.json({ valid: true, referral });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
