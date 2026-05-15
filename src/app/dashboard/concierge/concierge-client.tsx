'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, MessageSquare, UserCheck, ClipboardList, X, Check,
  AlertTriangle, Clock, Car, Utensils, MapPin, Package, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'transportation', label: 'รถรับ-ส่ง', icon: Car },
  { value: 'dining', label: 'จองร้านอาหาร', icon: Utensils },
  { value: 'activity', label: 'กิจกรรม/ทัวร์', icon: MapPin },
  { value: 'room_service', label: 'Room Service', icon: Package },
  { value: 'laundry', label: 'ซักรีด', icon: Sparkles },
  { value: 'other', label: 'อื่นๆ', icon: ClipboardList },
];

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-orange-100 text-orange-700 border-orange-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed:   'bg-green-100 text-green-700 border-green-200',
  cancelled:   'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'รอดำเนินการ', in_progress: 'กำลังดำเนินการ',
  completed: 'เสร็จแล้ว', cancelled: 'ยกเลิก',
};

const PRIORITY_STYLES: Record<string, string> = {
  low:    'bg-gray-50 text-gray-500',
  normal: 'bg-blue-50 text-blue-600',
  high:   'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
};

type Request = {
  id: string; hotel_id: string; category: string; title: string;
  description?: string; status: string; priority: string;
  scheduled_at?: string; notes?: string; created_at: string;
};

type Conv = { id: string; guest_name: string; channel: string; status: string; unread_count: number; last_message?: string; updated_at: string };
type Arrival = { id: string; reservation_code: string; check_in: string; check_out: string; status: string; special_requests?: string; guests: any; room_types: any };

type Tab = 'requests' | 'messages' | 'arrivals';

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

