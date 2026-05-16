'use client';

import { useEffect, useState, useMemo, Fragment, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TopBar } from '@/components/layout/top-bar';
import {
  ChevronLeft, ChevronRight, Plus, Calendar, List,
  Bed, ArrowRight, X, User, Clock, DollarSign, AlertCircle,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { addDays, format, startOfWeek, isSameDay, isToday, parseISO, isWithinInterval } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';

interface Room { id: string; room_number: string; room_type_id: string; }
interface RoomType { id: string; name: string; base_rate: number; }
interface Reservation {
  id: string; reservation_code: string; status: string;
  check_in: string; check_out: string; room_id?: string;
  total_amount: number; paid_amount: number; balance_amount: number;
  num_adults: number; num_children: number; nights: number;
  source: string; special_requests?: string; internal_notes?: string;
  guests: { id: string; first_name: string; last_name?: string; email?: string; phone?: string; nationality?: string };
  room_types?: { name: string };
  rooms?: { room_number: string };
}

// Parse DATE string (YYYY-MM-DD) safely without UTC shift
function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 dark:bg-amber-950 border-amber-300 text-amber-900 dark:text-amber-200',
  confirmed: 'bg-sky-100 dark:bg-sky-950 border-sky-300 text-sky-900 dark:text-sky-200',
  checked_in: 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 text-emerald-900 dark:text-emerald-200',
  checked_out: 'bg-secondary border-border text-muted-foreground',
  cancelled: 'bg-red-50 dark:bg-red-950/50 border-red-200 text-red-700 dark:text-red-300 line-through opacity-50',
  no_show: 'bg-red-100 dark:bg-red-950 border-red-300 text-red-900 dark:text-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'รอยืนยัน', confirmed: 'ยืนยันแล้ว', checked_in: 'เช็คอิน',
  checked_out: 'เช็คเอาท์', cancelled: 'ยกเลิก', no_show: 'ไม่มาพัก', on_hold: 'รอจอง',
};

