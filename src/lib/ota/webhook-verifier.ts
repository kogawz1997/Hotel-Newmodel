import crypto from 'crypto';
import { timingSafeEqualText, verifyHmacSha256 } from '@/lib/security/webhook';

export function verifyBookingComSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const normalized = signature.replace(/^sha256=/i, '');
  return timingSafeEqualText(normalized, expected);
}

export function verifyAgodaSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!secret || !signature) return false;
  const md5Hash = crypto.createHash('md5').update(payload + secret).digest('hex');
  if (timingSafeEqualText(signature, md5Hash)) return true;
  return verifyHmacSha256(payload, signature, secret);
}

export function verifyAirbnbSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const normalized = signature.replace(/^sha256=/i, '');
  return timingSafeEqualText(normalized, expected);
}

export function verifyExpediaSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha512', secret).update(payload).digest('hex');
  const normalized = signature.replace(/^sha512=/i, '');
  if (timingSafeEqualText(normalized, expected)) return true;
  return verifyHmacSha256(payload, signature, secret);
}

export function verifyOTAWebhook(
  provider: string,
  payload: string,
  headers: Record<string, string>,
): boolean {
  const normalizedProvider = provider.toLowerCase().replace(/-/g, '_');

  const header = (name: string): string =>
    headers[name] ?? headers[name.toLowerCase()] ?? '';

  switch (normalizedProvider) {
    case 'booking_com': {
      const signature = header('X-Booking-Signature') || header('X-Signature');
      const secret = process.env.BOOKING_COM_WEBHOOK_SECRET ?? process.env.BOOKING_COM_WEBHOOK_TOKEN ?? '';
      return verifyBookingComSignature(payload, signature, secret);
    }

    case 'agoda': {
      const signature = header('X-Agoda-Signature') || header('X-Signature') || header('Authorization');
      const secret = process.env.AGODA_WEBHOOK_SECRET ?? process.env.AGODA_WEBHOOK_TOKEN ?? '';
      return verifyAgodaSignature(payload, signature, secret);
    }

    case 'airbnb': {
      const signature = header('X-Airbnb-Signature') || header('X-Signature');
      const secret = process.env.AIRBNB_WEBHOOK_SECRET ?? process.env.AIRBNB_WEBHOOK_TOKEN ?? '';
      return verifyAirbnbSignature(payload, signature, secret);
    }

    case 'expedia': {
      const signature = header('X-Expedia-Signature') || header('X-Signature');
      const secret = process.env.EXPEDIA_WEBHOOK_SECRET ?? process.env.EXPEDIA_WEBHOOK_TOKEN ?? '';
      return verifyExpediaSignature(payload, signature, secret);
    }

    default:
      return false;
  }
}
