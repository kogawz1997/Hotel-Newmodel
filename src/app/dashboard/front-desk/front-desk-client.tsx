'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  LogIn, LogOut, Bed, Users, Clock, Phone, Mail,
  CheckCircle2, Search, RefreshCw, Radio,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  hotelId: string;
  hotel: any;
  arrivals: any[];
  departures: any[];
  inHouse: any[];
  rooms: any[];
  today: string;
}

const ROOM_STATUS_COLOR: Record<string, string> = {
  available:   'bg-emerald-100 text-emerald-800 border-emerald-200',
  occupied:    'bg-blue-100 text-blue-800 border-blue-200',
  cleaning:    'bg-amber-100 text-amber-800 border-amber-200',
  maintenance: 'bg-red-100 text-red-800 border-red-200',
  blocked:     'bg-gray-100 text-gray-500 border-gray-200',
  inspecting:  'bg-purple-100 text-purple-800 border-purple-200',
};

const ROOM_STATUS_TH: Record<string, string> = {
  available: 'ว่าง', occupied: 'มีผู้เข้าพัก', cleaning: 'กำลังทำความสะอาด',
  maintenance: 'ซ่อมบำรุง', blocked: 'ปิดใช้', inspecting: 'ตรวจสอบ',
};

function guestName(g: any) {
  if (!g) return '—';
  const src = Array.isArray(g) ? g[0] : g;
  return `${src?.first_name || ''} ${src?.last_name || ''}`.trim() || '—';
}

function roomNum(r: any) {
  const src = Array.isArray(r) ? r[0] : r;
  return src?.room_number || '—';
}