export function ReservationsClient({ hotelId }: { hotelId: string }) {
  const supabase = createClient();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [isMobile, setIsMobile] = useState(false);
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragResvId, setDragResvId] = useState<string | null>(null);
  const [resizeResvId, setResizeResvId] = useState<string | null>(null);
  const [resizeTargetDay, setResizeTargetDay] = useState<Date | null>(null);
  const [listSearch, setListSearch] = useState('');
  const [listStatus, setListStatus] = useState('');
  const [listPage, setListPage] = useState(0);
  const PAGE_SIZE = 50;

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(startDate, i)), [startDate]);

  const load = useCallback(async () => {
    setLoading(true);
    const rangeStart = format(startDate, 'yyyy-MM-dd');
    const rangeEnd = format(addDays(startDate, 14), 'yyyy-MM-dd');

    const [{ data: rs }, { data: rts }, { data: resvs }] = await Promise.all([
      supabase.from('rooms').select('id, room_number, room_type_id').eq('hotel_id', hotelId).order('room_number'),
      supabase.from('room_types').select('id, name, base_rate').eq('hotel_id', hotelId),
      supabase.from('reservations')
        .select('id, reservation_code, status, check_in, check_out, room_id, total_amount, paid_amount, balance_amount, num_adults, num_children, nights, source, special_requests, internal_notes, guests(id, first_name, last_name, email, phone, nationality), room_types(name), rooms(room_number)')
        .eq('hotel_id', hotelId)
        .gte('check_out', rangeStart)
        .lte('check_in', rangeEnd),
    ]);
    setRooms(rs || []);
    setRoomTypes(rts || []);
    setReservations(resvs as any || []);
    setLoading(false);
  }, [hotelId, startDate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const applyViewport = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setView(current => (mobile && current === 'calendar' ? 'list' : current));
    };
    applyViewport();
    window.addEventListener('resize', applyViewport);
    return () => window.removeEventListener('resize', applyViewport);
  }, []);

  async function handleDropOnRoom(targetRoomId: string) {
    if (!dragResvId) return;
    const resv = reservations.find(r => r.id === dragResvId);
    if (!resv || resv.room_id === targetRoomId) { setDragResvId(null); return; }
    try {
      const res = await fetch(`/api/reservations/${dragResvId}/move-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: targetRoomId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'ย้ายห้องไม่สำเร็จ');
      toast.success('ย้ายห้องเรียบร้อย');
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDragResvId(null);
    }
  }

  async function handleResizeDrop(targetDay: Date) {
    if (!resizeResvId || !resizeTargetDay) { setResizeResvId(null); setResizeTargetDay(null); return; }
    const resv = reservations.find(r => r.id === resizeResvId);
    if (!resv) { setResizeResvId(null); setResizeTargetDay(null); return; }
    // newCheckOut = day after the target (checkout is exclusive)
    const newCheckOut = format(addDays(targetDay, 1), 'yyyy-MM-dd');
    if (newCheckOut <= resv.check_out) { setResizeResvId(null); setResizeTargetDay(null); return; }
    try {
      const res = await fetch(`/api/reservations/${resizeResvId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCheckOut, additionalAmount: 0, note: 'Drag-resize from calendar' }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'ต่อวันไม่สำเร็จ');
      toast.success('ต่อวันพักเรียบร้อย');
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setResizeResvId(null);
      setResizeTargetDay(null);
    }
  }

  function getReservationForRoomDay(roomId: string, day: Date) {
    return reservations.find(r => {
      if (r.room_id !== roomId) return false;
      const ci = parseDateLocal(r.check_in);
      const co = parseDateLocal(r.check_out);
      return day >= ci && day < co;
    });
  }

  // List view with search + filter
  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      if (listStatus && r.status !== listStatus) return false;
      if (listSearch) {
        const q = listSearch.toLowerCase();
        return (
          r.reservation_code.toLowerCase().includes(q) ||
          r.guests?.first_name?.toLowerCase().includes(q) ||
          r.guests?.last_name?.toLowerCase().includes(q) ||
          r.guests?.email?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reservations, listSearch, listStatus]);

  const paginatedReservations = useMemo(() =>
    filteredReservations.slice(listPage * PAGE_SIZE, (listPage + 1) * PAGE_SIZE),
    [filteredReservations, listPage]
  );

  return (
    <div className="container max-w-[1600px] py-8 animate-fade-in">
      <TopBar
        title="การจอง"
        description={`${reservations.length} การจองในช่วง 14 วัน`}
        action={
          <>
            <div className="flex items-center bg-secondary rounded-lg p-1">
              <button
                onClick={() => setView('calendar')}
                disabled={isMobile}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1',
                  view === 'calendar' ? 'bg-card shadow-sm' : 'text-muted-foreground',
                  isMobile && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Calendar className="h-3.5 w-3.5" /> Calendar
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1',
                  view === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground'
                )}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
            </div>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-3.5 w-3.5" /> จองใหม่
            </Button>
          </>
        }
      />

      {/* Calendar view */}
      {view === 'calendar' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setStartDate(addDays(startDate, -7))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                วันนี้
              </Button>
              <Button variant="outline" size="icon" onClick={() => setStartDate(addDays(startDate, 7))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-3 font-medium text-sm">
                {format(startDate, 'd MMM', { locale: th })} – {format(addDays(startDate, 13), 'd MMM yyyy', { locale: th })}
              </span>
            </div>

            <div className="flex items-center gap-3 text-2xs text-muted-foreground">
              <LegendDot color="bg-sky-300" label="ยืนยันแล้ว" />
              <LegendDot color="bg-emerald-300" label="เช็คอิน" />
              <LegendDot color="bg-amber-300" label="รอยืนยัน" />
              <span className="text-muted-foreground/60">· คลิกบล็อกเพื่อดูรายละเอียด</span>
            </div>
          </div>

          {rooms.length === 0 ? (
            <EmptyState
              icon={Bed}
              title="ยังไม่มีห้อง"
              description="เพิ่มห้องเพื่อเริ่มรับการจอง"
              action={
                <Button asChild>
                  <a href="/dashboard/rooms">ไปจัดการห้อง <ArrowRight className="h-3.5 w-3.5" /></a>
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="sticky left-0 bg-secondary/50 backdrop-blur z-10 p-3 border-r border-border min-w-[120px] text-left text-xs font-medium text-muted-foreground">
                      ห้อง
                    </th>
                    {days.map(day => (
                      <th
                        key={day.toString()}
                        className={cn(
                          'p-2 border-r border-border min-w-[90px] text-center font-normal',
                          isToday(day) && 'bg-accent/5'
                        )}
                      >
                        <div className="text-2xs uppercase tracking-wider text-muted-foreground">
                          {format(day, 'EEE', { locale: th })}
                        </div>
                        <div className={cn('font-medium mt-0.5', isToday(day) && 'text-accent')}>
                          {format(day, 'd MMM', { locale: th })}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roomTypes.map(rt => (
                    <Fragment key={rt.id}>
                      <tr>
                        <td colSpan={15} className="px-3 py-2 sticky left-0 bg-cream/50 dark:bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground font-medium border-b border-border">
                          {rt.name} · {formatCurrency(rt.base_rate)}/คืน
                        </td>
                      </tr>
                      {rooms.filter(r => r.room_type_id === rt.id).map(room => (
                        <tr key={room.id}>
                          <td className="sticky left-0 bg-card backdrop-blur p-3 border-r border-border font-medium text-sm">
                            {room.room_number}
                          </td>
                          {days.map(day => {
                            const resv = getReservationForRoomDay(room.id, day);
                            const ci = resv ? parseDateLocal(resv.check_in) : null;
                            const co = resv ? parseDateLocal(resv.check_out) : null;
                            const isFirst = resv && ci ? isSameDay(day, ci) : false;
                            const isLast = resv && co ? isSameDay(day, addDays(co, -1)) : false;
                            const isDropTarget = dragResvId && !resv;
                            const isResizeTarget = resizeResvId && resv?.id === resizeResvId && !isLast;
                            const isResizeOver = resizeResvId && !resv && resizeTargetDay && day <= resizeTargetDay &&
                              (() => { const r = reservations.find(x => x.id === resizeResvId); return r?.room_id === room.id && day >= parseDateLocal(r.check_out); })();
                            return (
                              <td
                                key={day.toString()}
                                className={cn(
                                  'border-r border-b border-border h-14 p-0 relative overflow-visible',
                                  isToday(day) && !resv && 'bg-accent/5',
                                  isDropTarget && 'bg-accent/10 ring-1 ring-inset ring-accent/40',
                                  isResizeOver && 'bg-emerald-50 dark:bg-emerald-950/20'
                                )}
                                onDragOver={(e) => {
                                  if (isDropTarget) { e.preventDefault(); return; }
                                  if (resizeResvId) {
                                    const r = reservations.find(x => x.id === resizeResvId);
                                    if (r?.room_id === room.id) { e.preventDefault(); setResizeTargetDay(day); }
                                  }
                                }}
                                onDrop={() => {
                                  if (isDropTarget) { handleDropOnRoom(room.id); return; }
                                  if (resizeResvId) handleResizeDrop(day);
                                }}
                              >
                                {resv && (
                                  <button
                                    draggable
                                    onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragResvId(resv.id); }}
                                    onDragEnd={() => setDragResvId(null)}
                                    onClick={() => setSelectedReservation(resv)}
                                    className={cn(
                                      'absolute inset-y-1 flex items-center overflow-hidden border-y text-xs cursor-grab active:cursor-grabbing hover:brightness-95 transition-all',
                                      isFirst ? 'left-0.5 rounded-l-md border-l pl-2' : 'left-0',
                                      isLast ? 'right-0.5 rounded-r-md border-r pr-1' : 'right-0',
                                      STATUS_COLORS[resv.status]
                                    )}
                                    title={`${resv.guests?.first_name} ${resv.guests?.last_name || ''} · ${formatCurrency(resv.total_amount)}`}
                                  >
                                    {isFirst && (
                                      <span className="font-medium truncate">
                                        {resv.guests?.first_name} {resv.guests?.last_name?.[0] || ''}.
                                      </span>
                                    )}
                                    {isLast && (
                                      <span
                                        draggable
                                        onDragStart={(e) => {
                                          e.stopPropagation();
                                          e.dataTransfer.effectAllowed = 'copy';
                                          setResizeResvId(resv.id);
                                          setResizeTargetDay(day);
                                        }}
                                        onDragEnd={() => { setResizeResvId(null); setResizeTargetDay(null); }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="ml-auto pl-1 pr-0.5 cursor-col-resize text-current/50 hover:text-current select-none"
                                        title="ลากเพื่อต่อวันพัก"
                                      >⋮</span>
                                    )}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* List view */}
      {view === 'list' && (
        <Card>
          {/* Search + filter bar */}
          <div className="p-4 border-b border-border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <input
                value={listSearch}
                onChange={e => { setListSearch(e.target.value); setListPage(0); }}
                placeholder="ค้นหาชื่อ, รหัส, อีเมล..."
                className="w-full pl-3 pr-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={listStatus}
              onChange={e => { setListStatus(e.target.value); setListPage(0); }}
              className="px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">ทุกสถานะ</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {(listSearch || listStatus) && (
              <Button variant="ghost" size="sm" onClick={() => { setListSearch(''); setListStatus(''); setListPage(0); }}>
                <X className="h-3.5 w-3.5" /> ล้าง
              </Button>
            )}
            <span className="text-xs text-muted-foreground self-center">
              {filteredReservations.length} รายการ
            </span>
          </div>

          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/30">
                <tr>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">รหัส</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">แขก</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">เช็คอิน</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">เช็คเอาท์</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">ห้อง</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">ยอดเงิน</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">สถานะ</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {paginatedReservations.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState icon={Calendar} title="ไม่พบการจอง" description="ลองเปลี่ยนเงื่อนไขการค้นหา" /></td></tr>
                ) : paginatedReservations.map(r => (
                  <tr
                    key={r.id}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedReservation(r)}
                  >
                    <td className="p-4 font-mono text-xs text-muted-foreground">{r.reservation_code}</td>
                    <td className="p-4">
                      <div className="font-medium">{r.guests?.first_name} {r.guests?.last_name || ''}</div>
                      {r.guests?.email && <div className="text-xs text-muted-foreground">{r.guests.email}</div>}
                    </td>
                    <td className="p-4 text-muted-foreground">{format(parseDateLocal(r.check_in), 'd MMM yyyy', { locale: th })}</td>
                    <td className="p-4 text-muted-foreground">{format(parseDateLocal(r.check_out), 'd MMM yyyy', { locale: th })}</td>
                    <td className="p-4 text-muted-foreground">{r.rooms?.room_number || r.room_types?.name || '—'}</td>
                    <td className="p-4">
                      <div className="font-medium">{formatCurrency(r.total_amount)}</div>
                      {r.balance_amount > 0 && (
                        <div className="text-xs text-destructive">ค้าง {formatCurrency(r.balance_amount)}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={
                        r.status === 'confirmed' ? 'info' :
                        r.status === 'checked_in' ? 'success' :
                        r.status === 'pending' ? 'warning' :
                        'secondary'
                      }>{STATUS_LABELS[r.status] || r.status}</Badge>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setSelectedReservation(r); }}>
                        ดูรายละเอียด
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-border">
            {paginatedReservations.length === 0 ? (
              <EmptyState icon={Calendar} title="ไม่พบการจอง" description="ลองเปลี่ยนเงื่อนไขการค้นหา" />
            ) : paginatedReservations.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedReservation(r)}
                className="w-full text-left p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{r.guests?.first_name} {r.guests?.last_name || ''}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.reservation_code}</div>
                  </div>
                  <Badge variant={
                    r.status === 'confirmed' ? 'info' :
                    r.status === 'checked_in' ? 'success' :
                    r.status === 'pending' ? 'warning' :
                    'secondary'
                  }>{STATUS_LABELS[r.status] || r.status}</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {format(parseDateLocal(r.check_in), 'd MMM', { locale: th })} → {format(parseDateLocal(r.check_out), 'd MMM yyyy', { locale: th })}
                </div>
                <div className="mt-1 text-sm">{r.rooms?.room_number || r.room_types?.name || '—'}</div>
                <div className="mt-2 font-medium">{formatCurrency(r.total_amount)}</div>
                {r.balance_amount > 0 && (
                  <div className="text-xs text-destructive mt-0.5">ค้าง {formatCurrency(r.balance_amount)}</div>
                )}
              </button>
            ))}
          </div>

          {/* Pagination */}
          {filteredReservations.length > PAGE_SIZE && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                แสดง {listPage * PAGE_SIZE + 1}–{Math.min((listPage + 1) * PAGE_SIZE, filteredReservations.length)} จาก {filteredReservations.length}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={listPage === 0} onClick={() => setListPage(p => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" disabled={(listPage + 1) * PAGE_SIZE >= filteredReservations.length} onClick={() => setListPage(p => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Reservation Detail Modal */}
      <ReservationDetailModal
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
        onUpdated={() => { setSelectedReservation(null); load(); }}
        rooms={rooms}
      />

      <CreateReservationModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        hotelId={hotelId}
        roomTypes={roomTypes}
        onSuccess={() => { setShowCreateModal(false); load(); }}
      />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-sm ${color}`} />
      <span>{label}</span>
    </div>
  );
}

// ============================================================
// Reservation Detail Modal
// ============================================================
function ReservationDetailModal({
  reservation, onClose, onUpdated, rooms,
}: {
  reservation: Reservation | null;
  onClose: () => void;
  onUpdated: () => void;
  rooms?: { id: string; room_number: string }[];
}) {
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [showMoveRoom, setShowMoveRoom] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [moveRoomId, setMoveRoomId] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');
  const [extraAmount, setExtraAmount] = useState('0');
  const [showTimeline, setShowTimeline] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  if (!reservation) return null;

  async function loadTimeline() {
    if (timeline.length > 0) { setShowTimeline(true); return; }
    setTimelineLoading(true);
    setShowTimeline(true);
    try {
      const res = await fetch(`/api/reservations/${reservation!.id}/timeline`);
      if (res.ok) { const d = await res.json(); setTimeline(d.timeline || []); }
    } finally { setTimelineLoading(false); }
  }

  async function doAction(action: 'check_in' | 'check_out' | 'cancel') {
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${reservation!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'เกิดข้อผิดพลาด');
      }
      const labels: Record<string, string> = {
        check_in: 'เช็คอินเรียบร้อย',
        check_out: 'เช็คเอาท์เรียบร้อย สร้างงานแม่บ้านแล้ว',
        cancel: 'ยกเลิกการจองแล้ว',
      };
      toast.success(labels[action]);
      onUpdated();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  }

  async function doMoveRoom() {
    if (!moveRoomId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${reservation!.id}/move-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: moveRoomId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'ย้ายห้องไม่สำเร็จ');
      toast.success('ย้ายห้องเรียบร้อย');
      onUpdated();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); setShowMoveRoom(false); }
  }

  async function doExtend() {
    if (!newCheckOut) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${reservation!.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCheckOut, additionalAmount: Number(extraAmount) || 0 }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'ต่อวันไม่สำเร็จ');
      toast.success('ต่อวันพักเรียบร้อย');
      onUpdated();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); setShowExtend(false); }
  }

  const r = reservation;
  const nights = r.nights || 1;
  const canCheckIn = r.status === 'confirmed' || r.status === 'pending';
  const canCheckOut = r.status === 'checked_in';
  const canCancel = !['checked_out', 'cancelled', 'no_show'].includes(r.status);
  const canMove = !['checked_out', 'cancelled', 'no_show'].includes(r.status);
  const canExtend = r.status === 'confirmed' || r.status === 'checked_in';

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="font-mono text-base">{r.reservation_code}</DialogTitle>
              <DialogDescription>
                <Badge variant={
                  r.status === 'confirmed' ? 'info' :
                  r.status === 'checked_in' ? 'success' :
                  r.status === 'pending' ? 'warning' : 'secondary'
                } className="mt-1">{STATUS_LABELS[r.status] || r.status}</Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Guest */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50">
            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium shrink-0">
              {r.guests?.first_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{r.guests?.first_name} {r.guests?.last_name || ''}</div>
              {r.guests?.email && <div className="text-xs text-muted-foreground">{r.guests.email}</div>}
              {r.guests?.phone && <div className="text-xs text-muted-foreground">{r.guests.phone}</div>}
              {r.guests?.nationality && <div className="text-xs text-muted-foreground">🌏 {r.guests.nationality}</div>}
            </div>
          </div>

          {/* Stay details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl border border-border">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> เช็คอิน</div>
              <div className="font-medium">{format(parseDateLocal(r.check_in), 'd MMM yyyy', { locale: th })}</div>
            </div>
            <div className="p-3 rounded-xl border border-border">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> เช็คเอาท์</div>
              <div className="font-medium">{format(parseDateLocal(r.check_out), 'd MMM yyyy', { locale: th })}</div>
            </div>
            <div className="p-3 rounded-xl border border-border">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Bed className="h-3 w-3" /> ห้องพัก</div>
              <div className="font-medium">{r.rooms?.room_number || '—'} · {r.room_types?.name}</div>
              <div className="text-xs text-muted-foreground">{nights} คืน · {r.num_adults} ผู้ใหญ่{r.num_children ? ` · ${r.num_children} เด็ก` : ''}</div>
            </div>
            <div className="p-3 rounded-xl border border-border">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><DollarSign className="h-3 w-3" /> ยอดเงิน</div>
              <div className="font-medium">{formatCurrency(r.total_amount)}</div>
              {r.balance_amount > 0 ? (
                <div className="text-xs text-destructive">ค้าง {formatCurrency(r.balance_amount)}</div>
              ) : (
                <div className="text-xs text-emerald-600">ชำระครบแล้ว</div>
              )}
            </div>
          </div>

          {r.special_requests && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-sm">
              <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">คำขอพิเศษ</div>
              <div className="text-muted-foreground">{r.special_requests}</div>
            </div>
          )}

          {/* Move room panel */}
          {showMoveRoom && rooms && (
            <div className="p-3 rounded-xl border border-border space-y-2">
              <p className="text-xs font-medium">เลือกห้องใหม่</p>
              <select
                value={moveRoomId}
                onChange={e => setMoveRoomId(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— เลือกห้อง —</option>
                {rooms.filter(rm => rm.id !== r.room_id).map(rm => (
                  <option key={rm.id} value={rm.id}>{rm.room_number}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowMoveRoom(false)}>ยกเลิก</Button>
                <Button size="sm" disabled={!moveRoomId || loading} onClick={doMoveRoom}>
                  {loading ? 'กำลังย้าย...' : 'ย้ายห้อง'}
                </Button>
              </div>
            </div>
          )}

          {/* Extend stay panel */}
          {showExtend && (
            <div className="p-3 rounded-xl border border-border space-y-2">
              <p className="text-xs font-medium">ต่อวันพัก</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">วันเช็คเอาท์ใหม่</label>
                  <input type="date" value={newCheckOut} min={r.check_out}
                    onChange={e => setNewCheckOut(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">ยอดเพิ่ม (฿)</label>
                  <input type="number" value={extraAmount} min="0"
                    onChange={e => setExtraAmount(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowExtend(false)}>ยกเลิก</Button>
                <Button size="sm" disabled={!newCheckOut || loading} onClick={doExtend}>
                  {loading ? 'กำลังบันทึก...' : 'ต่อวันพัก'}
                </Button>
              </div>
            </div>
          )}

          {/* Confirm action */}
          {confirmAction && (
            <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <span>ยืนยัน{confirmAction === 'cancel' ? 'ยกเลิก' : confirmAction === 'check_in' ? 'เช็คอิน' : 'เช็คเอาท์'}?</span>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>ไม่</Button>
                <Button
                  size="sm"
                  variant={confirmAction === 'cancel' ? 'destructive' : 'default'}
                  disabled={loading}
                  onClick={() => doAction(confirmAction as any)}
                >
                  {loading ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
                </Button>
              </div>
            </div>
          )}
        </div>

          {/* Timeline */}
          {showTimeline && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-secondary/50 text-xs font-medium flex items-center justify-between">
                <span>ประวัติการจอง</span>
                <button onClick={() => setShowTimeline(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              {timelineLoading ? (
                <div className="p-4 text-center text-xs text-muted-foreground">กำลังโหลด...</div>
              ) : timeline.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">ยังไม่มีประวัติ</div>
              ) : (
                <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                  {timeline.map((ev: any) => (
                    <div key={ev.id} className="flex gap-2 text-xs">
                      <div className="w-1 rounded-full bg-accent/40 shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="font-medium">{ev.label}</div>
                        <div className="text-muted-foreground">{ev.actor} · {new Date(ev.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        <DialogFooter className="flex-wrap gap-2">
          {canCancel && !confirmAction && !showMoveRoom && !showExtend && (
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setConfirmAction('cancel')}>
              ยกเลิก
            </Button>
          )}
          {canMove && !confirmAction && !showMoveRoom && !showExtend && (
            <Button variant="outline" size="sm" onClick={() => { setShowMoveRoom(true); setShowExtend(false); }}>
              ย้ายห้อง
            </Button>
          )}
          {canExtend && !confirmAction && !showMoveRoom && !showExtend && (
            <Button variant="outline" size="sm" onClick={() => { setShowExtend(true); setShowMoveRoom(false); }}>
              ต่อวันพัก
            </Button>
          )}
          <a
            href={`/api/invoices/pdf?reservationId=${r.id}`}
            download
            className="inline-flex items-center justify-center gap-1 px-3 h-9 rounded-md border border-input bg-background text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            🖨️ ใบเสร็จ
          </a>
          <Button variant="outline" size="sm" onClick={loadTimeline}>
            ประวัติ
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>ปิด</Button>
          {canCheckIn && !confirmAction && !showMoveRoom && !showExtend && (
            <Button onClick={() => setConfirmAction('check_in')} disabled={loading}>เช็คอิน</Button>
          )}
          {canCheckOut && !confirmAction && !showMoveRoom && !showExtend && (
            <Button onClick={() => setConfirmAction('check_out')} disabled={loading}>เช็คเอาท์</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Create Reservation Modal — with auto-calculate + validation
// ============================================================
function CreateReservationModal({
  open, onClose, hotelId, roomTypes, onSuccess,
}: {
  open: boolean; onClose: () => void; hotelId: string;
  roomTypes: RoomType[]; onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', nationality: '',
    checkIn: '', checkOut: '', roomTypeId: roomTypes[0]?.id || '',
    numAdults: '1', totalAmount: '', source: 'direct', specialRequests: '',
  });
  const [quote, setQuote] = useState<{ nights: number; totalPrice: number; available: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset when opened
  useEffect(() => {
    if (open) {
      setFormData({ firstName: '', lastName: '', email: '', phone: '', nationality: '',
        checkIn: '', checkOut: '', roomTypeId: roomTypes[0]?.id || '',
        numAdults: '1', totalAmount: '', source: 'direct', specialRequests: '' });
      setQuote(null);
      setErrors({});
    }
  }, [open, roomTypes]);

  // Auto-calculate price when dates + room type change
  useEffect(() => {
    if (!formData.checkIn || !formData.checkOut || !formData.roomTypeId || !hotelId) return;
    if (formData.checkIn >= formData.checkOut) return;

    const t = setTimeout(async () => {
      setCalculating(true);
      try {
        const res = await fetch('/api/bookings/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotelId, roomTypeId: formData.roomTypeId,
            checkIn: formData.checkIn, checkOut: formData.checkOut,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setQuote(data);
          setFormData(prev => ({ ...prev, totalAmount: String(data.totalPrice) }));
        }
      } catch {
        // silent fail — user can still enter manually
      } finally {
        setCalculating(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [formData.checkIn, formData.checkOut, formData.roomTypeId, hotelId]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!formData.firstName.trim()) errs.firstName = 'กรุณากรอกชื่อ';
    if (!formData.checkIn) errs.checkIn = 'กรุณาเลือกวันเช็คอิน';
    if (!formData.checkOut) errs.checkOut = 'กรุณาเลือกวันเช็คเอาท์';
    if (formData.checkIn && formData.checkOut && formData.checkIn >= formData.checkOut)
      errs.checkOut = 'วันเช็คเอาท์ต้องหลังวันเช็คอิน';
    if (!formData.roomTypeId) errs.roomTypeId = 'กรุณาเลือกประเภทห้อง';
    if (!formData.totalAmount || Number(formData.totalAmount) <= 0) errs.totalAmount = 'กรุณากรอกยอดเงิน';
    if (quote && quote.available === 0) errs.roomTypeId = 'ห้องประเภทนี้เต็มในช่วงวันที่เลือก';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          nationality: formData.nationality.trim() || null,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          roomTypeId: formData.roomTypeId,
          numAdults: Number(formData.numAdults),
          totalAmount: Number(formData.totalAmount),
          source: formData.source,
          specialRequests: formData.specialRequests.trim() || null,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'ไม่สามารถสร้างการจองได้');
      }
      toast.success('สร้างการจองสำเร็จ');
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function setField(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>การจองใหม่</DialogTitle>
          <DialogDescription>กรอกข้อมูลการจอง ระบบจะคำนวณราคาและสร้าง folio อัตโนมัติ</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest info */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">ข้อมูลแขก</p>
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="ชื่อ *" value={formData.firstName} onChange={v => setField('firstName', v)} error={errors.firstName} placeholder="ชื่อจริง" />
              <FieldInput label="นามสกุล" value={formData.lastName} onChange={v => setField('lastName', v)} placeholder="นามสกุล" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <FieldInput label="อีเมล" value={formData.email} onChange={v => setField('email', v)} placeholder="email@example.com" type="email" />
              <FieldInput label="เบอร์โทร" value={formData.phone} onChange={v => setField('phone', v)} placeholder="0812345678" />
            </div>
            <div className="mt-3">
              <FieldInput label="สัญชาติ" value={formData.nationality} onChange={v => setField('nationality', v)} placeholder="เช่น Thai, Japanese (สำหรับ ทร.30)" />
            </div>
          </div>

          {/* Stay */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">รายละเอียดการพัก</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">เช็คอิน *</label>
                <input type="date" value={formData.checkIn} min={today}
                  onChange={e => setField('checkIn', e.target.value)}
                  className={cn('w-full px-3 py-2 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring', errors.checkIn ? 'border-destructive' : 'border-0')} />
                {errors.checkIn && <p className="text-xs text-destructive mt-1">{errors.checkIn}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">เช็คเอาท์ *</label>
                <input type="date" value={formData.checkOut} min={formData.checkIn || today}
                  onChange={e => setField('checkOut', e.target.value)}
                  className={cn('w-full px-3 py-2 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring', errors.checkOut ? 'border-destructive' : 'border-0')} />
                {errors.checkOut && <p className="text-xs text-destructive mt-1">{errors.checkOut}</p>}
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground block mb-1">ประเภทห้อง *</label>
              <select value={formData.roomTypeId} onChange={e => setField('roomTypeId', e.target.value)}
                className={cn('w-full px-3 py-2 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring', errors.roomTypeId ? 'border-destructive' : 'border-0')}>
                {roomTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.name} — {formatCurrency(rt.base_rate)}/คืน</option>
                ))}
              </select>
              {errors.roomTypeId && <p className="text-xs text-destructive mt-1">{errors.roomTypeId}</p>}
            </div>

            {/* Quote result */}
            {(calculating || quote) && (
              <div className={cn('mt-3 p-3 rounded-xl border text-sm', quote?.available === 0 ? 'border-destructive/30 bg-destructive/5' : 'border-accent/20 bg-accent/5')}>
                {calculating ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    กำลังคำนวณราคา...
                  </div>
                ) : quote && (
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">{quote.nights} คืน · ว่าง {quote.available} ห้อง</div>
                    <div className="font-medium text-accent">{formatCurrency(quote.totalPrice)}</div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">ผู้ใหญ่</label>
                <input type="number" min="1" max="20" value={formData.numAdults}
                  onChange={e => setField('numAdults', e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">ยอดรวม (บาท) *</label>
                <input type="number" min="0" value={formData.totalAmount}
                  onChange={e => setField('totalAmount', e.target.value)}
                  placeholder={calculating ? 'กำลังคำนวณ...' : '0'}
                  className={cn('w-full px-3 py-2 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring', errors.totalAmount ? 'border-destructive' : 'border-0')} />
                {errors.totalAmount && <p className="text-xs text-destructive mt-1">{errors.totalAmount}</p>}
              </div>
            </div>
          </div>

          {/* Source + requests */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">แหล่งที่มา</label>
            <select value={formData.source} onChange={e => setField('source', e.target.value)}
              className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="direct">Direct</option>
              <option value="walk_in">Walk-in</option>
              <option value="phone">โทรจอง</option>
              <option value="line">LINE</option>
              <option value="booking_com">Booking.com</option>
              <option value="agoda">Agoda</option>
              <option value="airbnb">Airbnb</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">คำขอพิเศษ</label>
            <textarea value={formData.specialRequests} onChange={e => setField('specialRequests', e.target.value)}
              rows={2} placeholder="เช่น ห้องชั้นสูง, ไม่สูบบุหรี่..."
              className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button type="submit" disabled={loading || calculating}>
              {loading ? 'กำลังสร้าง...' : 'สร้างการจอง'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({ label, value, onChange, placeholder, type = 'text', error }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; error?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={cn('w-full px-3 py-2 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring', error ? 'border-destructive' : 'border-0')} />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
