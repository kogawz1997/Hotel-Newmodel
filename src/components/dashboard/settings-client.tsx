'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TopBar } from '@/components/layout/top-bar';
import {
  Building2, Plug, Users, Save, Shield, CreditCard, Bell, Palette,
  FileText, Globe2, MessageCircle, Calculator, Copy, RefreshCw,
  Star, Check, Plus, Trash2, Mail, AlertCircle, ExternalLink,
  Lock, Webhook, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Lang = 'th' | 'en';
type Tab = 'hotel' | 'branding' | 'policies' | 'notifications' | 'team' | 'integrations' | 'security' | 'billing';

const T = {
  th: {
    title: 'ตั้งค่า', desc: 'จัดการโรงแรม ทีม และการเชื่อมต่อของคุณ',
    langToggle: 'EN',
    tabs: { hotel: 'โรงแรม', branding: 'แบรนด์', policies: 'นโยบาย', notifications: 'การแจ้งเตือน', team: 'ทีม', integrations: 'การเชื่อมต่อ', security: 'ความปลอดภัย', billing: 'แผนการ' },
    hotel: {
      title: 'ข้อมูลโรงแรม', desc: 'ข้อมูลพื้นฐานที่ใช้ในใบกำกับและการสื่อสารกับแขก',
      name: 'ชื่อโรงแรม', type: 'ประเภทที่พัก', address: 'ที่อยู่', city: 'จังหวัด',
      postalCode: 'รหัสไปรษณีย์', phone: 'เบอร์โทร', email: 'อีเมล', website: 'เว็บไซต์',
      taxId: 'เลขประจำตัวผู้เสียภาษี', taxIdHint: '13 หลัก สำหรับใบกำกับภาษีอิเล็กทรอนิกส์',
      checkIn: 'เวลา Check-in', checkOut: 'เวลา Check-out',
      currency: 'สกุลเงิน', vat: 'อัตรา VAT', vatHint: '0.07 = 7%', stars: 'ระดับดาว',
      types: { hotel: 'โรงแรม', hostel: 'โฮสเทล', pool_villa: 'Pool Villa', serviced_apartment: 'Serviced Apartment', resort: 'รีสอร์ท', boutique: 'Boutique' },
      save: 'บันทึกข้อมูลโรงแรม',
    },
    branding: {
      title: 'แบรนด์และรูปภาพ', desc: 'โลโก้ รูปหน้าปก และคำอธิบายที่แสดงในรายการโรงแรม',
      logo: 'URL โลโก้', logoDesc: 'แนะนำรูปสี่เหลี่ยม อย่างน้อย 200×200 px',
      hero: 'URL รูปหน้าปก', heroDesc: 'รูปแนวนอน 1920×1080 px ดีที่สุด',
      tagline: 'คำขวัญ (Tagline)', taglinePlaceholder: 'โรงแรมหรูกลางใจเมือง...',
      description: 'คำอธิบายโรงแรม', descPlaceholder: 'บอกเล่าเรื่องราวและความพิเศษของโรงแรมคุณ...',
      preview: 'ตัวอย่างรูป', save: 'บันทึกแบรนด์',
    },
    policies: {
      title: 'นโยบายที่พัก', desc: 'กฎและเงื่อนไขที่แสดงให้แขกเห็นก่อนจอง',
      cancel: 'นโยบายการยกเลิก',
      cancelOpts: { free_24h: 'ยกเลิกฟรีภายใน 24 ชม.', free_48h: 'ยกเลิกฟรีภายใน 48 ชม.', free_72h: 'ยกเลิกฟรีภายใน 72 ชม.', non_refundable: 'ไม่คืนเงิน' },
      deposit: 'มัดจำ (% ของยอดจอง)', depositHint: '0 = ไม่เก็บมัดจำ',
      childrenAllowed: 'อนุญาตให้เด็กเข้าพัก', minChildAge: 'อายุขั้นต่ำ (ปี, 0 = ทุกวัย)',
      petsAllowed: 'อนุญาตให้นำสัตว์เลี้ยงเข้าพัก',
      extraBedAvail: 'มีบริการเตียงเสริม', extraBedPrice: 'ราคาเตียงเสริม (บาท/คืน)',
      maxAdvance: 'จองล่วงหน้าสูงสุด (วัน)', maxAdvanceHint: '365 = จองได้ถึง 1 ปีล่วงหน้า',
      smokingAllowed: 'อนุญาตให้สูบบุหรี่ในห้อง',
      save: 'บันทึกนโยบาย',
    },
    notifications: {
      title: 'การแจ้งเตือน', desc: 'เลือกเหตุการณ์และช่องทางที่ต้องการรับแจ้งเตือน',
      notifEmail: 'อีเมลรับการแจ้งเตือน', notifEmailHint: 'อีเมลสำหรับรับแจ้งเตือนทั้งหมดของโรงแรม',
      events: { new_booking: 'มีการจองใหม่', cancellation: 'มีการยกเลิก', modification: 'มีการเปลี่ยนแปลงการจอง', ota_fail: 'OTA Sync ล้มเหลว', review: 'ได้รับรีวิวใหม่', payment: 'ได้รับชำระเงิน', low_inv: 'ห้องเหลือน้อย (< 3)' },
      viaEmail: 'อีเมล', viaLine: 'LINE', save: 'บันทึกการแจ้งเตือน',
    },
    team: {
      title: 'ทีมงาน', desc: 'จัดการสมาชิกและสิทธิ์การเข้าถึงระบบ',
      invite: 'เชิญพนักงาน', inviteTitle: 'เชิญพนักงานใหม่',
      inviteDesc: 'ส่งลิงก์เชิญทางอีเมล พนักงานจะตั้งรหัสผ่านเองได้',
      emailLabel: 'อีเมล', roleLabel: 'ตำแหน่ง',
      sendInvite: 'ส่งคำเชิญ', sending: 'กำลังส่ง...', cancel: 'ยกเลิก',
      deactivate: 'ปิดการใช้งาน', deactivateDesc: 'พนักงานจะไม่สามารถเข้าสู่ระบบได้ แต่ข้อมูลยังถูกเก็บไว้',
      confirm: 'ยืนยัน', disabled: '(ปิดใช้งาน)',
      permsTitle: 'สิทธิ์ตามตำแหน่ง',
      perms: { bookings: 'จัดการการจอง', rooms: 'จัดการห้อง', inbox: 'ดู/ตอบ Inbox', housekeeping: 'งานแม่บ้าน', reports: 'ดูรายงาน', accounting: 'จัดการบัญชี', settings: 'ตั้งค่าระบบ', team: 'จัดการทีม', billing: 'Billing' },
    },
    integrations: {
      title: 'การเชื่อมต่อ', desc: 'เชื่อมต่อบริการภายนอกเพื่อเพิ่มประสิทธิภาพ',
      setup: 'ตั้งค่า', connected: 'เชื่อมต่อแล้ว', pending: 'ยังไม่ได้ตั้งค่า',
    },
    security: {
      title: 'ความปลอดภัย', desc: 'API Key, Webhook และความปลอดภัยของบัญชี',
      apiKey: 'API Key', apiKeyDesc: 'ใช้สำหรับเชื่อมต่อระบบภายนอก เก็บไว้เป็นความลับ',
      copy: 'คัดลอก', copied: 'คัดลอกแล้ว!', regen: 'สร้างใหม่', regenConfirm: 'สร้าง API Key ใหม่? Key เดิมจะใช้งานไม่ได้ทันที',
      webhookUrl: 'Webhook URL', webhookDesc: 'ระบบส่ง POST request มาที่ URL นี้เมื่อมีเหตุการณ์ต่างๆ',
      saveWebhook: 'บันทึก Webhook',
      twoFa: 'Two-Factor Authentication (2FA)', twoFaDesc: 'เพิ่มความปลอดภัยด้วยการยืนยันตัวตน 2 ขั้นตอน',
      enable2fa: 'เปิดใช้งาน 2FA', comingSoon: 'เร็วๆ นี้',
    },
    billing: {
      title: 'แผนการและการชำระเงิน', desc: 'ดูแผนปัจจุบัน อัพเกรด หรือจัดการการชำระเงิน',
      currentPlan: 'แผนปัจจุบัน', manageBilling: 'จัดการ Billing', goToBilling: 'ไปที่หน้า Billing',
    },
    save: 'บันทึก', saving: 'กำลังบันทึก...', saved: 'บันทึกเรียบร้อย', errorSave: 'บันทึกไม่สำเร็จ',
    roles: { owner: 'เจ้าของ', admin: 'ผู้ดูแลระบบ', manager: 'ผู้จัดการ', front_desk: 'พนักงานต้อนรับ', housekeeping: 'แม่บ้าน', staff: 'พนักงาน' },
  },
  en: {
    title: 'Settings', desc: 'Manage your hotel, team, and integrations',
    langToggle: 'ไทย',
    tabs: { hotel: 'Hotel', branding: 'Branding', policies: 'Policies', notifications: 'Notifications', team: 'Team', integrations: 'Integrations', security: 'Security', billing: 'Billing' },
    hotel: {
      title: 'Hotel Information', desc: 'Basic details used in invoices and guest communications',
      name: 'Hotel Name', type: 'Property Type', address: 'Address', city: 'City / Province',
      postalCode: 'Postal Code', phone: 'Phone', email: 'Email', website: 'Website',
      taxId: 'Tax ID', taxIdHint: '13 digits — required for Thai e-invoicing',
      checkIn: 'Check-in Time', checkOut: 'Check-out Time',
      currency: 'Currency', vat: 'VAT Rate', vatHint: '0.07 = 7%', stars: 'Star Rating',
      types: { hotel: 'Hotel', hostel: 'Hostel', pool_villa: 'Pool Villa', serviced_apartment: 'Serviced Apartment', resort: 'Resort', boutique: 'Boutique' },
      save: 'Save Hotel Info',
    },
    branding: {
      title: 'Branding & Images', desc: 'Logo, hero image, and description shown on your listing',
      logo: 'Logo URL', logoDesc: 'Square image recommended, at least 200×200 px',
      hero: 'Hero Image URL', heroDesc: 'Landscape 1920×1080 px works best',
      tagline: 'Tagline', taglinePlaceholder: 'Luxury hotel in the heart of the city...',
      description: 'Hotel Description', descPlaceholder: 'Tell the story and highlights of your hotel...',
      preview: 'Image Preview', save: 'Save Branding',
    },
    policies: {
      title: 'Hotel Policies', desc: 'Rules and conditions displayed to guests before booking',
      cancel: 'Cancellation Policy',
      cancelOpts: { free_24h: 'Free cancel within 24h', free_48h: 'Free cancel within 48h', free_72h: 'Free cancel within 72h', non_refundable: 'Non-refundable' },
      deposit: 'Deposit (% of booking total)', depositHint: '0 = no deposit required',
      childrenAllowed: 'Children allowed', minChildAge: 'Minimum child age (years, 0 = all ages)',
      petsAllowed: 'Pets allowed',
      extraBedAvail: 'Extra bed available', extraBedPrice: 'Extra bed price (THB/night)',
      maxAdvance: 'Max advance booking (days)', maxAdvanceHint: '365 = bookable up to 1 year ahead',
      smokingAllowed: 'Smoking allowed in rooms',
      save: 'Save Policies',
    },
    notifications: {
      title: 'Notifications', desc: 'Choose which events and channels to receive alerts',
      notifEmail: 'Notification Email', notifEmailHint: 'All hotel alerts will be sent here',
      events: { new_booking: 'New booking received', cancellation: 'Booking cancelled', modification: 'Booking modified', ota_fail: 'OTA sync failure', review: 'New review received', payment: 'Payment received', low_inv: 'Low availability (< 3 rooms)' },
      viaEmail: 'Email', viaLine: 'LINE', save: 'Save Notifications',
    },
    team: {
      title: 'Team Members', desc: 'Manage members and their system access',
      invite: 'Invite Member', inviteTitle: 'Invite Team Member',
      inviteDesc: 'Send an invite link by email. The member sets their own password.',
      emailLabel: 'Email', roleLabel: 'Role',
      sendInvite: 'Send Invite', sending: 'Sending...', cancel: 'Cancel',
      deactivate: 'Deactivate', deactivateDesc: 'The member can no longer log in, but their data is preserved.',
      confirm: 'Confirm', disabled: '(disabled)',
      permsTitle: 'Permissions by Role',
      perms: { bookings: 'Manage Bookings', rooms: 'Manage Rooms', inbox: 'View/Reply Inbox', housekeeping: 'Housekeeping', reports: 'View Reports', accounting: 'Accounting', settings: 'System Settings', team: 'Team Management', billing: 'Billing' },
    },
    integrations: {
      title: 'Integrations', desc: 'Connect external services to boost efficiency',
      setup: 'Set Up', connected: 'Connected', pending: 'Not configured',
    },
    security: {
      title: 'Security', desc: 'API Key, Webhooks, and account security settings',
      apiKey: 'API Key', apiKeyDesc: 'Used to connect external systems. Keep it secret.',
      copy: 'Copy', copied: 'Copied!', regen: 'Regenerate', regenConfirm: 'Generate a new API Key? The current key will be immediately invalidated.',
      webhookUrl: 'Webhook URL', webhookDesc: 'System POSTs to this URL when events occur',
      saveWebhook: 'Save Webhook',
      twoFa: 'Two-Factor Authentication (2FA)', twoFaDesc: 'Add extra security with two-step verification',
      enable2fa: 'Enable 2FA', comingSoon: 'Coming soon',
    },
    billing: {
      title: 'Plan & Billing', desc: 'View your current plan, upgrade, or manage payments',
      currentPlan: 'Current Plan', manageBilling: 'Manage Billing', goToBilling: 'Go to Billing',
    },
    save: 'Save', saving: 'Saving...', saved: 'Saved', errorSave: 'Save failed',
    roles: { owner: 'Owner', admin: 'Admin', manager: 'Manager', front_desk: 'Front Desk', housekeeping: 'Housekeeping', staff: 'Staff' },
  },
};

type Strings = (typeof T)['th'];

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  admin: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  front_desk: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  housekeeping: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
  staff: 'bg-secondary text-muted-foreground',
};

