import { NextResponse } from 'next/server';

const SAFE_CODES: Record<string, { status: number; message: string }> = {
  '23505': { status: 409, message: 'A record with these details already exists.' },
  '23503': { status: 409, message: 'Referenced record does not exist.' },
  '23514': { status: 400, message: 'Value violates a data constraint.' },
  '42501': { status: 403, message: 'Insufficient database permissions.' },
  'PGRST116': { status: 404, message: 'Record not found.' },
};

export function apiError(error: unknown, fallbackStatus = 500): NextResponse {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const code = String(e.code ?? '');
    if (code && SAFE_CODES[code]) {
      const { status, message } = SAFE_CODES[code];
      return NextResponse.json({ error: message }, { status });
    }
  }
  // Never expose raw error details to the client
  return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: fallbackStatus });
}

export function notFound(resource = 'Resource') {
  return NextResponse.json({ error: `${resource} not found.` }, { status: 404 });
}

export function forbidden(message = 'Access denied.') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
