'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'register' | 'forgot';
type Provider = 'google' | 'facebook' | 'line' | 'apple';

const PROVIDERS: { id: Provider; label: string; bg: string; text: string; icon: React.ReactNode }[] = [
  {
    id: 'google',
    label: 'Google',
    bg: 'bg-white hover:bg-gray-50 border border-gray-200',
    text: 'text-gray-700',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'line',
    label: 'LINE',
    bg: 'bg-[#06C755] hover:bg-[#05B34C]',
    text: 'text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    bg: 'bg-[#1877F2] hover:bg-[#166FE5]',
    text: 'text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Apple',
    bg: 'bg-black hover:bg-gray-900',
    text: 'text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
];

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: 'เข้าสู่ระบบผ่าน Social ไม่สำเร็จ กรุณาลองใหม่',
  staff_account: 'บัญชีนี้เป็นบัญชีพนักงาน กรุณาใช้ลิงก์จากเจ้าของโรงแรม',
};

export default function GuestLoginPage() {
  const router = useRouter();
  const [next, setNext] = useState('/portal/bookings');
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<Provider | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [verified, setVerified] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    phone: '', confirmPassword: '', marketingConsent: false,
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get('next');
    if (n) setNext(n);
    if (params.get('verified') === '1') setVerified(true);
    const err = params.get('error');
    if (err && ERROR_MESSAGES[err]) setErrorBanner(ERROR_MESSAGES[err]);
  }, []);

  async function handleSocial(provider: Provider) {
    setSocialLoading(provider);
    try {
      const supabase = createClient();
      const callbackUrl = `${window.location.origin}/portal/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl },
      });
      if (error) toast.error(`ไม่สามารถเชื่อมต่อ ${provider} ได้`);
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setSocialLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'forgot') {
        const res = await fetch('/api/guest/auth/forgot-password', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        });
        if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
        toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว');
        setMode('login');
        return;
      }

      if (mode === 'register') {
        if (form.password !== form.confirmPassword) { toast.error('รหัสผ่านไม่ตรงกัน'); return; }
        if (form.password.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
        const res = await fetch('/api/guest/auth/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email, password: form.password,
            firstName: form.firstName, lastName: form.lastName,
            phone: form.phone, marketingConsent: form.marketingConsent,
          }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error); return; }
        toast.success('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยัน');
        setMode('login');
        return;
      }

      const res = await fetch('/api/guest/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      router.push(next);
      router.refresh();
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#2A2522] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M4 20V4h4l4 8 4-8h4v16h-3V9l-3 6h-4L7 9v11H4z" fill="white"/>
            </svg>
          </div>
          <span className="font-serif text-xl font-semibold text-[#2A2522] tracking-tight">Maitri</span>
        </Link>
        <div className="text-sm text-[#2A2522]/50">
          {mode === 'login' ? (
            <>ยังไม่มีบัญชี? <button onClick={() => setMode('register')} className="text-[#C66A30] font-medium hover:underline">สมัครฟรี</button></>
          ) : mode === 'register' ? (
            <>มีบัญชีอยู่แล้ว? <button onClick={() => setMode('login')} className="text-[#C66A30] font-medium hover:underline">เข้าสู่ระบบ</button></>
          ) : null}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-black/[0.06] overflow-hidden">

            {/* Card header */}
            <div className="px-8 pt-8 pb-0">
              {errorBanner && (
                <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{errorBanner}</div>
              )}
              {verified && !errorBanner && (
                <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                  <span>✓</span> ยืนยันอีเมลสำเร็จ เข้าสู่ระบบได้เลย
                </div>
              )}

              {mode === 'forgot' ? (
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold text-[#2A2522]">รีเซ็ตรหัสผ่าน</h1>
                  <p className="text-sm text-[#2A2522]/50 mt-1">กรอกอีเมลเพื่อรับลิงก์รีเซ็ต</p>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold text-[#2A2522] mb-5">
                    {mode === 'login' ? 'ยินดีต้อนรับกลับ' : 'สร้างบัญชีใหม่'}
                  </h1>

                  {/* Tab switch */}
                  <div className="flex bg-[#F4F1ED] rounded-xl p-1 mb-6">
                    {(['login', 'register'] as const).map(m => (
                      <button key={m} onClick={() => setMode(m)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === m ? 'bg-white text-[#2A2522] shadow-sm' : 'text-[#2A2522]/50 hover:text-[#2A2522]'}`}>
                        {m === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                      </button>
                    ))}
                  </div>

                  {/* Social buttons */}
                  <div className="grid grid-cols-2 gap-2.5 mb-5">
                    {PROVIDERS.map(p => (
                      <button key={p.id} onClick={() => handleSocial(p.id)}
                        disabled={!!socialLoading}
                        className={`${p.bg} ${p.text} flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all disabled:opacity-60`}>
                        {socialLoading === p.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : p.icon}
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-[#2A2522]/8" />
                    <span className="text-xs text-[#2A2522]/40 shrink-0">หรือใช้อีเมล</span>
                    <div className="flex-1 h-px bg-[#2A2522]/8" />
                  </div>
                </>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-3">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <FormField label="ชื่อ *" value={form.firstName} onChange={v => set('firstName', v)} placeholder="สมชาย" />
                  <FormField label="นามสกุล" value={form.lastName} onChange={v => set('lastName', v)} placeholder="ใจดี" />
                </div>
              )}

              <FormField label="อีเมล *" type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@email.com" />

              {mode === 'register' && (
                <FormField label="เบอร์โทร" type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="0812345678" />
              )}

              {mode !== 'forgot' && (
                <div className="relative">
                  <FormField
                    label="รหัสผ่าน *"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={v => set('password', v)}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 bottom-2.5 text-[#2A2522]/40 hover:text-[#2A2522]/70">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              )}

              {mode === 'register' && (
                <>
                  <div className="relative">
                    <FormField
                      label="ยืนยันรหัสผ่าน *"
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={v => set('confirmPassword', v)}
                      placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 bottom-2.5 text-[#2A2522]/40 hover:text-[#2A2522]/70">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer pt-1">
                    <input type="checkbox" checked={form.marketingConsent}
                      onChange={e => set('marketingConsent', e.target.checked)}
                      className="mt-0.5 rounded accent-[#C66A30]" />
                    <span className="text-xs text-[#2A2522]/50 leading-relaxed">
                      ยินยอมรับโปรโมชั่นและข่าวสาร (ยกเลิกได้ทุกเมื่อ)
                    </span>
                  </label>
                </>
              )}

              {/* Forgot link */}
              {mode === 'login' && (
                <div className="text-right -mt-1">
                  <button type="button" onClick={() => setMode('forgot')}
                    className="text-xs text-[#2A2522]/50 hover:text-[#C66A30] transition-colors">
                    ลืมรหัสผ่าน?
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full mt-1 flex items-center justify-center gap-2 bg-[#C66A30] hover:bg-[#A4522A] disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors">
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> กำลังดำเนินการ...</>
                  : <>{mode === 'login' ? 'เข้าสู่ระบบ' : mode === 'register' ? 'สมัครสมาชิก' : 'ส่งลิงก์รีเซ็ต'} <ArrowRight className="h-4 w-4" /></>}
              </button>

              {mode === 'forgot' && (
                <button type="button" onClick={() => setMode('login')}
                  className="w-full text-sm text-[#2A2522]/50 hover:text-[#2A2522] py-1 transition-colors">
                  ← กลับไปหน้าเข้าสู่ระบบ
                </button>
              )}
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-[#2A2522]/40 mt-5">
            คุณเป็นเจ้าของโรงแรม?{' '}
            <Link href="/owner/login" className="text-[#C66A30] hover:underline">เข้าสู่ระบบ Owner Portal</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#2A2522]/60 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={label.includes('*')}
        className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#2A2522]/10 rounded-xl text-sm placeholder:text-[#2A2522]/30 focus:outline-none focus:ring-2 focus:ring-[#C66A30]/25 focus:border-[#C66A30]/50 transition-all"
      />
    </div>
  );
}