const TABS: { key: Tab; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'hotel',          icon: Building2   },
  { key: 'branding',       icon: Palette     },
  { key: 'policies',       icon: FileText    },
  { key: 'notifications',  icon: Bell        },
  { key: 'team',           icon: Users       },
  { key: 'integrations',   icon: Plug        },
  { key: 'security',       icon: Shield      },
  { key: 'billing',        icon: CreditCard  },
];

export function SettingsClient({ hotel, profile }: { hotel: any; profile: any }) {
  const [lang, setLang] = useState<Lang>('th');
  const [tab, setTab] = useState<Tab>('hotel');
  const s = T[lang];

  useEffect(() => {
    const saved = localStorage.getItem('maitri_dash_lang');
    if (saved === 'en' || saved === 'th') setLang(saved);
  }, []);

  function toggleLang() {
    const next: Lang = lang === 'th' ? 'en' : 'th';
    setLang(next);
    localStorage.setItem('maitri_dash_lang', next);
  }

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-6">
        <TopBar title={s.title} description={s.desc} />
        <button
          onClick={toggleLang}
          className="shrink-0 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {s.langToggle}
        </button>
      </div>

      {/* Tab strip */}
      <div className="flex gap-0.5 mb-6 border-b border-border overflow-x-auto">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
              tab === key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {s.tabs[key]}
          </button>
        ))}
      </div>

      {tab === 'hotel'         && <HotelTab         hotel={hotel} s={s} lang={lang} />}
      {tab === 'branding'      && <BrandingTab       hotel={hotel} s={s} />}
      {tab === 'policies'      && <PoliciesTab       hotel={hotel} s={s} lang={lang} />}
      {tab === 'notifications' && <NotificationsTab  hotel={hotel} s={s} />}
      {tab === 'team'          && <TeamTab           profile={profile} s={s} lang={lang} />}
      {tab === 'integrations'  && <IntegrationsTab   s={s} />}
      {tab === 'security'      && <SecurityTab       hotel={hotel} s={s} lang={lang} />}
      {tab === 'billing'       && <BillingTab        hotel={hotel} s={s} />}
    </div>
  );
}

