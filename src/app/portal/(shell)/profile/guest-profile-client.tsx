'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  User, ArrowLeft, Save, Lock, Globe2, Download, CreditCard, Plus, Trash2,
  ShieldCheck, Bell, Eye, EyeOff, Smartphone, AlertTriangle, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Lang = 'th' | 'en';
type Tab = 'profile' | 'notifications' | 'security' | 'preferences' | 'payments' | 'privacy';

const T = {
  th: {
    title: 'บัญชีของฉัน', langToggle: 'EN',
    tabs: { profile: 'ข้อมูล', notifications: 'การแจ้งเตือน', security: 'ความปลอดภัย', preferences: 'การตั้งค่า', payments: 'บัตรชำระ', privacy: 'ความเป็นส่วนตัว' },
    profile: {
      title: 'ข้อมูลส่วนตัว', firstName: 'ชื่อ', lastName: 'นามสกุล',
      phone: 'เบอร์โทร', nationality: 'สัญชาติ', birthday: 'วันเกิด',
      email: 'อีเมล (ไม่สามารถเปลี่ยนได้)', save: 'บันทึกข้อมูล', saving: 'กำลังบันทึก...',
    },
    notifications: {
      title: 'การแจ้งเตือน', desc: 'เลือกว่าต้องการรับแจ้งเตือนเหตุการณ์ใด และผ่านช่องทางใด',
      events: { booking_confirm: 'ยืนยันการจอง', check_in_reminder: 'เตือนก่อน Check-in (1 วัน)', booking_cancel: 'การจองถูกยกเลิก', loyalty_points: 'ได้รับคะแนนสะสม', promo: 'โปรโมชั่นและข้อเสนอพิเศษ', review_request: 'ขอรีวิวหลัง Check-out' },
      viaEmail: 'อีเมล', viaSms: 'SMS', viaLine: 'LINE',
      save: 'บันทึกการแจ้งเตือน',
    },
    security: {
      title: 'ความปลอดภัย', changePassword: 'เปลี่ยนรหัสผ่าน',
      newPw: 'รหัสผ่านใหม่', confirmPw: 'ยืนยันรหัสผ่านใหม่',
      pwHint: 'อย่างน้อย 8 ตัวอักษร ผสมตัวอักษรและตัวเลข',
      changePwBtn: 'เปลี่ยนรหัสผ่าน', changing: 'กำลังเปลี่ยน...',
      sessions: 'อุปกรณ์ที่เข้าสู่ระบบ', currentDevice: 'อุปกรณ์นี้ (ปัจจุบัน)',
      logoutAll: 'ออกจากระบบทุกอุปกรณ์',
      twoFa: 'การยืนยัน 2 ขั้นตอน (2FA)', twoFaDesc: 'เพิ่มความปลอดภัยด้วยรหัส OTP ทางมือถือ',
      enable2fa: 'เปิดใช้งาน 2FA', comingSoon: 'เร็วๆ นี้',
    },
    preferences: {
      title: 'การตั้งค่า', language: 'ภาษาที่ต้องการ', currency: 'สกุลเงิน',
      dateFormat: 'รูปแบบวันที่', marketing: 'รับข่าวสารโปรโมชั่น',
      marketingDesc: 'รับอีเมลโปรโมชั่นและข้อเสนอพิเศษจากโรงแรมต่างๆ',
      save: 'บันทึกการตั้งค่า',
      langs: { th: '🇹🇭 ภาษาไทย', en: '🇬🇧 English', zh: '🇨🇳 中文', ja: '🇯🇵 日本語', ko: '🇰🇷 한국어' },
      currencies: { THB: '฿ บาทไทย (THB)', USD: '$ US Dollar (USD)', EUR: '€ Euro (EUR)', JPY: '¥ Japanese Yen (JPY)', CNY: '¥ Chinese Yuan (CNY)' },
      dateFormats: { dmy: 'DD/MM/YYYY', mdy: 'MM/DD/YYYY', ymd: 'YYYY-MM-DD' },
    },
    payments: {
      title: 'บัตรชำระเงิน', addCard: 'เพิ่มบัตร', savedCards: 'บัตรที่บันทึกไว้',
      noCards: 'ยังไม่มีบัตรที่บันทึกไว้', setDefault: 'ตั้งเป็นหลัก', remove: 'ลบ',
      defaultCard: 'บัตรหลัก', expires: 'หมดอายุ',
      addTitle: 'เพิ่มบัตรใหม่', cardNumber: 'หมายเลขบัตร', expiry: 'วันหมดอายุ (MM/YY)',
      cvv: 'CVV', cardName: 'ชื่อบนบัตร', saveCard: 'บันทึกบัตร', cancel: 'ยกเลิก',
      networks: 'ช่องทางชำระเงินที่รองรับ',
      security: 'ข้อมูลบัตรถูกเข้ารหัสด้วยมาตรฐาน PCI DSS Level 1 เราไม่เก็บหมายเลขบัตรฉบับเต็ม',
    },
    privacy: {
      title: 'ความเป็นส่วนตัว & PDPA',
      dataExport: 'ส่งออกข้อมูลของฉัน', dataExportDesc: 'ดาวน์โหลดข้อมูลบัญชี การจอง รีวิว และ wishlist เป็น JSON ตาม PDPA',
      exportBtn: 'ดาวน์โหลดข้อมูลของฉัน',
      deleteAccount: 'ลบบัญชี', deleteDesc: 'ส่งคำขอลบบัญชีและข้อมูลทั้งหมดของคุณ กระบวนการใช้เวลา 30 วัน',
      deleteBtn: 'ส่งคำขอลบบัญชี', deleteConfirm: 'คุณแน่ใจหรือไม่? การลบบัญชีไม่สามารถย้อนกลับได้',
      consentTitle: 'การยินยอม', cookieConsent: 'Cookie Analytics',
      cookieDesc: 'อนุญาตให้ใช้ cookies เพื่อวิเคราะห์การใช้งานและปรับปรุงประสบการณ์',
      marketingConsent: 'การตลาด',
      marketingConsentDesc: 'อนุญาตให้ส่งอีเมลโปรโมชั่นและข้อเสนอพิเศษ',
      thirdParty: 'แชร์ข้อมูลกับพาร์ทเนอร์',
      thirdPartyDesc: 'อนุญาตให้แชร์ข้อมูลแบบไม่ระบุตัวตนเพื่อปรับปรุงบริการ',
      save: 'บันทึกการยินยอม',
    },
    saved: 'บันทึกเรียบร้อย', saving: 'กำลังบันทึก...', error: 'บันทึกไม่สำเร็จ',
  },
  en: {
    title: 'My Account', langToggle: 'ไทย',
    tabs: { profile: 'Profile', notifications: 'Notifications', security: 'Security', preferences: 'Preferences', payments: 'Payments', privacy: 'Privacy' },
    profile: {
      title: 'Personal Information', firstName: 'First Name', lastName: 'Last Name',
      phone: 'Phone', nationality: 'Nationality', birthday: 'Birthday',
      email: 'Email (cannot be changed)', save: 'Save Profile', saving: 'Saving...',
    },
    notifications: {
      title: 'Notifications', desc: 'Choose which events to be notified about and through which channels',
      events: { booking_confirm: 'Booking confirmation', check_in_reminder: 'Check-in reminder (1 day before)', booking_cancel: 'Booking cancelled', loyalty_points: 'Loyalty points earned', promo: 'Promotions & special offers', review_request: 'Post-checkout review request' },
      viaEmail: 'Email', viaSms: 'SMS', viaLine: 'LINE',
      save: 'Save Notifications',
    },
    security: {
      title: 'Security', changePassword: 'Change Password',
      newPw: 'New Password', confirmPw: 'Confirm New Password',
      pwHint: 'At least 8 characters, mix of letters and numbers',
      changePwBtn: 'Change Password', changing: 'Changing...',
      sessions: 'Active Sessions', currentDevice: 'This device (current)',
      logoutAll: 'Sign out of all devices',
      twoFa: 'Two-Factor Authentication (2FA)', twoFaDesc: 'Add extra security with an OTP code on your phone',
      enable2fa: 'Enable 2FA', comingSoon: 'Coming soon',
    },
    preferences: {
      title: 'Preferences', language: 'Preferred Language', currency: 'Currency',
      dateFormat: 'Date Format', marketing: 'Receive Promotions',
      marketingDesc: 'Receive promotional emails and special offers from hotels',
      save: 'Save Preferences',
      langs: { th: '🇹🇭 Thai', en: '🇬🇧 English', zh: '🇨🇳 Chinese', ja: '🇯🇵 Japanese', ko: '🇰🇷 Korean' },
      currencies: { THB: '฿ Thai Baht (THB)', USD: '$ US Dollar (USD)', EUR: '€ Euro (EUR)', JPY: '¥ Japanese Yen (JPY)', CNY: '¥ Chinese Yuan (CNY)' },
      dateFormats: { dmy: 'DD/MM/YYYY', mdy: 'MM/DD/YYYY', ymd: 'YYYY-MM-DD' },
    },
    payments: {
      title: 'Payment Cards', addCard: 'Add Card', savedCards: 'Saved Cards',
      noCards: 'No saved cards yet', setDefault: 'Set as default', remove: 'Remove',
      defaultCard: 'Default', expires: 'Expires',
      addTitle: 'Add New Card', cardNumber: 'Card Number', expiry: 'Expiry (MM/YY)',
      cvv: 'CVV', cardName: 'Name on Card', saveCard: 'Save Card', cancel: 'Cancel',
      networks: 'Supported payment methods',
      security: 'Your card data is encrypted to PCI DSS Level 1 standards. We never store full card numbers.',
    },
    privacy: {
      title: 'Privacy & Data',
      dataExport: 'Export My Data', dataExportDesc: 'Download your account, bookings, reviews, and wishlist data as JSON in compliance with PDPA',
      exportBtn: 'Download My Data',
      deleteAccount: 'Delete Account', deleteDesc: 'Request deletion of your account and all data. The process takes up to 30 days.',
      deleteBtn: 'Request Account Deletion', deleteConfirm: 'Are you sure? Account deletion cannot be undone.',
      consentTitle: 'Consent Management', cookieConsent: 'Analytics Cookies',
      cookieDesc: 'Allow cookies to analyze usage and improve your experience',
      marketingConsent: 'Marketing',
      marketingConsentDesc: 'Allow promotional emails and special offers',
      thirdParty: 'Partner Data Sharing',
      thirdPartyDesc: 'Allow anonymous data sharing to improve services',
      save: 'Save Consent',
    },
    saved: 'Saved', saving: 'Saving...', error: 'Save failed',
  },
};

