'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, UtensilsCrossed, Bell, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DIETARY_COLORS: Record<string, string> = {
  vegan: 'bg-green-100 text-green-700',
  vegetarian: 'bg-emerald-100 text-emerald-700',
  halal: 'bg-teal-100 text-teal-700',
  kosher: 'bg-blue-100 text-blue-700',
  gluten_free: 'bg-amber-100 text-amber-700',
  lactose_free: 'bg-orange-100 text-orange-700',
};

const ALLERGY_COLOR = 'bg-red-100 text-red-700';

type Guest = {
  id: string;
  guest_name: string;
  room_id: string | null;
  dietary_requirements: string[] | string | null;
  allergies: string[] | string | null;
  special_requests: string | null;
  rooms: { room_number: string } | null;
};

type Order = {
  id: string;
  created_at: string;
  table_number: string | null;
  status: string;
  reservation_id: string | null;
  fb_order_items: { name: string; qty: number; menu_item_id: string }[];
};

function parseList(val: string[] | string | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  try { return JSON.parse(val); } catch { return val.split(',').map(s => s.trim()).filter(Boolean); }
}

export function DietaryAlertsClient({ hotelId, guests, activeOrders }: { hotelId: string; guests: Guest[]; activeOrders: Order[] }) {
  const [notified, setNotified] = useState<Set<string>>(new Set());

  function notifyKitchen(guestId: string, guestName: string) {
    setNotified(p => new Set([...p, guestId]));
    toast.success(`แจ้งครัวสำหรับ ${guestName} แล้ว`, { description: 'ข้อมูลอาหารถูกส่งให้ครัวแล้ว' });
  }

  const guestsWithAllergies = guests.filter(g => parseList(g.allergies).length > 0);
  const guestsWithDietary = guests.filter(g => parseList(g.dietary_requirements).length > 0);

  return (
    <div className="space-y-4">
      {guestsWithAllergies.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p><strong>{guestsWithAllergies.length}</strong> แขกที่เช็คอินอยู่มีข้อมูลการแพ้อาหาร — ตรวจสอบก่อนปรุง</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />แพ้อาหาร ({guestsWithAllergies.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {guestsWithAllergies.length === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีแขกแพ้อาหาร</p>
            ) : guestsWithAllergies.map(g => (
              <div key={g.id} className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{g.guest_name}</p>
                    <p className="text-xs text-muted-foreground">ห้อง {g.rooms?.room_number || '—'}</p>
                  </div>
                  <button
                    onClick={() => notifyKitchen(g.id, g.guest_name)}
                    aria-label={`แจ้งครัวสำหรับ ${g.guest_name}`}
                    className={cn('flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-colors',
                      notified.has(g.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700 hover:bg-red-200')}>
                    {notified.has(g.id) ? <><CheckCircle className="h-3 w-3" />แจ้งแล้ว</> : <><Bell className="h-3 w-3" />แจ้งครัว</>}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {parseList(g.allergies).map(a => (
                    <Badge key={a} className={`${ALLERGY_COLOR} border-0 text-2xs`}>⚠ {a}</Badge>
                  ))}
                </div>
                {g.special_requests && <p className="text-xs text-muted-foreground mt-1.5">{g.special_requests}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><UtensilsCrossed className="h-4 w-4" />ข้อจำกัดด้านอาหาร ({guestsWithDietary.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {guestsWithDietary.length === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีข้อจำกัด</p>
            ) : guestsWithDietary.map(g => (
              <div key={g.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{g.guest_name}</p>
                    <p className="text-xs text-muted-foreground">ห้อง {g.rooms?.room_number || '—'}</p>
                  </div>
                  <button
                    onClick={() => notifyKitchen(g.id, g.guest_name)}
                    aria-label={`แจ้งครัวสำหรับ ${g.guest_name}`}
                    className={cn('flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-colors',
                      notified.has(g.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary hover:bg-secondary/80')}>
                    {notified.has(g.id) ? <><CheckCircle className="h-3 w-3" />แจ้งแล้ว</> : <><Bell className="h-3 w-3" />แจ้งครัว</>}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {parseList(g.dietary_requirements).map(d => (
                    <Badge key={d} className={`${DIETARY_COLORS[d] || 'bg-secondary text-muted-foreground'} border-0 text-2xs`}>{d}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {activeOrders.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">ออร์เดอร์ที่กำลังปรุง — ตรวจสอบการแพ้อาหาร</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {activeOrders.map(o => {
              const linked = guests.find(g => g.id === o.reservation_id);
              const hasAlert = linked && (parseList(linked.allergies).length > 0 || parseList(linked.dietary_requirements).length > 0);
              return (
                <div key={o.id} className={cn('flex items-start gap-3 rounded-xl border p-3', hasAlert ? 'border-amber-300 bg-amber-50/50' : 'border-border')}>
                  {hasAlert && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {o.table_number ? `โต๊ะ ${o.table_number}` : 'Room Service'} · {o.status === 'preparing' ? 'กำลังปรุง' : 'รับออร์เดอร์'}
                    </p>
                    <p className="text-xs text-muted-foreground">{o.fb_order_items.map(i => `${i.name} ×${i.qty}`).join(', ')}</p>
                    {linked && hasAlert && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {parseList(linked.allergies).map(a => <Badge key={a} className="bg-red-100 text-red-700 border-0 text-2xs">⚠ แพ้ {a}</Badge>)}
                        {parseList(linked.dietary_requirements).map(d => <Badge key={d} className="bg-amber-100 text-amber-700 border-0 text-2xs">{d}</Badge>)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
