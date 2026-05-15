'use client';

import { useState } from 'react';
import { CheckCircle, Clock, Inbox } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/tasks/task-card';
import { PhotoUpload } from '@/components/tasks/photo-upload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'active', label: 'กำลังทำ', icon: Clock },
  { key: 'pending', label: 'รอรับงาน', icon: Inbox },
  { key: 'done', label: 'เสร็จแล้ว', icon: CheckCircle },
];

export function MyTasksClient({ myTasks: initMy, availableTasks: initAvail, profile, hotelId, today }: any) {
  const [myTasks, setMyTasks] = useState<any[]>(initMy);
  const [availableTasks, setAvailableTasks] = useState<any[]>(initAvail);
  const [activeTab, setActiveTab] = useState('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState<string | null>(null);

  const active = myTasks.filter(t => ['assigned','in_progress'].includes(t.status));
  const done = myTasks.filter(t => t.status === 'done');

  function handleStatusChange(id: string, status: string) {
    setMyTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }

  async function claimTask(taskId: string) {
    setClaimLoading(taskId);
    const res = await fetch('/api/work-orders/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId }) });
    setClaimLoading(null);
    if (!res.ok) { toast.error('ไม่สามารถรับงานได้'); return; }
    const task = availableTasks.find(t => t.id === taskId);
    if (task) {
      setMyTasks(prev => [{ ...task, status: 'assigned', assigned_to: profile?.id }, ...prev]);
      setAvailableTasks(prev => prev.filter(t => t.id !== taskId));
    }
    toast.success('รับงานแล้ว!');
  }

  const listToShow = activeTab === 'active' ? active : activeTab === 'done' ? done : [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar title="งานของฉัน" description={profile?.full_name ?? ''} />
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(t => {
            const count = t.key === 'active' ? active.length : t.key === 'done' ? done.length : availableTasks.length;
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', activeTab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {count > 0 && <span className={cn('text-xs rounded-full px-1.5 min-w-[18px] text-center', activeTab === t.key ? 'bg-primary-foreground/20' : 'bg-background')}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Available tasks tab */}
        {activeTab === 'pending' && (
          <div className="space-y-3">
            {availableTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><p>ไม่มีงานที่รอรับ</p></div>
            ) : availableTasks.map(t => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <TaskCard task={t} compact />
                </div>
                <Button size="sm" className="shrink-0" disabled={claimLoading === t.id} onClick={() => claimTask(t.id)}>
                  {claimLoading === t.id ? 'กำลังรับ...' : 'รับงาน'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* My tasks (active/done) */}
        {activeTab !== 'pending' && (
          <div className="space-y-4">
            {listToShow.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-2">{activeTab === 'done' ? '🎉' : '😴'}</div>
                <p className="text-sm">{activeTab === 'done' ? 'ยังไม่มีงานที่เสร็จ' : 'ไม่มีงานที่กำลังทำ'}</p>
              </div>
            ) : listToShow.map(t => (
              <div key={t.id} className="space-y-3">
                <TaskCard task={t} onStatusChange={handleStatusChange} />
                {/* Photo upload for active tasks */}
                {t.status === 'in_progress' && (
                  <div className="ml-4 flex gap-4 flex-wrap">
                    <PhotoUpload workOrderId={t.id} photoType="before" onUploaded={() => toast.success('อัพโหลดรูปก่อนทำแล้ว')} />
                    <PhotoUpload workOrderId={t.id} photoType="after" onUploaded={() => toast.success('อัพโหลดรูปหลังทำแล้ว')} />
                  </div>
                )}
                {/* Existing photos */}
                {t.task_photos?.length > 0 && (
                  <div className="ml-4 flex gap-2 flex-wrap">
                    {t.task_photos.map((p: any) => (
                      <img key={p.id} src={p.photo_url} alt={p.photo_type} className="h-16 w-16 object-cover rounded-lg border" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
