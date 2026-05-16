'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export function SatisfactionChart({ data }: { data: { label: string; avg: number; count: number }[] }) {
  const hasData = data.some(d => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          แนวโน้มคะแนนความพึงพอใจ
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground py-8 text-center">ยังไม่มีรีวิวในช่วงเวลานี้</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: any, _: any, props: any) => [`${Number(v).toFixed(2)} ⭐ (${props.payload.count} รีวิว)`, 'คะแนนเฉลี่ย']}
                labelStyle={{ fontSize: 11 }}
              />
              <ReferenceLine y={4} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'เป้าหมาย 4.0', fontSize: 10, fill: '#22c55e', position: 'right' }} />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6 }}
                name="คะแนนเฉลี่ย"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
