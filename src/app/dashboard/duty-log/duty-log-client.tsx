'use client';
import { useState } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ClipboardList } from 'lucide-react';

function fmt(iso: string) {
  return new Date(iso).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
}

export function DutyLogClient({ logs: initLogs, profile }: any) {
  const [logs, setLogs] = useState<any[]>(initLogs);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function addLog() {
    if (!text.trim()) return;
    setSaving(true);
    const res = await fetch('/api/work-orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'other', title: `Duty Log: ${text.slice(0, 60)}`, notes: text, priority: 'low', source: 'manual' }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error('บันทึกไม่สำเร็จ'); return; }
    setLogs(prev => [{ ...data, requester: { full_name: profile?.full_name } }, ...prev]);
    setText('');
    toast.success('บันทึก Duty Log แล้ว');
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar title="Duty Log" description="บันทึกการตัดสินใจและเหตุการณ์ประจำวัน" />
      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full space-y-4">
        <Card>
          <CardContent className="pt-4 space-y-3">
            <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" rows={4} placeholder="บันทึกเหตุการณ์, การตัดสินใจ, หรือข้อสังเกตประจำวัน..." value={text} onChange={e => setText(e.target.value)} />
            <Button className="w-full" onClick={addLog} disabled={saving || !text.trim()}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </CardContent>
        </Card>
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">ยังไม่มีรายการ</p></div>
          ) : logs.map((l: any) => (
            <Card key={l.id}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{l.requester?.full_name ?? 'ไม่ระบุ'}</span>
                  <span className="text-xs text-muted-foreground">{fmt(l.created_at)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{l.notes ?? l.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
