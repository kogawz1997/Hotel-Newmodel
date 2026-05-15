'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, X, Check, ShieldCheck, AlertTriangle, UserCheck,
  Clock, LogOut, Eye, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const INCIDENT_TYPES = [
  { value: 'theft', label: 'การขโมย/สูญหาย' },
  { value: 'disturbance', label: 'ความวุ่นวาย/เสียงดัง' },
  { value: 'medical', label: 'เหตุการณ์ทางการแพทย์' },
  { value: 'fire', label: 'ไฟไหม้/ควัน' },
  { value: 'access', label: 'การเข้าพื้นที่โดยไม่ได้รับอนุญาต' },
  { value: 'damage', label: 'ทรัพย์สินเสียหาย' },
  { value: 'other', label: 'อื่นๆ' },
];

const SEVERITY_STYLES: Record<string, string> = {
  low:      'bg-gray-100 text-gray-600 border-gray-200',
  medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};
const SEVERITY_LABELS: Record<string, string> = {
  low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง', critical: 'วิกฤต',
};
const STATUS_STYLES: Record<string, string> = {
  open:         'bg-red-100 text-red-700 border-red-200',
  investigating:'bg-blue-100 text-blue-700 border-blue-200',
  resolved:     'bg-green-100 text-green-700 border-green-200',
  closed:       'bg-gray-100 text-gray-500 border-gray-200',
};
const STATUS_LABELS: Record<string, string> = {
  open: 'เปิดอยู่', investigating: 'กำลังสอบสวน', resolved: 'แก้ไขแล้ว', closed: 'ปิดแล้ว',
};

type Incident = {
  id: string; hotel_id: string; type: string; title: string; description?: string;
  location?: string; severity: string; status: string; action_taken?: string;
  created_at: string; resolved_at?: string;
};
type Visitor = {
  id: string; hotel_id: string; visitor_name: string; visiting_room?: string;
  visiting_guest?: string; purpose?: string; id_type?: string; id_number?: string;
  vehicle_plate?: string; checked_in_at: string; checked_out_at?: string; notes?: string;
};

type Tab = 'incidents' | 'visitors' | 'staff';

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium', className)}>{children}</span>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring', className)} {...props} />;
}
function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring', className)} {...props}>{children}</select>;
}
function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none', className)} {...props} />;
}