export function ConciergeClient({ hotel, profile, initialRequests, conversations, arrivals }: {
  hotel: any; profile: any;
  initialRequests: Request[];
  conversations: Conv[];
  arrivals: Arrival[];
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('active');

  const [newReq, setNewReq] = useState({
    category: 'transportation', title: '', description: '',
    priority: 'normal', scheduled_at: '', notes: '',
  });

  const handleCreate = async () => {
    if (!newReq.title.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('concierge_requests').insert({
      hotel_id: hotel.id,
      category: newReq.category,
      title: newReq.title,
      description: newReq.description || null,
      priority: newReq.priority,
      scheduled_at: newReq.scheduled_at || null,
      notes: newReq.notes || null,
      status: 'pending',
    }).select().single();
    if (!error && data) {
      setRequests((prev) => [data as Request, ...prev]);
      setNewReq({ category: 'transportation', title: '', description: '', priority: 'normal', scheduled_at: '', notes: '' });
      setShowNew(false);
    }
    setSaving(false);
  };

  const handleStatus = async (id: string, status: string) => {
    await supabase.from('concierge_requests').update({ status, ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}) }).eq('id', id);
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  };

  const filtered = requests.filter((r) => {
    if (filterStatus === 'active') return ['pending', 'in_progress'].includes(r.status);
    if (filterStatus === 'completed') return r.status === 'completed';
    return true;
  });

  const stats = {
    pending: requests.filter((r) => r.status === 'pending').length,
    in_progress: requests.filter((r) => r.status === 'in_progress').length,
    completed_today: requests.filter((r) => r.status === 'completed' && r.created_at?.startsWith(new Date().toISOString().slice(0, 10))).length,
    unread_msgs: conversations.filter((c) => c.unread_count > 0).length,
  };

  return (
    <main className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Concierge Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">{hotel.name} · {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> คำขอใหม่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'รอดำเนินการ', value: stats.pending, color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/30' },
          { label: 'กำลังดูแล', value: stats.in_progress, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30' },
          { label: 'เสร็จวันนี้', value: stats.completed_today, color: 'bg-green-50 text-green-600 dark:bg-green-950/30' },
          { label: 'ข้อความรอตอบ', value: stats.unread_msgs, color: 'bg-red-50 text-red-600 dark:bg-red-950/30' },
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
          { id: 'requests', label: 'คำขอบริการ', icon: ClipboardList, count: stats.pending + stats.in_progress },
          { id: 'messages', label: 'ข้อความแขก', icon: MessageSquare, count: stats.unread_msgs },
          { id: 'arrivals', label: 'Check-in วันนี้', icon: UserCheck, count: arrivals.length },
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

      {/* Requests Tab */}
      {tab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {[
              { value: 'active', label: 'ที่ต้องดูแล' },
              { value: 'completed', label: 'เสร็จแล้ว' },
              { value: 'all', label: 'ทั้งหมด' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filterStatus === f.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ไม่มีคำขอในหมวดนี้</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((req) => {
                const Cat = CATEGORIES.find((c) => c.value === req.category);
                return (
                  <div key={req.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                    <div className={cn('rounded-lg p-2 shrink-0 mt-0.5', PRIORITY_STYLES[req.priority] || PRIORITY_STYLES.normal)}>
                      {Cat ? <Cat.icon className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="font-medium text-sm text-foreground">{req.title}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge className={STATUS_STYLES[req.status]}>{STATUS_LABELS[req.status]}</Badge>
                          {req.priority === 'urgent' && <Badge className="bg-red-100 text-red-600 border-red-200">เร่งด่วน</Badge>}
                        </div>
                      </div>
                      {req.description && <p className="text-xs text-muted-foreground mt-1">{req.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(req.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {req.scheduled_at && (
                          <span className="text-xs text-muted-foreground">นัด: {new Date(req.scheduled_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                        )}
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleStatus(req.id, 'in_progress')}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            รับงาน →
                          </button>
                        )}
                        {req.status === 'in_progress' && (
                          <button
                            onClick={() => handleStatus(req.id, 'completed')}
                            className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors"
                          >
                            <Check className="h-3 w-3" /> เสร็จแล้ว
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {tab === 'messages' && (
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ไม่มีข้อความที่รอตอบ</p>
            </div>
          ) : conversations.map((conv) => (
            <a
              key={conv.id}
              href={`/dashboard/inbox`}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-secondary/30 transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm shrink-0">
                {conv.guest_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{conv.guest_name || 'แขก'}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {conv.unread_count > 0 && (
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground capitalize">{conv.channel}</span>
                  </div>
                </div>
                {conv.last_message && <p className="text-xs text-muted-foreground mt-0.5 truncate">{conv.last_message}</p>}
              </div>
            </a>
          ))}
          <div className="text-center pt-2">
            <a href="/dashboard/inbox" className="text-sm text-primary hover:underline">ดูทั้งหมดใน Inbox →</a>
          </div>
        </div>
      )}

      {/* Arrivals Tab */}
      {tab === 'arrivals' && (
        <div className="space-y-2">
          {arrivals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ไม่มี Check-in วันนี้</p>
            </div>
          ) : arrivals.map((arr) => (
            <div key={arr.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{arr.guests?.first_name} {arr.guests?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{arr.reservation_code} · {arr.room_types?.name} · {arr.check_in} → {arr.check_out}</p>
                  {arr.guests?.phone && <p className="text-xs text-muted-foreground">{arr.guests.phone}</p>}
                </div>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full border font-medium shrink-0',
                  arr.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200',
                )}>{arr.status}</span>
              </div>
              {arr.special_requests && (
                <div className="flex items-start gap-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700 dark:text-orange-300">{arr.special_requests}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {showNew && (
        <Modal title="คำขอบริการใหม่" onClose={() => setShowNew(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">หมวดหมู่</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setNewReq((r) => ({ ...r, category: cat.value }))}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-colors',
                      newReq.category === cat.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">รายละเอียดคำขอ *</label>
              <Input value={newReq.title} onChange={(e) => setNewReq((r) => ({ ...r, title: e.target.value }))} placeholder="เช่น รถไปสนามบิน 6 ก.ค. 06:00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">ข้อมูลเพิ่มเติม</label>
              <Textarea value={newReq.description} onChange={(e) => setNewReq((r) => ({ ...r, description: e.target.value }))} rows={3} placeholder="จำนวนผู้โดยสาร, จุดหมาย, ความต้องการพิเศษ..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">ความสำคัญ</label>
                <Select value={newReq.priority} onChange={(e) => setNewReq((r) => ({ ...r, priority: e.target.value }))}>
                  <option value="low">ปกติ (ต่ำ)</option>
                  <option value="normal">ปกติ</option>
                  <option value="high">สูง</option>
                  <option value="urgent">เร่งด่วน</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">เวลานัด</label>
                <Input type="datetime-local" value={newReq.scheduled_at} onChange={(e) => setNewReq((r) => ({ ...r, scheduled_at: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">ยกเลิก</button>
              <button
                onClick={handleCreate}
                disabled={saving || !newReq.title.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {saving ? 'กำลังบันทึก...' : 'สร้างคำขอ'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
