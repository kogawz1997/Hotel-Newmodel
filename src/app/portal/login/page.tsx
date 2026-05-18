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

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left panel: hotel imagery ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=85&fit=crop"
          alt="Luxury hotel pool"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />

        {/* Brand mark */}
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <span className="font-display text-base font-bold text-white">M</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-medium">Private Journey</p>
              <p className="font-display text-base font-semibold text-white leading-none">Maitri Collection</p>
            </div>
          </div>
        </div>

        {/* Bottom quote */}
        <div className="absolute bottom-12 left-8 right-8 z-10">
          <blockquote className="font-display text-2xl font-semibold text-white leading-snug mb-3">
            "ประสบการณ์การพักที่ไม่เหมือนใคร<br />สำหรับทุกเส้นทางของคุณ"
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-px bg-amber-400/80" />
            <span className="text-sm text-white/60">Maitri Grand Collection</span>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile: subtle hotel image header */}
        <div className="lg:hidden relative h-48 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&fit=crop"
            alt="Hotel"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-background" />
          {/* Mobile brand */}
          <div className="absolute top-5 left-5 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <span className="font-display text-xs font-bold text-white">M</span>
            </div>
            <span className="font-display text-sm font-semibold text-white">Maitri Collection</span>
          </div>
        </div>

        {/* Theme toggle (desktop only — mobile has no header here) */}
        <div className="hidden lg:flex justify-end p-5">
          <PortalThemeToggle />
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-start lg:items-center justify-center px-6 py-8 lg:py-0">
          <div className="w-full max-w-sm">

            {/* Alerts */}
            <AnimatePresence>
              {errorBanner && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
                >
                  {errorBanner}
                </motion.div>
              )}
              {verified && !errorBanner && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  ยืนยันอีเมลสำเร็จ เข้าสู่ระบบได้เลย
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {mode === 'forgot' ? (
                <motion.div key="forgot" {...fadeUp}>
                  <h1 className="font-display text-2xl font-semibold text-foreground mb-1">รีเซ็ตรหัสผ่าน</h1>
                  <p className="text-sm text-muted-foreground mb-6">กรอกอีเมลเพื่อรับลิงก์รีเซ็ต</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <LuxField label="อีเมล" type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@email.com" required />
                    <button type="submit" disabled={loading} className="btn-gold w-full">
                      {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังส่ง...</> : <>ส่งลิงก์รีเซ็ต <ArrowRight className="h-4 w-4 ml-1.5" /></>}
                    </button>
                    <button type="button" onClick={() => setMode('login')}
                      className="w-full text-sm text-muted-foreground hover:text-foreground py-2 transition-colors">
                      ← กลับไปเข้าสู่ระบบ
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="main" variants={stagger} initial="initial" animate="animate">
                  {/* Heading */}
                  <motion.div variants={fadeUp} className="mb-6">
                    <h1 className="font-display text-2xl font-semibold text-foreground">
                      {mode === 'login' ? 'ยินดีต้อนรับกลับ' : 'เริ่มต้นประสบการณ์ของคุณ'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mode === 'login' ? 'เข้าสู่ระบบเพื่อดูการจองของคุณ' : 'สร้างบัญชีสมาชิกฟรี'}
                    </p>
                  </motion.div>

                  {/* Tab switch */}
                  <motion.div variants={fadeUp} className="relative flex bg-secondary rounded-2xl p-1 mb-6">
                    {(['login', 'register'] as const).map(m => (
                      <button key={m} onClick={() => setMode(m)}
                        className="flex-1 relative py-2.5 text-sm font-medium z-10 transition-colors duration-200"
                        style={{ color: mode === m ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
                      >
                        {mode === m && (
                          <motion.div
                            layoutId="login-tab-bg"
                            className="absolute inset-0 bg-card rounded-xl shadow-sm"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">
                          {m === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                        </span>
                      </button>
                    ))}
                  </motion.div>

                  {/* Social login */}
                  <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2.5 mb-5">
                    {PROVIDERS.map(p => (
                      p.soon ? (
                        <div key={p.id}
                          className={`relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium opacity-50 cursor-not-allowed pointer-events-none select-none ${p.className}`}>
                          {p.icon}
                          <span>{p.label}</span>
                          <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                            เร็วๆ นี้
                          </span>
                        </div>
                      ) : (
                        <button
                          key={p.id}
                          onClick={() => handleSocial(p.id as OAuthProvider)}
                          disabled={!!socialLoading}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all disabled:opacity-60 ${p.className}`}
                        >
                          {socialLoading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : p.icon}
                          <span>{p.label}</span>
                        </button>
                      )
                    ))}
                  </motion.div>

                  {/* Divider */}
                  <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground shrink-0">หรือใช้อีเมล</span>
                    <div className="flex-1 h-px bg-border" />
                  </motion.div>

                  {/* Email form */}
                  <form onSubmit={handleSubmit}>
                    <motion.div variants={stagger} className="space-y-3">
                      {mode === 'register' && (
                        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2.5">
                          <LuxField label="ชื่อ *" value={form.firstName} onChange={v => set('firstName', v)} placeholder="สมชาย" required />
                          <LuxField label="นามสกุล" value={form.lastName} onChange={v => set('lastName', v)} placeholder="ใจดี" />
                        </motion.div>
                      )}

                      <motion.div variants={fadeUp}>
                        <LuxField label="อีเมล *" type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@email.com" required />
                      </motion.div>

                      {mode === 'register' && (
                        <motion.div variants={fadeUp}>
                          <LuxField label="เบอร์โทร" type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="0812345678" />
                        </motion.div>
                      )}

                      <motion.div variants={fadeUp} className="relative">
                        <LuxField
                          label="รหัสผ่าน *"
                          type={showPass ? 'text' : 'password'}
                          value={form.password}
                          onChange={v => set('password', v)}
                          placeholder="อย่างน้อย 8 ตัวอักษร"
                          required
                        />
                        <button type="button" onClick={() => setShowPass(p => !p)}
                          className="absolute right-3 bottom-2.5 text-muted-foreground hover:text-foreground transition-colors">
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </motion.div>

                      {mode === 'register' && (
                        <motion.div variants={fadeUp} className="relative">
                          <LuxField
                            label="ยืนยันรหัสผ่าน *"
                            type={showConfirm ? 'text' : 'password'}
                            value={form.confirmPassword}
                            onChange={v => set('confirmPassword', v)}
                            placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                            required
                          />
                          <button type="button" onClick={() => setShowConfirm(p => !p)}
                            className="absolute right-3 bottom-2.5 text-muted-foreground hover:text-foreground transition-colors">
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </motion.div>
                      )}

                      {mode === 'register' && (
                        <motion.label variants={fadeUp} className="flex items-start gap-3 cursor-pointer pt-1">
                          <input type="checkbox" checked={form.marketingConsent}
                            onChange={e => set('marketingConsent', e.target.checked)}
                            className="mt-0.5 rounded accent-amber-600 dark:accent-amber-400" />
                          <span className="text-xs text-muted-foreground leading-relaxed">
                            ยินยอมรับโปรโมชั่นและข่าวสาร (ยกเลิกได้ทุกเมื่อ)
                          </span>
                        </motion.label>
                      )}

                      {mode === 'login' && (
                        <motion.div variants={fadeUp} className="text-right -mt-1">
                          <button type="button" onClick={() => setMode('forgot')}
                            className="text-xs text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                            ลืมรหัสผ่าน?
                          </button>
                        </motion.div>
                      )}

                      <motion.button
                        variants={fadeUp}
                        type="submit"
                        disabled={loading}
                        className="btn-gold w-full mt-1"
                        whileTap={{ scale: 0.98 }}
                      >
                        {redirecting
                          ? <><CheckCircle className="h-4 w-4 mr-2 text-emerald-300" />กำลังนำคุณไปหน้าหลัก...</>
                          : loading
                          ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังดำเนินการ...</>
                          : <>{mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'} <ArrowRight className="h-4 w-4 ml-1.5" /></>}
                      </motion.button>
                    </motion.div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer links */}
            <div className="mt-6 text-center text-xs text-muted-foreground/60">
              <p>ระบบสมาชิกสำหรับผู้เข้าพักเท่านั้น</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gold button global style for this page */}
      <style jsx global>{`
        .btn-gold {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          background: linear-gradient(135deg, #C8975A 0%, #A07240 100%);
          color: white;
          transition: opacity 0.15s, transform 0.15s;
          cursor: pointer;
          border: none;
        }
        .btn-gold:hover { opacity: 0.92; }
        .btn-gold:disabled { opacity: 0.55; cursor: not-allowed; }
        .dark .btn-gold {
          background: linear-gradient(135deg, #D4A574 0%, #B0825A 100%);
        }
      `}</style>
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
          focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50
          transition-all"
      />
    </div>
  );
}
