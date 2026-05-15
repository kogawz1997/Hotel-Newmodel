'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, X, Clock, User, Flower2, DoorOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type SpaBooking = {
  id: string;
  start_time: string;
  end_time?: string;
  status: string;
  amount?: number;
  notes?: string;
  guest_name?: string;
  treatment_room?: string;
  therapist_name?: string;
  service_id?: string;
  spa_services?: { name: string; duration_min?: number; price?: number } | null;
};

type SpaService = {
  id: string;
  name: string;
  description?: string;
  duration_min: number;
  price: number;
  is_available?: boolean;
  active?: boolean;
};

type SpaStaff = {
  id: string;
  full_name?: string;
  role: string;
  hotel_id: string;
};

type Tab = 'bookings' | 'services' | 'rooms' | 'therapists';

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed:   'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  completed:   'bg-green-100 text-green-700 border-green-200',
  cancelled:   'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending:     'รอยืนยัน',
  confirmed:   'ยืนยันแล้ว',
  in_progress: 'กำลังให้บริการ',
  completed:   'เสร็จสิ้น',
  cancelled:   'ยกเลิก',
};

function fmt(n: number) {
  return '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium', className)}>
      {children}
    </span>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring', className)}
      {...props}
    />
  );
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring', className)}
      {...props}
    >
      {children}
    </select>
  );
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn('w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none', className)}
      {...props}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SpaFullClient({
  hotel,
  profile,
}: {
  hotel: { id: string; name: string };
  profile: { id: string; role: string };
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('bookings');

  // Bookings
  const [bookings, setBookings] = useState<SpaBooking[]>([]);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    guest_name: '', service_id: '', booking_date: '', start_time: '',
    treatment_room: '', therapist_name: '', guest_notes: '',
  });

  // Services
  const [services, setServices] = useState<SpaService[]>([]);
  const [showNewService, setShowNewService] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', duration_min: '60', price: '' });

  // Therapists
  const [spaStaff, setSpaStaff] = useState<SpaStaff[]>([]);
  const [staffBookingCounts, setStaffBookingCounts] = useState<Record<string, number>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const loadBookings = useCallback(async () => {
    const res = await fetch('/api/spa/bookings');
    if (res.ok) {
      const json = await res.json();
      setBookings(json.bookings || []);
    }
  }, []);

  const loadServices = useCallback(async () => {
    const res = await fetch('/api/spa/services');
    if (res.ok) {
      const json = await res.json();
      setServices(json.services || []);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, hotel_id')
      .eq('hotel_id', hotel.id)
      .eq('role', 'spa_staff');
    const staff = (data as SpaStaff[]) || [];
    setSpaStaff(staff);

    // Count today's bookings per therapist
    if (staff.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: todayBookings } = await supabase
        .from('spa_bookings')
        .select('therapist_name')
        .eq('hotel_id', hotel.id)
        .gte('start_time', `${today}T00:00:00`)
        .lt('start_time', `${today}T23:59:59`);
      const counts: Record<string, number> = {};
      (todayBookings || []).forEach((b: any) => {
        if (b.therapist_name) {
          counts[b.therapist_name] = (counts[b.therapist_name] || 0) + 1;
        }
      });
      setStaffBookingCounts(counts);
    }
  }, [hotel.id, supabase]);

  useEffect(() => {
    loadBookings();
    loadServices();
  }, [loadBookings, loadServices]);

  useEffect(() => {
    if (tab === 'therapists') loadStaff();
  }, [tab, loadStaff]);

  // ── Derived: treatment rooms ───────────────────────────────────────────────

  const rooms = (() => {
    const now = new Date();
    const roomMap = new Map<string, { busy: boolean; currentGuest?: string }>();
    bookings.forEach((b) => {
      if (!b.treatment_room) return;
      const start = new Date(b.start_time);
      const end = b.end_time ? new Date(b.end_time) : new Date(start.getTime() + 60 * 60 * 1000);
      if (b.status === 'in_progress' && now >= start && now <= end) {
        roomMap.set(b.treatment_room, { busy: true, currentGuest: b.guest_name });
      } else if (!roomMap.has(b.treatment_room)) {
        roomMap.set(b.treatment_room, { busy: false });
      }
    });
    return Array.from(roomMap.entries()).map(([name, info]) => ({ name, ...info }));
  })();

  // ── Booking actions ────────────────────────────────────────────────────────

  const handleCreateBooking = async () => {
    if (!newBooking.guest_name.trim() || !newBooking.service_id) return;
    setSaving(true);
    setError(null);

    const startISO = newBooking.booking_date && newBooking.start_time
      ? `${newBooking.booking_date}T${newBooking.start_time}:00`
      : new Date().toISOString();

    const res = await fetch('/api/spa/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: newBooking.service_id,
        startTime: startISO,
        guestName: newBooking.guest_name,
        treatmentRoom: newBooking.treatment_room || undefined,
        therapistName: newBooking.therapist_name || undefined,
        notes: newBooking.guest_notes || undefined,
      }),
    });

    if (res.ok) {
      setNewBooking({ guest_name: '', service_id: '', booking_date: '', start_time: '', treatment_room: '', therapist_name: '', guest_notes: '' });
      setShowNewBooking(false);
      await loadBookings();
    } else {
      const j = await res.json();
      setError(j.error || 'เกิดข้อผิดพลาด');
    }
    setSaving(false);
  };

  // ── Service actions ────────────────────────────────────────────────────────

  const handleCreateService = async () => {
    if (!newService.name.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/spa/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newService.name,
        description: newService.description || undefined,
        durationMin: Number(newService.duration_min) || 60,
        price: Number(newService.price) || 0,
      }),
    });
    if (res.ok) {
      setNewService({ name: '', description: '', duration_min: '60', price: '' });
      setShowNewService(false);
      await loadServices();
    } else {
      const j = await res.json();
      setError(j.error || 'เกิดข้อผิดพลาด');
    }
    setSaving(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'bookings' as Tab, label: 'การจอง', icon: Clock },
    { id: 'services' as Tab, label: 'บริการ', icon: Flower2 },
    { id: 'rooms' as Tab, label: 'ห้องบำบัด', icon: DoorOpen },
    { id: 'therapists' as Tab, label: 'นักบำบัด', icon: User },
  ];

  return (
    <main className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Spa & Wellness</h1>
          <p className="text-sm text-muted-foreground mt-1">{hotel.name} · บริการสปาและการนวด</p>
        </div>
        {tab === 'bookings' && (
          <button
            onClick={() => setShowNewBooking(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> สร้างการจอง
          </button>
        )}
        {tab === 'services' && (
          <button
            onClick={() => setShowNewService(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> เพิ่มบริการ
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setError(null); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Bookings Tab ──────────────────────────────────────────────────────── */}
      {tab === 'bookings' && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ยังไม่มีการจอง</p>
            </div>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{b.guest_name || 'แขก'}</p>
                      <Badge className={STATUS_STYLES[b.status] || STATUS_STYLES.pending}>
                        {STATUS_LABELS[b.status] || b.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {b.spa_services?.name || 'บริการ'}
                      {b.treatment_room ? ` · ห้อง ${b.treatment_room}` : ''}
                      {b.therapist_name ? ` · ${b.therapist_name}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      {new Date(b.start_time).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </p>
                    {b.amount !== undefined && b.amount !== null && (
                      <p className="text-xs font-medium mt-0.5">{fmt(b.amount)}</p>
                    )}
                  </div>
                </div>
                {b.notes && <p className="text-xs text-muted-foreground italic">{b.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Services Tab ──────────────────────────────────────────────────────── */}
      {tab === 'services' && (
        <div className="space-y-3">
          {services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Flower2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ยังไม่มีบริการ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">ชื่อบริการ</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">คำอธิบาย</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">ระยะเวลา</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">ราคา</th>
                    <th className="pb-2 font-medium text-muted-foreground">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 pr-3 font-medium">{s.name}</td>
                      <td className="py-3 pr-3 text-muted-foreground max-w-xs truncate">{s.description || '-'}</td>
                      <td className="py-3 pr-3 text-right tabular-nums text-muted-foreground">{s.duration_min} นาที</td>
                      <td className="py-3 pr-3 text-right tabular-nums font-medium">{fmt(s.price)}</td>
                      <td className="py-3">
                        <Badge className={(s.is_available !== false && s.active !== false) ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}>
                          {(s.is_available !== false && s.active !== false) ? 'พร้อมให้บริการ' : 'ปิดให้บริการ'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Rooms Tab ─────────────────────────────────────────────────────────── */}
      {tab === 'rooms' && (
        <div className="space-y-3">
          {rooms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DoorOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ไม่พบข้อมูลห้องบำบัด</p>
              <p className="text-xs mt-1">ข้อมูลจะแสดงเมื่อมีการระบุห้องในการจอง</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rooms.map((room) => (
                <div
                  key={room.name}
                  className={cn(
                    'rounded-xl border p-4 space-y-2',
                    room.busy
                      ? 'border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20'
                      : 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">ห้อง {room.name}</p>
                    <Badge className={room.busy ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-green-100 text-green-700 border-green-200'}>
                      {room.busy ? 'ให้บริการอยู่' : 'ว่าง'}
                    </Badge>
                  </div>
                  {room.busy && room.currentGuest && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> {room.currentGuest}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Therapists Tab ────────────────────────────────────────────────────── */}
      {tab === 'therapists' && (
        <div className="space-y-3">
          {spaStaff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ไม่พบนักบำบัดในระบบ</p>
            </div>
          ) : (
            spaStaff.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm shrink-0">
                  {(s.full_name || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.full_name || '-'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium">{staffBookingCounts[s.full_name || ''] || 0} นัด</p>
                  <p className="text-2xs text-muted-foreground">วันนี้</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── New Booking Modal ─────────────────────────────────────────────────── */}
      {showNewBooking && (
        <Modal title="สร้างการจอง Spa" onClose={() => { setShowNewBooking(false); setError(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ชื่อแขก *</label>
              <Input
                value={newBooking.guest_name}
                onChange={(e) => setNewBooking((r) => ({ ...r, guest_name: e.target.value }))}
                placeholder="ชื่อ-นามสกุล"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">บริการ *</label>
              <Select value={newBooking.service_id} onChange={(e) => setNewBooking((r) => ({ ...r, service_id: e.target.value }))}>
                <option value="">-- เลือกบริการ --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.duration_min} นาที) — {fmt(s.price)}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">วันที่</label>
                <Input type="date" value={newBooking.booking_date} onChange={(e) => setNewBooking((r) => ({ ...r, booking_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">เวลาเริ่ม</label>
                <Input type="time" value={newBooking.start_time} onChange={(e) => setNewBooking((r) => ({ ...r, start_time: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">ห้องบำบัด</label>
              <Input
                value={newBooking.treatment_room}
                onChange={(e) => setNewBooking((r) => ({ ...r, treatment_room: e.target.value }))}
                placeholder="เช่น ห้อง 1, Relaxation Room"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">นักบำบัด</label>
              <Input
                value={newBooking.therapist_name}
                onChange={(e) => setNewBooking((r) => ({ ...r, therapist_name: e.target.value }))}
                placeholder="ชื่อนักบำบัด"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">หมายเหตุ</label>
              <Textarea
                value={newBooking.guest_notes}
                onChange={(e) => setNewBooking((r) => ({ ...r, guest_notes: e.target.value }))}
                rows={2}
                placeholder="ข้อมูลพิเศษ เช่น อาการแพ้, ความต้องการพิเศษ"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowNewBooking(false); setError(null); }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">ยกเลิก</button>
              <button onClick={handleCreateBooking} disabled={saving || !newBooking.guest_name.trim() || !newBooking.service_id} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? 'กำลังบันทึก...' : 'สร้างการจอง'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── New Service Modal ─────────────────────────────────────────────────── */}
      {showNewService && (
        <Modal title="เพิ่มบริการ Spa" onClose={() => { setShowNewService(false); setError(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ชื่อบริการ *</label>
              <Input
                value={newService.name}
                onChange={(e) => setNewService((r) => ({ ...r, name: e.target.value }))}
                placeholder="เช่น Thai Massage, Aromatherapy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">คำอธิบาย</label>
              <Textarea
                value={newService.description}
                onChange={(e) => setNewService((r) => ({ ...r, description: e.target.value }))}
                rows={2}
                placeholder="รายละเอียดบริการ..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">ระยะเวลา (นาที)</label>
                <Input
                  type="number"
                  min="15"
                  step="15"
                  value={newService.duration_min}
                  onChange={(e) => setNewService((r) => ({ ...r, duration_min: e.target.value }))}
                  placeholder="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">ราคา (บาท)</label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={newService.price}
                  onChange={(e) => setNewService((r) => ({ ...r, price: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowNewService(false); setError(null); }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">ยกเลิก</button>
              <button onClick={handleCreateService} disabled={saving || !newService.name.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? 'กำลังบันทึก...' : 'เพิ่มบริการ'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
