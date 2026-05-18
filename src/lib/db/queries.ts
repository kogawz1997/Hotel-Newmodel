/**
 * Typed query helpers — use these instead of raw Supabase client calls.
 * Import `db` from "@/lib/db" and use Prisma's fluent API for full type safety.
 *
 * Example usage (replaces old Supabase pattern):
 *
 *   // OLD (Supabase):
 *   const { data } = await supabase.from('reservations').select('*, guests(*)').eq('hotel_id', id)
 *
 *   // NEW (Prisma + SQL Server):
 *   const reservations = await getReservationsByHotel(hotelId)
 */

import db from '@/lib/db';

// ─── Reservations ─────────────────────────────────────────────────────────────

export async function getReservationsByHotel(hotelId: string, status?: string) {
  return db.reservation.findMany({
    where: {
      hotelId,
      ...(status ? { status } : {}),
    },
    include: {
      guest: true,
      room: { select: { roomNumber: true } },
      roomType: { select: { name: true } },
    },
    orderBy: { checkIn: 'desc' },
    take: 100,
  });
}

export async function getReservationById(id: string) {
  return db.reservation.findUnique({
    where: { id },
    include: {
      guest: true,
      room: true,
      roomType: true,
      ratePlan: true,
      folios: {
        include: { items: true },
      },
      payments: true,
    },
  });
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

export async function getRoomsByHotel(hotelId: string) {
  return db.room.findMany({
    where: { hotelId },
    include: { roomType: true },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  });
}

export async function getAvailableRooms(hotelId: string, roomTypeId: string) {
  return db.room.findMany({
    where: {
      hotelId,
      roomTypeId,
      status: 'available',
    },
  });
}

// ─── Guests ───────────────────────────────────────────────────────────────────

export async function searchGuests(hotelId: string, query: string) {
  return db.guest.findMany({
    where: {
      hotelId,
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
      ],
    },
    take: 20,
  });
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getOpenConversations(hotelId: string) {
  return db.conversation.findMany({
    where: {
      hotelId,
      status: 'open',
    },
    include: {
      guest: { select: { firstName: true, lastName: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
  });
}

// ─── Housekeeping ─────────────────────────────────────────────────────────────

export async function getPendingHousekeepingTasks(hotelId: string) {
  return db.housekeepingTask.findMany({
    where: {
      hotelId,
      status: { in: ['pending', 'in_progress'] },
    },
    include: {
      room: { select: { roomNumber: true, floor: true } },
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  });
}

// ─── Revenue ──────────────────────────────────────────────────────────────────

export async function getRevenueByPeriod(
  hotelId: string,
  from: Date,
  to: Date
) {
  return db.payment.aggregate({
    where: {
      hotelId,
      status: 'completed',
      paidAt: { gte: from, lte: to },
    },
    _sum: { amount: true },
    _count: { id: true },
  });
}

// ─── F&B ──────────────────────────────────────────────────────────────────────

export async function getOpenFbOrders(hotelId: string) {
  return db.fbOrder.findMany({
    where: {
      hotelId,
      status: { in: ['open', 'preparing'] },
    },
    include: {
      outlet: { select: { name: true } },
      items: {
        include: { menuItem: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}
