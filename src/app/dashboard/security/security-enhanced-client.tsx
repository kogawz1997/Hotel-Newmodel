'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, X, AlertTriangle, ShieldCheck, Clock, MapPin,
  ClipboardList, Siren,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type PatrolEntry = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  created_at: string;
};

type SecurityIncident = {
  id: string;
  hotel_id: string;
  type: string;
  location?: string;
  description?: string;
  severity: string;
  status: string;
  reported_by?: string;
  created_at: string;
};

type Tab = 'patrol' | 'incidents' | 'emergency';

// ── Label maps ────────────────────────────────────────────────────────────────

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  theft:       'การโจรกรรม',
  accident:    'อุบัติเหตุ',
  fire:        'ไฟไหม้',
  medical:     'เหตุฉุกเฉินทางการแพทย์',
  disturbance: 'ก่อกวน',
  other:       'อื่นๆ',
};

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
  open:          'bg-red-100 text-red-700 border-red-200',
  investigating: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved:      'bg-green-100 text-green-700 border-green-200',
  closed:        'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'เปิดอยู่', investigating: 'กำลังสอบสวน', resolved: 'แก้ไขแล้ว', closed: 'ปิดแล้ว',
};

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

export function SecurityEnhancedClient({
  hotel,
  profile,
}: {
  hotel: { id: string; name: string };
  profile: { id: string; role: string };
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('patrol');

  // Patrol
  const [patrols, setPatrols] = useState<PatrolEntry[]>([]);
  const [showNewPatrol, setShowNewPatrol] = useState(false);
  const [newPatrol, setNewPatrol] = useState({ checkpoint_name: '', location: '', notes: '' });

  // Incidents
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [newInc, setNewInc] = useState({ type: 'other', location: '', description: '', severity: 'low' });

  // Emergency
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyMsg, setEmergencyMsg] = useState('');
  const [emergencyLocation, setEmergencyLocation] = useState('');
  const [emergencyToast, setEmergencyToast] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const loadPatrols = useCallback(async () => {
    const res = await fetch('/api/security/patrol');
    if (res.ok) {
      const json = await res.json();
      setPatrols(json.patrols || []);
    }
  }, []);

  const loadIncidents = useCallback(async () => {
    const { data } = await supabase
      .from('security_incidents')
      .select('id, hotel_id, type, location, description, severity, status, reported_by, created_at')
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setIncidents((data as SecurityIncident[]) || []);
  }, [hotel.id, supabase]);

  useEffect(() => { loadPatrols(); }, [loadPatrols]);
  useEffect(() => { if (tab === 'incidents') loadIncidents(); }, [tab, loadIncidents]);

  // ── Patrol actions ─────────────────────────────────────────────────────────

  const handleCreatePatrol = async () => {
    if (!newPatrol.checkpoint_name.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/security/patrol', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPatrol),
    });
    if (res.ok) {
      setNewPatrol({ checkpoint_name: '', location: '', notes: '' });
      setShowNewPatrol(false);
      await loadPatrols();
    } else {
      const j = await res.json();
      setError(j.error || 'เกิดข้อผิดพลาด');
    }
    setSaving(false);
  };

  // ── Incident actions ───────────────────────────────────────────────────────

  const handleCreateIncident = async () => {
    if (!newInc.description.trim()) return;
    setSaving(true);
    setError(null);
    const { error: sbError } = await supabase.from('security_incidents').insert({
      hotel_id: hotel.id,
      type: newInc.type,
      location: newInc.location || null,
      description: newInc.description,
      severity: newInc.severity,
      status: 'open',
      reported_by: profile.id,
    });
    if (!sbError) {
      setNewInc({ type: 'other', location: '', description: '', severity: 'low' });
      setShowNewIncident(false);
      await loadIncidents();
    } else {
      setError(sbError.message);
    }
    setSaving(false);
  };

  // ── Emergency actions ──────────────────────────────────────────────────────

  const handleEmergency = async () => {
    if (!emergencyMsg.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/security/emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: emergencyMsg, location: emergencyLocation || undefined }),
    });
    if (res.ok) {
      setEmergencyMsg('');
      setEmergencyLocation('');
      setShowEmergency(false);
      setEmergencyToast(true);
      setTimeout(() => setEmergencyToast(false), 4000);
    } else {
      const j = await res.json();
      setError(j.error || 'เกิดข้อผิดพลาด');
    }
    setSaving(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'patrol' as Tab, label: 'Patrol', icon: ClipboardList },
    { id: 'incidents' as Tab, label: 'เหตุการณ์', icon: AlertTriangle },
    { id: 'emergency' as Tab, label: '🚨 ฉุกเฉิน', icon: Siren },
  ];

  return (
    <main className="space-y-6 p-6 md:p-8">
      {/* Toast */}
      {emergencyToast && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-xl bg-green-600 text-white px-5 py-3 shadow-xl text-sm font-medium">
          <ShieldCheck className="h-5 w-5 shrink-0" />
          แจ้งเหตุแล้ว — ทีมรับทราบ
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Security Enhanced</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {hotel.name} · {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {tab === 'patrol' && (
          <button
            onClick={() => setShowNewPatrol(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> บันทึกจุดตรวจ
          </button>
        )}
        {tab === 'incidents' && (
          <button
            onClick={() => setShowNewIncident(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> รายงานเหตุการณ์
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setError(null); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Patrol Tab ────────────────────────────────────────────────────────── */}
      {tab === 'patrol' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">บันทึกจุดตรวจวันนี้ ({patrols.length} จุด)</p>
          {patrols.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ยังไม่มีบันทึกจุดตรวจวันนี้</p>
            </div>
          ) : (
            <div className="relative pl-5 border-l-2 border-border space-y-4">
              {patrols.map((p) => {
                const checkpointName = p.title.replace(/^Patrol:\s*/, '');
                return (
                  <div key={p.id} className="relative">
                    <div className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-medium text-sm">{checkpointName}</p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(p.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {p.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {p.location}
                        </p>
                      )}
                      {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Incidents Tab ─────────────────────────────────────────────────────── */}
      {tab === 'incidents' && (
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">ไม่มีเหตุการณ์ผิดปกติ</p>
            </div>
          ) : (
            incidents.map((inc) => (
              <div key={inc.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start gap-3 flex-wrap">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {INCIDENT_TYPE_LABELS[inc.type] || inc.type}
                  </Badge>
                  <Badge className={SEVERITY_STYLES[inc.severity]}>
                    {SEVERITY_LABELS[inc.severity]}
                  </Badge>
                  <Badge className={STATUS_STYLES[inc.status]}>
                    {STATUS_LABELS[inc.status]}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(inc.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                {inc.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {inc.location}
                  </p>
                )}
                {inc.description && (
                  <p className="text-sm text-foreground line-clamp-2">{inc.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Emergency Tab ─────────────────────────────────────────────────────── */}
      {tab === 'emergency' && (
        <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">ระบบแจ้งเหตุฉุกเฉิน</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              กดปุ่มด้านล่างเพื่อแจ้งเหตุฉุกเฉินไปยังทีมทั้งหมดทันที
            </p>
          </div>
          <button
            onClick={() => setShowEmergency(true)}
            className="relative group flex h-36 w-36 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl shadow-red-500/40 hover:bg-red-700 transition-colors"
          >
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40 group-hover:opacity-20" />
            <div className="flex flex-col items-center gap-1 z-10">
              <Siren className="h-10 w-10" />
              <span className="text-sm font-bold">SOS</span>
            </div>
          </button>
          <p className="text-xs text-muted-foreground">กดเพื่อส่งการแจ้งเตือนฉุกเฉิน</p>
        </div>
      )}

      {/* ── New Patrol Modal ──────────────────────────────────────────────────── */}
      {showNewPatrol && (
        <Modal title="บันทึกจุดตรวจ" onClose={() => { setShowNewPatrol(false); setError(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ชื่อจุดตรวจ *</label>
              <Input
                value={newPatrol.checkpoint_name}
                onChange={(e) => setNewPatrol((r) => ({ ...r, checkpoint_name: e.target.value }))}
                placeholder="เช่น ล็อบบี้, ลานจอดรถ, ชั้น 5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">สถานที่</label>
              <Input
                value={newPatrol.location}
                onChange={(e) => setNewPatrol((r) => ({ ...r, location: e.target.value }))}
                placeholder="พิกัดหรือคำอธิบายสถานที่"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">หมายเหตุ</label>
              <Textarea
                value={newPatrol.notes}
                onChange={(e) => setNewPatrol((r) => ({ ...r, notes: e.target.value }))}
                rows={2}
                placeholder="สิ่งที่พบหรือสังเกตุเห็น..."
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowNewPatrol(false); setError(null); }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">ยกเลิก</button>
              <button onClick={handleCreatePatrol} disabled={saving || !newPatrol.checkpoint_name.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── New Incident Modal ────────────────────────────────────────────────── */}
      {showNewIncident && (
        <Modal title="รายงานเหตุการณ์" onClose={() => { setShowNewIncident(false); setError(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ประเภทเหตุการณ์</label>
              <Select value={newInc.type} onChange={(e) => setNewInc((r) => ({ ...r, type: e.target.value }))}>
                {Object.entries(INCIDENT_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">สถานที่</label>
              <Input
                value={newInc.location}
                onChange={(e) => setNewInc((r) => ({ ...r, location: e.target.value }))}
                placeholder="เช่น ห้อง 302, ล็อบบี้, ลานจอดรถ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">รายละเอียด *</label>
              <Textarea
                value={newInc.description}
                onChange={(e) => setNewInc((r) => ({ ...r, description: e.target.value }))}
                rows={3}
                placeholder="อธิบายเหตุการณ์โดยละเอียด..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">ระดับความรุนแรง</label>
              <Select value={newInc.severity} onChange={(e) => setNewInc((r) => ({ ...r, severity: e.target.value }))}>
                <option value="low">ต่ำ</option>
                <option value="medium">ปานกลาง</option>
                <option value="high">สูง</option>
                <option value="critical">วิกฤต</option>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowNewIncident(false); setError(null); }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">ยกเลิก</button>
              <button onClick={handleCreateIncident} disabled={saving || !newInc.description.trim()} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
                {saving ? 'กำลังบันทึก...' : 'รายงาน'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Emergency Confirm Modal ───────────────────────────────────────────── */}
      {showEmergency && (
        <Modal title="🚨 แจ้งเหตุฉุกเฉิน" onClose={() => { setShowEmergency(false); setError(null); }}>
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              การแจ้งเหตุจะถูกส่งไปยังทีมทั้งหมดทันที กรุณากรอกข้อมูลให้ครบถ้วน
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">รายละเอียดเหตุการณ์ *</label>
              <Textarea
                value={emergencyMsg}
                onChange={(e) => setEmergencyMsg(e.target.value)}
                rows={3}
                placeholder="อธิบายสถานการณ์ฉุกเฉินที่เกิดขึ้น..."
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">สถานที่เกิดเหตุ</label>
              <Input
                value={emergencyLocation}
                onChange={(e) => setEmergencyLocation(e.target.value)}
                placeholder="ห้อง, ชั้น, หรือพื้นที่..."
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowEmergency(false); setError(null); }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">ยกเลิก</button>
              <button
                onClick={handleEmergency}
                disabled={saving || !emergencyMsg.trim()}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'กำลังส่ง...' : '🚨 ส่งการแจ้งเตือน'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
