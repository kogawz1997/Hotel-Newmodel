'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, ShieldAlert, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { loginInternal } from '@/lib/auth/role-login';

export default function InternalLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    if (error === 'session_expired') setErrorMessage('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
    if (error === '2fa_required') setErrorMessage('บัญชีนี้ต้องยืนยัน 2FA ก่อนใช้งาน');
    if (!token) {
      setTokenValid(false);
      setTokenChecked(true);
      return;
    }

    fetch('/api/team/staff-login-validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'invalid_token');
        setTokenValid(true);
      })
      .catch(() => {
        setTokenValid(false);
        toast.error('ลิงก์พนักงานไม่ถูกต้องหรือหมดอายุ');
      })
      .finally(() => setTokenChecked(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenValid) return;
    setLoading(true);
    try {
      const result = await loginInternal(email, password);
      if (!result.ok) return toast.error(result.message);
      toast.success('เข้าสู่ระบบสำเร็จ');
      window.location.href = result.redirectTo;
    } catch (error) {
      toast.error(error instanceof Error && error.message === 'AUTH_TIMEOUT' ? 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่' : 'ไม่สามารถเข้าสู่ระบบได้');
    } finally {
      setLoading(false);
    }
  }

  if (!tokenChecked) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Staff Portal</span>
        </div>
        <p className="text-sm text-muted-foreground">กำลังตรวจสอบลิงก์พนักงาน...</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Staff Portal</span>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 space-y-2">
          <p className="text-sm font-medium text-amber-900">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          <p className="text-xs text-amber-800">
            หน้านี้ใช้สำหรับพนักงานที่ได้รับลิงก์จากเจ้าของโรงแรมเท่านั้น
            กรุณาติดต่อเจ้าของโรงแรมเพื่อขอลิงก์เข้าสู่ระบบ
          </p>
          {errorMessage && <p className="text-xs text-amber-800 border-t border-amber-200 pt-2">{errorMessage}</p>}
        </div>
        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p>
            ลูกค้าโรงแรม?{' '}
            <Link href="/portal/login" className="text-primary hover:underline">
              เข้าสู่ระบบ Guest Portal
            </Link>
          </p>
          <p>
            เจ้าของโรงแรม?{' '}
            <Link href="/owner/login" className="text-primary hover:underline">
              เข้าสู่ระบบ Owner Portal
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Staff Portal</span>
        </div>
        {errorMessage && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {errorMessage}
          </div>
        )}
        <h1 className="font-display text-3xl font-medium tracking-tight">เข้าสู่ระบบพนักงาน</h1>
        <p className="text-sm text-muted-foreground mt-2">ลิงก์ผ่านการตรวจสอบแล้ว กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input type="email" label="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" label="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : <>เข้าสู่ระบบ <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
      </form>
    </div>
  );
}
