'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight,
  X, ArrowLeft, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type SegmentType = 'vip' | 'repeat_guest' | 'high_spender' | 'new_guest' | 'at_risk_churn' | 'win_back' | 'custom';

interface SegmentRule {
  field: string;
  operator: string;
  value: string;
}

interface Segment {
  id: string;
  name: string;
  type: SegmentType;
  rules: SegmentRule[];
  is_active: boolean;
  member_count: number;
  created_at: string;
}

interface Member {
  guest_id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  total_stays: number;
  total_spent: number;
  loyalty_tier: string | null;
}

const SEGMENT_TYPE_LABELS: Record<string, string> = {
  vip: 'VIP',
  repeat_guest: 'Repeat Guest',
  high_spender: 'High Spender',
  new_guest: 'New Guest',
  at_risk_churn: 'At-Risk Churn',
  win_back: 'Win-back',
  custom: 'Custom',
};

const SEGMENT_TYPE_COLORS: Record<string, string> = {
  vip: 'text-violet-400 bg-violet-400/10',
  repeat_guest: 'text-emerald-400 bg-emerald-400/10',
  high_spender: 'text-amber-400 bg-amber-400/10',
  new_guest: 'text-blue-400 bg-blue-400/10',
  at_risk_churn: 'text-red-400 bg-red-400/10',
  win_back: 'text-pink-400 bg-pink-400/10',
  custom: 'text-white/60 bg-white/5',
};

const RULE_FIELDS = [
  { value: 'total_stays', label: 'Total Stays' },
  { value: 'total_spent', label: 'Total Spent' },
  { value: 'days_since_last_stay', label: 'Days Since Last Stay' },
  { value: 'loyalty_tier', label: 'Loyalty Tier' },
  { value: 'is_vip', label: 'Is VIP' },
];

const RULE_OPERATORS = [
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
];

const SEGMENT_TYPES: SegmentType[] = ['vip', 'repeat_guest', 'high_spender', 'new_guest', 'at_risk_churn', 'win_back', 'custom'];

const TIER_COLORS: Record<string, string> = {
  bronze: 'text-amber-600 bg-amber-600/10',
  silver: 'text-zinc-300 bg-zinc-300/10',
  gold: 'text-yellow-400 bg-yellow-400/10',
  platinum: 'text-violet-400 bg-violet-400/10',
};

const inputCls = 'bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500/50 w-full';
const selectCls = 'bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50';