export function SecurityClient({ hotel, profile, initialIncidents, initialVisitors, staffOnDuty }: {
  hotel: any; profile: any;
  initialIncidents: Incident[];
  initialVisitors: Visitor[];
  staffOnDuty: any[];
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('incidents');
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [visitors, setVisitors] = useState<Visitor[]>(initialVisitors);
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [showNewVisitor, setShowNewVisitor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('active');

  const [newInc, setNewInc] = useState({
    type: 'other', title: '', description: '', location: '', severity: 'low', action_taken: '',
  });
  const [newVis, setNewVis] = useState({
    visitor_name: '', visiting_room: '', visiting_guest: '', purpose: '',
    id_type: 'id_card', id_number: '', vehicle_plate: '', notes: '',
  });

  const handleCreateIncident = async () => {
    if (!newInc.title.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('security_incidents').insert({
      hotel_id: hotel.id,
      type: newInc.type,
      title: newInc.title,
      description: newInc.description || null,
      location: newInc.location || null,
      severity: newInc.severity,
      action_taken: newInc.action_taken || null,
      status: 'open',
      reported_by: profile?.id,
    }).select().single();
    if (!error && data) {
      setIncidents((prev) => [data as Incident, ...prev]);
      setNewInc({ type: 'other', title: '', description: '', location: '', severity: 'low', action_taken: '' });
      setShowNewIncident(false);
    }
    setSaving(false);
  };

  const handleCreateVisitor = async () => {
    if (!newVis.visitor_name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('visitor_log').insert({
      hotel_id: hotel.id,
      visitor_name: newVis.visitor_name,
      visiting_room: newVis.visiting_room || null,
      visiting_guest: newVis.visiting_guest || null,
      purpose: newVis.purpose || null,
      id_type: newVis.id_type || 'id_card',
      id_number: newVis.id_number || null,
      vehicle_plate: newVis.vehicle_plate || null,
      notes: newVis.notes || null,
      logged_by: profile?.id,
    }).select().single();
    if (!error && data) {
      setVisitors((prev) => [data as Visitor, ...prev]);
      setNewVis({ visitor_name: '', visiting_room: '', visiting_guest: '', purpose: '', id_type: 'id_card', id_number: '', vehicle_plate: '', notes: '' });
      setShowNewVisitor(false);
    }
    setSaving(false);
  };

  const handleIncidentStatus = async (id: string, status: string) => {
    await supabase.from('security_incidents').update({
      status,
      ...(status === 'resolved' ? { resolved_at: new Date().toISOString(), resolved_by: profile?.id } : {}),
    }).eq('id', id);
    setIncidents((prev) => prev.map((inc) => inc.id === id ? { ...inc, status } : inc));
  };

  const handleCheckout = async (id: string) => {
    await supabase.from('visitor_log').update({ checked_out_at: new Date().toISOString() }).eq('id', id);
    setVisitors((prev) => prev.map((v) => v.id === id ? { ...v, checked_out_at: new Date().toISOString() } : v));
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filterStatus === 'active') return ['open', 'investigating'].includes(inc.status);
    if (filterStatus === 'resolved') return ['resolved', 'closed'].includes(inc.status);
    return true;
  });

  const activeVisitors = visitors.filter((v) => !v.checked_out_at);

  const stats = {
    openIncidents: incidents.filter((i) => ['open', 'investigating'].includes(i.status)).length,
    critical: incidents.filter((i) => i.severity === 'critical' && ['open', 'investigating'].includes(i.status)).length,
    activeVisitors: activeVisitors.length,
    resolvedToday: incidents.filter((i) => i.status === 'resolved' && i.resolved_at?.startsWith(new Date().toISOString().slice(0, 10))).length,
  };

  return (
    <main className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Security Center</h1>
          <p className="text-sm text-muted-foreground mt-1">{hotel.name} · {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewVisitor(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            <UserCheck className="h-4 w-4" /> ลงทะเบียนผู้เยี่ยม
          </button>
          <button
            onClick={() => setShowNewIncident(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" /> บันทึกเหตุการณ์
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'เหตุการณ์เปิดอยู่', value: stats.openIncidents, color: stats.openIncidents ? 'bg-red-50 text-red-600 dark:bg-red-950/30' : 'bg-green-50 text-green-600 dark:bg-green-950/30' },
          { label: 'ระดับวิกฤต', value: stats.critical, color: stats.critical ? 'bg-red-100 text-red-700 dark:bg-red-950/40' : 'bg-green-50 text-green-600 dark:bg-green-950/30' },
          { label: 'ผู้เยี่ยมในพื้นที่', value: stats.activeVisitors, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30' },
          { label: 'แก้ไขแล้ววันนี้', value: stats.resolvedToday, color: 'bg-gray-50 text-gray-600 dark:bg-gray-800' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl p-4', s.color)}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: 'incidents', label: 'เหตุการณ์', icon: AlertTriangle, count: stats.openIncidents },
          { id: 'visitors', label: 'ผู้เยี่ยม', icon: UserCheck, count: stats.activeVisitors },
          { id: 'staff', label: 'เจ้าหน้าที่', icon: Users, count: staffOnDuty.length },
        ] as const).map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count > 0 && <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', tab === id ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground')}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Incidents Tab */}
      {tab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {[
              { value: 'active', label: 'กำลังดำเนินการ' },
              { value: 'resolved', label: 'แก้ไขแล้ว' },
              { value: 'all', label: 'ทั้งหมด' },
            ].map((f) => (
              <button key={f.value} onClick={() => setFilterStatus(f.value)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', filterStatus === f.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
                {f.label}
              </button>
            ))}
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">ไม่มีเหตุการณ์ผิดปกติ</p>
            </div>
          ) : filteredIncidents.map((inc) => (
            <div key={inc.id} className={cn('rounded-xl border bg-card p-4 space-y-3', inc.severity === 'critical' ? 'border-red-300 dark:border-red-800' : 'border-border')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{inc.title}</p>
                    <Badge className={SEVERITY_STYLES[inc.severity]}>{SEVERITY_LABELS[inc.severity]}</Badge>
                    <Badge className={STATUS_STYLES[inc.status]}>{STATUS_LABELS[inc.status]}</Badge>
                  </div>
                  {inc.description && <p className="text-xs text-muted-foreground mt-1">{inc.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground capitalize">{inc.type}</span>
                    {inc.location && <span className="text-xs text-muted-foreground">📍 {inc.location}</span>}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(inc.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {inc.action_taken && <p className="text-xs text-muted-foreground mt-1 bg-secondary/50 rounded px-2 py-1">การดำเนินการ: {inc.action_taken}</p>}
                </div>
              </div>
              {['open', 'investigating'].includes(inc.status) && (
                <div className="flex items-center gap-2 border-t border-border pt-2">
                  {inc.status === 'open' && (
                    <button onClick={() => handleIncidentStatus(inc.id, 'investigating')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors">
                      <Eye className="h-3 w-3" /> เริ่มสอบสวน
                    </button>
                  )}
                  <button onClick={() => handleIncidentStatus(inc.id, 'resolved')} className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors">
                    <Check className="h-3 w-3" /> ทำเครื่องหมายแก้ไขแล้ว
                  </button>
                  <button onClick={() => handleIncidentStatus(inc.id, 'closed')} className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors ml-auto">
                    ปิด
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Visitors Tab */}
      {tab === 'visitors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">ผู้เยี่ยมในพื้นที่: <span className="font-semibold text-foreground">{activeVisitors.length} คน</span></p>
          </div>

          {/* Active visitors */}
          {activeVisitors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">อยู่ในพื้นที่ขณะนี้</p>
              {activeVisitors.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm shrink-0">
                    {v.visitor_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{v.visitor_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.visiting_room ? `ห้อง ${v.visiting_room}` : ''}{v.visiting_guest ? ` · หา ${v.visiting_guest}` : ''}{v.purpose ? ` · ${v.purpose}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      เข้า {new Date(v.checked_in_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCheckout(v.id)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Check Out
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* History */}
          {visitors.filter((v) => v.checked_out_at).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ออกไปแล้ว</p>
              {visitors.filter((v) => v.checked_out_at).slice(0, 10).map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-medium text-sm shrink-0">
                    {v.visitor_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-muted-foreground">{v.visitor_name}</p>
                    <p className="text-xs text-muted-foreground">
                      เข้า {new Date(v.checked_in_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} · ออก {new Date(v.checked_out_at!).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge className="bg-gray-100 text-gray-500 border-gray-200 shrink-0">ออกแล้ว</Badge>
                </div>
              ))}
            </div>
          )}

          {visitors.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ยังไม่มีบันทึกผู้เยี่ยมวันนี้</p>
            </div>
          )}
        </div>
      )}

      {/* Staff Tab */}
      {tab === 'staff' && (
        <div className="space-y-2">
          {staffOnDuty.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ไม่พบข้อมูลเจ้าหน้าที่</p>
            </div>
          ) : staffOnDuty.map((s: any) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm shrink-0">
                {(s.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{s.full_name || '-'}</p>
                <p className="text-xs text-muted-foreground capitalize">{s.role} {s.phone ? `· ${s.phone}` : ''}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Incident Modal */}
      {showNewIncident && (
        <Modal title="บันทึกเหตุการณ์" onClose={() => setShowNewIncident(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ประเภทเหตุการณ์</label>
              <Select value={newInc.type} onChange={(e) => setNewInc((r) => ({ ...r, type: e.target.value }))}>
                {INCIDENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">ชื่อเหตุการณ์ *</label>
              <Input value={newInc.title} onChange={(e) => setNewInc((r) => ({ ...r, title: e.target.value }))} placeholder="เช่น พบทรัพย์สินหาย ห้อง 302" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">ระดับความรุนแรง</label>
                <Select value={newInc.severity} onChange={(e) => setNewInc((r) => ({ ...r, severity: e.target.value }))}>
                  <option value="low">ต่ำ</option>
                  <option value="medium">ปานกลาง</option>
                  <option value="high">สูง</option>
                  <option value="critical">วิกฤต</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">สถานที่</label>
                <Input value={newInc.location} onChange={(e) => setNewInc((r) => ({ ...r, location: e.target.value }))} placeholder="เช่น ชั้น 3, ล็อบบี้" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">รายละเอียด</label>
              <Textarea value={newInc.description} onChange={(e) => setNewInc((r) => ({ ...r, description: e.target.value }))} rows={3} placeholder="อธิบายเหตุการณ์โดยละเอียด..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">การดำเนินการเบื้องต้น</label>
              <Textarea value={newInc.action_taken} onChange={(e) => setNewInc((r) => ({ ...r, action_taken: e.target.value }))} rows={2} placeholder="สิ่งที่ดำเนินการไปแล้ว..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNewIncident(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">ยกเลิก</button>
              <button onClick={handleCreateIncident} disabled={saving || !newInc.title.trim()} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                {saving ? 'กำลังบันทึก...' : 'บันทึกเหตุการณ์'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Visitor Modal */}
      {showNewVisitor && (
        <Modal title="ลงทะเบียนผู้เยี่ยม" onClose={() => setShowNewVisitor(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ชื่อผู้เยี่ยม *</label>
              <Input value={newVis.visitor_name} onChange={(e) => setNewVis((r) => ({ ...r, visitor_name: e.target.value }))} placeholder="ชื่อ-นามสกุล" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">ห้องที่มาเยี่ยม</label>
                <Input value={newVis.visiting_room} onChange={(e) => setNewVis((r) => ({ ...r, visiting_room: e.target.value }))} placeholder="101, 202..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">มาหา</label>
                <Input value={newVis.visiting_guest} onChange={(e) => setNewVis((r) => ({ ...r, visiting_guest: e.target.value }))} placeholder="ชื่อแขก" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">วัตถุประสงค์</label>
              <Input value={newVis.purpose} onChange={(e) => setNewVis((r) => ({ ...r, purpose: e.target.value }))} placeholder="เช่น เยี่ยมญาติ, ส่งของ" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">ประเภทบัตร</label>
                <Select value={newVis.id_type} onChange={(e) => setNewVis((r) => ({ ...r, id_type: e.target.value }))}>
                  <option value="id_card">บัตรประชาชน</option>
                  <option value="passport">หนังสือเดินทาง</option>
                  <option value="driving_license">ใบขับขี่</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">เลขที่บัตร</label>
                <Input value={newVis.id_number} onChange={(e) => setNewVis((r) => ({ ...r, id_number: e.target.value }))} placeholder="เลขบัตร" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">ทะเบียนรถ (ถ้ามี)</label>
              <Input value={newVis.vehicle_plate} onChange={(e) => setNewVis((r) => ({ ...r, vehicle_plate: e.target.value }))} placeholder="กข 1234 กรุงเทพ" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNewVisitor(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">ยกเลิก</button>
              <button onClick={handleCreateVisitor} disabled={saving || !newVis.visitor_name.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? 'กำลังบันทึก...' : 'ลงทะเบียน'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
