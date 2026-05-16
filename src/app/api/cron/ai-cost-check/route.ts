import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOpsAlert } from '@/lib/ops-alert';

const COST_ALERT_THRESHOLD_USD = Number(process.env.AI_COST_ALERT_THRESHOLD_USD || '50');
const COST_CRITICAL_THRESHOLD_USD = Number(process.env.AI_COST_CRITICAL_THRESHOLD_USD || '200');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('hotel_id, changes')
    .eq('action', 'ai_usage')
    .gte('created_at', since.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate cost by hotel
  const byHotel: Record<string, { totalCost: number; calls: number }> = {};
  let grandTotal = 0;

  for (const log of logs || []) {
    const hotelId = log.hotel_id || 'unknown';
    const cost = (log.changes as any)?.cost_usd || 0;
    if (!byHotel[hotelId]) byHotel[hotelId] = { totalCost: 0, calls: 0 };
    byHotel[hotelId].totalCost += cost;
    byHotel[hotelId].calls += 1;
    grandTotal += cost;
  }

  const totalCalls = (logs || []).length;
  const result = { grandTotal, byHotel, totalCalls, thresholdUsd: COST_ALERT_THRESHOLD_USD };

  if (grandTotal >= COST_CRITICAL_THRESHOLD_USD) {
    await sendOpsAlert({
      level: 'critical',
      title: 'AI Cost Critical Threshold Exceeded',
      message: `Total AI spend in last 30 days: $${grandTotal.toFixed(2)} USD (limit: $${COST_CRITICAL_THRESHOLD_USD})`,
      context: { grandTotal, totalCalls, hotelCount: Object.keys(byHotel).length },
    });
  } else if (grandTotal >= COST_ALERT_THRESHOLD_USD) {
    await sendOpsAlert({
      level: 'warning',
      title: 'AI Cost Alert',
      message: `Total AI spend in last 30 days: $${grandTotal.toFixed(2)} USD (warning at $${COST_ALERT_THRESHOLD_USD})`,
      context: { grandTotal, totalCalls, hotelCount: Object.keys(byHotel).length },
    });
  }

  return NextResponse.json({ ok: true, ...result });
}
