'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { loginOwner } from '@/lib/auth/role-login';
import { createClient } from '@/lib/supabase/client';

type Tab = 'login' | 'register';

export default function OwnerLoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    if (t === 'register') setTab('register');
    const error = params.get('error');
    if (error === 'session_expired') setErrorMessage('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
    if (error === '2fa_required') setErrorMessage('บัญชีนี้ต้องยืนยัน 2FA ก่อนใช้งาน');
    if (error === 'forbidden') setErrorMessage('บัญชีนี้ไม่มีสิทธิ์เข้าถึง Owner Portal');
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await loginOwner(email, password);
      if (!result.ok) return toast.error(result.message);
      toast.success('เข้าสู่ระบบสำเร็จ');
      window.location.href = result.redirectTo;
    } catch (err) {
      toast.error(err instanceof Error && err.message === 'AUTH_TIMEOUT' ? 'การเชื่อมต่อใช้เวลานานเกินไป' : 'ไม่สามารถเข้าสู่ระบบได้');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regPassword.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: regEmail, password: regPassword,
        options: { data: { full_name: fullName } },
      });
      if (authError) { toast.error(authError.message); return; }

      const res = await fetch('/api/auth/register-owner', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast.success('สมัครสำเร็จ! กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ');
          setTab('login');
          return;
        }
        const payload = await res.json().catch(() => null);
        toast.error(payload?.error || 'เกิดข้อผิดพลาดในการสร้างบัญชี');
        return;
      }
      toast.success('สร้างบัญชีสำเร็จ! ยินดีต้อนรับ');
      window.location.href = '/owner/hotels';
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Portal badge */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">Owner Portal</span>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {errorMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1">
        {(['login', 'register'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        ))}
      </div>

      {/* Login Form */}
      {tab === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <Input type="email" label="อีเมล" value={email} onChange={e => setEmail(e.target.value)} required />
          <div className="relative">
            <Input type={showPass ? 'text' : 'password'} label="รหัสผ่าน" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3 bottom-2.5 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังเข้าสู่ระบบ...</> : <>เข้าสู่ระบบ <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </form>
      )}

      {/* Register Form */}
      {tab === 'register' && (
        <form onSubmit={handleRegister} className="space-y-3">
          <Input label="ชื่อ-นามสกุล *" placeholder="ชื่อจริง นามสกุล" value={fullName} onChange={e => setFullName(e.target.value)} required />
          <Input type="email" label="อีเมล *" placeholder="you@hotel.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
          <div className="relative">
            <Input type={showPass ? 'text' : 'password'} label="รหัสผ่าน *" hint="อย่างน้อย 8 ตัวอักษร" value={regPassword} onChange={e => setRegPassword(e.target.value)} required minLength={8} />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-3 bottom-2.5 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={loading} size="lg">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังสร้างบัญชี...</> : <>สมัครฟรี 60 วัน <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            การสมัครหมายถึงยอมรับ <a href="#" className="underline">เงื่อนไขการใช้งาน</a> และ <a href="#" className="underline">นโยบายความเป็นส่วนตัว</a>
          </p>
        </form>
      )}

      <div className="space-y-1.5 text-center text-xs text-muted-foreground">
        <p>
          ลูกค้าโรงแรม?{' '}
          <Link href="/portal/login" className="text-primary hover:underline">เข้าสู่ระบบ Guest Portal</Link>
        </p>
        <p className="text-muted-foreground/60">พนักงาน: ใช้ลิงก์ที่ได้รับจากเจ้าของโรงแรมเท่านั้น</p>
      </div>
    </div>
  );
}
