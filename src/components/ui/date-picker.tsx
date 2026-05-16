'use client';

import { useState, useRef, useEffect } from 'react';
import { format, parse, isValid, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isSameDay, isBefore, startOfDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;           // ISO date string YYYY-MM-DD
  onChange: (v: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function DatePicker({ value, onChange, placeholder = 'เลือกวันที่', minDate, maxDate, disabled, className, label }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => {
    if (value) { const d = parse(value, 'yyyy-MM-dd', new Date()); if (isValid(d)) return startOfMonth(d); }
    return startOfMonth(new Date());
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;
  const min = minDate ? parse(minDate, 'yyyy-MM-dd', new Date()) : null;
  const max = maxDate ? parse(maxDate, 'yyyy-MM-dd', new Date()) : null;

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startPad = getDay(startOfMonth(month)); // 0=Sun

  function select(d: Date) {
    onChange(format(d, 'yyyy-MM-dd'));
    setOpen(false);
  }

  function isDisabled(d: Date) {
    if (min && isBefore(startOfDay(d), startOfDay(min))) return true;
    if (max && isBefore(startOfDay(max), startOfDay(d))) return true;
    return false;
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      {label && <label className="block text-xs text-muted-foreground mb-1">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-label={label || placeholder}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm transition',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'hover:bg-accent/10',
          disabled && 'cursor-not-allowed opacity-50',
          !selected && 'text-muted-foreground',
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 text-left">
          {selected && isValid(selected) ? format(selected, 'd MMMM yyyy', { locale: th }) : placeholder}
        </span>
        {selected && (
          <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground hover:text-foreground" onClick={e => { e.stopPropagation(); onChange(''); }} aria-label="ล้างวันที่" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="ปฏิทิน"
          className="absolute z-50 mt-1.5 w-72 rounded-xl border border-border bg-popover shadow-lg"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <button type="button" onClick={() => setMonth(subMonths(month, 1))} aria-label="เดือนก่อนหน้า" className="rounded p-1 hover:bg-accent/20">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">{format(month, 'MMMM yyyy', { locale: th })}</span>
            <button type="button" onClick={() => setMonth(addMonths(month, 1))} aria-label="เดือนถัดไป" className="rounded p-1 hover:bg-accent/20">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 px-2 pt-2 pb-1">
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
              <div key={d} className="text-center text-2xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px px-2 pb-3">
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(d => {
              const dis = isDisabled(d);
              const sel = selected && isSameDay(d, selected);
              const today = isSameDay(d, new Date());
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={dis}
                  onClick={() => select(d)}
                  aria-label={format(d, 'd MMMM yyyy', { locale: th })}
                  aria-pressed={sel || false}
                  className={cn(
                    'flex h-8 w-full items-center justify-center rounded-lg text-xs transition',
                    dis && 'cursor-not-allowed text-muted-foreground/40',
                    !dis && 'hover:bg-accent/20',
                    sel && 'bg-primary text-primary-foreground hover:bg-primary/90',
                    today && !sel && 'font-bold underline decoration-dotted',
                  )}
                >
                  {format(d, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
