'use client';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export function GroupBookingClient({ hotelId, reservations }: { hotelId: string; reservations: any[] }) {
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const total = useMemo(() => reservations.filter((r:any) => selected.includes(r.id)).reduce((s:number,r:any)=>s+Number(r.total_amount||0),0), [reservations, selected]);

  async function createGroup() {
    if (selected.length < 2 || !groupName) return toast.error('เลือกอย่างน้อย 2 การจองและใส่ชื่อกลุ่ม');
    setLoading(true);
    const res = await fetch('/api/group-bookings/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelId, groupName, reservationIds: selected }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(data.error || 'สร้าง group ไม่สำเร็จ');
    toast.success(`สร้าง group สำเร็จ: ${data.groupCode}`);
  }

  return (
    <main className="space-y-6 p-6 md:p-8">
      <h1 className="text-2xl font-semibold">Group Booking + Group Folio</h1>
      <Card>
        <CardHeader><CardTitle>Create Group</CardTitle><CardDescription>รวมหลาย reservation เป็นกลุ่มเดียว พร้อมสรุปยอดรวมแบบ group folio</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Input label="Group name" value={groupName} onChange={(e:any)=>setGroupName(e.target.value)} placeholder="เช่น Company Retreat May" />
          <div className="text-sm text-muted-foreground">Selected: {selected.length} reservations · Total {formatCurrency(total)}</div>
          <div className="max-h-96 space-y-2 overflow-auto rounded-xl border p-2">
            {reservations.map((r:any) => {
              const checked = selected.includes(r.id);
              return <label key={r.id} className="flex items-center justify-between rounded-lg border p-2 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={checked} onChange={()=>setSelected(prev=>checked?prev.filter(x=>x!==r.id):[...prev,r.id])} />{r.reservation_code} · {r.guests?.first_name} {r.guests?.last_name || ''}</span><span>{formatCurrency(Number(r.total_amount||0))}</span></label>;
            })}
          </div>
          <Button onClick={createGroup} disabled={loading}>{loading ? 'กำลังสร้าง...' : 'Create Group Booking'}</Button>
        </CardContent>
      </Card>
    </main>
  );
}
