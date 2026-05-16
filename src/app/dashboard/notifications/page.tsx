import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const { data: hotels } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile?.organization_id)
    .limit(1);
  const hotelId = hotels?.[0]?.id;
  if (!hotelId) redirect('/dashboard/onboarding');

  const { data: notifications } = await supabase
    .from('audit_logs')
    .select('id, action, created_at, entity_type')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Notification Center</h1>
        <p className="text-sm text-muted-foreground">เหตุการณ์ล่าสุดจากระบบ (audit-based feed)</p>
      </div>

      <Card className="overflow-hidden">
        {!notifications?.length ? (
          <EmptyState icon={Bell} title="ยังไม่มีการแจ้งเตือน" description="เมื่อมีเหตุการณ์สำคัญ ระบบจะแสดงที่หน้านี้" />
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((item) => (
              <li key={item.id} className="p-4 flex items-start gap-3">
                <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-accent shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium break-words">{item.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.entity_type || 'system'} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: th })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