type PStrings = (typeof T)['th'];

type SavedCard = { id: string; brand: string; last4: string; expMonth: number; expYear: number; isDefault: boolean };
const DEMO_CARDS: SavedCard[] = [
  { id: 'card_1', brand: 'Visa', last4: '4242', expMonth: 12, expYear: 2026, isDefault: true },
  { id: 'card_2', brand: 'Mastercard', last4: '5555', expMonth: 8, expYear: 2027, isDefault: false },
];

export function GuestProfileClient({ guest }: { guest: any }) {
  const supabase = createClient();
  const [lang, setLang] = useState<Lang>('th');
  const [tab, setTab] = useState<Tab>('profile');
  const s = T[lang];

  useEffect(() => {
    const saved = localStorage.getItem('maitri_portal_lang') as Lang | null;
    if (saved === 'th' || saved === 'en') setLang(saved);
  }, []);

  function toggleLang() {
    const next: Lang = lang === 'th' ? 'en' : 'th';
    setLang(next);
    localStorage.setItem('maitri_portal_lang', next);
  }

  const TABS: { key: Tab; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'profile',       icon: User       },
    { key: 'notifications', icon: Bell       },
    { key: 'security',      icon: Lock       },
    { key: 'preferences',   icon: Globe2     },
    { key: 'payments',      icon: CreditCard },
    { key: 'privacy',       icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">
      {/* Sticky header */}
      <nav className="sticky top-0 z-30 bg-[#f5f7fa]/95 dark:bg-background/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-border/40">
        <div className="max-w-screen-sm lg:max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/portal/account" className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0 hover:bg-secondary/80 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <p className="font-display font-bold text-foreground">{s.title}</p>
          </div>
          <button onClick={toggleLang} className="px-3 py-1.5 rounded-xl bg-secondary border border-border/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            {s.langToggle}
          </button>
        </div>
      </nav>

      <div className="px-4 py-5 pb-24 max-w-screen-sm lg:max-w-2xl mx-auto">
        {/* Avatar card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/60 shadow-sm p-4 flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-md">
            {(guest.first_name || guest.email || 'G').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground truncate">{guest.first_name} {guest.last_name || ''}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{guest.email}</p>
          </div>
        </div>

        {/* Tab strip */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1 bg-secondary rounded-2xl p-1 mb-4">
          {TABS.map(({ key, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-semibold transition-all',
                tab === key
                  ? 'bg-white dark:bg-background text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}>
              <Icon className="h-4 w-4" />
              <span className="leading-none">{s.tabs[key]}</span>
            </button>
          ))}
        </div>

        {tab === 'profile'       && <ProfileTab       guest={guest} supabase={supabase} s={s} />}
        {tab === 'notifications' && <NotificationsTab  guest={guest} s={s} />}
        {tab === 'security'      && <SecurityTab       supabase={supabase} s={s} lang={lang} />}
        {tab === 'preferences'   && <PreferencesTab    guest={guest} supabase={supabase} s={s} />}
        {tab === 'payments'      && <PaymentsTab       s={s} />}
        {tab === 'privacy'       && <PrivacyTab        guest={guest} supabase={supabase} s={s} lang={lang} />}
      </div>
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab({ guest, supabase, s }: { guest: any; supabase: any; s: PStrings }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: guest.first_name || '', last_name: guest.last_name || '',
    phone: guest.phone || '', nationality: guest.nationality || '',
    birthday: guest.birthday || '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const ps = s.profile;

  async function save() {
    setSaving(true);
    const res = await fetch('/api/guest/account', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) toast.error(s.error); else toast.success(s.saved);
  }

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-6 space-y-4">
      <h3 className="font-semibold text-foreground">{ps.title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <PField label={ps.firstName} value={form.first_name} onChange={v => set('first_name', v)} />
        <PField label={ps.lastName} value={form.last_name} onChange={v => set('last_name', v)} />
      </div>
      <PField label={ps.phone} type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="0812345678" />
      <PField label={ps.nationality} value={form.nationality} onChange={v => set('nationality', v)} placeholder="Thai / ไทย" />
      <PField label={ps.birthday} type="date" value={form.birthday} onChange={v => set('birthday', v)} />
      <PField label={ps.email} value={guest.email} disabled />
      <button onClick={save} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-colors">
        <Save className="h-4 w-4" />{saving ? ps.saving : ps.save}
      </button>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab({ guest, s }: { guest: any; s: PStrings }) {
  const storageKey = `maitri_notif_${guest.id}`;
  const [saving, setSaving] = useState(false);
  const defaults = {
    booking_confirm:  { email: true,  sms: false, line: true  },
    check_in_reminder:{ email: true,  sms: true,  line: false },
    booking_cancel:   { email: true,  sms: false, line: true  },
    loyalty_points:   { email: false, sms: false, line: true  },
    promo:            { email: false, sms: false, line: false },
    review_request:   { email: true,  sms: false, line: false },
  };
  const [prefs, setPrefs] = useState<Record<string, { email: boolean; sms: boolean; line: boolean }>>(defaults);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) try { setPrefs(JSON.parse(saved)); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(key: string, ch: 'email' | 'sms' | 'line') {
    setPrefs(p => ({ ...p, [key]: { ...p[key], [ch]: !p[key][ch] } }));
  }

  function save() {
    setSaving(true);
    localStorage.setItem(storageKey, JSON.stringify(prefs));
    setTimeout(() => { setSaving(false); toast.success(s.saved); }, 400);
  }

  const ns = s.notifications;
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-6 space-y-5">
      <div>
        <h3 className="font-semibold text-foreground">{ns.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{ns.desc}</p>
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm min-w-[340px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left pb-2 text-muted-foreground font-medium text-xs"></th>
              {([ns.viaEmail, ns.viaSms, ns.viaLine] as const).map(ch => (
                <th key={ch} className="text-center pb-2 px-3 text-muted-foreground font-medium text-xs">{ch}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(Object.keys(ns.events) as (keyof typeof ns.events)[]).map(key => (
              <tr key={key} className="hover:bg-muted/50 transition-colors">
                <td className="py-3 text-sm text-foreground/80">{ns.events[key]}</td>
                {(['email', 'sms', 'line'] as const).map(ch => (
                  <td key={ch} className="text-center py-3 px-3">
                    <button onClick={() => toggle(key, ch)}
                      className={cn('h-5 w-5 rounded border-2 mx-auto flex items-center justify-center transition-all',
                        prefs[key]?.[ch] ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500' : 'border-border hover:border-blue-500/50')}>
                      {prefs[key]?.[ch] && <Check className="h-3 w-3 text-white" />}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={save} disabled={saving}
        className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-colors">
        {saving ? s.saving : ns.save}
      </button>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab({ supabase, s, lang }: { supabase: any; s: PStrings; lang: Lang }) {
  const [pwForm, setPwForm] = useState({ next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const ss = s.security;

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) { toast.error(lang === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match'); return; }
    if (pwForm.next.length < 8) { toast.error(lang === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' : 'Password must be at least 8 characters'); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === 'th' ? 'เปลี่ยนรหัสผ่านเรียบร้อย' : 'Password changed successfully');
    setPwForm({ next: '', confirm: '' });
  }

  return (
    <div className="space-y-4">
      {/* Password */}
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-6 space-y-4">
        <h3 className="font-semibold text-foreground">{ss.changePassword}</h3>
        <div className="relative">
          <PField label={ss.newPw} type={showPw ? 'text' : 'password'} value={pwForm.next}
            onChange={v => setPwForm(p => ({ ...p, next: v }))} placeholder={ss.pwHint} />
          <button type="button" onClick={() => setShowPw(p => !p)}
            className="absolute right-3 bottom-2.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PField label={ss.confirmPw} type="password" value={pwForm.confirm}
          onChange={v => setPwForm(p => ({ ...p, confirm: v }))} />
        <button onClick={changePassword} disabled={pwSaving}
          className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-colors">
          {pwSaving ? ss.changing : ss.changePwBtn}
        </button>
      </div>

      {/* Sessions */}
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-6 space-y-4">
        <h3 className="font-semibold text-foreground">{ss.sessions}</h3>
        <div className="space-y-2">
          {[
            { device: ss.currentDevice, location: 'Thailand', time: lang === 'th' ? 'ตอนนี้' : 'Now', current: true },
          ].map((session, i) => (
            <div key={i} className={cn('flex items-center gap-3 p-3 rounded-xl border', session.current ? 'border-blue-500/20 bg-blue-500/8' : 'border-border bg-muted/50')}>
              <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{session.device}</p>
                <p className="text-xs text-muted-foreground">{session.location} · {session.time}</p>
              </div>
              {session.current && <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-medium">Active</span>}
            </div>
          ))}
        </div>
        <button onClick={() => toast.info(lang === 'th' ? 'ออกจากระบบอุปกรณ์อื่นแล้ว' : 'Signed out of all other devices')}
          className="text-sm text-muted-foreground hover:text-red-500 transition-colors underline underline-offset-2">
          {ss.logoutAll}
        </button>
      </div>

      {/* 2FA */}
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-sm text-foreground">{ss.twoFa}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{ss.twoFaDesc}</p>
        </div>
        <button disabled
          className="shrink-0 px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground cursor-not-allowed">
          {ss.enable2fa} <span className="ml-1 text-muted-foreground/50">({ss.comingSoon})</span>
        </button>
      </div>
    </div>
  );
}

// ─── Preferences Tab ──────────────────────────────────────────────────────────
function PreferencesTab({ guest, supabase, s }: { guest: any; supabase: any; s: PStrings }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    preferred_language: guest.preferred_language || 'th',
    preferred_currency: guest.preferred_currency || 'THB',
    date_format: guest.date_format || 'dmy',
    marketing_consent: guest.marketing_consent || false,
  });
  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));
  const ps = s.preferences;

  async function save() {
    setSaving(true);
    const res = await fetch('/api/guest/account', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferred_language: form.preferred_language, marketing_consent: form.marketing_consent }),
    });
    setSaving(false);
    if (!res.ok) toast.error(s.error); else toast.success(s.saved);
  }

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-6 space-y-5">
      <h3 className="font-semibold text-foreground">{ps.title}</h3>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground block">{ps.language}</label>
        <select value={form.preferred_language} onChange={e => set('preferred_language', e.target.value)}
          className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all">
          {Object.entries(ps.langs).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground block">{ps.currency}</label>
        <select value={form.preferred_currency} onChange={e => set('preferred_currency', e.target.value)}
          className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all">
          {Object.entries(ps.currencies).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground block">{ps.dateFormat}</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ps.dateFormats).map(([v, l]) => (
            <button key={v} onClick={() => set('date_format', v)}
              className={cn('py-2 text-xs rounded-xl border font-medium transition-all', form.date_format === v ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500' : 'bg-muted/50 border-border text-muted-foreground hover:border-blue-500/40')}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-start justify-between cursor-pointer gap-4">
        <div>
          <div className="text-sm font-medium text-foreground">{ps.marketing}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{ps.marketingDesc}</div>
        </div>
        <div onClick={() => set('marketing_consent', !form.marketing_consent)}
          className={cn('relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 mt-0.5', form.marketing_consent ? 'bg-blue-600 dark:bg-blue-500' : 'bg-muted-foreground/30')}>
          <div className={cn('absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform', form.marketing_consent ? 'left-6' : 'left-1')} />
        </div>
      </label>

      <button onClick={save} disabled={saving}
        className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-colors">
        {saving ? s.saving : ps.save}
      </button>
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────
function PaymentsTab({ s }: { s: PStrings }) {
  const [cards, setCards] = useState<SavedCard[]>(DEMO_CARDS);
  const [addingCard, setAddingCard] = useState(false);
  const ps = s.payments;

  function removeCard(id: string) { setCards(prev => prev.filter(c => c.id !== id)); toast.success(ps.remove); }
  function setDefault(id: string) { setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id }))); }

  return (
    <div className="space-y-4">
      {/* Security notice */}
      <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-700 dark:text-emerald-300">{ps.security}</p>
      </div>

      {/* Saved cards */}
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">{ps.savedCards}</h3>
          <button onClick={() => setAddingCard(true)} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
            <Plus className="h-3.5 w-3.5" />{ps.addCard}
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-10"><CreditCard className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" /><p className="text-sm text-muted-foreground">{ps.noCards}</p></div>
        ) : (
          <div className="space-y-2">
            {cards.map(card => (
              <div key={card.id} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all', card.isDefault ? 'border-blue-500/30 bg-blue-500/8' : 'border-border bg-muted/50')}>
                <div className="h-10 w-14 bg-gradient-to-br from-foreground/80 to-blue-600 dark:to-blue-500 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-white text-2xs font-bold">{card.brand.slice(0, 4).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">•••• {card.last4}</p>
                  <p className="text-xs text-muted-foreground">{ps.expires} {String(card.expMonth).padStart(2, '0')}/{card.expYear}</p>
                  {card.isDefault && <span className="text-2xs text-blue-600 dark:text-blue-400 font-medium">{ps.defaultCard}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!card.isDefault && (
                    <button onClick={() => setDefault(card.id)} className="text-2xs text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap">{ps.setDefault}</button>
                  )}
                  <button onClick={() => removeCard(card.id)} className="p-1.5 text-muted-foreground/50 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add card */}
      {addingCard && (
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-5 space-y-4">
          <h3 className="font-bold text-foreground">{ps.addTitle}</h3>
          <PField label={ps.cardNumber} placeholder="1234 5678 9012 3456" />
          <div className="grid grid-cols-2 gap-3">
            <PField label={ps.expiry} placeholder="MM/YY" />
            <PField label={ps.cvv} type="password" placeholder="123" />
          </div>
          <PField label={ps.cardName} placeholder="SOMCHAI JAIDEE" />
          <div className="flex gap-3">
            <button onClick={() => setAddingCard(false)} className="flex-1 py-3 border border-border text-muted-foreground rounded-xl text-sm font-medium">{ps.cancel}</button>
            <button onClick={() => { toast.success('เพิ่มบัตรแล้ว (ระบบ demo)'); setAddingCard(false); }} className="flex-1 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-medium">{ps.saveCard}</button>
          </div>
          <p className="text-center text-2xs text-muted-foreground/50">🔒 TLS 1.3 · PCI DSS Level 1</p>
        </div>
      )}

      {/* Networks */}
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">{ps.networks}</p>
        <div className="flex flex-wrap gap-2">
          {['Visa', 'Mastercard', 'Amex', 'PromptPay', 'TrueMoney', 'LINE Pay', 'JCB'].map(n => (
            <span key={n} className="px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-muted-foreground font-medium">{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Privacy Tab ─────────────────────────────────────────────────────────────
function PrivacyTab({ guest, supabase, s, lang }: { guest: any; supabase: any; s: PStrings; lang: Lang }) {
  const storageKey = `maitri_consent_${guest.id}`;
  const [saving, setSaving] = useState(false);
  const [consents, setConsents] = useState({ cookie: true, marketing: guest.marketing_consent || false, third_party: false });
  const toggle = (k: keyof typeof consents) => setConsents(p => ({ ...p, [k]: !p[k] }));
  const ps = s.privacy;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) try { setConsents(JSON.parse(saved)); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveConsents() {
    setSaving(true);
    localStorage.setItem(storageKey, JSON.stringify(consents));
    fetch('/api/guest/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ marketing_consent: consents.marketing }) }).catch(() => {});
    setTimeout(() => { setSaving(false); toast.success(s.saved); }, 400);
  }

  return (
    <div className="space-y-4">
      {/* Data export */}
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-5">
        <h3 className="font-semibold text-foreground mb-1">{ps.dataExport}</h3>
        <p className="text-xs text-muted-foreground mb-4">{ps.dataExportDesc}</p>
        <button onClick={() => { window.location.href = '/api/guest/privacy/export'; }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-colors">
          <Download className="h-4 w-4" />{ps.exportBtn}
        </button>
      </div>

      {/* Consent management */}
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-5 space-y-4">
        <h3 className="font-semibold text-foreground">{ps.consentTitle}</h3>
        {[
          { key: 'cookie' as const, label: ps.cookieConsent, desc: ps.cookieDesc },
          { key: 'marketing' as const, label: ps.marketingConsent, desc: ps.marketingConsentDesc },
          { key: 'third_party' as const, label: ps.thirdParty, desc: ps.thirdPartyDesc },
        ].map(({ key, label, desc }) => (
          <label key={key} className="flex items-start justify-between cursor-pointer gap-4">
            <div>
              <div className="text-sm font-medium text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
            </div>
            <div onClick={() => toggle(key)}
              className={cn('relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 mt-0.5', consents[key] ? 'bg-blue-600 dark:bg-blue-500' : 'bg-muted-foreground/30')}>
              <div className={cn('absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform', consents[key] ? 'left-6' : 'left-1')} />
            </div>
          </label>
        ))}
        <button onClick={saveConsents} disabled={saving}
          className="w-full py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-colors">
          {saving ? s.saving : ps.save}
        </button>
      </div>

      {/* Delete account */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-700 dark:text-red-300 dark:text-red-300">{ps.deleteAccount}</h3>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{ps.deleteDesc}</p>
          </div>
        </div>
        <button onClick={() => { if (confirm(ps.deleteConfirm)) toast.info(lang === 'th' ? 'ส่งคำขอลบบัญชีแล้ว ทีมงานจะติดต่อกลับภายใน 30 วัน' : 'Deletion request submitted. Our team will process it within 30 days.'); }}
          className="px-4 py-2.5 border border-destructive/30 text-red-700 dark:text-red-300 rounded-xl text-sm font-medium hover:bg-destructive/10 transition-colors">
          {ps.deleteBtn}
        </button>
      </div>
    </div>
  );
}

// ─── DateSelect component (replaces native date input) ───────────────────────
function DateSelect({ label, value, onChange }: { label?: string; value?: string; onChange?: (v: string) => void }) {
  const parts = value ? value.split('-') : ['', '', ''];
  const yr = parts[0] || '', mo = parts[1] || '', dy = parts[2] || '';

  function update(y: string, m: string, d: string) {
    if (y && m && d) onChange?.(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
    else if (!y && !m && !d) onChange?.('');
  }

  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);

  const sel = 'flex-1 px-2 py-2.5 bg-muted/50 border border-border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none cursor-pointer';

  return (
    <div>
      {label && <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>}
      <div className="flex gap-2">
        <select value={dy} onChange={e => update(yr, mo, e.target.value)} className={sel}>
          <option value="">วัน</option>
          {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={String(d)}>{d}</option>)}
        </select>
        <select value={mo} onChange={e => update(yr, e.target.value, dy)} className={cn(sel, 'flex-[2]')}>
          <option value="">เดือน</option>
          {months.map((m,i)=><option key={i+1} value={String(i+1).padStart(2,'0')}>{m}</option>)}
        </select>
        <select value={yr} onChange={e => update(e.target.value, mo, dy)} className={cn(sel, 'flex-[1.5]')}>
          <option value="">ปี</option>
          {years.map(y=><option key={y} value={String(y)}>{y + 543}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Helper component ─────────────────────────────────────────────────────────
function PField({ label, value, onChange, type = 'text', placeholder, disabled }: {
  label?: string; value?: string; onChange?: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean;
}) {
  if (type === 'date') return <DateSelect label={label} value={value} onChange={onChange} />;
  return (
    <div>
      {label && <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>}
      <input
        type={type} value={value ?? ''} onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className={cn(
          'w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm transition-all',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      />
    </div>
  );
}
