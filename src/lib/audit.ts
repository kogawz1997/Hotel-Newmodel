/**
 * Central audit log writer.
 * All sensitive actions must call writeAuditLog().
 * Writes to the audit_logs table scoped by hotel_id / organization_id.
 */
import { createAdminClient } from '@/lib/supabase/server';

export interface AuditLogEntry {
  hotelId:    string;
  actorId?:   string | null;
  action:     string;
  entityType: string;
  entityId?:  string | null;
  metadata?:  Record<string, unknown>;
  ipAddress?: string;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      hotel_id:    entry.hotelId,
      actor_id:    entry.actorId ?? null,
      action:      entry.action,
      entity_type: entry.entityType,
      entity_id:   entry.entityId ?? null,
      metadata:    entry.metadata ?? {},
      ip_address:  entry.ipAddress ?? null,
      created_at:  new Date().toISOString(),
    });
  } catch (err) {
    // Audit log must never crash the main flow
    console.error('[audit] failed to write log:', err);
  }
}
