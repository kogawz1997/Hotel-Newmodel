'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { loginOwner } from '@/lib/auth/role-login';

export default function OwnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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
    } catch (error) {
      toast.error(
        error instanceof Error && error.message === 'AUTH_TIMEOUT'
          ? 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่'
          : 'ไม่สามารถเข้าสู่ระบบได้'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Owner Portal</span>
        </div>
        {errorMessage && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {errorMessage}
          </div>
        )}
        <h1 className="font-display text-3xl font-medium tracking-tight">เข้าสู่ระบบเจ้าของโรงแรม</h1>
        <p className="text-sm text-muted-foreground mt-2">
          สำหรับเจ้าของโรงแรมและผู้จัดการทั่วไปเท่านั้น
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          type="email"
          label="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          label="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : <>เข้าสู่ระบบ <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
      </form>

      <div className="space-y-2 text-center text-xs text-muted-foreground">
        <p>
          ลูกค้าโรงแรม?{' '}
          <Link href="/portal/login" className="text-primary hover:underline">
            เข้าสู่ระบบ Guest Portal
          </Link>
        </p>
        <p className="text-muted-foreground/70">
          พนักงาน: ใช้ลิงก์ที่ได้รับจากเจ้าของโรงแรมเท่านั้น
        </p>
      </div>
    </div>
  );
}
