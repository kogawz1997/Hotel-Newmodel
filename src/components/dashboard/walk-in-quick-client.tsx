'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

export function WalkInQuickClient({ hotelId, roomTypes }: { hotelId: string; roomTypes: any[] }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDayUse, setIsDayUse] = useState(false);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    setCheckIn(today.toISOString().slice(0, 10));
    setCheckOut(tomorrow.toISOString().slice(0, 10));
  }, []);

  async function createWalkIn() {
    if (!roomTypeId || !firstName || !phone) {
      toast.error('กรอกข้อมูลไม่ครบ');
      return;
    }
    setSubmitting(true);
    const selected = roomTypes.find((r) => r.id === roomTypeId);
    const totalAmount = isDayUse ? Math.round(Number(selected?.base_rate || 0) * 0.6) : Number(selected?.base_rate || 0);

    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotelId,
        roomTypeId,
        checkIn,
        checkOut: isDayUse ? checkIn : checkOut,
        numAdults: 1,
        numChildren: 0,
        firstName,
        lastName,
        email,
        phone,
        source: isDayUse ? 'day_use' : 'walk_in',
        totalAmount,
        paymentMethod: 'at_hotel',
        roomTypeName: selected?.name || 'Walk-in',
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) return toast.error(data.error || 'สร้างการจองไม่สำเร็จ');
    toast.success(`สร้าง Walk-in สำเร็จ (${data.reservation?.reservation_code || 'OK'})`);
    setFirstName(''); setLastName(''); setPhone(''); setEmail('');
  }

  return (
    <main className="space-y-6 p-6 md:p-8">
      <section>
        <h1 className="text-2xl font-semibold">Walk-in Fast Flow</h1>
        <p className="text-sm text-muted-foreground">3 ขั้นตอน: เลือกวัน → เลือกห้อง → กรอกแขกและยืนยัน</p>
      </section>
      <Card>
        <CardHeader><CardTitle>Step 1: วันที่เข้าพัก</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input label="Check-in" type="date" value={checkIn} onChange={(e:any) => setCheckIn(e.target.value)} />
          <Input label="Check-out" type="date" value={isDayUse ? checkIn : checkOut} disabled={isDayUse} onChange={(e:any) => setCheckOut(e.target.value)} />
          <div className="md:col-span-2 flex items-center gap-2 rounded-lg border p-3 text-sm">
            <input id="dayuse" type="checkbox" checked={isDayUse} onChange={(e) => setIsDayUse(e.target.checked)} />
            <label htmlFor="dayuse">Day-use booking (รายชั่วโมง/ไม่ค้างคืน) — checkout วันเดียวกับ check-in</label>
          </div>

        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Step 2: เลือกประเภทห้อง</CardTitle><CardDescription>เลือกห้องที่ขายหน้างานได้ทันที</CardDescription></CardHeader>
        <CardContent>
          <Select label="Room Type" value={roomTypeId} onChange={(e:any) => setRoomTypeId(e.target.value)}>
            <option value="">เลือกประเภทห้อง</option>
            {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.name} · ฿{Number(rt.base_rate || 0).toLocaleString()}</option>)}
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Step 3: ข้อมูลแขก + ยืนยัน</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="ชื่อ" value={firstName} onChange={(e:any) => setFirstName(e.target.value)} />
            <Input label="นามสกุล" value={lastName} onChange={(e:any) => setLastName(e.target.value)} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="เบอร์โทร" value={phone} onChange={(e:any) => setPhone(e.target.value)} />
            <Input label="อีเมล" type="email" value={email} onChange={(e:any) => setEmail(e.target.value)} />
          </div>
          <Button onClick={createWalkIn} disabled={submitting}>{submitting ? 'กำลังสร้าง...' : 'ยืนยัน Walk-in'}</Button>
        </CardContent>
      </Card>
    </main>
  );
}
