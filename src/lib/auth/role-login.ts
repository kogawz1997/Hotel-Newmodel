// All staff/owner login now routes through /api/auth/staff-login (server-side)
// so UUID-mapped auth emails (for hotel-created staff) are resolved securely.

const AUTH_TIMEOUT_MS = 15000;

type StaffLoginResult = { ok: boolean; redirectTo?: '/dashboard' | '/admin' | '/owner/hotels'; message?: string };

async function callStaffLogin(email: string, password: string): Promise<StaffLoginResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const res = await fetch('/api/auth/staff-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.error || 'เข้าสู่ระบบไม่สำเร็จ' };
    return { ok: true, redirectTo: data.redirectTo };
  } catch (e: any) {
    if (e?.name === 'AbortError') return { ok: false, message: 'AUTH_TIMEOUT' };
    return { ok: false, message: 'ไม่สามารถเชื่อมต่อได้' };
  } finally {
    clearTimeout(timer);
  }
}

export async function loginInternal(email: string, password: string) {
  const result = await callStaffLogin(email, password);
  if (!result.ok) return result;
  if (result.redirectTo === '/owner/hotels') return { ok: true, redirectTo: '/dashboard' as const };
  return result;
}

export async function loginManagement(email: string, password: string) {
  return callStaffLogin(email, password);
}

export async function loginOwner(email: string, password: string) {
  const result = await callStaffLogin(email, password);
  if (!result.ok) return result;
  if (result.redirectTo === '/dashboard') {
    // Staff account tried to log in at owner portal — redirect them correctly
    return { ok: true, redirectTo: '/owner/hotels' as const };
  }
  return result;
}

export async function loginStaff(email: string, password: string) {
  const result = await callStaffLogin(email, password);
  if (!result.ok) return result;
  return { ok: true, redirectTo: '/dashboard' as const };
}

export async function loginWebAdmin(email: string, password: string) {
  const result = await callStaffLogin(email, password);
  if (!result.ok) return result;
  return result;
}
