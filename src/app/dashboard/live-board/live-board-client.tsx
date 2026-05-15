'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { OccupancyMap } from '@/components/live/occupancy-map';
import { StaffStatusGrid } from '@/components/live/staff-status-grid';
import { TaskQueueWidget } from '@/components/live/task-queue-widget';
import { AlertsFeed } from '@/components/live/alerts-feed';
import { VipArrivalsWidget } from '@/components/live/vip-arrivals-widget';
import { EmergencyAlertBar } from '@/components/live/emergency-alert-bar';
import { SlaWidget } from './sla-widget';
import { Megaphone } from 'lucide-react';
import { toast } from 'sonner';

export function LiveBoardClient({ hotelId, rooms: initRooms, staff, pendingTasks: initTasks, todayArrivals, alerts: initAlerts, profile }: any) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<any[]>(initTasks);
  const [alerts, setAlerts] = useState<any[]>(initAlerts);
  const [emergency, setEmergency] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const occupied = initRooms.filter((r: any) => r.status === 'occupied').length;
  const occupancyPct = initRooms.length > 0 ? Math.round((occupied / initRooms.length) * 100) : 0;
  const activeTaskCount = tasks.filter((t: any) => ['pending','assigned','in_progress'].includes(t.status)).length;
  const breachedCount = tasks.filter((t: any) => t.sla_deadline && new Date(t.sla_deadline) < new Date() && !['done','cancelled'].includes(t.status)).length;

  useEffect(() => {
    const channel = supabase.channel(`live-board-${hotelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders', filter: `hotel_id=eq.${hotelId}` }, (payload: any) => {
        if (payload.eventType === 'INSERT') setTasks(prev => [payload.new, ...prev]);
        else if (payload.eventType === 'UPDATE') setTasks(prev => prev.map((t: any) => t.id === payload.new.id ? payload.new : t));
        else if (payload.eventType === 'DELETE') setTasks(prev => prev.filter((t: any) => t.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hotelId]);

  async function broadcast() {
    if (!announcement.trim()) return;
    setBroadcasting(true);
    await fetch('/api/work-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'other', title: `📢 ${announcement}`, priority: 'normal', source: 'manual' }) });
    setBroadcasting(false);
    setShowBroadcast(false);
    setAnnouncement('');
    toast.success('ส่งประกาศแล้ว');
  }

  const stats = [
    { label: 'Occupancy', value: `${occupancyPct}%`, sub: `${occupied}/${initRooms.length} ห้อง`, color: 'text-sky-600' },
    { label: 'งานทั้งหมด', value: activeTaskCount, sub: 'กำลังดำเนินการ', color: 'text-amber-600' },
    { label: 'พนักงาน', value: staff.length, sub: 'ออนไลน์', color: 'text-emerald-600' },
    { label: 'เกิน SLA', value: breachedCount, sub: 'ต้องดำเนินการด่วน', color: breachedCount > 0 ? 'text-red-600' : 'text-muted-foreground' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <EmergencyAlertBar active={emergency} onDismiss={() => setEmergency(false)} />
      <TopBar title="Live Board" description="GM Command Center" action={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowBroadcast(true)}><Megaphone className="h-4 w-4 mr-1" />ประกาศ</Button>
          <Button size="sm" variant="destructive" onClick={() => setEmergency(true)}>🚨 Emergency</Button>
        </div>
      } />

      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* SLA Traffic Light */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-muted-foreground">SLA Status:</span>
          <SlaWidget />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">แผนผังห้อง</CardTitle></CardHeader>
              <CardContent><OccupancyMap rooms={initRooms} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">VIP วันนี้</CardTitle></CardHeader>
              <CardContent><VipArrivalsWidget arrivals={todayArrivals} /></CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">คิวงาน</CardTitle></CardHeader>
              <CardContent><TaskQueueWidget tasks={tasks} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">การแจ้งเตือน</CardTitle></CardHeader>
              <CardContent><AlertsFeed alerts={alerts} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">พนักงาน</CardTitle></CardHeader>
              <CardContent><StaffStatusGrid staff={staff} /></CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
        <DialogContent>
          <DialogHeader><DialogTitle>ส่งประกาศภายใน</DialogTitle></DialogHeader>
          <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" rows={4} placeholder="ข้อความประกาศ..." value={announcement} onChange={e => setAnnouncement(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBroadcast(false)}>ยกเลิก</Button>
            <Button onClick={broadcast} disabled={broadcasting}>{broadcasting ? 'กำลังส่ง...' : 'ส่งประกาศ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
