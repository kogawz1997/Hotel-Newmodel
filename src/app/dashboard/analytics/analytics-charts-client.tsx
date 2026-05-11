'use client';

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

interface DayPoint {
  date: string;
  label: string;
  revenue: number;
  reservations: number;
  occupancy: number;
}

interface Props {
  trend: DayPoint[];
  currency: string;
}

const fmt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

function MoneyTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === 'Revenue' ? `฿${fmt.format(p.value)}` : p.value}
        </p>
      ))}
    </div>
  );
}

export function AnalyticsChartsClient({ trend, currency }: Props) {
  if (!trend.length) return null;

  return (
    <div className="grid gap-6 mt-6 lg:grid-cols-2">
      {/* Revenue trend */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Revenue 30 วันล่าสุด (฿)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<MoneyTip />} />
            <Bar dataKey="revenue" name="Revenue" fill="#C66A30" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Occupancy + Reservations trend */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Occupancy % & การจอง 30 วันล่าสุด</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis yAxisId="occ" tick={{ fontSize: 10 }} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
            <YAxis yAxisId="res" orientation="right" tick={{ fontSize: 10 }} tickLine={false} />
            <Tooltip content={<MoneyTip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line yAxisId="occ" type="monotone" dataKey="occupancy" name="Occupancy %" stroke="#004B87" strokeWidth={2} dot={false} />
            <Line yAxisId="res" type="monotone" dataKey="reservations" name="การจอง" stroke="#C66A30" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
