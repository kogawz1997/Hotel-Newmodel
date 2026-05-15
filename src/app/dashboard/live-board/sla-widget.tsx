'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SLACounts { onTime: number; warning: number; breached: number; }

export function SlaWidget() {
  const [counts, setCounts] = useState<SLACounts>({ onTime: 0, warning: 0, breached: 0 });

  async function load() {
    const supabase = createClient();
    const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', (await supabase.auth.getUser()).data.user?.id ?? '').single();
    const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1).single();
    if (!hotel) return;
    const { data } = await supabase.from('work_orders')
      .select('sla_deadline')
      .eq('hotel_id', hotel.id)
      .in('status', ['pending','assigned','in_progress'])
      .not('sla_deadline', 'is', null);
    if (!data) return;
    const now = Date.now();
    let onTime = 0, warning = 0, breached = 0;
    for (const r of data) {
      const mins = (new Date(r.sla_deadline).getTime() - now) / 60000;
      if (mins < 0) breached++;
      else if (mins < 15) warning++;
      else onTime++;
    }
    setCounts({ onTime, warning, breached });
  }

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  return (
    <div className="flex gap-4">
      {[
        { label: 'ตรงเวลา', value: counts.onTime, color: 'text-emerald-600', dot: 'bg-emerald-500' },
        { label: 'ใกล้หมดเวลา', value: counts.warning, color: 'text-amber-600', dot: 'bg-amber-500' },
        { label: 'เกินเวลา', value: counts.breached, color: 'text-red-600', dot: 'bg-red-500' },
      ].map(s => (
        <div key={s.label} className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${s.dot}`} />
          <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
          <span className="text-xs text-muted-foreground">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
