'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Staff {
  id: string;
  full_name: string;
  role?: string;
}

interface Props {
  hotelId: string;
  staff: Staff[];
}

const CATEGORIES = [
  { value: 'fire_safety',      label: 'ความปลอดภัยอัคคีภัย' },
  { value: 'first_aid',        label: 'ปฐมพยาบาล' },
  { value: 'food_hygiene',     label: 'สุขลักษณะอาหาร' },
  { value: 'customer_service', label: 'บริการลูกค้า' },
  { value: 'housekeeping',     label: 'แม่บ้าน' },
  { value: 'front_office',     label: 'แผนกต้อนรับ' },
  { value: 'it_security',      label: 'ความปลอดภัย IT' },
  { value: 'compliance',       label: 'กฎหมายและข้อบังคับ' },
  { value: 'leadership',       label: 'ภาวะผู้นำ' },
  { value: 'other',            label: 'อื่นๆ' },
];

const selectCls = cn(
  'flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-9 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

export function TrainingFormClient({ hotelId: _hotelId, staff }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [staffId, setStaffId]       = useState('');
  const [courseName, setCourseName] = useState('');
  const [category, setCategory]     = useState('');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [hours, setHours]           = useState('');
  const [trainer, setTrainer]       = useState('');
  const [passed, setPassed]         = useState('');

  function resetForm() {
    setStaffId(''); setCourseName(''); setCategory('');
    setStartDate(''); setEndDate(''); setHours('');
    setTrainer(''); setPassed(''); setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId || !courseName || !category || !startDate) {
      setError('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/hr/training', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staff_id:    staffId,
            course_name: courseName,
            category,
            start_date:  startDate,
            end_date:    endDate  || null,
            hours:       hours    ? Number(hours) : null,
            trainer:     trainer  || null,
            passed:      passed === 'true' ? true : passed === 'false' ? false : null,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? 'เกิดข้อผิดพลาด');
          return;
        }
        setOpen(false);
        resetForm();
        router.refresh();
      } catch {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> เพิ่มบันทึกการอบรม
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>บันทึกการอบรม / ใบรับรองใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Staff */}
          <div className="space-y-1">
            <label className="text-sm font-medium">พนักงาน <span className="text-red-500">*</span></label>
            <select className={selectCls} value={staffId} onChange={e => setStaffId(e.target.value)}>
              <option value="">เลือกพนักงาน</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          {/* Course name */}
          <div className="space-y-1">
            <label className="text-sm font-medium">ชื่อหลักสูตร <span className="text-red-500">*</span></label>
            <Input value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="เช่น ดับเพลิงเบื้องต้น" />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-sm font-medium">หมวดหมู่ <span className="text-red-500">*</span></label>
            <select className={selectCls} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">เลือกหมวดหมู่</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">วันที่เริ่ม <span className="text-red-500">*</span></label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">วันหมดอายุ</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Hours + Trainer */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">ชั่วโมง</label>
              <Input type="number" min="0" step="0.5" value={hours} onChange={e => setHours(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">วิทยากร</label>
              <Input value={trainer} onChange={e => setTrainer(e.target.value)} placeholder="ชื่อวิทยากร" />
            </div>
          </div>

          {/* Result */}
          <div className="space-y-1">
            <label className="text-sm font-medium">ผลการอบรม</label>
            <select className={selectCls} value={passed} onChange={e => setPassed(e.target.value)}>
              <option value="">รอผล</option>
              <option value="true">ผ่าน</option>
              <option value="false">ไม่ผ่าน</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> กำลังบันทึก…</> : 'บันทึก'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
