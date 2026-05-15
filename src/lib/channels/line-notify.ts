/**
 * LINE automated notifications — booking confirm, pre-arrival, QR check-in
 *
 * Uses the conversations table to find if a guest has an active LINE conversation,
 * then sends a push message via LINE Messaging API.
 * All calls are non-blocking: errors are swallowed so LINE never breaks core flows.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { lineAdapter } from './line';
import { formatCurrency } from '@/lib/utils';

interface BookingConfirmPayload {
  hotelId: string;
  guestId: string;
  reservationCode: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  totalAmount: number;
  currency?: string;
  checkInTime?: string;
}

interface PreArrivalPayload {
  hotelId: string;
  guestId: string;
  guestName: string;
  reservationCode: string;
  checkIn: string;
  daysUntilArrival: number;
  checkInTime?: string;
  hotelName?: string;
}

async function findLineConversation(hotelId: string, guestId: string): Promise<string | null> {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from('conversations')
    .select('channel_user_id')
    .eq('hotel_id', hotelId)
    .eq('guest_id', guestId)
    .eq('channel', 'line')
    .eq('status', 'open')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.channel_user_id || null;
}

export async function sendLineBookingConfirmation(payload: BookingConfirmPayload): Promise<void> {
  try {
    const channelUserId = await findLineConversation(payload.hotelId, payload.guestId);
    if (!channelUserId) return;

    const amount = formatCurrency(payload.totalAmount, payload.currency || 'THB');
    const message = [
      `✅ ยืนยันการจอง`,
      ``,
      `📋 รหัสจอง: ${payload.reservationCode}`,
      `👤 ${payload.guestName}`,
      `🏨 ${payload.roomType}`,
      `📅 เช็คอิน: ${payload.checkIn}${payload.checkInTime ? ` เวลา ${payload.checkInTime.slice(0, 5)}` : ''}`,
      `📅 เช็คเอาต์: ${payload.checkOut}`,
      `💳 ยอดรวม: ${amount}`,
      ``,
      `ขอบคุณที่เลือกพักกับเรา 🙏`,
    ].join('\n');

    await lineAdapter.sendMessage({ channelUserId, text: message });
  } catch {
    // LINE failure must NOT break booking
  }
}

export async function sendLinePreArrival(payload: PreArrivalPayload): Promise<void> {
  try {
    const channelUserId = await findLineConversation(payload.hotelId, payload.guestId);
    if (!channelUserId) return;

    const dayLabel = payload.daysUntilArrival === 1 ? 'พรุ่งนี้' : `อีก ${payload.daysUntilArrival} วัน`;
    const message = [
      `🏨 แจ้งเตือนก่อนเข้าพัก`,
      ``,
      `สวัสดี ${payload.guestName}!`,
      `การจองของคุณ (${payload.reservationCode}) จะถึงกำหนด${dayLabel}`,
      `📅 วันเช็คอิน: ${payload.checkIn}${payload.checkInTime ? ` เวลา ${payload.checkInTime.slice(0, 5)}` : ''}`,
      payload.hotelName ? `📍 ${payload.hotelName}` : '',
      ``,
      `หากมีคำถามหรือต้องการสิ่งอำนวยความสะดวกพิเศษ ทักมาได้เลย 😊`,
    ].filter(Boolean).join('\n');

    await lineAdapter.sendMessage({ channelUserId, text: message });
  } catch {
    // non-blocking
  }
}
