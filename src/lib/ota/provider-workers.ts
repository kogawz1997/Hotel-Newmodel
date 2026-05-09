import { buildRetryPolicy, normalizeChannel } from '@/lib/master-4p/production-suite';

export type OtaProvider = 'booking-com' | 'agoda' | 'expedia' | 'airbnb';
export type OtaJobType = 'reservation_pull' | 'ari_push' | 'mapping_sync' | 'webhook_event';

export type OtaJob = {
  id?: string;
  provider: OtaProvider | string;
  type?: OtaJobType | string;
  hotelId?: string | null;
  attempts?: number;
  payload?: Record<string, unknown>;
};

export function buildProviderEndpoint(provider: string) {
  const key = `${normalizeChannel(provider).replace(/-/g, '_').toUpperCase()}_API_BASE_URL`;
  return process.env[key] || null;
}

export function prepareOtaJob(job: OtaJob) {
  const provider = normalizeChannel(job.provider);
  const endpoint = buildProviderEndpoint(provider);
  const retry = buildRetryPolicy(job.attempts || 0, 5);
  return {
    id: job.id || `${provider}-${Date.now()}`,
    provider,
    type: job.type || 'reservation_pull',
    hotelId: job.hotelId || null,
    endpointConfigured: Boolean(endpoint),
    endpoint,
    retry,
    action: endpoint ? 'dispatch_to_provider' : 'skip_missing_vendor_credentials',
    payload: job.payload || {},
  };
}

export function detectOtaConflict(existing: Array<{ externalId?: string | null; checkIn?: string; checkOut?: string; guestEmail?: string | null }>, incoming: { externalId?: string | null; checkIn?: string; checkOut?: string; guestEmail?: string | null }) {
  const duplicate = existing.find((item) => incoming.externalId && item.externalId === incoming.externalId);
  if (duplicate) return { conflict: true, reason: 'duplicate_external_id', reservation: duplicate };
  const overlap = existing.find((item) => item.guestEmail && item.guestEmail === incoming.guestEmail && item.checkIn === incoming.checkIn && item.checkOut === incoming.checkOut);
  if (overlap) return { conflict: true, reason: 'same_guest_same_dates', reservation: overlap };
  return { conflict: false, reason: 'none', reservation: null };
}
