export const dynamic = 'force-dynamic';

import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createClient } from '@/lib/supabase/server';
import { DocumentsClient } from './documents-client';

const ALL_ROLES = ['owner', 'admin', 'manager', 'front_desk', 'housekeeping', 'staff', 'viewer'] as const;

export default async function DocumentsPage() {
  const { profile } = await requireDashboardRole([...ALL_ROLES]);

  const supabase = await createClient();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) return null;

  const { data: documents } = await supabase
    .from('documents')
    .select('*, uploader:user_profiles!uploaded_by(id, full_name, role)')
    .eq('hotel_id', hotel.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const isManager = ['owner', 'admin', 'manager'].includes(profile.role);

  return (
    <DocumentsClient
      hotelId={hotel.id}
      documents={documents ?? []}
      userRole={profile.role}
      isManager={isManager}
    />
  );
}
