'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

const COMMON_PAIRS = [
  { from: 'USD', to: 'THB', flag: '🇺🇸' },
  { from: 'EUR', to: 'THB', flag: '🇪🇺' },
  { from: 'GBP', to: 'THB', flag: '🇬🇧' },
  { from: 'JPY', to: 'THB', flag: '🇯🇵' },
  { from: 'CNY', to: 'THB', flag: '🇨🇳' },
  { from: 'SGD', to: 'THB', flag: '🇸🇬' },
  { from: 'AUD', to: 'THB', flag: '🇦🇺' },
  { from: 'KRW', to: 'THB', flag: '🇰🇷' },
];

type FXRate = { id?: string; from_currency: string; to_currency: string; rate: number; effective_date: string };

export function FXClient() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [rates, setRates] = useState<FXRate[]>(
    COMMON_PAIRS.map(p => ({ from_currency: p.from, to_currency: p.to, rate: 0, effective_date: today }))
  );
  const [saving, setSaving] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customRate, setCustomRate] = useState('');

  function updateRate(idx: number, val: string) {
    setRates(p => p.map((r, i) => i === idx ? { ...r, rate: Number(val) || 0 } : r));
  }

  async function saveRates() {
    const valid = rates.filter(r => r.rate > 0);
    if (!valid.length) { toast.error('กรอกอัตราแลกเปลี่ยนอย่างน้อย 1 รายการ'); return; }
    setSaving(true);
    const { error } = await supabase.from('fx_rates').upsert(
      valid.map(r => ({ from_currency: r.from_currency, to_currency: r.to_currency, rate: r.rate, effective_date: today })),
      { onConflict: 'from_currency,to_currency,effective_date' }
    );
    setSaving(false);
    if (error) toast.error('บันทึกไม่สำเร็จ: ' + error.message);
    else toast.success('บันทึกอัตราแลกเปลี่ยนแล้ว');
  }

  function addCustom() {
    if (!customFrom.trim() || !customRate) { toast.error('กรอกสกุลเงินและอัตรา'); return; }
    const code = customFrom.toUpperCase().trim();
    if (rates.find(r => r.from_currency === code)) { toast.error('มีสกุลเงินนี้แล้ว'); return; }
    setRates(p => [...p, { from_currency: code, to_currency: 'THB', rate: Number(customRate), effective_date: today }]);
    setCustomFrom(''); setCustomRate('');
  }

  function removeRate(idx: number) {
    setRates(p => p.filter((_, i) => i !== idx));
  }

  const sampleAmount = 1000;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />ตั้งค่าอัตราแลกเปลี่ยนประจำวัน ({today})
        </CardTitle>
        <button
          onClick={saveRates} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          aria-label="บันทึกอัตราแลกเปลี่ยน">
          <Save className="h-3 w-3" />{saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">กรอกอัตราแลกเปลี่ยน 1 หน่วยต่อ THB สำหรับใช้คำนวณกระทบยอด</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rates.map((r, i) => {
            const pair = COMMON_PAIRS.find(p => p.from === r.from_currency);
            return (
              <div key={r.from_currency} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="w-12 text-center">
                  <div className="text-lg leading-none">{pair?.flag || '💱'}</div>
                  <div className="text-xs font-mono font-bold mt-0.5">{r.from_currency}</div>
                </div>
                <div className="flex-1">
                  <label className="text-2xs text-muted-foreground block mb-1">1 {r.from_currency} = ? THB</label>
                  <input
                    type="number" step="0.01" min="0" value={r.rate || ''}
                    onChange={e => updateRate(i, e.target.value)}
                    placeholder="0.00"
                    aria-label={`อัตรา ${r.from_currency} ต่อ THB`}
                    className="w-full px-2 py-1.5 bg-secondary border-0 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {r.rate > 0 && (
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{sampleAmount} {r.from_currency}</div>
                    <div className="font-medium text-foreground">{formatCurrency(sampleAmount * r.rate)}</div>
                  </div>
                )}
                {!pair && (
                  <button onClick={() => removeRate(i)} aria-label="ลบสกุลเงิน"
                    className="p-1 rounded hover:bg-destructive/10 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <input
            value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            placeholder="รหัสสกุลเงิน เช่น HKD"
            aria-label="รหัสสกุลเงินใหม่"
            className="w-36 px-3 py-2 bg-secondary border-0 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="number" step="0.01" value={customRate} onChange={e => setCustomRate(e.target.value)}
            placeholder="อัตราต่อ THB"
            aria-label="อัตราแลกเปลี่ยน"
            className="flex-1 px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={addCustom} aria-label="เพิ่มสกุลเงิน"
            className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <Plus className="h-3.5 w-3.5" />เพิ่ม
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
