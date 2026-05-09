export type AuthSessionCheck = {
  status: 'fresh' | 'refresh_required' | 'expired';
  expiresAt: string | null;
  refreshInSeconds: number;
};

export function deriveSessionRefreshState(expiresAtUnixSeconds?: number | null, nowMs = Date.now()): AuthSessionCheck {
  if (!expiresAtUnixSeconds) return { status: 'refresh_required', expiresAt: null, refreshInSeconds: 0 };
  const expiresAtMs = expiresAtUnixSeconds * 1000;
  const remainingSeconds = Math.floor((expiresAtMs - nowMs) / 1000);
  if (remainingSeconds <= 0) {
    return { status: 'expired', expiresAt: new Date(expiresAtMs).toISOString(), refreshInSeconds: 0 };
  }
  if (remainingSeconds < 10 * 60) {
    return { status: 'refresh_required', expiresAt: new Date(expiresAtMs).toISOString(), refreshInSeconds: remainingSeconds };
  }
  return { status: 'fresh', expiresAt: new Date(expiresAtMs).toISOString(), refreshInSeconds: remainingSeconds - 10 * 60 };
}

export function buildAuthRedirect(path = '/dashboard') {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
