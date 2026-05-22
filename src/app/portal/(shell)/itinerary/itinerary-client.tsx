'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar, Plus, MapPin, Clock, Trash2, Plane, Utensils,
  Camera, Ticket, Car, Star, CheckCircle2, X, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type ItineraryItem = {
  id: string; date: string; time?: string; title: string;
  category: string; location?: string; notes?: string; confirmed: boolean;
};
type Reservation = {
  id: string; check_in: string; check_out: string;
  guest_name?: string; rooms: { room_number: string } | null;
};

const CATEGORIES = [
  { key: 'hotel',       label: 'โรงแรม',      icon: Star,      color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
  { key: 'flight',      label: 'เที่ยวบิน',   icon: Plane,     color: 'text-sky-600 dark:text-sky-400',       bg: 'bg-sky-500/10' },
  { key: 'restaurant',  label: 'ร้านอาหาร',   icon: Utensils,  color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-500/10' },
  { key: 'activity',    label: 'กิจกรรม',     icon: Ticket,    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'sightseeing', label: 'ท่องเที่ยว',  icon: Camera,    color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-500/10' },
  { key: 'transport',   label: 'การเดินทาง',  icon: Car,       color: 'text-gray-600 dark:text-muted-foreground', bg: 'bg-gray-200/60 dark:bg-secondary' },
] as const;

const EMPTY_FORM = { date: '', time: '', title: '', category: 'activity', location: '', notes: '' };

function getCategoryMeta(key: string) {
  return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[3];
}

function getDates(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const start = new Date(checkIn);
  const end   = new Date(checkOut);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-secondary border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all placeholder:text-muted-foreground/50';

export function ItineraryClient({
  reservation,
  items: initItems,
}: {
  reservation: Reservation;
  items: ItineraryItem[];
}) {
  const supabase = createClient();
  const [items, setItems]     = useState(initItems);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);

  const dates = getDates(reservation.check_in, reservation.check_out);

  async function addItem() {
    if (!form.date || !form.title) { toast.error('กรอกวันที่และชื่อกิจกรรม'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('itinerary_items').insert({
      reservation_id: reservation.id,
      date: form.date, time: form.time || null, title: form.title,
      category: form.category, location: form.location || null,
      notes: form.notes || null, confirmed: false,
    }).select().single();
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    setItems(p => [...p, data].sort((a, b) =>
      a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''),
    ));
    setShowAdd(false);
    setForm(EMPTY_FORM);
    toast.success('เพิ่มกิจกรรมแล้ว');
  }

  async function deleteItem(id: string) {
    await supabase.from('itinerary_items').delete().eq('id', id);
    setItems(p => p.filter(i => i.id !== id));
    toast.success('ลบกิจกรรมแล้ว');
  }

  async function toggleConfirm(item: ItineraryItem) {
    await supabase.from('itinerary_items').update({ confirmed: !item.confirmed }).eq('id', item.id);
    setItems(p => p.map(i => i.id === item.id ? { ...i, confirmed: !i.confirmed } : i));
  }

  return (
    <div className="space-y-4">

      {/* ── Reservation summary chip ── */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-border/60 bg-white dark:bg-card p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">การเข้าพัก</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {new Date(reservation.check_in).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
              {' – '}
              {new Date(reservation.check_out).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
              {reservation.rooms?.room_number && ` · ห้อง ${reservation.rooms.room_number}`}
            </p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />เพิ่มกิจกรรม
        </motion.button>
      </div>

      {/* ── Days ── */}
      {dates.map(date => {
        const dayItems = items.filter(i => i.date === date);
        const d = new Date(date + 'T12:00:00');
        const dayLabel = d.toLocaleDateString('th-TH', { weekday: 'long', month: 'short', day: 'numeric' });
        const todayStr = new Date().toISOString().slice(0, 10);
        const isToday  = date === todayStr;

        return (
          <div key={date}>
            {/* Day header */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className={cn(
                'h-2 w-2 rounded-full shrink-0',
                isToday ? 'bg-blue-600' : 'bg-gray-300 dark:bg-border',
              )} />
              <p className={cn(
                'text-xs font-bold',
                isToday ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground',
              )}>
                {dayLabel}
                {isToday && (
                  <span className="ml-1.5 text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-semibold">
                    วันนี้
                  </span>
                )}
              </p>
            </div>

            {dayItems.length === 0 ? (
              <button
                onClick={() => { setForm(p => ({ ...p, date })); setShowAdd(true); }}
                className="w-full border border-dashed border-border/60 rounded-2xl py-4 text-center text-xs text-muted-foreground hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <Plus className="h-4 w-4 mx-auto mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                เพิ่มกิจกรรม
              </button>
            ) : (
              <div className="space-y-2">
                {dayItems.map((item, idx) => {
                  const meta = getCategoryMeta(item.category);
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.25 }}
                      className={cn(
                        'flex items-start gap-3 rounded-2xl border border-gray-100 dark:border-border/60 bg-white dark:bg-card p-3.5 shadow-sm transition-opacity',
                        item.confirmed && 'opacity-55',
                      )}
                    >
                      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', meta.bg)}>
                        <Icon className={cn('h-4 w-4', meta.color)} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-semibold text-foreground leading-tight',
                          item.confirmed && 'line-through text-muted-foreground',
                        )}>
                          {item.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                          <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', meta.bg, meta.color)}>
                            {meta.label}
                          </span>
                          {item.time && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />{item.time}
                            </span>
                          )}
                          {item.location && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5" />{item.location}
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-[10px] text-muted-foreground/70 mt-1 italic leading-relaxed">{item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleConfirm(item)}
                          className={cn(
                            'h-7 w-7 rounded-lg flex items-center justify-center transition-colors',
                            item.confirmed
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'hover:bg-secondary text-muted-foreground/40 hover:text-muted-foreground',
                          )}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                {/* Add more for this day */}
                <button
                  onClick={() => { setForm(p => ({ ...p, date })); setShowAdd(true); }}
                  className="w-full text-left text-xs text-muted-foreground/50 hover:text-blue-600 dark:hover:text-blue-400 py-1 px-2 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-3 w-3" />เพิ่มกิจกรรมอีก
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Add Activity Bottom Sheet ── */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAdd(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="relative w-full bg-white dark:bg-card rounded-t-3xl border-t border-gray-100 dark:border-border/60 shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 shrink-0">
                <p className="font-display font-bold text-foreground">เพิ่มกิจกรรม</p>
                <button
                  onClick={() => setShowAdd(false)}
                  className="h-8 w-8 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    ชื่อกิจกรรม <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="เช่น ดินเนอร์ริมทะเล, ทัวร์วัดพระแก้ว..."
                    className={inputCls}
                    autoFocus
                  />
                </div>

                {/* Category chips */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">ประเภท</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, category: c.key }))}
                        className={cn(
                          'px-3 py-1.5 text-xs rounded-full font-medium transition-colors',
                          form.category === c.key
                            ? cn(c.bg, c.color, 'font-bold')
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80',
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      วันที่ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.date}
                        onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                        className={inputCls + ' appearance-none pr-7'}
                      >
                        <option value="">— เลือก —</option>
                        {dates.map(d => (
                          <option key={d} value={d}>
                            {new Date(d + 'T12:00:00').toLocaleDateString('th-TH', {
                              weekday: 'short', month: 'short', day: 'numeric',
                            })}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">เวลา</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">สถานที่</label>
                  <input
                    value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="เช่น ร้าน The Deck, วัดพระแก้ว..."
                    className={inputCls}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">หมายเหตุ</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="รายละเอียดเพิ่มเติม..."
                    rows={2}
                    className={inputCls + ' resize-none'}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pt-3 pb-8 flex gap-2.5 border-t border-border/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 rounded-2xl border border-border/60 bg-white dark:bg-secondary text-sm font-semibold text-foreground hover:bg-secondary/60 transition-colors"
                >
                  ยกเลิก
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={addItem}
                  disabled={saving || !form.title || !form.date}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