// ─── Hotel Info ─────────────────────────────────────────────────────────────
function HotelTab({ hotel, s, lang }: { hotel: any; s: Strings; lang: Lang }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: hotel.name || '', type: hotel.type || 'hotel',
    address: hotel.address || '', city: hotel.city || '',
    postal_code: hotel.postal_code || '',
    phone: hotel.phone || '', email: hotel.email || '', website: hotel.website || '',
    tax_id: hotel.tax_id || '',
    check_in_time: hotel.check_in_time || '14:00', check_out_time: hotel.check_out_time || '12:00',
    currency: hotel.currency || 'THB', vat_rate: String(hotel.vat_rate ?? 0.07),
    star_rating: String(hotel.star_rating ?? 3),
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    const { error } = await supabase.from('hotels').update({
      name: form.name, type: form.type, address: form.address, city: form.city,
      phone: form.phone, email: form.email, website: form.website, tax_id: form.tax_id,
      check_in_time: form.check_in_time, check_out_time: form.check_out_time,
      currency: form.currency, vat_rate: parseFloat(form.vat_rate),
    }).eq('id', hotel.id);
    setSaving(false);
    if (error) toast.error(s.errorSave); else toast.success(s.saved);
  }

  const hs = s.hotel;
  return (
    <Card>
      <CardHeader><CardTitle>{hs.title}</CardTitle><CardDescription>{hs.desc}</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={hs.name} value={form.name} onChange={e => set('name', e.target.value)} required />
          <Select label={hs.type} value={form.type} onChange={e => set('type', e.target.value)}>
            {Object.entries(hs.types).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
        <Input label={hs.address} value={form.address} onChange={e => set('address', e.target.value)} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Input label={hs.city} value={form.city} onChange={e => set('city', e.target.value)} />
          <Input label={hs.postalCode} value={form.postal_code} onChange={e => set('postal_code', e.target.value)} />
          <Input label={hs.phone} value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={hs.email} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label={hs.website} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
        </div>
        <Input label={hs.taxId} value={form.tax_id} onChange={e => set('tax_id', e.target.value)} hint={hs.taxIdHint} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={hs.checkIn} type="time" value={form.check_in_time} onChange={e => set('check_in_time', e.target.value)} />
          <Input label={hs.checkOut} type="time" value={form.check_out_time} onChange={e => set('check_out_time', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select label={hs.currency} value={form.currency} onChange={e => set('currency', e.target.value)}>
            <option value="THB">THB — บาทไทย</option>
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="CNY">CNY — Chinese Yuan</option>
          </Select>
          <Input label={hs.vat} type="number" step="0.01" value={form.vat_rate} onChange={e => set('vat_rate', e.target.value)} hint={hs.vatHint} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">{hs.stars}</label>
            <div className="flex gap-1 mt-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => set('star_rating', String(n))}
                  className={cn('p-1 rounded transition-colors', Number(form.star_rating) >= n ? 'text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300')}>
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-2">
          <Button onClick={save} disabled={saving}>{saving ? s.saving : hs.save}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Branding ───────────────────────────────────────────────────────────────
function BrandingTab({ hotel, s }: { hotel: any; s: Strings }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    logo_url: hotel.logo_url || '',
    hero_image_url: hotel.hero_image_url || '',
    tagline: hotel.tagline || '',
    description: hotel.description || '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    const { error } = await supabase.from('hotels').update(form).eq('id', hotel.id);
    setSaving(false);
    if (error) toast.error(s.errorSave); else toast.success(s.saved);
  }

  const bs = s.branding;
  return (
    <Card>
      <CardHeader><CardTitle>{bs.title}</CardTitle><CardDescription>{bs.desc}</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <Input label={bs.logo} value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." hint={bs.logoDesc} />
            {form.logo_url && (
              <div className="rounded-xl border border-border p-3 flex items-center gap-3 bg-secondary/30">
                <img src={form.logo_url} alt="Logo" className="h-12 w-12 rounded-lg object-contain bg-white"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <p className="text-xs text-muted-foreground">{bs.preview}</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <Input label={bs.hero} value={form.hero_image_url} onChange={e => set('hero_image_url', e.target.value)} placeholder="https://..." hint={bs.heroDesc} />
            {form.hero_image_url && (
              <div className="rounded-xl border border-border overflow-hidden">
                <img src={form.hero_image_url} alt="Hero" className="w-full h-28 object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>
        </div>
        <Input label={bs.tagline} value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder={bs.taglinePlaceholder} />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground/80">{bs.description}</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder={bs.descPlaceholder}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>
        <div className="pt-2">
          <Button onClick={save} disabled={saving}>{saving ? s.saving : bs.save}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Policies ───────────────────────────────────────────────────────────────
function PoliciesTab({ hotel, s, lang }: { hotel: any; s: Strings; lang: Lang }) {
  const storageKey = `maitri_policies_${hotel.id}`;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cancellation_policy: 'free_24h', deposit_percent: '0',
    children_allowed: true, min_child_age: '0',
    pets_allowed: false,
    extra_bed: false, extra_bed_price: '500',
    max_advance_days: '365', smoking_allowed: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) try { setForm(JSON.parse(saved)); } catch {}
  }, [storageKey]);

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  function save() {
    setSaving(true);
    localStorage.setItem(storageKey, JSON.stringify(form));
    setTimeout(() => {
      setSaving(false);
      toast.success(s.saved);
    }, 400);
  }

  const ps = s.policies;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{ps.title}</CardTitle><CardDescription>{ps.desc}</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <Select label={ps.cancel} value={form.cancellation_policy} onChange={e => set('cancellation_policy', e.target.value)}>
            {Object.entries(ps.cancelOpts).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Input label={ps.deposit} type="number" min="0" max="100" step="5"
            value={form.deposit_percent} onChange={e => set('deposit_percent', e.target.value)} hint={ps.depositHint} />
          <Input label={ps.maxAdvance} type="number" min="1" max="730"
            value={form.max_advance_days} onChange={e => set('max_advance_days', e.target.value)} hint={ps.maxAdvanceHint} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <PolicyToggle label={ps.childrenAllowed} value={form.children_allowed} onChange={v => set('children_allowed', v)} />
          {form.children_allowed && (
            <Input label={ps.minChildAge} type="number" min="0" max="18"
              value={form.min_child_age} onChange={e => set('min_child_age', e.target.value)} />
          )}
          <PolicyToggle label={ps.petsAllowed} value={form.pets_allowed} onChange={v => set('pets_allowed', v)} />
          <PolicyToggle label={ps.extraBedAvail} value={form.extra_bed} onChange={v => set('extra_bed', v)} />
          {form.extra_bed && (
            <Input label={ps.extraBedPrice} type="number" min="0" step="50"
              value={form.extra_bed_price} onChange={e => set('extra_bed_price', e.target.value)} />
          )}
          <PolicyToggle label={ps.smokingAllowed} value={form.smoking_allowed} onChange={v => set('smoking_allowed', v)} />
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>{saving ? s.saving : ps.save}</Button>
    </div>
  );
}

// ─── Notifications ──────────────────────────────────────────────────────────
function NotificationsTab({ hotel, s }: { hotel: any; s: Strings }) {
  const storageKey = `maitri_notif_${hotel.id}`;
  const [saving, setSaving] = useState(false);
  const defaultEvents = { new_booking: { email: true, line: false }, cancellation: { email: true, line: true }, modification: { email: true, line: false }, ota_fail: { email: true, line: false }, review: { email: false, line: false }, payment: { email: true, line: false }, low_inv: { email: true, line: false } };
  const [notifEmail, setNotifEmail] = useState(hotel.email || '');
  const [events, setEvents] = useState<Record<string, { email: boolean; line: boolean }>>(defaultEvents);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) try { const d = JSON.parse(saved); setNotifEmail(d.email || hotel.email || ''); setEvents(d.events || defaultEvents); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleEvent(key: string, channel: 'email' | 'line') {
    setEvents(p => ({ ...p, [key]: { ...p[key], [channel]: !p[key][channel] } }));
  }

  function save() {
    setSaving(true);
    localStorage.setItem(storageKey, JSON.stringify({ email: notifEmail, events }));
    setTimeout(() => { setSaving(false); toast.success(s.saved); }, 400);
  }

  const ns = s.notifications;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{ns.title}</CardTitle><CardDescription>{ns.desc}</CardDescription></CardHeader>
        <CardContent>
          <Input label={ns.notifEmail} type="email" value={notifEmail} onChange={e => setNotifEmail(e.target.value)} hint={ns.notifEmailHint} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-3 text-muted-foreground font-medium text-xs">เหตุการณ์</th>
                  <th className="text-center pb-3 px-4 text-muted-foreground font-medium text-xs">{ns.viaEmail}</th>
                  <th className="text-center pb-3 px-4 text-muted-foreground font-medium text-xs">{ns.viaLine}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(Object.keys(ns.events) as (keyof typeof ns.events)[]).map(key => (
                  <tr key={key} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 text-sm">{ns.events[key]}</td>
                    {(['email', 'line'] as const).map(ch => (
                      <td key={ch} className="text-center py-3 px-4">
                        <button onClick={() => toggleEvent(key, ch)}
                          className={cn('h-5 w-5 rounded border-2 mx-auto flex items-center justify-center transition-all',
                            events[key]?.[ch] ? 'bg-primary border-primary' : 'border-muted-foreground/30 hover:border-primary/50')}>
                          {events[key]?.[ch] && <Check className="h-3 w-3 text-primary-foreground" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>{saving ? s.saving : ns.save}</Button>
    </div>
  );
}

// ─── Team ───────────────────────────────────────────────────────────────────
function TeamTab({ profile, s, lang }: { profile: any; s: Strings; lang: Lang }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('front_desk');
  const [inviteError, setInviteError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<any>(null);
  const isOwnerOrAdmin = ['owner', 'admin'].includes(profile?.role);
  const ts = s.team;

  const loadMembers = useCallback(async () => {
    const res = await fetch('/api/team');
    if (res.ok) { const d = await res.json(); setMembers(d.members || []); }
    setLoading(false);
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    if (!inviteEmail.trim() || !/\S+@\S+\.\S+/.test(inviteEmail)) { setInviteError(lang === 'th' ? 'กรุณากรอกอีเมลที่ถูกต้อง' : 'Please enter a valid email'); return; }
    setInviting(true);
    const res = await fetch('/api/team/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }) });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) { setInviteError(data.error || ts.inviteTitle); return; }
    toast.success(`${lang === 'th' ? 'ส่งคำเชิญไปที่' : 'Invite sent to'} ${inviteEmail}`);
    setShowInvite(false); setInviteEmail(''); setInviteRole('front_desk'); loadMembers();
  }

  async function updateRole(userId: string, role: string) {
    const res = await fetch('/api/team', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role }) });
    if (res.ok) { toast.success(s.saved); loadMembers(); }
    else { const d = await res.json(); toast.error(d.error || s.errorSave); }
  }

  async function deactivate(userId: string) {
    const res = await fetch('/api/team', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, active: false }) });
    if (res.ok) { toast.success(s.saved); setConfirmRemove(null); loadMembers(); }
    else { const d = await res.json(); toast.error(d.error || s.errorSave); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div><CardTitle>{ts.title}</CardTitle><CardDescription>{ts.desc}</CardDescription></div>
          {isOwnerOrAdmin && <Button size="sm" onClick={() => setShowInvite(true)}><Plus className="h-3.5 w-3.5" />{ts.invite}</Button>}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : (
            <div className="divide-y divide-border">
              {members.map(m => (
                <div key={m.id} className={cn('flex items-center gap-4 px-6 py-4', !m.active && 'opacity-50')}>
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                    {(m.full_name || m.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{m.full_name || m.email}</span>
                      {!m.active && <span className="text-2xs text-muted-foreground">{ts.disabled}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{m.email}</span>
                    </div>
                  </div>
                  {isOwnerOrAdmin && m.role !== 'owner' && m.id !== profile?.id ? (
                    <select value={m.role} onChange={e => updateRole(m.id, e.target.value)}
                      className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-ring">
                      {Object.entries(s.roles).filter(([k]) => k !== 'owner').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ) : (
                    <span className={cn('text-2xs px-2 py-1 rounded-md font-medium', ROLE_COLORS[m.role])}>{s.roles[m.role as keyof typeof s.roles] || m.role}</span>
                  )}
                  {isOwnerOrAdmin && m.role !== 'owner' && m.id !== profile?.id && m.active && (
                    <button onClick={() => setConfirmRemove(m)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions reference */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />{ts.permsTitle}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">{lang === 'th' ? 'สิทธิ์' : 'Permission'}</th>
                  {Object.entries(s.roles).map(([k, l]) => <th key={k} className="text-center py-2 px-2 text-muted-foreground font-medium">{l}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {[
                  { key: 'bookings', roles: ['owner','admin','manager','front_desk'] },
                  { key: 'rooms',    roles: ['owner','admin','manager','front_desk'] },
                  { key: 'inbox',    roles: ['owner','admin','manager','front_desk'] },
                  { key: 'housekeeping', roles: ['owner','admin','manager','front_desk','housekeeping'] },
                  { key: 'reports',  roles: ['owner','admin','manager'] },
                  { key: 'accounting', roles: ['owner','admin','manager'] },
                  { key: 'settings', roles: ['owner','admin'] },
                  { key: 'team',     roles: ['owner','admin'] },
                  { key: 'billing',  roles: ['owner'] },
                ].map(row => (
                  <tr key={row.key}>
                    <td className="py-2 pr-4 text-muted-foreground">{ts.perms[row.key as keyof typeof ts.perms]}</td>
                    {Object.keys(s.roles).map(r => (
                      <td key={r} className="text-center py-2 px-2">
                        {row.roles.includes(r)
                          ? <Check className="h-3.5 w-3.5 text-emerald-600 mx-auto" />
                          : <span className="text-muted-foreground/25">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showInvite} onOpenChange={o => !o && setShowInvite(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{ts.inviteTitle}</DialogTitle><DialogDescription>{ts.inviteDesc}</DialogDescription></DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">{ts.emailLabel} *</label>
              <input type="email" value={inviteEmail} onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }} placeholder="staff@hotel.com"
                className={cn('w-full px-3 py-2 bg-secondary border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring', inviteError ? 'border-destructive' : 'border-0')} />
              {inviteError && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{inviteError}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">{ts.roleLabel}</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {Object.entries(s.roles).filter(([k]) => k !== 'owner').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>{ts.cancel}</Button>
              <Button type="submit" disabled={inviting}>{inviting ? ts.sending : ts.sendInvite}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRemove} onOpenChange={o => !o && setConfirmRemove(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{ts.deactivate} {confirmRemove?.full_name || confirmRemove?.email}?</DialogTitle>
            <DialogDescription>{ts.deactivateDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>{ts.cancel}</Button>
            <Button variant="destructive" onClick={() => deactivate(confirmRemove?.id)}>{ts.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Integrations ────────────────────────────────────────────────────────────
function IntegrationsTab({ s }: { s: Strings }) {
  const groups = [
    {
      title: 'OTA & Channel',
      items: [
        { name: 'Agoda', desc: 'Hotel ID + API credentials', icon: Globe2, status: 'pending', color: 'bg-red-50 text-red-600' },
        { name: 'Booking.com', desc: 'Property ID + API key', icon: Globe2, status: 'pending', color: 'bg-blue-50 text-blue-600' },
        { name: 'Airbnb', desc: 'iCal URL or API key', icon: Globe2, status: 'pending', color: 'bg-rose-50 text-rose-600' },
      ],
    },
    {
      title: 'Messaging',
      items: [
        { name: 'LINE Official Account', desc: 'Channel ID + Channel Secret', icon: MessageCircle, status: 'pending', color: 'bg-green-50 text-green-600' },
        { name: 'WhatsApp Business', desc: 'Phone Number ID + Token', icon: MessageCircle, status: 'pending', color: 'bg-emerald-50 text-emerald-600' },
      ],
    },
    {
      title: 'Payment',
      items: [
        { name: 'Omise', desc: 'Public Key + Secret Key', icon: CreditCard, status: 'pending', color: 'bg-indigo-50 text-indigo-600' },
        { name: 'SCB Easy App', desc: 'Merchant ID + QR credentials', icon: CreditCard, status: 'pending', color: 'bg-purple-50 text-purple-600' },
      ],
    },
    {
      title: 'Accounting & Tax',
      items: [
        { name: 'PEAK Accounting', desc: 'API Key + Company ID', icon: Calculator, status: 'pending', color: 'bg-orange-50 text-orange-600' },
        { name: 'e-Tax Invoice (ETDA)', desc: 'Client ID + Certificate', icon: FileText, status: 'pending', color: 'bg-amber-50 text-amber-600' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-4">
        <CardTitle className="text-sm mb-0.5">{s.integrations.title}</CardTitle>
        <CardDescription>{s.integrations.desc}</CardDescription>
      </div>
      {groups.map(group => (
        <div key={group.title}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group.title}</h3>
          <div className="space-y-2">
            {group.items.map(item => {
              const Icon = item.icon;
              return (
                <Card key={item.name}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', item.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm">{item.name}</span>
                        <Badge variant="outline" className="text-2xs">{s.integrations.pending}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0">
                      {s.integrations.setup} <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Security ────────────────────────────────────────────────────────────────
function SecurityTab({ hotel, s, lang }: { hotel: any; s: Strings; lang: Lang }) {
  const [apiKey] = useState(`mk_live_${hotel.id.slice(0, 8)}xxxxxxxxxxxxxxxxxxxx`);
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const ss = s.security;

  function copyKey() {
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{ss.title}</CardTitle><CardDescription>{ss.desc}</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          {/* API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80 flex items-center gap-2"><Lock className="h-3.5 w-3.5" />{ss.apiKey}</label>
            <p className="text-xs text-muted-foreground">{ss.apiKeyDesc}</p>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg border border-input bg-secondary text-xs font-mono text-muted-foreground truncate">
                {apiKey}
              </code>
              <Button size="sm" variant="outline" onClick={copyKey}><Copy className="h-3.5 w-3.5" />{copied ? ss.copied : ss.copy}</Button>
              <Button size="sm" variant="outline" onClick={() => { if (confirm(ss.regenConfirm)) toast.success(lang === 'th' ? 'สร้าง API Key ใหม่แล้ว' : 'New API Key generated'); }}><RefreshCw className="h-3.5 w-3.5" />{ss.regen}</Button>
            </div>
          </div>

          {/* Webhook */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80 flex items-center gap-2"><Webhook className="h-3.5 w-3.5" />{ss.webhookUrl}</label>
            <p className="text-xs text-muted-foreground">{ss.webhookDesc}</p>
            <div className="flex gap-2">
              <Input className="flex-1" placeholder="https://your-server.com/webhook" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
              <Button variant="outline" onClick={() => toast.success(s.saved)}>{ss.saveWebhook}</Button>
            </div>
          </div>

          {/* 2FA */}
          <div className="flex items-start justify-between p-4 rounded-xl border border-border bg-secondary/30">
            <div>
              <p className="text-sm font-medium">{ss.twoFa}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{ss.twoFaDesc}</p>
            </div>
            <Button size="sm" variant="outline" disabled className="shrink-0">
              {ss.enable2fa} <Badge variant="secondary" className="ml-1 text-2xs">{ss.comingSoon}</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Billing ─────────────────────────────────────────────────────────────────
function BillingTab({ hotel, s }: { hotel: any; s: Strings }) {
  const bs = s.billing;
  const plan = hotel.subscription_plan || hotel.organizations?.subscription_plan || 'starter';
  const planColors: Record<string, string> = { starter: 'bg-zinc-100 text-zinc-700', standard: 'bg-blue-100 text-blue-700', pro: 'bg-purple-100 text-purple-700', enterprise: 'bg-amber-100 text-amber-700' };

  return (
    <Card>
      <CardHeader><CardTitle>{bs.title}</CardTitle><CardDescription>{bs.desc}</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{bs.currentPlan}</p>
            <Badge className={cn('capitalize text-sm px-3 py-1', planColors[plan] || planColors.starter)}>{plan}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/billing'}>
            <ExternalLink className="h-4 w-4" />{bs.manageBilling}
          </Button>
          <Button onClick={() => window.location.href = '/dashboard/billing'}>
            {bs.goToBilling} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function PolicyToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <div onClick={() => onChange(!value)}
        className={cn('relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0', value ? 'bg-primary' : 'bg-muted-foreground/25')}>
        <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', value ? 'left-5' : 'left-0.5')} />
      </div>
    </div>
  );
}
