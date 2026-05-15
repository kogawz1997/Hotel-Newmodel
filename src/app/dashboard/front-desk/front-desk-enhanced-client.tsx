'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  KeyRound, ArrowUpCircle, CreditCard, X, Plus,
  RefreshCw, Clock, Wallet, CheckCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring',
        props.className
      )}
      {...props}
    />
  );
}

function Sel({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      {...props}
    >
      {children}
    </select>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground mb-1">
      {children}
    </label>
  );
}

function Btn({
  children,
  variant = 'primary',
  disabled,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger';
}) {
  const base =
    'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60';
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline:
      'border border-border text-foreground hover:bg-secondary',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      className={cn(base, variants[variant], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type KeycardEntry = {
  id: string;
  reservation_id: string;
  room_no: string;
  action: 'issue' | 'reissue' | 'deactivate';
  reason?: string;
  issued_at: string;
  issued_by_user?: { full_name: string };
};

type AvailableRoom = { id: string; room_number: string; floor?: string };

type CashierSession = {
  id: string;
  status: string;
  opening_balance: number;
  closing_balance?: number;
  opened_at: string;
  closed_at?: string;
  notes?: string;
  cashier?: { full_name: string };
};

// ─── ACTION BADGE COLOURS ────────────────────────────────────────────────────

const ACTION_BADGE: Record<string, string> = {
  issue:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  reissue:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  deactivate: 'bg-red-100 text-red-700 border-red-200',
};
const ACTION_LABEL: Record<string, string> = {
  issue: 'ออก', reissue: 'ออกใหม่', deactivate: 'ยกเลิก',
};

// ─── TAB 1: KEYCARD ───────────────────────────────────────────────────────────

function KeycardTab({ hotelId }: { hotelId: string }) {
  const supabase = createClient();
  const [logs, setLogs] = useState<KeycardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    room_no: '',
    reservation_id: '',
    action: 'issue' as 'issue' | 'reissue' | 'deactivate',
    reason: '',
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('keycard_log')
      .select('*, issued_by_user:issued_by(full_name)')
      .eq('hotel_id', hotelId)
      .gte('issued_at', `${today}T00:00:00.000Z`)
      .lte('issued_at', `${today}T23:59:59.999Z`)
      .order('issued_at', { ascending: false })
      .limit(100);
    setLogs((data as KeycardEntry[]) ?? []);
    setLoading(false);
  }, [hotelId, supabase]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  async function handleSubmit() {
    if (!form.room_no || !form.reservation_id) {
      toast.error('กรุณากรอกหมายเลขห้องและรหัสการจอง');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/front-desk/keycard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success('บันทึก Keycard แล้ว');
      setShowModal(false);
      setForm({ room_no: '', reservation_id: '', action: 'issue', reason: '' });
      fetchLogs();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || 'เกิดข้อผิดพลาด');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">รายการ Keycard วันนี้</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            title="รีเฟรช"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
          <Btn onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> ออก Keycard
          </Btn>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">กำลังโหลด...</p>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <KeyRound className="h-10 w-10 opacity-20" />
          <p className="text-sm">ยังไม่มีรายการ Keycard วันนี้</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['ห้อง', 'การดำเนินการ', 'รหัสการจอง', 'โดย', 'เวลา', 'หมายเหตุ'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-3 py-2.5 font-medium">{log.room_no}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        'inline-flex text-xs px-2 py-0.5 rounded-full border font-medium',
                        ACTION_BADGE[log.action]
                      )}
                    >
                      {ACTION_LABEL[log.action]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {log.reservation_id.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {log.issued_by_user?.full_name || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.issued_at), 'HH:mm', { locale: th })}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">
                    {log.reason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="ออก Keycard" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <Label>หมายเลขห้อง *</Label>
              <Input
                value={form.room_no}
                onChange={(e) => setForm((f) => ({ ...f, room_no: e.target.value }))}
                placeholder="เช่น 101"
              />
            </div>
            <div>
              <Label>รหัสการจอง (reservation_id) *</Label>
              <Input
                value={form.reservation_id}
                onChange={(e) => setForm((f) => ({ ...f, reservation_id: e.target.value }))}
                placeholder="UUID ของการจอง"
              />
            </div>
            <div>
              <Label>การดำเนินการ</Label>
              <Sel
                value={form.action}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    action: e.target.value as typeof form.action,
                  }))
                }
              >
                <option value="issue">ออก (issue)</option>
                <option value="reissue">ออกใหม่ (reissue)</option>
                <option value="deactivate">ยกเลิก (deactivate)</option>
              </Sel>
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <Input
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="เหตุผล (ถ้ามี)"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="outline" onClick={() => setShowModal(false)}>
                ยกเลิก
              </Btn>
              <Btn onClick={handleSubmit} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB 2: ROOM UPGRADE ──────────────────────────────────────────────────────

