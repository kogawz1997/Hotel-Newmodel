export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { TicketDetailClient } from './ticket-detail-client';

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const admin = createAdminClient();
  const { data: ticket } = await admin.from('support_tickets_internal')
    .select('*, hotels(name, id, organization_id), user_profiles!requester_id(full_name, email)')
    .eq('id', ticketId).single();
  if (!ticket) notFound();
  return <TicketDetailClient ticket={ticket} />;
}
