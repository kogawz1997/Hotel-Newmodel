'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, Plus, Minus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const AMENITIES = [
  { key: 'soap', label: 'สบู่', unit: 'ก้อน', minStock: 2 },
  { key: 'shampoo', label: 'แชมพู', unit: 'ขวด', minStock: 1 },
  { key: 'conditioner', label: 'ครีมนวด', unit: 'ขวด', minStock: 1 },
  { key: 'body_lotion', label: 'โลชั่น', unit: 'ขวด', minStock: 1 },
  { key: 'towel_bath', label: 'ผ้าเช็ดตัว', unit: 'ผืน', minStock: 2 },
  { key: 'towel_face', label: 'ผ้าเช็ดหน้า', unit: 'ผืน', minStock: 2 },
  { key: 'towel_pool', label: 'ผ้าสระ', unit: 'ผืน', minStock: 1 },
  { key: 'toilet_paper', label: 'กระดาษชำระ', unit: 'ม้วน', minStock: 2 },
  { key: 'toothbrush', label: 'แปรงสีฟัน', unit: 'อัน', minStock: 2 },
  { key: 'toothpaste', label: 'ยาสีฟัน', unit: 'หลอด', minStock: 1 },
  { key: 'slippers', label: 'รองเท้าแตะ', unit: 'คู่', minStock: 2 },
  { key: 'bathrobe', label: 'เสื้อคลุม', unit: 'ตัว', minStock: 2 },
];

type InventoryMap = Record<string, Record<string, number>>;

export function AmenitiesClient({ hotelId, rooms, inventory }: { hotelId: string; rooms: any[]; inventory: any[] }) {
  const supabase = createClient();

  const [inv, setInv] = useState<InventoryMap>(() => {
    const map: InventoryMap = {};
    inventory.forEach(i => {
      if (!map[i.room_id]) map[i.room_id] = {};
      map[i.room_id][i.amenity_key] = Number(i.quantity || 0);
    });
    return map;
  });
  const [selectedRoom, setSelectedRoom] = useState<string>(rooms[0]?.id || '');
  const [saving, setSaving] = useState<string | null>(null);

  async function adjust(roomId: string, amenityKey: string, delta: number) {
    const current = inv[roomId]?.[amenityKey] ?? 0;
    const next = Math.max(0, current + delta);
    setInv(p => ({ ...p, [roomId]: { ...p[roomId], [amenityKey]: next } }));
    const k = `${roomId}-${amenityKey}`;
    setSaving(k);
    const { error } = await supabase.from('room_amenity_inventory').upsert({
      hotel_id: hotelId, room_id: roomId, amenity_key: amenityKey, quantity: next,
    }, { onConflict: 'room_id,amenity_key' });
    setSaving(null);
    if (error) toast.error('บันทึกไม่สำเร็จ');
  }

  async function restockRoom(roomId: string) {
    const updates = AMENITIES.map(a => ({
      hotel_id: hotelId, room_id: roomId, amenity_key: a.key, quantity: a.minStock * 2,
    }));
    await supabase.from('room_amenity_inventory').upsert(updates, { onConflict: 'room_id,amenity_key' });
    const full: Record<string, number> = {};
    AMENITIES.forEach(a => { full[a.key] = a.minStock * 2; });
    setInv(p => ({ ...p, [roomId]: full }));
    toast.success('เติม Amenity ครบแล้ว');
  }

  const lowStockRooms = rooms.filter(r => {
    const roomInv = inv[r.id] || {};
    return AMENITIES.some(a => (roomInv[a.key] ?? 0) < a.minStock);
  });

  const room = rooms.find(r => r.id === selectedRoom);
  const roomInv = inv[selectedRoom] || {};

  return (
    <div className="space-y-4">
      {lowStockRooms.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <p>{lowStockRooms.length} ห้องมี amenity ต่ำกว่าขั้นต่ำ: {lowStockRooms.slice(0, 5).map(r => `ห้อง ${r.room_number}`).join(', ')}{lowStockRooms.length > 5 ? '...' : ''}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">เลือกห้อง</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {rooms.map(r => {
                const low = AMENITIES.some(a => (inv[r.id]?.[a.key] ?? 0) < a.minStock);
                return (
                  <button key={r.id} onClick={() => setSelectedRoom(r.id)}
                    className={cn('flex items-center justify-between w-full px-3 py-2.5 text-sm text-left transition-colors', selectedRoom === r.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50')}>
                    <span>ห้อง {r.room_number}</span>
                    {low && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-label="ต่ำกว่าขั้นต่ำ" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {selectedRoom && room && (
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />ห้อง {room.room_number}
              </CardTitle>
              <button onClick={() => restockRoom(selectedRoom)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                aria-label="เติม amenity ทั้งหมด">
                <RotateCcw className="h-3 w-3" />เติมครบ
              </button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AMENITIES.map(a => {
                  const qty = roomInv[a.key] ?? 0;
                  const isLow = qty < a.minStock;
                  const k = `${selectedRoom}-${a.key}`;
                  return (
                    <div key={a.key} className={cn('rounded-xl border p-3', isLow ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30' : 'border-border')}>
                      <p className="text-xs font-medium mb-2">{a.label}</p>
                      <div className="flex items-center justify-between">
                        <button onClick={() => adjust(selectedRoom, a.key, -1)} disabled={qty === 0 || saving === k}
                          aria-label={`ลด ${a.label}`} className="h-7 w-7 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-40 transition-colors">
                          <Minus className="h-3 w-3" />
                        </button>
                        <div className="text-center">
                          <span className={cn('font-bold text-sm', isLow ? 'text-amber-600' : '')}>{qty}</span>
                          <span className="text-2xs text-muted-foreground block">{a.unit}</span>
                        </div>
                        <button onClick={() => adjust(selectedRoom, a.key, 1)} disabled={saving === k}
                          aria-label={`เพิ่ม ${a.label}`} className="h-7 w-7 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-40 transition-colors">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      {isLow && <p className="text-2xs text-amber-600 mt-1 text-center">ขั้นต่ำ {a.minStock}</p>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
