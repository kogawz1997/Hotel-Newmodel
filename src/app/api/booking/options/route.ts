import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildAuditEnvelope } from '@/lib/master-4p/production-suite';

export const dynamic = 'force-dynamic';

const schema = z.object({
  hotelId: z.string().uuid().optional(),
  roomTypeId: z.string().uuid().optional(),
  couponCode: z.string().max(40).optional(),
  addOns: z.array(z.string().max(80)).optional().default([]),
  packageCode: z.string().max(80).optional(),
});

const addOnCatalog = [
  { code: 'airport-transfer', name: 'Airport transfer', price: 1200 },
  { code: 'breakfast', name: 'Daily breakfast', price: 350 },
  { code: 'late-checkout', name: 'Late checkout', price: 500 },
  { code: 'spa-credit', name: 'Spa credit', price: 1000 },
];

export async function GET() {
  return NextResponse.json({ addOns: addOnCatalog, packages: ['romantic', 'family', 'business'], coupons: ['WELCOME10'] });
}

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  const selectedAddOns = addOnCatalog.filter((item) => parsed.data.addOns.includes(item.code));
  const subtotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const discount = parsed.data.couponCode?.toUpperCase() === 'WELCOME10' ? Math.round(subtotal * 0.1) : 0;
  return NextResponse.json(buildAuditEnvelope('booking.options.quoted', { selectedAddOns, subtotal, discount, total: subtotal - discount, packageCode: parsed.data.packageCode || null }));
}
