'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { format, addDays, subMonths, startOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { Plus, Sparkles, TrendingUp, BarChart3, Hotel, Target, RefreshCw, CircleDollarSign, Activity, Info } from 'lucide-react';
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

// ── Tab definitions ──────────────────────────────────────────────────────────
type Tab = 'competitor' | 'dynamic' | 'forecast' | 'abandoned';

const TABS: { id: Tab; label: string }[] = [
  { id: 'competitor', label: 'ราคาคู่แข่ง' },
  { id: 'dynamic', label: 'Dynamic Pricing' },
  { id: 'forecast', label: 'Forecasting' },
  { id: 'abandoned', label: 'Abandoned Bookings' },
];

// ── Channel badge colours ────────────────────────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  manual: 'bg-secondary text-muted-foreground',
  scraper: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  ota: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
};

const DEMAND_COLORS: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  low: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

// ── Shared input style ───────────────────────────────────────────────────────
const INPUT = 'w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const LABEL = 'text-xs text-muted-foreground mb-1 block';

// ────────────────────────────────────────────────────────────────────────────
export function RevenueFullClient({ hotelId }: { hotelId: string }) {
  const [tab, setTab] = useState<Tab>('competitor');

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar title="Revenue Management" description="ราคาคู่แข่ง · Dynamic Pricing · Forecasting · Abandoned Bookings" />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
              tab === t.id
                ? 'border-accent text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'competitor' && <CompetitorTab hotelId={hotelId} />}
      {tab === 'dynamic' && <DynamicPricingTab hotelId={hotelId} />}
      {tab === 'forecast' && <ForecastingTab hotelId={hotelId} />}
      {tab === 'abandoned' && <AbandonedTab hotelId={hotelId} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Competitor Rates Tab
// ════════════════════════════════════════════════════════════════════════════
function CompetitorTab({ hotelId }: { hotelId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ competitor_name: '', rate_date: format(new Date(), 'yyyy-MM-dd'), room_type: '', rate: '', source: 'manual' });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/revenue/competitor');
    if (res.ok) { const j = await res.json(); setRows(j.data || []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.competitor_name || !form.room_type || !form.rate) {
      toast.error('กรอกข้อมูลให้ครบก่อน'); return;
    }
    setSaving(true);
    const res = await fetch('/api/revenue/competitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, rate: Number(form.rate) }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('บันทึกไม่สำเร็จ'); return; }
    const { data } = await res.json();
    setRows(prev => [data, ...prev]);
    setShowAdd(false);
    setForm({ competitor_name: '', rate_date: format(new Date(), 'yyyy-MM-dd'), room_type: '', rate: '', source: 'manual' });
    toast.success('เพิ่มราคาคู่แข่งแล้ว');
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">ราคาคู่แข่ง 30 วันที่ผ่านมา ({rows.length} รายการ)</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" /> เพิ่มราคาคู่แข่ง</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">ยังไม่มีข้อมูลราคาคู่แข่ง</p>
          <p className="text-sm mt-1">เพิ่มราคาคู่แข่งเพื่อ benchmark</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left px-4 py-3">คู่แข่ง</th>
                  <th className="text-left px-4 py-3">ประเภทห้อง</th>
                  <th className="text-left px-4 py-3">วันที่</th>
                  <th className="text-right px-4 py-3">ราคา (฿)</th>
                  <th className="text-center px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{r.competitor_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.room_type}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(r.rate_date), 'd MMM yyyy', { locale: th })}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{Number(r.rate).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('text-2xs px-2 py-0.5 rounded-full font-medium', SOURCE_COLORS[r.source] || SOURCE_COLORS.manual)}>
                        {r.source || 'manual'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={o => !o && setShowAdd(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>เพิ่มราคาคู่แข่ง</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className={LABEL}>ชื่อคู่แข่ง *</label>
              <input className={INPUT} value={form.competitor_name} placeholder="เช่น Grand Hotel" onChange={e => setForm(p => ({ ...p, competitor_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>ประเภทห้อง *</label>
                <input className={INPUT} value={form.room_type} placeholder="เช่น Deluxe" onChange={e => setForm(p => ({ ...p, room_type: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL}>ราคา (฿) *</label>
                <input className={INPUT} type="number" value={form.rate} placeholder="3500" onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={LABEL}>วันที่</label>
              <input className={INPUT} type="date" value={form.rate_date} onChange={e => setForm(p => ({ ...p, rate_date: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>แหล่งข้อมูล</label>
              <select className={INPUT} value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
                <option value="manual">Manual</option>
                <option value="scraper">Scraper</option>
                <option value="ota">OTA</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Dynamic Pricing Tab
// ════════════════════════════════════════════════════════════════════════════
function DynamicPricingTab({ hotelId }: { hotelId: string }) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    condition_metric: 'occupancy',
    condition_operator: '>',
    condition_value: '',
    adjustment_type: 'percent',
    adjustment_value: '',
    priority: '0',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/revenue/dynamic-pricing');
    if (res.ok) { const j = await res.json(); setRules(j.data || []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.name || !form.condition_value || !form.adjustment_value) {
      toast.error('กรอกข้อมูลให้ครบก่อน'); return;
    }
    setSaving(true);
    const res = await fetch('/api/revenue/dynamic-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        condition: { metric: form.condition_metric, operator: form.condition_operator, value: Number(form.condition_value) },
        adjustment: { type: form.adjustment_type, value: Number(form.adjustment_value) },
        priority: Number(form.priority),
      }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('บันทึกไม่สำเร็จ'); return; }
    const { data } = await res.json();
    setRules(prev => [data, ...prev]);
    setShowAdd(false);
    setForm({ name: '', condition_metric: 'occupancy', condition_operator: '>', condition_value: '', adjustment_type: 'percent', adjustment_value: '', priority: '0' });
    toast.success('สร้าง rule แล้ว');
  }

  async function toggleActive(rule: any) {
    setToggling(rule.id);
    const res = await fetch('/api/revenue/dynamic-pricing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, is_active: !rule.is_active }),
    });
    setToggling(null);
    if (!res.ok) { toast.error('อัปเดตไม่สำเร็จ'); return; }
    const { data } = await res.json();
    setRules(prev => prev.map(r => r.id === rule.id ? data : r));
  }

  function conditionSummary(c: any) {
    if (!c) return '—';
    return `${c.metric} ${c.operator} ${c.value}`;
  }

  function adjustmentSummary(a: any) {
    if (!a) return '—';
    return a.type === 'percent' ? `+${a.value}%` : `+฿${a.value}`;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{rules.length} rules ที่ตั้งค่าไว้</p>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" /> เพิ่ม Rule</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">ยังไม่มี Dynamic Pricing Rules</p>
          <p className="text-sm mt-1">สร้าง rule เพื่อปรับราคาอัตโนมัติตามสภาพตลาด</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <Card key={rule.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{rule.name}</span>
                    <span className="text-2xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      Priority {rule.priority}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    เงื่อนไข: <span className="font-mono">{conditionSummary(rule.condition)}</span>
                    {' → '}
                    <span className="text-emerald-600 font-medium">{adjustmentSummary(rule.adjustment)}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(rule)}
                  disabled={toggling === rule.id}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0',
                    rule.is_active ? 'bg-accent' : 'bg-secondary',
                    toggling === rule.id && 'opacity-50'
                  )}
                >
                  <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', rule.is_active ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={o => !o && setShowAdd(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>เพิ่ม Dynamic Pricing Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className={LABEL}>ชื่อ Rule *</label>
              <input className={INPUT} value={form.name} placeholder="เช่น High Occupancy Surge" onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className={LABEL}>เงื่อนไข (Condition)</label>
              <div className="grid grid-cols-3 gap-2">
                <select className={INPUT} value={form.condition_metric} onChange={e => setForm(p => ({ ...p, condition_metric: e.target.value }))}>
                  <option value="occupancy">Occupancy</option>
                  <option value="day_of_week">Day of Week</option>
                  <option value="lead_time">Lead Time</option>
                </select>
                <select className={INPUT} value={form.condition_operator} onChange={e => setForm(p => ({ ...p, condition_operator: e.target.value }))}>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value="=">=</option>
                </select>
                <input className={INPUT} type="number" value={form.condition_value} placeholder="70" onChange={e => setForm(p => ({ ...p, condition_value: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={LABEL}>การปรับราคา (Adjustment)</label>
              <div className="grid grid-cols-2 gap-2">
                <select className={INPUT} value={form.adjustment_type} onChange={e => setForm(p => ({ ...p, adjustment_type: e.target.value }))}>
                  <option value="percent">% เพิ่ม</option>
                  <option value="fixed">฿ เพิ่ม (Fixed)</option>
                </select>
                <input className={INPUT} type="number" value={form.adjustment_value} placeholder={form.adjustment_type === 'percent' ? '15' : '500'} onChange={e => setForm(p => ({ ...p, adjustment_value: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Priority (สูง = ทำงานก่อน)</label>
              <input className={INPUT} type="number" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Forecasting Tab
// ════════════════════════════════════════════════════════════════════════════

interface AdvancedData {
  forecastRevenue: number;
  revenueMonth: number;
  bookingsMonth: number;
  date: string;
}

interface ChartPoint {
  month: string;
  actual?: number;
  forecast?: number;
}

function buildChartData(advData: AdvancedData | null): ChartPoint[] {
  const now = new Date();
  const points: ChartPoint[] = [];

  // Last 3 months actual (use revenueMonth for current month, estimate prior months)
  for (let i = 2; i >= 0; i--) {
    const d = subMonths(now, i);
    const label = format(startOfMonth(d), 'MMM yy', { locale: th });
    // Only current month has real data; prior months show as estimate (null if no data)
    const isCurrentMonth = i === 0;
    points.push({
      month: label,
      actual: isCurrentMonth && advData ? advData.revenueMonth : undefined,
    });
  }

  // Next month forecast
  const nextMonth = addDays(now, 30);
  const forecastLabel = format(startOfMonth(nextMonth), 'MMM yy', { locale: th });
  points.push({
    month: forecastLabel,
    forecast: advData?.forecastRevenue,
  });

  return points;
}

const fmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

function ForecastTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: ฿{fmt.format(p.value)}
        </p>
      ))}
    </div>
  );
}

function ForecastingTab({ hotelId }: { hotelId: string }) {
  const [advData, setAdvData] = useState<AdvancedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/analytics/advanced?hotelId=${hotelId}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!cancelled && json) setAdvData(json as AdvancedData);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hotelId]);

  // Booking pace = bookingsMonth / days elapsed this month
  const now = new Date();
  const daysElapsed = now.getDate();
  const bookingPace = advData && daysElapsed > 0
    ? (advData.bookingsMonth / daysElapsed).toFixed(1)
    : null;

  const chartData = buildChartData(advData);

  return (
    <>
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Forecast Revenue */}
        <Card>
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Forecast Revenue (30 วัน)</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {loading ? '...' : advData ? `฿${fmt.format(advData.forecastRevenue)}` : '—'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">คาดการณ์รายได้เดือนนี้</p>
            </div>
            <div className="rounded-xl border bg-muted/50 p-2">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Booking Pace */}
        <Card>
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Booking Pace</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {loading ? '...' : bookingPace !== null ? `${bookingPace} /วัน` : '—'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">อัตราการจอง 7 วันล่าสุด</p>
            </div>
            <div className="rounded-xl border bg-muted/50 p-2">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Confidence */}
        <Card>
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-600">Medium</p>
              <p className="mt-1 text-xs text-muted-foreground">ขึ้นอยู่กับปริมาณข้อมูลที่มี</p>
            </div>
            <div className="rounded-xl border bg-muted/50 p-2">
              <Info className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Area Chart: Actual + Forecast */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue Actual vs Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">กำลังโหลด...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004B87" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#004B87" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C66A30" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C66A30" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ForecastTip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#004B87"
                  strokeWidth={2}
                  fill="url(#gradActual)"
                  dot={{ fill: '#004B87', r: 4 }}
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="#C66A30"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  fill="url(#gradForecast)"
                  dot={{ fill: '#C66A30', r: 4 }}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Info note */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">ระบบ AI จะคำนวณค่าพยากรณ์อัตโนมัติ</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            เมื่อมีข้อมูล occupancy และ booking ที่เพียงพอ ความแม่นยำของการพยากรณ์จะเพิ่มขึ้น
            ค่า Confidence จะเปลี่ยนเป็น High เมื่อมีข้อมูลอย่างน้อย 3 เดือน
          </p>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Abandoned Bookings Tab
// ════════════════════════════════════════════════════════════════════════════
function AbandonedTab({ hotelId }: { hotelId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/revenue/abandoned');
    if (res.ok) { const j = await res.json(); setRows(j.data || []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function sendRecovery(id: string) {
    setSending(id);
    const res = await fetch('/api/revenue/abandoned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setSending(null);
    if (!res.ok) { toast.error('ส่งไม่สำเร็จ'); return; }
    const { data } = await res.json();
    setRows(prev => prev.map(r => r.id === id ? data : r));
    toast.success('ทำเครื่องหมาย recovery sent แล้ว');
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Abandoned Bookings ({rows.length} รายการ)</p>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">ไม่มี Abandoned Bookings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm">{r.guest_email || '—'}</span>
                    {r.recovered && (
                      <span className="text-2xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                        Recovered
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {r.room_type && <span>ห้อง: {r.room_type}</span>}
                    {r.check_in && <span>Check-in: {format(new Date(r.check_in), 'd MMM yyyy', { locale: th })}</span>}
                    {r.check_out && <span>Check-out: {format(new Date(r.check_out), 'd MMM yyyy', { locale: th })}</span>}
                    {r.last_step && <span>ขั้นตอนสุดท้าย: {r.last_step}</span>}
                  </div>
                  <div className="text-xs mt-1">
                    {r.recovery_sent_at ? (
                      <span className="text-emerald-600">ส่งแล้ว ({format(new Date(r.recovery_sent_at), 'd MMM HH:mm', { locale: th })})</span>
                    ) : (
                      <span className="text-muted-foreground">ยังไม่ส่ง</span>
                    )}
                  </div>
                </div>
                {!r.recovery_sent_at && !r.recovered && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendRecovery(r.id)}
                    disabled={sending === r.id}
                  >
                    {sending === r.id ? 'กำลังส่ง...' : 'ส่ง Recovery Email'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
