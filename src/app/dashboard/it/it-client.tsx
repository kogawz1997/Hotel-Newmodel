'use client';

import { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Monitor, Ticket, Activity, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { th } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRef {
  id: string;
  full_name: string | null;
}

interface SupportTicket {
  id: string;
  hotel_id: string;
  requester_id: string;
  category: 'hardware' | 'software' | 'network' | 'printer' | 'access' | 'other';
  title: string;
  description: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  requester: UserRef | null;
  assignee: UserRef | null;
}

interface Device {
  id: string;
  hotel_id: string;
  name: string;
  type: 'pos' | 'printer' | 'tv' | 'phone' | 'router' | 'camera' | 'tablet' | 'other';
  model: string | null;
  serial_no: string | null;
  location: string | null;
  ip_address: string | null;
  mac_address: string | null;
  status: 'online' | 'offline' | 'faulty' | 'maintenance';
  last_ping: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  hotelId: string;
  userId: string;
  initialTickets: SupportTicket[];
  initialDevices: Device[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TH: Record<string, string> = {
  hardware: 'ฮาร์ดแวร์',
  software: 'ซอฟต์แวร์',
  network: 'เครือข่าย',
  printer: 'เครื่องพิมพ์',
  access: 'สิทธิ์เข้าถึง',
  other: 'อื่นๆ',
};

const CATEGORY_COLOR: Record<string, string> = {
  hardware: 'bg-orange-100 text-orange-700',
  software: 'bg-purple-100 text-purple-700',
  network: 'bg-blue-100 text-blue-700',
  printer: 'bg-slate-100 text-slate-700',
  access: 'bg-yellow-100 text-yellow-700',
  other: 'bg-secondary text-muted-foreground',
};

const PRIORITY_CFG: Record<string, { label: string; className: string }> = {
  low: { label: 'ต่ำ', className: 'bg-slate-100 text-slate-600' },
  normal: { label: 'ปกติ', className: 'bg-sky-100 text-sky-700' },
  high: { label: 'สูง', className: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'เร่งด่วน', className: 'bg-red-100 text-red-700' },
};

const STATUS_CFG: Record<string, { label: string; className: string }> = {
  open: { label: 'เปิด', className: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'กำลังดำเนินการ', className: 'bg-sky-100 text-sky-700' },
  resolved: { label: 'แก้ไขแล้ว', className: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'ปิด', className: 'bg-secondary text-muted-foreground' },
};

const DEVICE_STATUS_COLOR: Record<string, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-red-500',
  faulty: 'bg-orange-400',
  maintenance: 'bg-slate-400',
};

const DEVICE_STATUS_TH: Record<string, string> = {
  online: 'ออนไลน์',
  offline: 'ออฟไลน์',
  faulty: 'ขัดข้อง',
  maintenance: 'บำรุงรักษา',
};

const DEVICE_TYPE_TH: Record<string, string> = {
  pos: 'POS',
  printer: 'เครื่องพิมพ์',
  tv: 'โทรทัศน์',
  phone: 'โทรศัพท์',
  router: 'เราเตอร์',
  camera: 'กล้อง',
  tablet: 'แท็บเล็ต',
  other: 'อื่นๆ',
};

const SYSTEM_SERVICES = [
  { name: 'API Server', key: 'api' },
  { name: 'Database', key: 'database' },
  { name: 'Webhooks', key: 'webhooks' },
  { name: 'LINE Messaging', key: 'line' },
  { name: 'WhatsApp', key: 'whatsapp' },
  { name: 'OTA Integration', key: 'ota' },
];

const DEFAULT_DEVICE_FORM = {
  name: '',
  type: 'other' as Device['type'],
  model: '',
  serial_no: '',
  location: '',
  ip_address: '',
};

const TABS = [
  { key: 'tickets', label: 'ตั๋วซัพพอร์ต', icon: Ticket },
  { key: 'devices', label: 'อุปกรณ์', icon: Monitor },
  { key: 'health', label: 'สุขภาพระบบ', icon: Activity },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ITClient({ hotelId, userId, initialTickets, initialDevices }: Props) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'devices' | 'health'>('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [saving, setSaving] = useState(false);

  // Add device modal
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [deviceForm, setDeviceForm] = useState(DEFAULT_DEVICE_FORM);

  // Resolve ticket modal
  const [resolveModal, setResolveModal] = useState<SupportTicket | null>(null);
  const [resolution, setResolution] = useState('');

  // Stats
  const openTickets = useMemo(() => tickets.filter((t) => t.status === 'open').length, [tickets]);
  const onlineDevices = useMemo(() => devices.filter((d) => d.status === 'online').length, [devices]);
  const faultyDevices = useMemo(() => devices.filter((d) => d.status === 'faulty').length, [devices]);

  // ─── Ticket Actions ────────────────────────────────────────────────────────

  async function claimTicket(ticket: SupportTicket) {
    setSaving(true);
    const res = await fetch(`/api/it/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign', assigned_to: userId }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('รับงานไม่สำเร็จ'); return; }
    const updated = await res.json();
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, ...updated } : t)));
    toast.success('รับงานแล้ว!');
  }

  async function resolveTicket() {
    if (!resolveModal) return;
    if (!resolution.trim()) { toast.error('กรุณากรอกวิธีแก้ไข'); return; }
    setSaving(true);
    const res = await fetch(`/api/it/tickets/${resolveModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve', resolution }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('บันทึกไม่สำเร็จ'); return; }
    const updated = await res.json();
    setTickets((prev) => prev.map((t) => (t.id === resolveModal.id ? { ...t, ...updated } : t)));
    setResolveModal(null);
    setResolution('');
    toast.success('ปิดตั๋วเรียบร้อย!');
  }

  // ─── Device Actions ────────────────────────────────────────────────────────

  async function addDevice() {
    if (!deviceForm.name.trim()) { toast.error('กรอกชื่ออุปกรณ์ก่อน'); return; }
    setSaving(true);
    const res = await fetch('/api/it/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceForm),
    });
    setSaving(false);
    if (!res.ok) { toast.error('เพิ่มอุปกรณ์ไม่สำเร็จ'); return; }
    const newDevice = await res.json();
    setDevices((prev) => [...prev, newDevice].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAddDevice(false);
    setDeviceForm(DEFAULT_DEVICE_FORM);
    toast.success('เพิ่มอุปกรณ์แล้ว');
  }

  async function updateDeviceStatus(device: Device, status: Device['status']) {
    const res = await fetch('/api/it/devices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: device.id, status }),
    });
    if (!res.ok) { toast.error('อัพเดตไม่สำเร็จ'); return; }
    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, status } : d))
    );
    toast.success('อัพเดตสถานะอุปกรณ์แล้ว');
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="container max-w-6xl py-8 animate-fade-in">
      <TopBar
        title="IT Support"
        description="จัดการตั๋วซัพพอร์ต อุปกรณ์ และสุขภาพระบบ"
        action={
          activeTab === 'devices' ? (
            <Button size="sm" onClick={() => setShowAddDevice(true)}>
              <Plus className="h-3.5 w-3.5" />
              เพิ่มอุปกรณ์
            </Button>
          ) : undefined
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{openTickets}</div>
          <div className="text-xs text-muted-foreground mt-0.5">ตั๋วเปิดอยู่</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{onlineDevices}</div>
          <div className="text-xs text-muted-foreground mt-0.5">อุปกรณ์ออนไลน์</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className={cn('text-2xl font-bold', faultyDevices > 0 ? 'text-red-600' : 'text-slate-400')}>
            {faultyDevices}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">อุปกรณ์ขัดข้อง</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mt-6 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tickets Tab ── */}
      {activeTab === 'tickets' && (
        <div className="mt-4 rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-4 py-3 font-medium">หมวดหมู่</th>
                <th className="text-left px-4 py-3 font-medium">หัวข้อ</th>
                <th className="text-left px-4 py-3 font-medium">ผู้แจ้ง</th>
                <th className="text-left px-4 py-3 font-medium">ความสำคัญ</th>
                <th className="text-left px-4 py-3 font-medium">สถานะ</th>
                <th className="text-left px-4 py-3 font-medium">ผู้รับผิดชอบ</th>
                <th className="text-left px-4 py-3 font-medium">วันที่</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    ไม่มีตั๋วซัพพอร์ต
                  </td>
                </tr>
              )}
              {tickets.map((ticket) => {
                const pCfg = PRIORITY_CFG[ticket.priority] ?? PRIORITY_CFG.normal;
                const sCfg = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
                return (
                  <tr
                    key={ticket.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          CATEGORY_COLOR[ticket.category] ?? CATEGORY_COLOR.other
                        )}
                      >
                        {CATEGORY_TH[ticket.category] ?? ticket.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[200px]">
                      <div className="truncate">{ticket.title}</div>
                      {ticket.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {ticket.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ticket.requester?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', pCfg.className)}>
                        {pCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', sCfg.className)}>
                        {sCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ticket.assignee?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(new Date(ticket.created_at), 'd MMM yy', { locale: th })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {ticket.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving}
                            onClick={() => claimTicket(ticket)}
                          >
                            รับงาน
                          </Button>
                        )}
                        {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={saving}
                            onClick={() => { setResolveModal(ticket); setResolution(''); }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            แก้ไขแล้ว
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Devices Tab ── */}
      {activeTab === 'devices' && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground text-sm">
              ยังไม่มีอุปกรณ์ — กด "เพิ่มอุปกรณ์" เพื่อเริ่มต้น
            </div>
          )}
          {devices.map((device) => (
            <Card key={device.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Status dot */}
                      <span
                        className={cn(
                          'w-2.5 h-2.5 rounded-full shrink-0',
                          DEVICE_STATUS_COLOR[device.status] ?? 'bg-slate-400',
                          device.status === 'online' && 'animate-pulse'
                        )}
                      />
                      <h3 className="font-medium text-sm truncate">{device.name}</h3>
                    </div>

                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        {DEVICE_TYPE_TH[device.type] ?? device.type}
                        {device.model ? ` · ${device.model}` : ''}
                      </p>
                      {device.location && (
                        <p className="text-xs text-muted-foreground">{device.location}</p>
                      )}
                      {device.ip_address && (
                        <p className="text-xs font-mono text-muted-foreground">
                          {device.ip_address}
                        </p>
                      )}
                      {device.last_ping && (
                        <p className="text-xs text-muted-foreground">
                          ping:{' '}
                          {formatDistanceToNow(new Date(device.last_ping), {
                            addSuffix: true,
                            locale: th,
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                      device.status === 'online'
                        ? 'bg-emerald-100 text-emerald-700'
                        : device.status === 'offline'
                        ? 'bg-red-100 text-red-700'
                        : device.status === 'faulty'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {DEVICE_STATUS_TH[device.status]}
                  </span>
                </div>

                {/* Quick status buttons */}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {(['online', 'offline', 'faulty', 'maintenance'] as Device['status'][])
                    .filter((s) => s !== device.status)
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => updateDeviceStatus(device, s)}
                        className="text-xs px-2 py-0.5 rounded border border-border hover:bg-secondary/50 transition-colors text-muted-foreground"
                      >
                        → {DEVICE_STATUS_TH[s]}
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── System Health Tab ── */}
      {activeTab === 'health' && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEM_SERVICES.map((svc) => (
            <div
              key={svc.key}
              className="rounded-xl border border-border bg-card p-5 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-sm">{svc.name}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600 font-medium">ปกติ</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Uptime</div>
                <div className="text-sm font-semibold text-emerald-600">99.9%</div>
              </div>
            </div>
          ))}

          {/* Network summary card */}
          <div className="rounded-xl border border-border bg-card p-5 sm:col-span-2 lg:col-span-3">
            <h3 className="font-semibold text-sm mb-3">สรุปภาพรวมระบบ</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {devices.filter((d) => d.status === 'online').length}
                </div>
                <div className="text-xs text-muted-foreground">อุปกรณ์ออนไลน์</div>
              </div>
              <div>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    devices.filter((d) => d.status === 'offline' || d.status === 'faulty').length > 0
                      ? 'text-red-600'
                      : 'text-slate-400'
                  )}
                >
                  {devices.filter((d) => d.status === 'offline' || d.status === 'faulty').length}
                </div>
                <div className="text-xs text-muted-foreground">อุปกรณ์มีปัญหา</div>
              </div>
              <div>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    openTickets > 0 ? 'text-amber-600' : 'text-slate-400'
                  )}
                >
                  {openTickets}
                </div>
                <div className="text-xs text-muted-foreground">ตั๋วค้างแก้ไข</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Resolve Ticket Modal ── */}
      <Dialog
        open={!!resolveModal}
        onOpenChange={(o) => { if (!o) { setResolveModal(null); setResolution(''); } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>บันทึกการแก้ไข</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {resolveModal && (
              <p className="text-sm font-medium text-muted-foreground">
                {resolveModal.title}
              </p>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">
                วิธีแก้ไขและผลลัพธ์ *
              </label>
              <textarea
                rows={4}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none"
                placeholder="อธิบายขั้นตอนที่ดำเนินการและผลการแก้ไข..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setResolveModal(null); setResolution(''); }}
            >
              ยกเลิก
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={resolveTicket}
              disabled={saving}
            >
              <CheckCircle2 className="h-4 w-4" />
              ยืนยันแก้ไขแล้ว
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Device Modal ── */}
      <Dialog
        open={showAddDevice}
        onOpenChange={(o) => { if (!o) { setShowAddDevice(false); setDeviceForm(DEFAULT_DEVICE_FORM); } }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มอุปกรณ์ใหม่</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">ชื่ออุปกรณ์ *</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={deviceForm.name}
                onChange={(e) => setDeviceForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="เช่น POS Counter A"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ประเภท</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={deviceForm.type}
                onChange={(e) =>
                  setDeviceForm((p) => ({ ...p, type: e.target.value as Device['type'] }))
                }
              >
                {Object.entries(DEVICE_TYPE_TH).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">รุ่น</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={deviceForm.model}
                onChange={(e) => setDeviceForm((p) => ({ ...p, model: e.target.value }))}
                placeholder="HP LaserJet Pro"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">หมายเลขซีเรียล</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={deviceForm.serial_no}
                onChange={(e) => setDeviceForm((p) => ({ ...p, serial_no: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">สถานที่ติดตั้ง</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={deviceForm.location}
                onChange={(e) => setDeviceForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="ห้องฟร้อนท์ / ชั้น 1"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">IP Address</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background font-mono"
                value={deviceForm.ip_address}
                onChange={(e) => setDeviceForm((p) => ({ ...p, ip_address: e.target.value }))}
                placeholder="192.168.1.100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowAddDevice(false); setDeviceForm(DEFAULT_DEVICE_FORM); }}
            >
              ยกเลิก
            </Button>
            <Button onClick={addDevice} disabled={saving}>
              เพิ่มอุปกรณ์
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
