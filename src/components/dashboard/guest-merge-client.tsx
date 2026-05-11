'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function GuestMergeClient({ hotelId, guests }: { hotelId: string; guests: any[] }) {
  const [primaryGuestId, setPrimaryGuestId] = useState('');
  const [duplicateGuestId, setDuplicateGuestId] = useState('');
  const [loading, setLoading] = useState(false);

  async function merge() {
    if (!primaryGuestId || !duplicateGuestId) return toast.error('เลือก guest ให้ครบ');
    setLoading(true);
    const res = await fetch('/api/guests/merge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelId, primaryGuestId, duplicateGuestId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(data.error || 'merge ไม่สำเร็จ');
    toast.success('รวมโปรไฟล์แขกเรียบร้อย');
  }

  return (
    <main className="space-y-6 p-6 md:p-8">
      <h1 className="text-2xl font-semibold">Guest Profile Merge</h1>
      <Card>
        <CardHeader><CardTitle>Merge duplicate guest</CardTitle><CardDescription>เลือกโปรไฟล์หลัก และโปรไฟล์ซ้ำที่ต้องการรวม</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Select label="Primary guest (เก็บไว้)" value={primaryGuestId} onChange={(e:any) => setPrimaryGuestId(e.target.value)}>
            <option value="">เลือก guest หลัก</option>
            {guests.map((g:any) => <option key={g.id} value={g.id}>{g.first_name} {g.last_name || ''} · {g.email || g.phone || '-'} · stays {g.total_stays || 0}</option>)}
          </Select>
          <Select label="Duplicate guest (ลบหลังรวม)" value={duplicateGuestId} onChange={(e:any) => setDuplicateGuestId(e.target.value)}>
            <option value="">เลือก guest ซ้ำ</option>
            {guests.map((g:any) => <option key={g.id} value={g.id}>{g.first_name} {g.last_name || ''} · {g.email || g.phone || '-'} · stays {g.total_stays || 0}</option>)}
          </Select>
          <Button onClick={merge} disabled={loading}>{loading ? 'กำลังรวม...' : 'Merge profile'}</Button>
        </CardContent>
      </Card>
    </main>
  );
}
