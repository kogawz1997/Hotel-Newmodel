'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Bell, Globe, Shield, Trash2, ChevronRight,
  Languages, QrCode, MapPin, DollarSign, Thermometer,
  Clock, Accessibility, Share2, FileText, Lock,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';
import { toast } from 'sonner';

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const v = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.25, ease } }),
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [darkMode,        setDarkMode]        = useState(theme === 'dark');
  const [shareScreenshot, setShareScreenshot] = useState(true);
  const [notifAll,        setNotifAll]        = useState(true);

  function toggleDark(on: boolean) {
    setDarkMode(on);
    setTheme(on ? 'dark' : 'light');
    toast.success(on ? 'เปิดโหมดหน้าจอมืดแล้ว' : 'ปิดโหมดหน้าจอมืดแล้ว');
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/95 dark:bg-background/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto lg:max-w-2xl">
          <Link href="/portal/account">
            <motion.div whileTap={{ scale: 0.9 }} className="h-9 w-9 rounded-full bg-secondary border border-border/40 flex items-center justify-center">
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </motion.div>
          </Link>
          <h1 className="font-bold text-lg text-foreground">การตั้งค่า</h1>
        </div>
      </div>

      <div className="pb-12 max-w-screen-sm mx-auto lg:max-w-2xl">

        {/* ── Regional & Language ── */}
        <motion.div custom={0} variants={v} initial="hidden" animate="show" className="mt-4">
          <div className="bg-card border-y border-border/40 divide-y divide-border/30">
            <SettingRow label="ภาษา"               value="ภาษาไทย"                         />
            <SettingRow label="ประเทศหรือภูมิภาค"   value="ไทย"                             />
            <SettingRow label="สกุลเงิน"             value="THB"                             />
            <SettingRow label="หน่วย"                value="เมตริก (กม., ตร.ม., กก.)"       />
            <SettingRow label="อุณหภูมิ"             value="เซลเซียส (°C)"                  />
            <SettingRow label="รูปแบบเวลา"           value="24 ชั่วโมง"                      />
          </div>
        </motion.div>

        {/* ── Account ── */}
        <motion.div custom={1} variants={v} initial="hidden" animate="show" className="mt-4">
          <div className="bg-card border-y border-border/40 divide-y divide-border/30">
            <Link href="/portal/profile">
              <SettingRow label="จัดการบัญชี" />
            </Link>
            <Link href="/portal/scan">
              <SettingRow label="สแกน QR Code" />
            </Link>
          </div>
        </motion.div>

        {/* ── Display & Notifications ── */}
        <motion.div custom={2} variants={v} initial="hidden" animate="show" className="mt-4">
          <div className="bg-card border-y border-border/40 divide-y divide-border/30">
            {/* Dark mode toggle */}
            <div className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">หน้าจอมืด</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    เปิดใช้โหมดหน้าจอมืดได้ (คุณต้องเลือกเปิดใช้ในการตั้งค่าก่อน)
                  </p>
                </div>
                <Toggle value={darkMode} onChange={toggleDark} />
              </div>
            </div>
            {/* Notifications link */}
            <button
              onClick={() => toast.info('กำลังพัฒนา...')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors">
              <p className="text-sm font-medium text-foreground">การแจ้งเตือน</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
            {/* Share screenshot toggle */}
            <div className="px-4 py-3.5 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">แชร์ภาพหน้าจอ</p>
              <Toggle value={shareScreenshot} onChange={setShareScreenshot} />
            </div>
            {/* Accessibility */}
            <button
              onClick={() => toast.info('กำลังพัฒนา...')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors">
              <p className="text-sm font-medium text-foreground">การช่วยการเข้าถึง</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
          </div>
        </motion.div>

        {/* ── Legal ── */}
        <motion.div custom={3} variants={v} initial="hidden" animate="show" className="mt-4">
          <div className="bg-card border-y border-border/40 divide-y divide-border/30">
            <Link href="/terms">
              <SettingRow label="ข้อกำหนดและเงื่อนไข" />
            </Link>
            <Link href="/privacy">
              <SettingRow label="นโยบายความเป็นส่วนตัว" />
            </Link>
          </div>
        </motion.div>

        {/* ── Danger ── */}
        <motion.div custom={4} variants={v} initial="hidden" animate="show" className="mt-4">
          <div className="bg-card border-y border-border/40">
            <button
              onClick={() => toast.error('กรุณาติดต่อฝ่ายบริการลูกค้าเพื่อลบบัญชี')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-500/5 transition-colors">
              <p className="text-sm font-medium text-red-500">ลบบัญชี</p>
              <ChevronRight className="h-4 w-4 text-red-400/50 shrink-0" />
            </button>
          </div>
        </motion.div>

        <motion.div custom={5} variants={v} initial="hidden" animate="show" className="mt-6 px-4">
          <p className="text-center text-[11px] text-muted-foreground/40">
            Maitri Collection · Guest Portal v1.0
          </p>
        </motion.div>

      </div>
    </div>
  );
}

function SettingRow({ label, value, onClick }: { label: string; value?: string; onClick?: () => void }) {
  const inner = (
    <div className="flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-muted-foreground">{value}</span>}
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      </div>
    </div>
  );
  if (onClick) return <button onClick={onClick} className="w-full text-left">{inner}</button>;
  return <>{inner}</>;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => onChange(!value)}
      className={cn(
        'relative h-7 w-12 rounded-full transition-colors shrink-0',
        value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-border',
      )}>
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1.5 h-4 w-4 rounded-full bg-white shadow-sm"
      />
    </motion.button>
  );
}
