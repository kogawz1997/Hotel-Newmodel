'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const OTA_CHANNELS = ['Booking.com', 'Agoda', 'Expedia', 'Airbnb', 'Trip.com', 'Hotels.com'];

interface RateEntry { channel: string; rate: string; }

export function ParityClient({ hotelName, roomTypes }: { hotelName: string; roomTypes: any[] }) {
  const [selectedRoom, setSelectedRoom] = useState<any>(roomTypes[0] || null);
  const [directRate, setDirectRate] = useState(String(roomTypes[0]?.base_rate || ''));
  const [otaRates, setOtaRates] = useState<RateEntry[]>(OTA_CHANNELS.slice(0, 3).map(c => ({ channel: c, rate: '' })));
  const [checked, setChecked] = useState(false);

  function addChannel() {
    const remaining = OTA_CHANNELS.filter(c => !otaRates.some(r => r.channel === c));
    if (remaining.length === 0) return;
    setOtaRates(p => [...p, { channel: remaining[0], rate: '' }]);
  }

  function check() {
    if (!directRate) { toast.error('กรอกราคาตรงก่อน'); return; }
    setChecked(true);
  }

  const direct = Number(directRate);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">เลือกประเภทห้องและราคา</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {roomTypes.map(rt => (
              <button
                key={rt.id}
                onClick={() => { setSelectedRoom(rt); setDirectRate(String(rt.base_rate)); setChecked(false); }}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${selectedRoom?.id === rt.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
              >
                {rt.name}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              ราคาตรง (Direct / ราคาบนเว็บโรงแรม)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">฿</span>
              <input
                type="number"
                value={directRate}
                onChange={e => { setDirectRate(e.target.value); setChecked(false); }}
                className="w-40 px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="3000"
                aria-label="ราคาตรง"
              />
              <span className="text-xs text-muted-foreground">/ คืน</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">ราคาบน OTA Channels</label>
              <button onClick={addChannel} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus className="h-3 w-3" aria-hidden="true" /> เพิ่มช่องทาง
              </button>
            </div>
            <div className="space-y-2">
              {otaRates.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={entry.channel}
                    onChange={e => setOtaRates(p => p.map((r, j) => j === i ? { ...r, channel: e.target.value } : r))}
                    aria-label={`ช่องทาง OTA ${i + 1}`}
                    className="flex-1 px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {OTA_CHANNELS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <span className="text-sm text-muted-foreground">฿</span>
                  <input
                    type="number"
                    value={entry.rate}
                    onChange={e => { setOtaRates(p => p.map((r, j) => j === i ? { ...r, rate: e.target.value } : r)); setChecked(false); }}
                    placeholder="3200"
                    aria-label={`ราคา ${entry.channel}`}
                    className="w-32 px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button onClick={() => setOtaRates(p => p.filter((_, j) => j !== i))} aria-label="ลบช่องทาง" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={check}
            disabled={!directRate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> ตรวจสอบ Rate Parity
          </button>
        </CardContent>
      </Card>

      {checked && (
        <Card>
          <CardHeader><CardTitle className="text-sm">ผลการตรวจสอบ — {selectedRoom?.name}</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">ราคาตรง ({hotelName})</span>
              <span className="font-bold text-emerald-600">{formatCurrency(direct)}</span>
            </div>
            {otaRates.filter(r => r.rate).map(entry => {
              const ota = Number(entry.rate);
              const diff = ota - direct;
              const pct = direct > 0 ? (diff / direct) * 100 : 0;
              const ok = Math.abs(pct) <= 2;
              return (
                <div key={entry.channel} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    {ok
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="ราคาเท่ากัน" />
                      : <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="ราคาต่างกัน" />
                    }
                    <span className="text-sm">{entry.channel}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-sm">{formatCurrency(ota)}</span>
                    {diff !== 0 && (
                      <span className={`ml-2 text-xs ${diff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        ({diff > 0 ? '+' : ''}{formatCurrency(diff)}, {pct > 0 ? '+' : ''}{pct.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {otaRates.some(r => r.rate && Math.abs((Number(r.rate) - direct) / direct * 100) > 2) && (
              <div className="pt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <p>พบราคาที่ต่างกันเกิน 2% อาจส่งผลต่อ Rate Parity policy ของ OTA กรุณาตรวจสอบและปรับราคา</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
