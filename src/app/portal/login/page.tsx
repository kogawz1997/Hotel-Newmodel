'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';

type Mode = 'login' | 'register' | 'forgot';
type OAuthProvider = 'google' | 'facebook' | 'apple';
type ProviderItem = {
  id: OAuthProvider | 'line';
  label: string;
  soon?: boolean;
  icon: React.ReactNode;
  className: string;
};

const PROVIDERS: ProviderItem[] = [
  {
    id: 'google',
    label: 'Google',
    className: 'bg-card border border-border hover:bg-muted transition-colors text-foreground',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    id: 'line',
    label: 'LINE',
    soon: true,
    className: 'bg-[#06C755]/60 dark:bg-[#06C755]/40 border border-[#06C755]/30 text-white cursor-not-allowed',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-white" aria-hidden>
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    className: 'bg-[#1877F2] hover:bg-[#166FE5] border border-[#1877F2] text-white',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-white" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Apple',
    className: 'bg-foreground hover:opacity-90 border border-foreground text-background',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-background" aria-hidden>
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
];

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: 'เข้าสู่ระบบผ่าน Social ไม่สำเร็จ กรุณาลองใหม่',
  staff_account: 'บัญชีนี้เป็นบัญชีพนักงาน กรุณาใช้ลิงก์จากเจ้าของโรงแรม',
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export default function GuestLoginPage() {
  const router = useRouter();
  const [next, setNext] = useState('/portal/home');
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<OAuthProvider | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [verified, setVerified] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    phone: '', confirmPassword: '', marketingConsent: false,
  });
  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get('next');
    if (n) setNext(n);
    if (params.get('verified') === '1') setVerified(true);
    const err = params.get('error');
    if (err && ERROR_MESSAGES[err]) setErrorBanner(ERROR_MESSAGES[err]);
  }, []);

  async function handleSocial(provider: OAuthProvider) {
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
        toast.success('สมัครสมาชิกสำเร็จ! เข้าสู่ระบบได้เลย');
        setMode('login');
        return;
      }

      // Step 1: resolve the internal auth email from the guest's real email
      const resolveRes = await fetch('/api/guest/auth/resolve-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      if (!resolveRes.ok) { toast.error('ไม่สามารถเชื่อมต่อระบบได้'); return; }
      const { authEmail } = await resolveRes.json();

      // Step 2: sign in client-side so the browser Supabase client manages the session cookie
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: form.password,
      });
      if (signInError) { toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); return; }
      toast.success('เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ 🎉');
      setRedirecting(true);
      router.push(next);
      router.refresh();
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  // Wrapper so button onClick can call the FormEvent handler
  function handleEmailClick() {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  }

  // Social provider config for Trip.com-style stacked buttons
  const TRIP_PROVIDERS = [
    {
      id: 'google' as OAuthProvider,
      label: 'ดำเนินการต่อด้วย Google',
      className: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
        </svg>
      ),
    },
    {
      id: 'facebook' as OAuthProvider,
      label: 'ดำเนินการต่อด้วย Facebook',
      className: 'bg-[#1877F2] hover:bg-[#166FE5] text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-white" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      id: 'line' as 'line',
      label: 'ดำเนินการต่อด้วย LINE',
      soon: true,
      className: 'bg-[#06C755] hover:bg-[#05b34c] text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-white" aria-hidden>
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      ),
    },
    {
      id: 'apple' as OAuthProvider,
      label: 'ดำเนินการต่อด้วย Apple',
      className: 'bg-black hover:bg-gray-900 text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-white" aria-hidden>
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa] px-4 py-10">
      {/* Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl flex overflow-hidden">

        {/* ── Close button ── */}
        <Link
          href="/"
          className="absolute top-3 right-3 z-20 h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="ปิด"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>

        {/* ══════════════════════════════════════
            LEFT PANEL — form (~55%)
        ══════════════════════════════════════ */}
        <div className="flex-1 px-8 py-8 flex flex-col min-w-0">

          {/* Alerts */}
          <AnimatePresence>
            {errorBanner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
              >
                {errorBanner}
              </motion.div>
            )}
            {verified && !errorBanner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4 shrink-0" />
                ยืนยันอีเมลสำเร็จ เข้าสู่ระบบได้เลย
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {mode === 'forgot' ? (
              /* ── Forgot password view ── */
              <motion.div key="forgot" {...fadeUp} className="flex flex-col gap-5">
                <div>
                  <h1 className="text-xl font-bold text-gray-800 text-center">รีเซ็ตรหัสผ่าน</h1>
                  <p className="text-sm text-gray-500 text-center mt-1">กรอกอีเมลเพื่อรับลิงก์รีเซ็ต</p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="โปรดระบุอีเมล"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" />กำลังส่ง...</> : <>ส่งลิงก์รีเซ็ต</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
                  >
                    ← กลับไปเข้าสู่ระบบ
                  </button>
                </form>
              </motion.div>
            ) : (
              /* ── Main login / register view ── */
              <motion.div key="main" variants={stagger} initial="initial" animate="animate" className="flex flex-col gap-5">

                {/* Title */}
                <motion.div variants={fadeUp} className="text-center">
                  <h1 className="text-xl font-bold text-gray-800">เข้าสู่ระบบ / ลงทะเบียน</h1>
                  {/* Benefits subtitle */}
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">✓</span> สิทธิประโยชน์สำหรับสมาชิก
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-green-500">✓</span> จัดการการจองง่ายดาย
                    </span>
                  </div>
                </motion.div>

                {/* Email input */}
                <motion.div variants={fadeUp} className="flex flex-col gap-2">
                  {mode === 'register' && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={e => set('firstName', e.target.value)}
                        placeholder="ชื่อ"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={e => set('lastName', e.target.value)}
                        placeholder="นามสกุล"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                    </div>
                  )}

                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="โปรดระบุอีเมล"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />

                  {mode === 'register' && (
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="เบอร์โทรศัพท์"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                  )}

                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {mode === 'register' && (
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={e => set('confirmPassword', e.target.value)}
                        placeholder="ยืนยันรหัสผ่าน"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  )}

                  {mode === 'register' && (
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.marketingConsent}
                        onChange={e => set('marketingConsent', e.target.checked)}
                        className="mt-0.5 rounded accent-blue-600"
                      />
                      <span className="text-xs text-gray-500 leading-relaxed">
                        ยินยอมรับโปรโมชั่นและข่าวสาร (ยกเลิกได้ทุกเมื่อ)
                      </span>
                    </label>
                  )}
                </motion.div>

                {/* Email submit button */}
                <motion.div variants={fadeUp} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={handleEmailClick}
                    disabled={loading || (!form.email && !form.password)}
                    className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2
                      ${form.email && form.password
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                      disabled:opacity-60`}
                  >
                    {redirecting
                      ? <><CheckCircle className="h-4 w-4 text-green-300" />กำลังนำคุณไปหน้าหลัก...</>
                      : loading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />กำลังดำเนินการ...</>
                      : <>{mode === 'login' ? 'ดำเนินการต่อด้วยอีเมล' : 'สมัครสมาชิก'}</>
                    }
                  </button>
                  {mode === 'login' && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        ลืมรหัสผ่าน?
                      </button>
                    </div>
                  )}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                      className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {mode === 'login' ? 'ยังไม่มีบัญชี? สมัครสมาชิก' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
                    </button>
                  </div>
                </motion.div>

                {/* Divider */}
                <motion.div variants={fadeUp} className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 shrink-0">หรือ</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </motion.div>

                {/* Social buttons — stacked vertically */}
                <motion.div variants={fadeUp} className="flex flex-col gap-2.5">
                  {TRIP_PROVIDERS.map(p => (
                    p.soon ? (
                      <div
                        key={p.id}
                        className={`relative flex items-center gap-3 w-full py-2.5 px-4 rounded-lg text-sm font-medium opacity-60 cursor-not-allowed select-none ${p.className}`}
                      >
                        {p.icon}
                        <span className="flex-1 text-center">{p.label}</span>
                        <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full leading-none shrink-0">
                          เร็วๆ นี้
                        </span>
                      </div>
                    ) : (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSocial(p.id as OAuthProvider)}
                        disabled={!!socialLoading}
                        className={`flex items-center gap-3 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${p.className}`}
                      >
                        {socialLoading === p.id
                          ? <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                          : p.icon
                        }
                        <span className="flex-1 text-center">{p.label}</span>
                      </button>
                    )
                  ))}
                </motion.div>

                {/* Footer */}
                <motion.div variants={fadeUp} className="text-center text-[11px] text-gray-400 leading-relaxed mt-1">
                  การเข้าสู่ระบบถือว่าคุณยอมรับ{' '}
                  <Link href="/terms" className="underline hover:text-gray-600">ข้อกำหนดการใช้งาน</Link>
                  {' '}และ{' '}
                  <Link href="/privacy" className="underline hover:text-gray-600">นโยบายความเป็นส่วนตัว</Link>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══════════════════════════════════════
            RIGHT PANEL — QR code (~45%), hidden on mobile
        ══════════════════════════════════════ */}
        <div className="hidden md:flex w-[45%] shrink-0 bg-gray-50 border-l border-gray-100 flex-col items-center justify-center px-6 py-10 gap-5">

          {/* QR code placeholder */}
          <div className="w-[180px] h-[180px] bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
            {/* Simple SVG QR-like grid pattern */}
            <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="QR Code">
              {/* Corner squares */}
              <rect x="8" y="8" width="44" height="44" rx="4" fill="#1a1a1a"/>
              <rect x="16" y="16" width="28" height="28" rx="2" fill="white"/>
              <rect x="22" y="22" width="16" height="16" rx="1" fill="#1a1a1a"/>

              <rect x="108" y="8" width="44" height="44" rx="4" fill="#1a1a1a"/>
              <rect x="116" y="16" width="28" height="28" rx="2" fill="white"/>
              <rect x="122" y="22" width="16" height="16" rx="1" fill="#1a1a1a"/>

              <rect x="8" y="108" width="44" height="44" rx="4" fill="#1a1a1a"/>
              <rect x="16" y="116" width="28" height="28" rx="2" fill="white"/>
              <rect x="22" y="122" width="16" height="16" rx="1" fill="#1a1a1a"/>

              {/* Data dots — simplified grid */}
              {[60,68,76,84,92,100].map(x =>
                [8,16,24,32,40,48].map(y =>
                  (Math.sin(x * y) > 0.1) ? <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1" fill="#1a1a1a"/> : null
                )
              )}
              {[8,16,24,32,40,48,60,68,76,84,92,100,108,116,124,132,140,148].map(x =>
                [60,68,76,84,92,100,108,116,124,132,140,148].map(y =>
                  (Math.cos(x + y) > 0.15) ? <rect key={`d-${x}-${y}`} x={x} y={y} width="6" height="6" rx="1" fill="#1a1a1a"/> : null
                )
              )}

              {/* Center logo area */}
              <rect x="66" y="66" width="28" height="28" rx="4" fill="white"/>
              <rect x="70" y="70" width="20" height="20" rx="3" fill="#0066CC"/>
              <text x="80" y="84" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="sans-serif">M</text>
            </svg>
          </div>

          {/* Heading */}
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700 leading-snug">
              ใช้แอป Maitri เพื่อเข้าสู่ระบบ<br />ด้วย QR Code
            </p>
          </div>

          {/* Steps */}
          <ol className="flex flex-col gap-2.5 text-xs text-gray-500 w-full max-w-[180px]">
            <li className="flex items-start gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-[10px] mt-px">1</span>
              <span>เปิดแอป Maitri</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-[10px] mt-px">2</span>
              <span>ไปที่ บัญชี</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-[10px] mt-px">3</span>
              <span>แตะไอคอนสแกนที่มุมขวาบน หรือไปที่ ⚙ (การตั้งค่า) &gt; สแกน QR Code</span>
            </li>
          </ol>
        </div>

      </div>
    </div>
  );
}

function LuxField({
  label, value, onChange, type = 'text', placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 bg-background border border-input rounded-xl text-sm
          placeholder:text-muted-foreground/40
          focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50
          transition-all"
      />
    </div>
  );
}