export function FrontDeskClient({ hotelId, hotel, arrivals, departures, inHouse, rooms, today }: Props) {
  const [tab, setTab] = useState<'arrivals' | 'departures' | 'inhouse' | 'rooms'>('arrivals');
  const [search, setSearch] = useState('');
  const [pending, startTransition] = useTransition();
  const [liveIndicator, setLiveIndicator] = useState(false);

  // Realtime: refresh page when reservations or rooms change
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`front-desk-live-${hotelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `hotel_id=eq.${hotelId}` }, () => {
        setLiveIndicator(true);
        toast.info('ข้อมูลการจองอัปเดตแล้ว — กดรีเฟรชเพื่อโหลดใหม่', { duration: 4000 });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `hotel_id=eq.${hotelId}` }, () => {
        setLiveIndicator(true);
        toast.info('สถานะห้องเปลี่ยนแปลง — กดรีเฟรชเพื่อโหลดใหม่', { duration: 4000 });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hotelId]);

  async function doCheckIn(reservationId: string) {
    const res = await fetch(`/api/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check_in' }),
    });
    if (res.ok) {
      toast.success('Check-in สำเร็จ');
      startTransition(() => { /* trigger re-render hint */ });
      setTimeout(() => window.location.reload(), 800);
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || 'Check-in ไม่สำเร็จ');
    }
  }

  async function doCheckOut(reservationId: string) {
    const res = await fetch(`/api/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check_out' }),
    });
    if (res.ok) {
      toast.success('Check-out สำเร็จ');
      setTimeout(() => window.location.reload(), 800);
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || 'Check-out ไม่สำเร็จ');
    }
  }

  const filterTerm = search.toLowerCase();
  const filterRes = (list: any[]) =>
    list.filter(r =>
      !filterTerm ||
      guestName(r.guests).toLowerCase().includes(filterTerm) ||
      (r.reservation_code || '').toLowerCase().includes(filterTerm) ||
      roomNum(r.rooms).toLowerCase().includes(filterTerm)
    );

  const floors = [...new Set(rooms.map((r: any) => r.floor || '1'))].sort();

  const TABS = [
    { key: 'arrivals',   label: 'เช็คอินวันนี้',   count: arrivals.length,   icon: LogIn },
    { key: 'departures', label: 'เช็คเอาท์วันนี้',  count: departures.length,  icon: LogOut },
    { key: 'inhouse',    label: 'In House',           count: inHouse.length,     icon: Users },
    { key: 'rooms',      label: 'สถานะห้อง',         count: rooms.length,       icon: Bed },
  ] as const;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Front Desk</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(today + 'T00:00:00'), 'EEEE d MMMM yyyy', { locale: th })}
            {' · '}{hotel.check_in_time || '14:00'}–{hotel.check_out_time || '12:00'}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-colors',
            liveIndicator ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'hover:bg-secondary'
          )}
        >
          {liveIndicator
            ? <><Radio className="h-3.5 w-3.5 animate-pulse" /> มีอัปเดต</>
            : <><RefreshCw className="h-3.5 w-3.5" /> รีเฟรช</>
          }
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'เช็คอินรอ', value: arrivals.length, color: 'text-emerald-600' },
          { label: 'เช็คเอาท์รอ', value: departures.length, color: 'text-amber-600' },
          { label: 'In House', value: inHouse.length, color: 'text-blue-600' },
          {
            label: 'ห้องว่าง',
            value: rooms.filter((r: any) => r.status === 'available').length,
            color: 'text-purple-600',
          },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className={cn('text-3xl font-bold mt-0.5', kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                'text-2xs px-1.5 py-0.5 rounded-full font-medium',
                tab === t.key ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search (not shown for rooms tab) */}
      {tab !== 'rooms' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อแขก, รหัสจอง, หมายเลขห้อง..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          />
        </div>
      )}

      {/* Arrivals */}
      {tab === 'arrivals' && (
        <div className="space-y-2">
          {filterRes(arrivals).length === 0 && (
            <EmptyState icon={CheckCircle2} message="ไม่มีรายการเช็คอินวันนี้" />
          )}
          {filterRes(arrivals).map(r => (
            <ReservationRow
              key={r.id}
              reservation={r}
              action={
                <button
                  onClick={() => doCheckIn(r.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" /> Check-in
                </button>
              }
            />
          ))}
        </div>
      )}

      {/* Departures */}
      {tab === 'departures' && (
        <div className="space-y-2">
          {filterRes(departures).length === 0 && (
            <EmptyState icon={CheckCircle2} message="ไม่มีรายการเช็คเอาท์วันนี้" />
          )}
          {filterRes(departures).map(r => (
            <ReservationRow
              key={r.id}
              reservation={r}
              action={
                <button
                  onClick={() => doCheckOut(r.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Check-out
                </button>
              }
            />
          ))}
        </div>
      )}

      {/* In House */}
      {tab === 'inhouse' && (
        <div className="space-y-2">
          {filterRes(inHouse).length === 0 && (
            <EmptyState icon={Users} message="ไม่มีผู้เข้าพักในขณะนี้" />
          )}
          {filterRes(inHouse).map(r => (
            <ReservationRow key={r.id} reservation={r} />
          ))}
        </div>
      )}

      {/* Room Status Board */}
      {tab === 'rooms' && (
        <div className="space-y-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(ROOM_STATUS_TH).map(([k, v]) => (
              <span key={k} className={cn('text-xs px-2.5 py-1 rounded-full border font-medium', ROOM_STATUS_COLOR[k])}>
                {v}
              </span>
            ))}
          </div>
          {floors.map(floor => (
            <div key={floor}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                ชั้น {floor}
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {rooms.filter((r: any) => (r.floor || '1') === floor).map((room: any) => {
                  const rtName = Array.isArray(room.room_types) ? room.room_types[0]?.name : room.room_types?.name;
                  return (
                    <div
                      key={room.id}
                      className={cn(
                        'rounded-xl border p-2 text-center cursor-default select-none',
                        ROOM_STATUS_COLOR[room.status] || 'bg-gray-50 border-gray-100 text-gray-500'
                      )}
                      title={`${room.room_number} — ${ROOM_STATUS_TH[room.status] || room.status}${rtName ? ` (${rtName})` : ''}`}
                    >
                      <p className="text-sm font-bold leading-none">{room.room_number}</p>
                      <p className="text-2xs mt-1 opacity-70 leading-tight truncate">{ROOM_STATUS_TH[room.status] || room.status}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {rooms.length === 0 && <EmptyState icon={Bed} message="ไม่พบข้อมูลห้อง" />}
        </div>
      )}
    </div>
  );
}

function ReservationRow({ reservation: r, action }: { reservation: any; action?: React.ReactNode }) {
  const guest = Array.isArray(r.guests) ? r.guests[0] : r.guests;
  const room = Array.isArray(r.rooms) ? r.rooms[0] : r.rooms;
  const roomType = Array.isArray(r.room_types) ? r.room_types[0] : r.room_types;

  return (
    <div className="flex items-center gap-4 bg-white border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
        {(guest?.first_name || '?').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-foreground">
            {guest?.first_name} {guest?.last_name || ''}
          </span>
          <span className="text-2xs font-mono bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
            {r.reservation_code}
          </span>
          {room?.room_number && (
            <span className="text-2xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 font-medium">
              ห้อง {room.room_number}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          {roomType?.name && <span>{roomType.name}</span>}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />{r.num_adults} คน
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(r.check_in + 'T00:00:00'), 'd MMM', { locale: th })} →{' '}
            {format(new Date(r.check_out + 'T00:00:00'), 'd MMM', { locale: th })}
          </span>
          {guest?.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />{guest.phone}
            </span>
          )}
          {guest?.email && (
            <span className="flex items-center gap-1 hidden sm:flex">
              <Mail className="h-3 w-3" />{guest.email}
            </span>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
      <Icon className="h-10 w-10 opacity-20" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
