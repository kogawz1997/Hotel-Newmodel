import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const REDEEM_OPTIONS = [
  { id: 'discount_50',  points: 500,  baht: 50,   label: 'ส่วนลด ฿50' },
  { id: 'discount_150', points: 1000, baht: 150,  label: 'ส่วนลด ฿150' },
  { id: 'discount_400', points: 2000, baht: 400,  label: 'ส่วนลด ฿400' },
  { id: 'free_night',   points: 5000, baht: 1500, label: 'ห้องพักฟรี 1 คืน (ห้องเริ่มต้น)' },
] as const;

const schema = z.object({
  redeemId: z.enum(['discount_50', 'discount_150', 'discount_400', 'free_night']),
});

export async function GET() {
  return NextResponse.json({ options: REDEEM_OPTIONS });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error' }, { status: 422 });
  }

  const option = REDEEM_OPTIONS.find(o => o.id === parsed.data.redeemId);
  if (!option) return NextResponse.json({ error: 'Invalid redeem option' }, { status: 400 });

  const { data: loyalty } = await supabase
    .from('guest_loyalty')
    .select('points')
    .eq('guest_id', user.id)
    .maybeSingle();

  const currentPoints = loyalty?.points ?? 0;
  if (currentPoints < option.points) {
    return NextResponse.json({ error: `คะแนนไม่เพียงพอ (มี ${currentPoints} แต้ม, ต้องการ ${option.points} แต้ม)` }, { status: 400 });
  }

  const couponCode = `RDM-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const { error: txError } = await supabase.from('loyalty_transactions').insert({
    guest_id:    user.id,
    points:      -option.points,
    type:        'redeem',
    description: `แลก: ${option.label}`,
    metadata:    { coupon_code: couponCode, baht_value: option.baht },
  });

  if (txError) {
    console.error('loyalty redeem tx error', txError);
    return NextResponse.json({ error: 'Failed to redeem points' }, { status: 500 });
  }

  await supabase.from('guest_loyalty')
    .update({ points: currentPoints - option.points })
    .eq('guest_id', user.id);

  return NextResponse.json({
    success: true,
    couponCode,
    label: option.label,
    bahtValue: option.baht,
    pointsDeducted: option.points,
    remainingPoints: currentPoints - option.points,
  });
}
