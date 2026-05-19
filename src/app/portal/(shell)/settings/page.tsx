'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Moon, Sun, Monitor, Bell, BellOff,
  Globe, Shield, Trash2, ChevronRight, Languages,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';
import { toast } from 'sonner';

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const v = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3, ease } }),
};

const THEMES = [
  { id: 'light', label: 'สว่าง',   Icon: Sun },
  { id: 'dark',  label: 'มืด',     Icon: Moon },
  { id: 'system',label: 'อัตโนมัติ', Icon: Monitor },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [notifBooking,  setNotifBooking]  = useState(true);
  const [notifPromo,    setNotifPromo]    = useState(true);
  const [notifCheckIn,  setNotifCheckIn]  = useState(true);
  const [notifLoyalty,  setNotifLoyalty]  = useState(false);

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto lg:max-w-2xl">
          <Link href="/portal/account">
            <motion.div whileTap={{ scale: 0.9 }} className="h-9 w-9 rounded-xl bg-secondary border border-border/40 flex items-center justify-center">
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </motion.div>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground tracking-tight">ตั้งค่า</h1>
        </div>
      </div>

      <div className="px-4 pt-5 pb-10 max-w-screen-sm mx-auto lg:max-w-2xl space-y-5">

        {/* ── Theme ── */}
        <motion.div custom={0} variants={v} initial="hidden" animate="show">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">ธีม</p>
          <div className="rounded-2xl bg-card border border-border/60 shadow-sm p-4">
            <p className="text-sm font-semibold text-foreground mb-3">โหมดการแสดงผล</p>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(({ id, label, Icon }) => (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setTheme(id); toast.success(`เปลี่ยนเป็นโหมด${label}แล้ว`); }}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                    theme === id
                      ? 'border-amber-500 bg-amber-500/8'
                      : 'border-border/40 bg-secondary/40 hover:bg-secondary',
                  )}>
                  <Icon className={cn('h-5 w-5', theme === id ? 'text-amber-500' : 'text-muted-foreground')} />
                  <span className={cn('text-xs font-semibold', theme === id ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
                    {label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Notifications ── */}
        <motion.div custom={1} variants={v} initial="hidden" animate="show">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">การแจ้งเตือน</p>
          <div className="rounded-2xl bg-card border border-border/60 shadow-sm divide-y divide-border/40">
            <NotifRow
              icon={Bell} label="การจองและยืนยัน"
              desc="อัปเดตสถานะการจอง เช็คอิน/เช็คเอาท์"
              value={notifBooking} onChange={setNotifBooking} />
            <NotifRow
              icon={Bell} label="โปรโมชั่นและดีล"
              desc="ส่วนลดพิเศษ คูปอง และออเฟอร์สุดคุ้ม"
              value={notifPromo} onChange={setNotifPromo} />
            <NotifRow
              icon={Bell} label="เตือนเช็คอิน"
              desc="แจ้งเตือนก่อนวันเช็คอิน 1 วัน"
              value={notifCheckIn} onChange={setNotifCheckIn} />
            <NotifRow
              icon={Bell} label="แต้มสะสม"
              desc="อัปเดตยอดแต้ม Maitri Rewards"
              value={notifLoyalty} onChange={setNotifLoyalty} />
          </div>
        </motion.div>

        {/* ── Account ── */}
        <motion.div custom={2} variants={v} initial="hidden" animate="show">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">บัญชี</p>
          <div className="rounded-2xl bg-card border border-border/60 shadow-sm divide-y divide-border/40 overflow-hidden">
            <Link href="/portal/profile">
              <motion.div whileTap={{ scale: 0.985 }} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-secondary/40 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Globe className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">ข้อมูลส่วนตัว</p>
                  <p className="text-xs text-muted-foreground mt-0.5">ชื่อ อีเมล เบอร์โทรศัพท์</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/35 shrink-0" />
              </motion.div>
            </Link>
            <Link href="/portal/loyalty">
              <motion.div whileTap={{ scale: 0.985 }} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-secondary/40 transition-colors">
                <div className="h-9 w-9 rounded-xl bg-violet-500/12 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Maitri Rewards</p>
                  <p className="text-xs text-muted-foreground mt-0.5">ดูแต้มสะสมและสิทธิพิเศษ</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/35 shrink-0" />
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* ── Danger zone ── */}
        <motion.div custom={3} variants={v} initial="hidden" animate="show">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">อื่น ๆ</p>
          <div className="rounded-2xl bg-card border border-border/60 shadow-sm divide-y divide-border/40 overflow-hidden">
            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={() => toast.info('ฟีเจอร์นี้จะเปิดให้บริการเร็ว ๆ นี้')}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-secondary/40 transition-colors">
              <div className="h-9 w-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Languages className="h-4.5 w-4.5 text-orange-500" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-foreground">ภาษา</p>
                <p className="text-xs text-muted-foreground mt-0.5">ไทย (TH)</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/35 shrink-0" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={() => toast.error('กรุณาติดต่อฝ่ายบริการลูกค้าเพื่อลบบัญชี')}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-red-500/5 hover:border-red-500/20 transition-colors group">
              <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-4.5 w-4.5 text-red-500" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-red-500">ลบบัญชี</p>
                <p className="text-xs text-muted-foreground mt-0.5">ลบข้อมูลทั้งหมดอย่างถาวร</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/35 shrink-0" />
            </motion.button>
          </div>
        </motion.div>

        <motion.div custom={4} variants={v} initial="hidden" animate="show">
          <p className="text-center text-[10px] text-muted-foreground/35 pb-1">
            Maitri Collection · Guest Portal v1.0
          </p>
        </motion.div>

      </div>
    </div>
  );
}

function NotifRow({
  icon: Icon, label, desc, value, onChange,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <div className={cn(
        'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
        value ? 'bg-amber-500/12 text-amber-600 dark:text-amber-400' : 'bg-secondary text-muted-foreground',
      )}>
        {value ? <Bell className="h-4.5 w-4.5" strokeWidth={1.8} /> : <BellOff className="h-4.5 w-4.5" strokeWidth={1.8} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(!value)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors shrink-0',
          value ? 'bg-amber-500' : 'bg-border',
        )}>
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm" />
      </motion.button>
    </div>
  );
}
