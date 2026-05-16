import { Bell, CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { redirect } from 'next/navigation';

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-400',
  normal:   'bg-blue-400',
  low:      'bg-gray-300',
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/backoffice/login');

  const admin = createAdminClient();

  const { data: notifications } = await admin
    .from('staff_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const unread = (notifications ?? []).filter(n => !n.is_read).length;

  return (
    <div className="container max-w-3xl py-8 animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            การแจ้งเตือน
            {unread > 0 && (
              <Badge variant="destructive" className="text-xs">{unread}</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">การแจ้งเตือนส่วนตัวของคุณ</p>
        </div>
        {unread > 0 && (
          <form action={`/api/notifications/all/read`} method="POST">
            <button type="submit" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <CheckCheck className="h-4 w-4" />
              อ่านทั้งหมด
            </button>
          </form>
        )}
      </div>

      <Card className="overflow-hidden divide-y divide-border">
        {!notifications?.length ? (
          <EmptyState icon={Bell} title="ยังไม่มีการแจ้งเตือน" description="เมื่อมีเหตุการณ์สำคัญ ระบบจะแสดงที่หน้านี้" />
        ) : (
          notifications.map((item) => (
            <div key={item.id} className={`p-4 flex items-start gap-3 transition-colors ${item.is_read ? 'opacity-60' : 'bg-muted/30'}`}>
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${PRIORITY_COLORS[item.priority] ?? 'bg-gray-400'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.body}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: th })}
                </p>
              </div>
              {item.deep_link && (
                <a href={item.deep_link} className="text-xs text-primary shrink-0 hover:underline">ดู →</a>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
