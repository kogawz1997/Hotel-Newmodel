'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Route, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const INPUT = 'w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const LABEL = 'text-xs text-muted-foreground mb-1 block';

const SENTIMENT_OPTS = [
  { value: 'negative', label: '😤 Negative' },
  { value: 'neutral', label: '😐 Neutral' },
  { value: 'positive', label: '😊 Positive' },
  { value: 'any', label: 'Any' },
];

const ROLE_OPTS = [
  { value: 'manager', label: 'Manager' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'concierge', label: 'Concierge' },
];

const SENTIMENT_EMOJI: Record<string, string> = {
  negative: '😤',
  neutral: '😐',
  positive: '😊',
  any: '—',
};

type Rule = {
  id: string;
  name: string;
  sentiment: string;
  emotion_score_lt: number | null;
  assign_to_role: string;
  sla_minutes: number;
  is_active: boolean;
};

type Form = {
  name: string;
  sentiment: string;
  emotion_score_lt: string;
  assign_to_role: string;
  sla_minutes: string;
};

const DEFAULT_FORM: Form = {
  name: '',
  sentiment: 'negative',
  emotion_score_lt: '5',
  assign_to_role: 'manager',
  sla_minutes: '15',
};

export function RoutingRulesClient({ hotelId }: { hotelId: string }) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(DEFAULT_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/sentiment/routing-rules?hotel_id=${hotelId}`);
    if (res.ok) {
      const j = await res.json();
      setRules(j.rules || []);
    }
    setLoading(false);
  }, [hotelId]);

  useEffect(() => { load(); }, [load]);

  async function createRule() {
    if (!form.name.trim() || !form.assign_to_role || !form.sla_minutes) {
      toast.error('กรอกข้อมูลให้ครบก่อน');
      return;
    }
    setSaving(true);
    const body: Record<string, unknown> = {
      hotel_id: hotelId,
      name: form.name.trim(),
      sentiment: form.sentiment,
      assign_to_role: form.assign_to_role,
      sla_minutes: Number(form.sla_minutes),
    };
    if (form.sentiment !== 'any' && form.emotion_score_lt) {
      body.emotion_score_lt = Number(form.emotion_score_lt);
    }
    const res = await fetch('/api/sentiment/routing-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { toast.error('สร้าง rule ไม่สำเร็จ'); return; }
    const { rule } = await res.json();
    setRules(prev => [...prev, rule]);
    setShowCreate(false);
    setForm(DEFAULT_FORM);
    toast.success('สร้าง routing rule แล้ว');
  }

  async function toggleActive(rule: Rule) {
    setToggling(rule.id);
    const res = await fetch('/api/sentiment/routing-rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, hotel_id: hotelId, is_active: !rule.is_active }),
    });
    setToggling(null);
    if (!res.ok) { toast.error('อัปเดตไม่สำเร็จ'); return; }
    const { rule: updated } = await res.json();
    setRules(prev => prev.map(r => r.id === rule.id ? updated : r));
  }

  async function deleteRule(rule: Rule) {
    setDeleting(rule.id);
    const res = await fetch(`/api/sentiment/routing-rules?id=${rule.id}&hotel_id=${hotelId}`, {
      method: 'DELETE',
    });
    setDeleting(null);
    if (!res.ok) { toast.error('ลบไม่สำเร็จ'); return; }
    setRules(prev => prev.filter(r => r.id !== rule.id));
    toast.success('ลบ rule แล้ว');
  }

  const previewText = () => {
    const sentimentLabel = SENTIMENT_OPTS.find(s => s.value === form.sentiment)?.label ?? form.sentiment;
    const roleLabel = ROLE_OPTS.find(r => r.value === form.assign_to_role)?.label ?? form.assign_to_role;
    const scoreText = form.sentiment !== 'any' && form.emotion_score_lt
      ? ` และ score < ${form.emotion_score_lt}`
      : '';
    return `ถ้าข้อความมี sentiment ${sentimentLabel}${scoreText} → ส่งให้ ${roleLabel} ภายใน ${form.sla_minutes || '?'} นาที`;
  };

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar
        title="Routing Rules"
        description="กำหนดเงื่อนไขการส่งต่อบทสนทนาตาม sentiment"
        action={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Create Rule
          </Button>
        }
      />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Route className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">ยังไม่มี routing rules</p>
          <p className="text-sm mt-1">สร้าง rule แรกเพื่อเริ่มต้น</p>
          <Button size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Create Rule
          </Button>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left px-4 py-3">Rule Name</th>
                  <th className="text-center px-4 py-3">Sentiment</th>
                  <th className="text-center px-4 py-3">Score Threshold</th>
                  <th className="text-left px-4 py-3">Assign To</th>
                  <th className="text-center px-4 py-3">SLA</th>
                  <th className="text-center px-4 py-3">Active</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{rule.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        {SENTIMENT_EMOJI[rule.sentiment] ?? '—'}
                        <span className="text-xs text-muted-foreground capitalize">{rule.sentiment}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {rule.emotion_score_lt != null ? `< ${rule.emotion_score_lt}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {ROLE_OPTS.find(r => r.value === rule.assign_to_role)?.label ?? rule.assign_to_role}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{rule.sla_minutes} นาที</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(rule)}
                        disabled={toggling === rule.id}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0',
                          rule.is_active ? 'bg-accent' : 'bg-secondary',
                          toggling === rule.id && 'opacity-50'
                        )}
                      >
                        <span className={cn(
                          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                          rule.is_active ? 'translate-x-6' : 'translate-x-1'
                        )} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteRule(rule)}
                        disabled={deleting === rule.id}
                        className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={showCreate} onOpenChange={o => { if (!o) { setShowCreate(false); setForm(DEFAULT_FORM); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>สร้าง Routing Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Rule Name *</label>
              <input
                className={INPUT}
                value={form.name}
                placeholder="เช่น Negative → Manager"
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className={LABEL}>Sentiment</label>
              <select
                className={INPUT}
                value={form.sentiment}
                onChange={e => setForm(p => ({ ...p, sentiment: e.target.value }))}
              >
                {SENTIMENT_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {form.sentiment !== 'any' && (
              <div>
                <label className={LABEL}>Emotion Score Threshold (0–10)</label>
                <input
                  className={INPUT}
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={form.emotion_score_lt}
                  onChange={e => setForm(p => ({ ...p, emotion_score_lt: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">ส่งต่อเมื่อ score น้อยกว่า {form.emotion_score_lt || '?'}</p>
              </div>
            )}
            <div>
              <label className={LABEL}>Assign To Role</label>
              <select
                className={INPUT}
                value={form.assign_to_role}
                onChange={e => setForm(p => ({ ...p, assign_to_role: e.target.value }))}
              >
                {ROLE_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>SLA Minutes *</label>
              <input
                className={INPUT}
                type="number"
                min={1}
                value={form.sla_minutes}
                onChange={e => setForm(p => ({ ...p, sla_minutes: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">ต้องตอบภายใน {form.sla_minutes || '?'} นาที</p>
            </div>
            <div className="rounded-lg bg-secondary/60 px-3 py-2.5">
              <p className="text-xs text-muted-foreground leading-relaxed">{previewText()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setForm(DEFAULT_FORM); }}>ยกเลิก</Button>
            <Button onClick={createRule} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'สร้าง Rule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
