'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function OnlineCheckInPage() {
  const supabase = createClient();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [arrival, setArrival] = useState('');
  const [requests, setRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!code || !email) return toast.error('กรอกเลขจองและอีเมล');
    setSubmitting(true);
    const { data: booking, error } = await supabase
      .from('reservations')
      .select('id, reservation_code')
      .eq('reservation_code', code.toUpperCase())
      .eq('email', email.toLowerCase())
      .single();
    if (error || !booking) {
      setSubmitting(false);
      return toast.error('ไม่พบข้อมูลการจอง');
    }

    const { error: updateError } = await supabase
      .from('reservations')
      .update({ estimated_arrival: arrival || null, special_requests: requests || null })
      .eq('id', booking.id);
    setSubmitting(false);
    if (updateError) return toast.error(updateError.message);
    toast.success(`Online check-in สำเร็จ (${booking.reservation_code})`);
    setArrival('');
    setRequests('');
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6 md:p-10">
      <div>
        <Link href="/portal/bookings" className="text-sm text-muted-foreground hover:underline">← กลับไป My Bookings</Link>
        <h1 className="mt-3 text-3xl font-semibold">Online Check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">กรอกข้อมูลก่อนถึงโรงแรม เพื่อลดเวลารอคิวหน้าเคาน์เตอร์</p>
      </div>

      <div className="rounded-2xl border p-5 space-y-4">
        <Input label="Reservation Code" value={code} onChange={(e:any) => setCode(e.target.value)} placeholder="เช่น MT123456" />
        <Input label="Email ที่ใช้จอง" type="email" value={email} onChange={(e:any) => setEmail(e.target.value)} />
        <Input label="เวลาเดินทางถึงโดยประมาณ" type="time" value={arrival} onChange={(e:any) => setArrival(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">คำขอพิเศษ</label>
          <textarea className="w-full rounded-xl border bg-background px-3 py-2 text-sm" rows={4} value={requests} onChange={(e) => setRequests(e.target.value)} placeholder="เช่น ขอเตียงเสริม, ห้องชั้นสูง" />
        </div>
        <Button onClick={submit} disabled={submitting}>{submitting ? 'กำลังบันทึก...' : 'ยืนยัน Online Check-in'}</Button>
      </div>
    </main>
  );
}
