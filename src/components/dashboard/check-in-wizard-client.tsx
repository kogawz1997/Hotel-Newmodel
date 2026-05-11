'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function CheckInWizardClient({ hotelId, hotelName, reservations, rooms }: { hotelId: string; hotelName: string; reservations: any[]; rooms: any[] }) {
  const [step, setStep] = useState(1);
  const [reservationId, setReservationId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [deposit, setDeposit] = useState('0');
  const [loading, setLoading] = useState(false);

  const selected = reservations.find((r:any) => r.id === reservationId);

  async function completeCheckIn() {
    if (!reservationId || !roomId) return toast.error('เลือก reservation และห้องก่อน');
    setLoading(true);
    const res = await fetch(`/api/reservations/${reservationId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'checked_in', roomId, internalNotes: `Check-in wizard deposit: ${deposit}` }),
    });
    setLoading(false);
    if (!res.ok) return toast.error('เช็คอินไม่สำเร็จ');
    toast.success('เช็คอินสำเร็จ');
    setStep(4);
  }

  return (
    <main className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Check-in Wizard</h1>
        <p className="text-sm text-muted-foreground">Flow: scan/เลือกแขก → assign room → collect deposit → print receipt</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4 text-xs">
        {[1,2,3,4].map((s) => <div key={s} className={`rounded-lg border px-3 py-2 ${step >= s ? 'bg-primary/10 border-primary/30' : ''}`}>Step {s}</div>)}
      </div>

      {step === 1 && <Card><CardHeader><CardTitle>Step 1: เลือกการจอง</CardTitle></CardHeader><CardContent className="space-y-3"><Select label="Reservation" value={reservationId} onChange={(e:any)=>setReservationId(e.target.value)}><option value="">เลือก reservation</option>{reservations.map((r:any)=><option key={r.id} value={r.id}>{r.reservation_code} · {r.guests?.first_name} {r.guests?.last_name || ''}</option>)}</Select><Button onClick={()=>setStep(2)} disabled={!reservationId}>ถัดไป</Button></CardContent></Card>}

      {step === 2 && <Card><CardHeader><CardTitle>Step 2: Assign room</CardTitle><CardDescription>{selected?.room_types?.name || '-'}</CardDescription></CardHeader><CardContent className="space-y-3"><Select label="Room" value={roomId} onChange={(e:any)=>setRoomId(e.target.value)}><option value="">เลือกห้อง</option>{rooms.map((r:any)=><option key={r.id} value={r.id}>ห้อง {r.room_number} ({r.status})</option>)}</Select><div className="flex gap-2"><Button variant="outline" onClick={()=>setStep(1)}>ย้อนกลับ</Button><Button onClick={()=>setStep(3)} disabled={!roomId}>ถัดไป</Button></div></CardContent></Card>}

      {step === 3 && <Card><CardHeader><CardTitle>Step 3: Collect deposit</CardTitle></CardHeader><CardContent className="space-y-3"><Input label="Deposit (THB)" type="number" value={deposit} onChange={(e:any)=>setDeposit(e.target.value)} /><div className="flex gap-2"><Button variant="outline" onClick={()=>setStep(2)}>ย้อนกลับ</Button><Button onClick={completeCheckIn} disabled={loading}>{loading ? 'กำลังบันทึก...' : 'ยืนยัน Check-in'}</Button></div></CardContent></Card>}

      {step === 4 && <Card><CardHeader><CardTitle>Step 4: Print receipt</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm">เช็คอินเสร็จแล้วสำหรับ {selected?.reservation_code}</p><Button onClick={()=>window.open(`/api/invoices/pdf?reservationId=${reservationId}`,'_blank')}>พิมพ์ใบเสร็จ</Button><Button variant="outline" onClick={()=>{setStep(1); setReservationId(''); setRoomId(''); setDeposit('0');}}>เริ่มรายการใหม่</Button></CardContent></Card>}
    </main>
  );
}