function RoomUpgradeTab({ hotelId }: { hotelId: string }) {
  const supabase = createClient();
  const [reservationId, setReservationId] = useState('');
  const [reservation, setReservation] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [form, setForm] = useState({
    new_room_id: '',
    reason: '',
    upgrade_charge: '',
  });
  const [saving, setSaving] = useState(false);

  async function searchReservation() {
    if (!reservationId.trim()) return;
    setSearchLoading(true);
    setReservation(null);
    const { data } = await supabase
      .from('reservations')
      .select(
        'id, reservation_code, status, room_id, guests(first_name, last_name), rooms(id, room_number)'
      )
      .eq('hotel_id', hotelId)
      .or(`id.eq.${reservationId},reservation_code.ilike.%${reservationId}%`)
      .limit(1)
      .single();
    setSearchLoading(false);
    if (data) {
      setReservation(data);
    } else {
      toast.error('ไม่พบการจองนี้');
    }
  }

  useEffect(() => {
    if (!hotelId) return;
    supabase
      .from('rooms')
      .select('id, room_number, floor')
      .eq('hotel_id', hotelId)
      .eq('status', 'available')
      .order('room_number')
      .limit(100)
      .then(({ data }) => setAvailableRooms((data as AvailableRoom[]) ?? []));
  }, [hotelId, supabase]);

  async function handleUpgrade() {
    if (!reservation || !form.new_room_id || !form.reason) {
      toast.error('กรุณาเลือกห้องใหม่และระบุเหตุผล');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/front-desk/room-upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservation_id: reservation.id,
        new_room_id: form.new_room_id,
        reason: form.reason,
        upgrade_charge: form.upgrade_charge ? Number(form.upgrade_charge) : undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      toast.success(
        `อัปเกรดสำเร็จ: ${d.upgrade.old_room.room_number} → ${d.upgrade.new_room.room_number}`
      );
      setReservation(null);
      setReservationId('');
      setForm({ new_room_id: '', reason: '', upgrade_charge: '' });
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || 'เกิดข้อผิดพลาด');
    }
  }

  const guest = reservation
    ? Array.isArray(reservation.guests)
      ? reservation.guests[0]
      : reservation.guests
    : null;
  const currentRoom = reservation
    ? Array.isArray(reservation.rooms)
      ? reservation.rooms[0]
      : reservation.rooms
    : null;

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="font-semibold text-foreground">อัปเกรดห้องพัก</h2>

      {/* Search */}
      <div className="space-y-2">
        <Label>ค้นหาการจอง (ID หรือรหัสการจอง)</Label>
        <div className="flex gap-2">
          <Input
            value={reservationId}
            onChange={(e) => setReservationId(e.target.value)}
            placeholder="เช่น RES-20240101 หรือ UUID"
            onKeyDown={(e) => e.key === 'Enter' && searchReservation()}
          />
          <Btn onClick={searchReservation} disabled={searchLoading}>
            {searchLoading ? '...' : 'ค้นหา'}
          </Btn>
        </div>
      </div>

      {/* Reservation details */}
      {reservation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
          <p className="font-medium text-blue-900">
            {guest?.first_name} {guest?.last_name || ''}
          </p>
          <p className="text-sm text-blue-700">
            รหัสจอง: {reservation.reservation_code} · สถานะ: {reservation.status}
          </p>
          <p className="text-sm text-blue-700">
            ห้องปัจจุบัน:{' '}
            <span className="font-semibold">{currentRoom?.room_number || '—'}</span>
          </p>
        </div>
      )}

      {/* Upgrade form */}
      {reservation && (
        <div className="space-y-4">
          <div>
            <Label>ห้องใหม่ (ห้องที่ว่าง) *</Label>
            <Sel
              value={form.new_room_id}
              onChange={(e) => setForm((f) => ({ ...f, new_room_id: e.target.value }))}
            >
              <option value="">-- เลือกห้อง --</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  ห้อง {r.room_number}
                  {r.floor ? ` (ชั้น ${r.floor})` : ''}
                </option>
              ))}
            </Sel>
            {availableRooms.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">ไม่มีห้องว่างขณะนี้</p>
            )}
          </div>
          <div>
            <Label>เหตุผล *</Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="เช่น ห้องชำรุด, อัปเกรด VIP"
            />
          </div>
          <div>
            <Label>ค่าอัปเกรด (บาท, ถ้ามี)</Label>
            <Input
              type="number"
              min="0"
              value={form.upgrade_charge}
              onChange={(e) => setForm((f) => ({ ...f, upgrade_charge: e.target.value }))}
              placeholder="0"
            />
          </div>
          <Btn onClick={handleUpgrade} disabled={saving} className="w-full justify-center">
            <ArrowUpCircle className="h-4 w-4" />
            {saving ? 'กำลังอัปเกรด...' : 'ยืนยันอัปเกรด'}
          </Btn>
        </div>
      )}
    </div>
  );
}

