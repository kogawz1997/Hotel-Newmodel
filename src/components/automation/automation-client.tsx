'use client';

import { useState } from 'react';
import { Play, CheckCircle, AlertCircle, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  channel: string;
  enabled: boolean;
  template_key?: string;
};

type TestPreview = {
  trigger: string;
  channel: string;
  message: string;
  wouldSendTo: {
    guestName: string;
    email: string;
    phone?: string | null;
    reservationCode: string;
    checkIn: string;
    checkOut: string;
  };
};

const TRIGGER_LABELS: Record<string, string> = {
  checkin_minus_1_day: 'ก่อนเช็กอิน 1 วัน',
  checkout_day: 'วันเช็กเอาต์',
  payment_overdue: 'ค้างชำระ',
  booking_created: 'สร้างการจองใหม่',
  post_checkout_review: 'หลังเช็กเอาต์ / ขอรีวิว',
};

function RuleRow({ rule }: { rule: AutomationRule }) {
  const [testing, setTesting] = useState(false);
  const [preview, setPreview] = useState<TestPreview | null>(null);
  const [enabled, setEnabled] = useState(rule.enabled);
  const [toggling, setToggling] = useState(false);

  async function handleTest() {
    setTesting(true);
    setPreview(null);
    try {
      const res = await fetch('/api/automation/rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId: rule.id }),
      });
      const d = await res.json();
      if (res.ok && d.preview) {
        setPreview(d.preview);
        toast.success('Test run complete — ดูตัวอย่างข้อความด้านล่าง');
      } else {
        toast.error(d.error?.formErrors?.[0] || d.error || 'ทดสอบไม่สำเร็จ');
      }
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้');
    } finally {
      setTesting(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      const res = await fetch('/api/automation/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, enabled: !enabled }),
      });
      if (res.ok) {
        setEnabled(!enabled);
        toast.success(enabled ? 'ปิด automation แล้ว' : 'เปิด automation แล้ว');
      } else {
        toast.error('อัปเดตไม่สำเร็จ');
      }
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้');
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{rule.name}</p>
            <span className={cn(
              'text-2xs px-1.5 py-0.5 rounded-full font-medium',
              enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
            )}>
              {enabled ? 'เปิดใช้งาน' : 'ปิดอยู่'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {TRIGGER_LABELS[rule.trigger] || rule.trigger} · {rule.channel}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={enabled ? 'ปิด automation' : 'เปิด automation'}
          >
            {toggling ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : enabled ? (
              <ToggleRight className="h-5 w-5 text-emerald-600" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-accent/10 hover:text-accent text-muted-foreground transition-colors"
          >
            {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {testing ? 'กำลังทดสอบ...' : 'ทดสอบ'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            Dry-run preview — ไม่ได้ส่งจริง
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div><span className="text-muted-foreground">แขก: </span>{preview.wouldSendTo.guestName}</div>
            <div><span className="text-muted-foreground">จอง: </span>{preview.wouldSendTo.reservationCode}</div>
            <div><span className="text-muted-foreground">ส่งไปที่: </span>{preview.wouldSendTo.email}</div>
            <div><span className="text-muted-foreground">ช่องทาง: </span>{preview.channel}</div>
          </div>
          {preview.message && (
            <div className="mt-1 pt-2 border-t border-emerald-200 dark:border-emerald-900">
              <p className="text-xs text-muted-foreground mb-0.5">ข้อความ:</p>
              <p className="text-xs whitespace-pre-wrap">{preview.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AutomationClient({ rules }: { rules: AutomationRule[] }) {
  if (rules.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-8 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">ยังไม่มี automation rule</p>
        <p className="text-xs text-muted-foreground mt-1">สร้าง rule แรกผ่าน API หรือ Supabase dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <RuleRow key={rule.id} rule={rule} />
      ))}
    </div>
  );
}