export function SegmentsClient({ hotelId }: { hotelId: string }) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<SegmentType>('custom');
  const [formRules, setFormRules] = useState<SegmentRule[]>([{ field: 'total_stays', operator: 'gte', value: '' }]);
  const [saving, setSaving] = useState(false);

  const fetchSegments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/segments?hotel_id=${hotelId}`);
      const data = await res.json();
      setSegments(data.segments || []);
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูล segments ได้');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => { fetchSegments(); }, [fetchSegments]);

  const fetchMembers = useCallback(async (segmentId: string) => {
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/crm/segments/${segmentId}/members?hotel_id=${hotelId}&limit=50`);
      const data = await res.json();
      setMembers(data.members || []);
    } catch {
      toast.error('ไม่สามารถโหลดสมาชิกได้');
    } finally {
      setMembersLoading(false);
    }
  }, [hotelId]);

  async function handleCreate() {
    if (!formName.trim()) { toast.error('กรุณาใส่ชื่อ segment'); return; }
    const rulesWithValues = formRules.filter(r => r.value.trim() !== '');
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/segments?hotel_id=${hotelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, type: formType, rules: rulesWithValues }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'เกิดข้อผิดพลาด'); return; }
      toast.success(`สร้าง segment "${formName}" สำเร็จ`);
      setShowCreate(false);
      setFormName('');
      setFormType('custom');
      setFormRules([{ field: 'total_stays', operator: 'gte', value: '' }]);
      fetchSegments();
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(seg: Segment) {
    try {
      const res = await fetch(`/api/crm/segments?hotel_id=${hotelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: seg.id, is_active: !seg.is_active }),
      });
      if (!res.ok) { toast.error('ไม่สามารถอัปเดตได้'); return; }
      toast.success(seg.is_active ? 'ปิดใช้งานแล้ว' : 'เปิดใช้งานแล้ว');
      fetchSegments();
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    }
  }

  async function handleDelete(seg: Segment) {
    if (!confirm(`ลบ segment "${seg.name}" ใช่ไหม?`)) return;
    try {
      const res = await fetch(`/api/crm/segments?hotel_id=${hotelId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: seg.id }),
      });
      if (!res.ok) { toast.error('ไม่สามารถลบได้'); return; }
      toast.success('ลบแล้ว');
      if (selectedSegment?.id === seg.id) setSelectedSegment(null);
      fetchSegments();
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    }
  }

  async function handleRecalculate(seg: Segment) {
    try {
      const res = await fetch(`/api/crm/segments?hotel_id=${hotelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: seg.id, rules: seg.rules }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error('ไม่สามารถคำนวณใหม่ได้'); return; }
      toast.success(`คำนวณใหม่สำเร็จ — ${data.segment?.member_count ?? 0} สมาชิก`);
      fetchSegments();
      if (selectedSegment?.id === seg.id) fetchMembers(seg.id);
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    }
  }

  function openSegment(seg: Segment) {
    setSelectedSegment(seg);
    fetchMembers(seg.id);
  }

  function addRule() {
    setFormRules(r => [...r, { field: 'total_stays', operator: 'gte', value: '' }]);
  }

  function removeRule(idx: number) {
    setFormRules(r => r.filter((_, i) => i !== idx));
  }

  function updateRule(idx: number, key: keyof SegmentRule, val: string) {
    setFormRules(r => r.map((rule, i) => i === idx ? { ...rule, [key]: val } : rule));
  }

  return (
    <div className="p-4 md:p-6 space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/crm" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-4 w-4 text-white/50" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Segment Management</h1>
            <p className="text-white/50 text-sm mt-0.5">จัดการกลุ่มลูกค้าสำหรับการตลาด</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          สร้าง Segment
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCreate(false)} className="absolute right-4 top-4 p-1 rounded-md hover:bg-white/10 transition-colors">
              <X className="h-4 w-4 text-white/50" />
            </button>
            <h2 className="text-lg font-bold mb-4">สร้าง Segment ใหม่</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">ชื่อ Segment</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="เช่น VIP ที่ไม่ได้กลับมา 6 เดือน" className={inputCls} />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1.5 block">ประเภท</label>
                <select value={formType} onChange={e => setFormType(e.target.value as SegmentType)} className={cn(selectCls, 'w-full')}>
                  {SEGMENT_TYPES.map(t => (
                    <option key={t} value={t}>{SEGMENT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-white/50">กฎการคัดเลือก</label>
                  <button onClick={addRule} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    <Plus className="h-3 w-3" /> เพิ่มกฎ
                  </button>
                </div>
                <div className="space-y-2">
                  {formRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select value={rule.field} onChange={e => updateRule(idx, 'field', e.target.value)} className={cn(selectCls, 'flex-1')}>
                        {RULE_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                      <select value={rule.operator} onChange={e => updateRule(idx, 'operator', e.target.value)} className={cn(selectCls, 'w-16')}>
                        {RULE_OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input value={rule.value} onChange={e => updateRule(idx, 'value', e.target.value)} placeholder="ค่า" className={cn(inputCls, 'w-24')} />
                      {formRules.length > 1 && (
                        <button onClick={() => removeRule(idx)} className="p-1 hover:text-red-400 text-white/30 transition-colors shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleCreate} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors">
                {saving ? 'กำลังสร้าง…' : 'สร้าง Segment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={cn('grid gap-6', selectedSegment ? 'lg:grid-cols-2' : 'grid-cols-1')}>
        <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/30">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> กำลังโหลด…
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['ชื่อ', 'ประเภท', 'สมาชิก', 'สถานะ', 'จัดการ'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {segments.map((seg, i) => {
                  const typeCfg = SEGMENT_TYPE_COLORS[seg.type] || 'text-white/60 bg-white/5';
                  const isSelected = selectedSegment?.id === seg.id;
                  return (
                    <tr
                      key={seg.id}
                      onClick={() => openSegment(seg)}
                      className={cn(
                        'border-b border-white/5 cursor-pointer transition-colors',
                        i === segments.length - 1 && 'border-0',
                        isSelected ? 'bg-violet-600/10' : 'hover:bg-white/5',
                      )}
                    >
                      <td className="px-4 py-3 font-medium">{seg.name}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', typeCfg)}>
                          {SEGMENT_TYPE_LABELS[seg.type] || seg.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-white/60">
                          <Users className="h-3.5 w-3.5" />
                          {seg.member_count.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {seg.is_active
                          ? <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Active</span>
                          : <span className="text-xs font-medium text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Inactive</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleRecalculate(seg)}
                            title="คำนวณใหม่"
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggle(seg)}
                            title={seg.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                          >
                            {seg.is_active ? <ToggleRight className="h-3.5 w-3.5 text-emerald-400" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(seg)}
                            title="ลบ"
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {segments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <TrendingUp className="h-8 w-8 text-white/15 mx-auto mb-2" />
                      <p className="text-white/30 text-sm">ยังไม่มี segment — กด "สร้าง Segment" เพื่อเริ่มต้น</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {selectedSegment && (
          <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div>
                <h3 className="font-semibold text-sm">{selectedSegment.name}</h3>
                <p className="text-xs text-white/40 mt-0.5">{members.length} สมาชิก</p>
              </div>
              <button onClick={() => setSelectedSegment(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            {membersLoading ? (
              <div className="flex items-center justify-center py-12 text-white/30">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" /> กำลังโหลด…
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {['ชื่อ', 'Email', 'Tier', 'Stays', 'Spend'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => {
                    const tierCls = m.loyalty_tier ? (TIER_COLORS[m.loyalty_tier] || 'text-white/40 bg-white/5') : null;
                    return (
                      <tr key={m.guest_id} className={cn('border-b border-white/5 hover:bg-white/5', i === members.length - 1 && 'border-0')}>
                        <td className="px-4 py-3 font-medium">{m.first_name} {m.last_name || ''}</td>
                        <td className="px-4 py-3 text-white/50 text-xs">{m.email || '—'}</td>
                        <td className="px-4 py-3">
                          {tierCls
                            ? <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', tierCls)}>{m.loyalty_tier}</span>
                            : <span className="text-white/20 text-xs">—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-white/60">{m.total_stays}</td>
                        <td className="px-4 py-3 text-emerald-400 font-medium">฿{m.total_spent.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-white/30">ไม่มีสมาชิกใน segment นี้</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
