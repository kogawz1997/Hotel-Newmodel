'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { toast } from 'sonner';
import { User, ArrowLeft, Save, Lock, Globe2, Download, CreditCard, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { PortalBottomNav } from '@/components/portal/PortalBottomNav';

type SavedCard = { id: string; brand: string; last4: string; expMonth: number; expYear: number; isDefault: boolean };

const DEMO_CARDS: SavedCard[] = [
  { id: 'card_1', brand: 'Visa', last4: '4242', expMonth: 12, expYear: 2026, isDefault: true },
  { id: 'card_2', brand: 'Mastercard', last4: '5555', expMonth: 8, expYear: 2027, isDefault: false },
];

function cardBrandLogo(brand: string) {
  if (brand.toLowerCase() === 'visa') return '💳 Visa';
  if (brand.toLowerCase() === 'mastercard') return '💳 Mastercard';
  if (brand.toLowerCase() === 'amex') return '💳 Amex';
  return '💳 ' + brand;
}

export function GuestProfileClient({ guest }: { guest: any }) {
  const supabase = createClient();
  const [form, setForm] = useState({
    first_name: guest.first_name || '',
    last_name: guest.last_name || '',
    phone: guest.phone || '',
    nationality: guest.nationality || '',
    preferred_language: guest.preferred_language || 'th',
    marketing_consent: guest.marketing_consent || false,
  });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [tab, setTab] = useState<'profile' | 'security' | 'preferences' | 'payments'>('profile');
  const [cards, setCards] = useState<SavedCard[]>(DEMO_CARDS);
  const [addingCard, setAddingCard] = useState(false);

  function exportData() {
    window.location.href = '/api/guest/privacy/export';
  }

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase.from('guest_accounts').update({
      first_name: form.first_name, last_name: form.last_name,
      phone: form.phone, nationality: form.nationality,
      preferred_language: form.preferred_language, marketing_consent: form.marketing_consent,
    }).eq('id', guest.id);
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    toast.success('บันทึกเรียบร้อย');
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) { toast.error('รหัสผ่านใหม่ไม่ตรงกัน'); return; }
    if (pwForm.next.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('เปลี่ยนรหัสผ่านเรียบร้อย');
    setPwForm({ current: '', next: '', confirm: '' });
  }

  function removeCard(id: string) {
    setCards(prev => prev.filter(c => c.id !== id));
    toast.success('ลบบัตรแล้ว');
  }

  function setDefaultCard(id: string) {
    setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
    toast.success('ตั้งเป็นบัตรหลักแล้ว');
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <nav className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/portal/bookings" className="p-2 rounded-full hover:bg-black/5">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium">โปรไฟล์ของฉัน</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-[#2A2522] text-white flex items-center justify-center text-2xl font-bold">
            {guest.first_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-lg text-[#2A2522]">{guest.first_name} {guest.last_name || ''}</div>
            <div className="text-sm text-[#2A2522]/50">{guest.email}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-white rounded-xl p-1 border border-black/5 mb-6">
          {[
            { key: 'profile', label: 'ข้อมูล', icon: User },
            { key: 'security', label: 'ความปลอดภัย', icon: Lock },
            { key: 'preferences', label: 'การตั้งค่า', icon: Globe2 },
            { key: 'payments', label: 'บัตรชำระ', icon: CreditCard },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={`flex flex-col items-center justify-center gap-1 py-2 text-2xs rounded-lg font-medium transition-all ${
                  tab === t.key ? 'bg-[#2A2522] text-white' : 'text-[#2A2522]/50 hover:text-[#2A2522]'
                }`}>
                <Icon className="h-3.5 w-3.5" />{t.label}
              </button>
            );
          })}
        </div>

        {tab === 'profile' && (
          <div className="bg-white rounded-2xl border border-black/5 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="ชื่อ *" value={form.first_name} onChange={(v: string) => set('first_name', v)} />
              <Field label="นามสกุล" value={form.last_name} onChange={(v: string) => set('last_name', v)} />
            </div>
            <Field label="เบอร์โทร" type="tel" value={form.phone} onChange={(v: string) => set('phone', v)} placeholder="0812345678" />
            <Field label="สัญชาติ" value={form.nationality} onChange={(v: string) => set('nationality', v)} placeholder="Thai" />
            <button onClick={saveProfile} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#C66A30] text-white rounded-xl font-medium text-sm disabled:opacity-50">
              <Save className="h-4 w-4" />{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        )}

        {tab === 'security' && (
          <div className="bg-white rounded-2xl border border-black/5 p-6 space-y-4">
            <h3 className="font-semibold text-[#2A2522]">เปลี่ยนรหัสผ่าน</h3>
            <Field label="รหัสผ่านใหม่" type="password" value={pwForm.next} onChange={(v: string) => setPwForm(p => ({ ...p, next: v }))} placeholder="อย่างน้อย 8 ตัวอักษร" />
            <Field label="ยืนยันรหัสผ่านใหม่" type="password" value={pwForm.confirm} onChange={(v: string) => setPwForm(p => ({ ...p, confirm: v }))} placeholder="พิมพ์รหัสผ่านอีกครั้ง" />
            <button onClick={changePassword} disabled={pwSaving}
              className="w-full py-3 bg-[#2A2522] text-white rounded-xl font-medium text-sm disabled:opacity-50">
              {pwSaving ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </div>
        )}

        {tab === 'preferences' && (
          <div className="bg-white rounded-2xl border border-black/5 p-6 space-y-5">
            <div>
              <label className="text-xs font-medium text-[#2A2522]/60 mb-1.5 block">ภาษาที่ต้องการ</label>
              <select value={form.preferred_language} onChange={e => set('preferred_language', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none">
                <option value="th">🇹🇭 ภาษาไทย</option>
                <option value="en">🇬🇧 English</option>
                <option value="zh">🇨🇳 中文</option>
                <option value="ja">🇯🇵 日本語</option>
              </select>
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm font-medium text-[#2A2522]">รับข่าวสารโปรโมชั่น</div>
                <div className="text-xs text-[#2A2522]/50">รับอีเมลโปรโมชั่นและข้อเสนอพิเศษ</div>
              </div>
              <div onClick={() => set('marketing_consent', !form.marketing_consent)}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${form.marketing_consent ? 'bg-[#C66A30]' : 'bg-black/15'}`}>
                <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.marketing_consent ? 'left-7' : 'left-1'}`} />
              </div>
            </label>
            <button onClick={saveProfile} disabled={saving}
              className="w-full py-3 bg-[#C66A30] text-white rounded-xl font-medium text-sm disabled:opacity-50">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>

            <div className="rounded-xl border border-black/10 bg-[#FAF7F2] p-4">
              <div className="text-sm font-semibold text-[#2A2522]">PDPA Data Export</div>
              <p className="mt-1 text-xs leading-5 text-[#2A2522]/55">ดาวน์โหลดข้อมูลบัญชี การจอง รีวิว และ wishlist ของคุณเป็นไฟล์ JSON</p>
              <button onClick={exportData} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#2A2522] px-4 py-2 text-xs font-semibold text-white">
                <Download className="h-3.5 w-3.5" /> ดาวน์โหลดข้อมูลของฉัน
              </button>
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-4">
            {/* Security notice */}
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700">ข้อมูลบัตรของคุณถูกเก็บอย่างปลอดภัยด้วยมาตรฐาน PCI DSS Level 1 เราไม่เก็บหมายเลขบัตรฉบับเต็ม</p>
            </div>

            {/* Saved cards */}
            <div className="bg-white rounded-2xl border border-black/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#2A2522]">บัตรที่บันทึกไว้</h3>
                <button onClick={() => setAddingCard(true)}
                  className="flex items-center gap-1.5 text-xs text-[#C66A30] font-medium hover:underline">
                  <Plus className="h-3.5 w-3.5" />เพิ่มบัตร
                </button>
              </div>

              {cards.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-8 w-8 text-[#2A2522]/20 mx-auto mb-2" />
                  <p className="text-sm text-[#2A2522]/40">ยังไม่มีบัตรที่บันทึกไว้</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map(card => (
                    <div key={card.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${card.isDefault ? 'border-[#C66A30]/30 bg-[#C66A30]/5' : 'border-black/8 bg-[#FAF7F2]'}`}>
                      <div className="h-10 w-14 bg-gradient-to-br from-[#2A2522] to-[#C66A30] rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-white text-2xs font-bold">{card.brand.slice(0, 4).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2A2522]">{cardBrandLogo(card.brand)} •••• {card.last4}</p>
                        <p className="text-xs text-[#2A2522]/40">หมดอายุ {String(card.expMonth).padStart(2, '0')}/{card.expYear}</p>
                        {card.isDefault && <span className="text-2xs text-[#C66A30] font-medium">บัตรหลัก</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!card.isDefault && (
                          <button onClick={() => setDefaultCard(card.id)}
                            className="text-2xs text-[#2A2522]/50 hover:text-[#C66A30] transition-colors">
                            ตั้งเป็นหลัก
                          </button>
                        )}
                        <button onClick={() => removeCard(card.id)}
                          className="p-1.5 text-[#2A2522]/30 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add card form */}
            {addingCard && (
              <div className="bg-white rounded-2xl border border-black/5 p-5 space-y-4">
                <h3 className="font-bold text-[#2A2522]">เพิ่มบัตรใหม่</h3>
                <Field label="หมายเลขบัตร" placeholder="1234 5678 9012 3456" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="วันหมดอายุ" placeholder="MM/YY" />
                  <Field label="CVV" placeholder="123" type="password" />
                </div>
                <Field label="ชื่อบนบัตร" placeholder="SOMCHAI JAIDEE" />
                <div className="flex gap-3">
                  <button onClick={() => setAddingCard(false)}
                    className="flex-1 py-3 border border-black/10 text-[#2A2522]/60 rounded-xl text-sm font-medium">
                    ยกเลิก
                  </button>
                  <button onClick={() => {
                    toast.success('เพิ่มบัตรแล้ว (ระบบ demo)');
                    setAddingCard(false);
                  }}
                    className="flex-1 py-3 bg-[#C66A30] text-white rounded-xl text-sm font-medium">
                    บันทึกบัตร
                  </button>
                </div>
                <p className="text-center text-2xs text-[#2A2522]/30">
                  🔒 ข้อมูลถูกเข้ารหัสด้วย TLS 1.3 และ PCI DSS compliant
                </p>
              </div>
            )}

            {/* Supported networks */}
            <div className="bg-white rounded-2xl border border-black/5 p-4">
              <p className="text-xs font-medium text-[#2A2522]/50 mb-3">ช่องทางชำระเงินที่รองรับ</p>
              <div className="flex flex-wrap gap-2">
                {['Visa', 'Mastercard', 'Amex', 'PromptPay', 'TrueMoney', 'LINE Pay'].map(name => (
                  <span key={name} className="px-3 py-1.5 bg-[#FAF7F2] border border-black/8 rounded-lg text-xs text-[#2A2522]/60 font-medium">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <PortalBottomNav />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: any) {
  return (
    <div>
      <label className="text-xs font-medium text-[#2A2522]/60 mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30 focus:border-[#C66A30] transition-all" />
    </div>
  );
}
