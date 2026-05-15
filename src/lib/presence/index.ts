// ─── Staff Presence Helpers ────────────────────────────────────────────────────

export type PresenceStatus = 'online' | 'busy' | 'break' | 'offline';

export function getPresenceColor(status: PresenceStatus): string {
  return { online: '#22c55e', busy: '#f59e0b', break: '#a855f7', offline: '#6b7280' }[status];
}

export function getPresenceLabel(status: PresenceStatus): string {
  return { online: 'ออนไลน์', busy: 'ติดงาน', break: 'พัก', offline: 'ออฟไลน์' }[status];
}

// Heartbeat interval in ms — call /api/presence/heartbeat every 30s
export const HEARTBEAT_INTERVAL_MS = 30_000;

// Staff considered offline after this many ms without heartbeat
export const OFFLINE_AFTER_MS = 90_000;
