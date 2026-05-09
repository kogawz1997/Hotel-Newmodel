import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireHotelAccess } from '@/lib/auth/guards';
import { recommendRoomAssignments, balanceStaffWorkload, detectComplaintSignals } from '@/lib/ai/operations';

export const dynamic = 'force-dynamic';

const schema = z.object({
  hotelId: z.string().uuid().optional().nullable(),
  reservations: z.array(z.object({ id: z.string(), checkIn: z.string(), checkOut: z.string(), roomTypeId: z.string().optional(), priority: z.number().optional() })).optional(),
  rooms: z.array(z.object({ id: z.string(), roomTypeId: z.string().optional(), status: z.string().optional() })).optional(),
  staff: z.array(z.object({ id: z.string(), role: z.string(), openTasks: z.number().optional() })).optional(),
  complaints: z.array(z.object({ id: z.string(), sentiment: z.number().optional(), message: z.string().optional() })).optional(),
});

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  const ctx = await requireHotelAccess(parsed.data.hotelId || null);
  if (ctx.error) return ctx.error;
  return NextResponse.json({
    roomAssignments: recommendRoomAssignments(parsed.data),
    workload: balanceStaffWorkload(parsed.data),
    complaints: detectComplaintSignals(parsed.data),
  });
}