// ─── TAB 3: CASHIER ───────────────────────────────────────────────────────────

function CashierTab({ hotelId }: { hotelId: string }) {
  const supabase = createClient();
  const [sessions, setSessions] = useState<CashierSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CashierSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [openForm, setOpenForm] = useState({ opening_balance: '', notes: '' });
  const [closeForm, setCloseForm] = useState({
    closing_balance: '',
    cash_breakdown: '',
    notes: '',
  });

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('cashier_sessions')
      .select('*, cashier:opened_by(full_name)')
      .eq('hotel_id', hotelId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(10);
    setSessions((data as CashierSession[]) ?? []);
    setLoading(false);
  }, [hotelId, supabase]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  async function handleOpenSession() {
    setSaving(true);
    const res = await fetch('/api/front-desk/cashier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'open',
        opening_balance: Number(openForm.opening_balance) || 0,
        notes: openForm.notes || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success('เปิดกะสำเร็จ');
      setShowOpen(false);
      setOpenForm({ opening_balance: '', notes: '' });
      fetchSessions();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || 'เกิดข้อผิดพลาด');
    }
  }

  async function handleCloseSession() {
    if (!selectedSession) return;
    setSaving(true);
    const res = await fetch('/api/front-desk/cashier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'close',
        session_id: selectedSession.id,
        closing_balance: Number(closeForm.closing_balance) || 0,
        cash_breakdown: closeForm.cash_breakdown || null,
        notes: closeForm.notes || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success('ปิดกะสำเร็จ');
      setShowClose(false);
      setSelectedSession(null);
      setCloseForm({ closing_balance: '', cash_breakdown: '', notes: '' });
      fetchSessions();
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || 'เกิดข้อผิดพลาด');
    }
  }

  const thaiMoney = (n: number) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Cashier Sessions</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchSessions}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
          <Btn onClick={() => setShowOpen(true)}>
            <Plus className="h-4 w-4" /> เปิดกะ
          </Btn>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">กำลังโหลด...</p>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-muted-foreground">
          <Wallet className="h-12 w-12 opacity-20" />
          <p className="text-sm">ไม่มีกะที่เปิดอยู่</p>
          <Btn onClick={() => setShowOpen(true)}>
            <Plus className="h-4 w-4" /> เปิดกะใหม่
          </Btn>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">
                    <CheckCircle className="h-3 w-3" /> เปิดอยู่
                  </span>
                  <span className="text-sm font-medium">
                    {s.cashier?.full_name || 'พนักงาน'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  เปิดเมื่อ {format(new Date(s.opened_at), 'HH:mm · d MMM', { locale: th })}
                </p>
                <p className="text-sm">
                  ยอดเปิด:{' '}
                  <span className="font-medium">{thaiMoney(s.opening_balance ?? 0)}</span>
                </p>
                {s.notes && (
                  <p className="text-xs text-muted-foreground">{s.notes}</p>
                )}
              </div>
              <Btn
                variant="outline"
                onClick={() => {
                  setSelectedSession(s);
                  setShowClose(true);
                }}
              >
                ปิดกะ
              </Btn>
            </div>
          ))}
        </div>
      )}

      {/* Open session modal */}
      {showOpen && (
        <Modal title="เปิดกะ Cashier" onClose={() => setShowOpen(false)}>
          <div className="space-y-4">
            <div>
              <Label>ยอดเงินเปิดกะ (บาท)</Label>
              <Input
                type="number"
                min="0"
                value={openForm.opening_balance}
                onChange={(e) =>
                  setOpenForm((f) => ({ ...f, opening_balance: e.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <Input
                value={openForm.notes}
                onChange={(e) => setOpenForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="หมายเหตุ (ถ้ามี)"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="outline" onClick={() => setShowOpen(false)}>
                ยกเลิก
              </Btn>
              <Btn onClick={handleOpenSession} disabled={saving}>
                {saving ? 'กำลังเปิด...' : 'เปิดกะ'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Close session modal */}
      {showClose && selectedSession && (
        <Modal
          title={`ปิดกะ — ${selectedSession.cashier?.full_name || 'พนักงาน'}`}
          onClose={() => {
            setShowClose(false);
            setSelectedSession(null);
          }}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ยอดเปิดกะ: {thaiMoney(selectedSession.opening_balance ?? 0)}
            </p>
            <div>
              <Label>ยอดเงินปิดกะ (บาท) *</Label>
              <Input
                type="number"
                min="0"
                value={closeForm.closing_balance}
                onChange={(e) =>
                  setCloseForm((f) => ({ ...f, closing_balance: e.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label>รายละเอียดเงินสด (Cash Breakdown)</Label>
              <textarea
                rows={3}
                value={closeForm.cash_breakdown}
                onChange={(e) =>
                  setCloseForm((f) => ({ ...f, cash_breakdown: e.target.value }))
                }
                placeholder="เช่น ธนบัตร 1000 x 5, 500 x 2, เหรียญ 20 x 10..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <Input
                value={closeForm.notes}
                onChange={(e) =>
                  setCloseForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="หมายเหตุ (ถ้ามี)"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Btn
                variant="outline"
                onClick={() => {
                  setShowClose(false);
                  setSelectedSession(null);
                }}
              >
                ยกเลิก
              </Btn>
              <Btn variant="danger" onClick={handleCloseSession} disabled={saving}>
                {saving ? 'กำลังปิด...' : 'ยืนยันปิดกะ'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const TABS = [
  { key: 'keycard',  label: 'Keycard',      icon: KeyRound },
  { key: 'upgrade',  label: 'อัปเกรดห้อง',  icon: ArrowUpCircle },
  { key: 'cashier',  label: 'Cashier',       icon: CreditCard },
] as const;

type TabKey = typeof TABS[number]['key'];

export function FrontDeskEnhancedClient({ hotelId }: { hotelId: string }) {
  const [tab, setTab] = useState<TabKey>('keycard');

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Front Desk — Extended</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Keycard · อัปเกรดห้อง · Cashier
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'keycard'  && <KeycardTab hotelId={hotelId} />}
      {tab === 'upgrade'  && <RoomUpgradeTab hotelId={hotelId} />}
      {tab === 'cashier'  && <CashierTab hotelId={hotelId} />}
    </div>
  );
}
