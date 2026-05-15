export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BedDouble, CalendarCheck, CircleDollarSign, MessageSquareWarning,
  Sparkles, UsersRound, Wrench, ArrowRight, ShieldCheck, Headphones,
  ClipboardList, AlertTriangle, UserCheck, Receipt,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ReservationActionButtons } from '@/components/dashboard/reservation-action-buttons';
import { DashboardShortcuts } from '@/components/dashboard/dashboard-shortcuts';

async function count(query: any) {
  const { count } = await query;
  return count || 0;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, organization_id, full_name, role')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name, currency, check_in_time, check_out_time')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  // Role-specific redirect: send operational staff straight to their workspace
  const role = profile?.role;
  if (role === 'housekeeping') redirect('/dashboard/housekeeping');
  if (role === 'front_desk') redirect('/dashboard/front-desk');
  if (role === 'maintenance') redirect('/dashboard/rooms');

  if (!hotel) {
    return (
      <main className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                <path d="M4 20V4h4l4 8 4-8h4v16h-3V9l-3 6h-4L7 9v11H4z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="font-display text-3xl font-medium tracking-tight mb-2">ยินดีต้อนรับสู่ Maitri</h1>
            <p className="text-sm text-muted-foreground">เริ่มต้นด้วยการตั้งค่าโรงแรมของคุณ</p>
          </div>
          <div className="space-y-3 mb-8">
            {[
              { step: '1', title: 'ตั้งชื่อและข้อมูลโรงแรม', desc: 'เวลาเช็คอิน-เอาท์, VAT', href: '/dashboard/settings' },
              { step: '2', title: 'สร้างประเภทห้อง', desc: 'Deluxe, Suite พร้อมราคาฐาน', href: '/dashboard/rooms' },
              { step: '3', title: 'เพิ่มห้องพัก', desc: 'หมายเลขห้อง ชั้น สถานะ', href: '/dashboard/rooms' },
              { step: '4', title: 'รับการจองแรก', desc: 'จากหน้า Reservations', href: '/dashboard/reservations' },
            ].map(item => (
              <a key={item.step} href={item.href} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all group">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium shrink-0 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">{item.step}</div>
                <div className="flex-1"><div className="font-medium text-sm">{item.title}</div><div className="text-xs text-muted-foreground">{item.desc}</div></div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </a>
            ))}
          </div>
          <div className="text-center"><Button asChild><Link href="/dashboard/settings">เริ่มตั้งค่าโรงแรม</Link></Button></div>
        </div>
      </main>
    );
  }

  const role = profile?.role || 'staff';
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  // ── Shared counts (always needed) ──────────────────────────────────────────
  const [checkIns, checkOuts, openInbox] = await Promise.all([
    count(supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('check_in', today).in('status', ['confirmed', 'pending'])),
    count(supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('check_out', today).eq('status', 'checked_in')),
    count(supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'open')),
  ]);

  // ── Management ─────────────────────────────────────────────────────────────
  if (['owner', 'admin', 'manager'].includes(role)) {
    const [roomsTotal, roomsOccupied, roomsAvailable, hkPending, guestsTotal, maintOpen] = await Promise.all([
      count(supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id)),
      count(supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'occupied')),
      count(supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'available')),
      count(supabase.from('housekeeping_tasks').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).in('status', ['pending', 'in_progress'])),
      count(supabase.from('guests').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id)),
      count(supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).in('status', ['open', 'in_progress'])),
    ]);
    const { data: revenueRows } = await supabase.from('payments').select('amount').eq('hotel_id', hotel.id).eq('status', 'completed').gte('created_at', `${today}T00:00:00Z`).lt('created_at', `${tomorrow}T00:00:00Z`);
    const revenueToday = (revenueRows || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
    const occupancyRate = roomsTotal ? Math.round((roomsOccupied / roomsTotal) * 100) : 0;
    const { data: arrivals } = await supabase.from('reservations').select('id,reservation_code,check_in,check_out,status,guests(first_name,last_name),room_types(name)').eq('hotel_id', hotel.id).eq('check_in', today).order('created_at', { ascending: false }).limit(6);

    return (
      <main className="space-y-6 p-6 md:p-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2"><Badge variant="accent">Maitri PMS</Badge><Badge variant="outline">{role}</Badge></div>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{hotel.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">ภาพรวมวันนี้ · เช็คอิน {hotel.check_in_time?.slice(0,5)} · เช็คเอาต์ {hotel.check_out_time?.slice(0,5)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href="/dashboard/reservations">รายการจอง</Link></Button>
            <Button asChild><Link href="/dashboard/front-desk">Front Desk</Link></Button>
          </div>
        </section>

      <DashboardShortcuts />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Link key={item.label} href={item.href} className="group">
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Check-out วันนี้ ({checkOuts})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {!(departures?.length) ? <p className="text-sm text-muted-foreground text-center py-4">ไม่มีการ check-out วันนี้</p> : departures?.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.guests?.first_name} {r.guests?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{r.reservation_code} · {r.room_types?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="info">checked_in</Badge>
                    <ReservationActionButtons reservationId={r.id} status={r.status} compact />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  // ── Housekeeping ────────────────────────────────────────────────────────────
  if (role === 'housekeeping') {
    const [hkPending, hkInProgress, hkDone, roomsOccupied, roomsTotal] = await Promise.all([
      count(supabase.from('housekeeping_tasks').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'pending')),
      count(supabase.from('housekeeping_tasks').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'in_progress')),
      count(supabase.from('housekeeping_tasks').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'completed')),
      count(supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'occupied')),
      count(supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id)),
    ]);
    const { data: myTasks } = await supabase.from('housekeeping_tasks').select('id,room_id,status,task_type,notes,rooms(room_number,floor)').eq('hotel_id', hotel.id).in('status', ['pending','in_progress']).order('created_at').limit(10);

    return (
      <main className="space-y-6 p-6 md:p-8">
        <section className="flex items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-2">แม่บ้าน</Badge>
            <h1 className="font-display text-2xl font-semibold">{hotel.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">งานทำความสะอาดวันนี้ {formatDate(today)}</p>
          </div>
          <Button asChild><Link href="/dashboard/housekeeping">เปิดรายการงาน</Link></Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'รอดำเนินการ', value: hkPending, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30' },
            { label: 'กำลังทำ', value: hkInProgress, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
            { label: 'เสร็จแล้ว', value: hkDone, color: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
            { label: 'ห้องที่มีแขก', value: `${roomsOccupied}/${roomsTotal}`, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`rounded-xl p-3 ${s.color}`}><ClipboardList className="h-5 w-5" /></div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'สร้างการจอง', href: '/dashboard/reservations', desc: 'เปิด calendar/list แล้วกดจองใหม่' },
          { title: 'Walk-in 3 คลิก', href: '/dashboard/front-desk/walk-in', desc: 'หน้าเคาน์เตอร์ใช้งานเร็ว' },
          { title: 'ตอบ Inbox', href: '/dashboard/inbox', desc: `${openInbox} งานเปิดอยู่` },
          { title: 'อัปเดตห้อง', href: '/dashboard/rooms', desc: `${roomsAvailable} ห้องพร้อมขาย` },
          { title: 'งานแม่บ้าน', href: '/dashboard/housekeeping', desc: `${hkPending} งานต้องตาม` },
        ].map((item) => (
          <Link key={item.title} href={item.href} className="rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button asChild size="lg"><Link href="/dashboard/housekeeping">ดูรายการงานทั้งหมด</Link></Button>
        </div>
      </main>
    );
  }

  // ── Maintenance ─────────────────────────────────────────────────────────────
  if (role === 'maintenance') {
    const [open, inProgress, urgent, done] = await Promise.all([
      count(supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'open')),
      count(supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'in_progress')),
      count(supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('priority', 'urgent').in('status', ['open','in_progress'])),
      count(supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'completed').gte('updated_at', `${today}T00:00:00Z`)),
    ]);
    const { data: requests } = await supabase.from('maintenance_requests').select('id,title,priority,status,location,rooms(room_number)').eq('hotel_id', hotel.id).in('status', ['open','in_progress']).order('created_at', { ascending: false }).limit(10);

    return (
      <main className="space-y-6 p-6 md:p-8">
        <section className="flex items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-2">ซ่อมบำรุง</Badge>
            <h1 className="font-display text-2xl font-semibold">{hotel.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">คำขอซ่อมบำรุงวันนี้ {formatDate(today)}</p>
          </div>
          <Button asChild><Link href="/dashboard/maintenance">ดูรายการทั้งหมด</Link></Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'งานใหม่', value: open, color: 'text-orange-600' },
            { label: 'กำลังแก้ไข', value: inProgress, color: 'text-blue-600' },
            { label: 'เร่งด่วน', value: urgent, color: 'text-red-600' },
            { label: 'เสร็จวันนี้', value: done, color: 'text-green-600' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`rounded-xl bg-muted p-3 ${s.color}`}><Wrench className="h-5 w-5" /></div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader><CardTitle>คำขอที่รอดำเนินการ</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!(requests?.length) ? <p className="text-sm text-muted-foreground text-center py-6">ไม่มีงานค้าง 🎉</p> : requests?.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.location || (r.rooms?.room_number ? `ห้อง ${r.rooms.room_number}` : '-')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.priority === 'urgent' && <Badge variant="destructive">เร่งด่วน</Badge>}
                  <Badge variant={r.status === 'in_progress' ? 'info' : 'warning'}>{r.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    );
  }

  // ── Accounting ──────────────────────────────────────────────────────────────
  if (role === 'accounting') {
    const { data: revenueMonth } = await supabase.from('payments').select('amount').eq('hotel_id', hotel.id).eq('status', 'completed').gte('created_at', `${today.slice(0,7)}-01T00:00:00Z`);
    const revenueMonthTotal = (revenueMonth || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
    const { data: revenueDay } = await supabase.from('payments').select('amount').eq('hotel_id', hotel.id).eq('status', 'completed').gte('created_at', `${today}T00:00:00Z`).lt('created_at', `${tomorrow}T00:00:00Z`);
    const revenueDayTotal = (revenueDay || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
    const [invoicesPending, invoicesTotal] = await Promise.all([
      count(supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'draft')),
      count(supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id)),
    ]);
    const { data: recentInvoices } = await supabase.from('invoices').select('id,invoice_number,status,total_amount,created_at,reservations(reservation_code)').eq('hotel_id', hotel.id).order('created_at', { ascending: false }).limit(8);

    return (
      <main className="space-y-6 p-6 md:p-8">
        <section className="flex items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-2">บัญชี</Badge>
            <h1 className="font-display text-2xl font-semibold">{hotel.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">ภาพรวมการเงิน {formatDate(today)}</p>
          </div>
          <Button asChild><Link href="/dashboard/accounting">เปิดรายงานบัญชี</Link></Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'รายได้วันนี้', value: formatCurrency(revenueDayTotal, hotel.currency || 'THB'), icon: CircleDollarSign, color: 'text-green-600' },
            { label: 'รายได้เดือนนี้', value: formatCurrency(revenueMonthTotal, hotel.currency || 'THB'), icon: CircleDollarSign, color: 'text-blue-600' },
            { label: 'ใบแจ้งหนี้ draft', value: invoicesPending, icon: Receipt, color: 'text-orange-600' },
            { label: 'ใบแจ้งหนี้ทั้งหมด', value: invoicesTotal, icon: Receipt, color: 'text-purple-600' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`rounded-xl bg-muted p-3 ${s.color}`}><s.icon className="h-5 w-5" /></div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold leading-tight mt-1">{s.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader><CardTitle>ใบแจ้งหนี้ล่าสุด</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!(recentInvoices?.length) ? <p className="text-sm text-muted-foreground text-center py-6">ยังไม่มีใบแจ้งหนี้</p> : recentInvoices?.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">{inv.reservations?.reservation_code} · {new Date(inv.created_at).toLocaleDateString('th-TH')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium">{formatCurrency(inv.total_amount, hotel.currency || 'THB')}</span>
                  <Badge variant={inv.status === 'issued' ? 'success' : inv.status === 'draft' ? 'warning' : 'outline'}>{inv.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    );
  }

  // ── Concierge ───────────────────────────────────────────────────────────────
  if (role === 'concierge') {
    const [activeRequests, pendingReqs, msgOpen, todayArrivals] = await Promise.all([
      count(supabase.from('concierge_requests').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).in('status', ['pending','in_progress'])),
      count(supabase.from('concierge_requests').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'pending')),
      count(supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'open').gt('unread_count', 0)),
      count(supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('check_in', today).in('status', ['confirmed','pending'])),
    ]);
    const { data: requests } = await supabase.from('concierge_requests').select('id,category,title,status,priority,created_at').eq('hotel_id', hotel.id).in('status', ['pending','in_progress']).order('created_at', { ascending: false }).limit(8);
    const { data: arrivals } = await supabase.from('reservations').select('id,reservation_code,guests(first_name,last_name),room_types(name),special_requests').eq('hotel_id', hotel.id).eq('check_in', today).limit(6);

    return (
      <main className="space-y-6 p-6 md:p-8">
        <section className="flex items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-2">Concierge</Badge>
            <h1 className="font-display text-2xl font-semibold">{hotel.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">งานบริการแขก {formatDate(today)}</p>
          </div>
          <Button asChild><Link href="/dashboard/concierge">เปิด Concierge Desk</Link></Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'คำขอที่ดูแลอยู่', value: activeRequests, icon: Headphones, color: 'text-blue-600' },
            { label: 'รอดำเนินการ', value: pendingReqs, icon: ClipboardList, color: 'text-orange-600' },
            { label: 'ข้อความที่ยังไม่ตอบ', value: msgOpen, icon: MessageSquareWarning, color: 'text-red-600' },
            { label: 'Arrivals วันนี้', value: todayArrivals, icon: UserCheck, color: 'text-green-600' },
          ].map((s) => (
            <Link key={s.label} href={s.label.includes('ข้อความ') ? '/dashboard/inbox' : '/dashboard/concierge'} className="group">
              <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`rounded-xl bg-muted p-3 group-hover:bg-accent/10 ${s.color}`}><s.icon className="h-5 w-5" /></div>
                  <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>คำขอล่าสุด</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {!(requests?.length) ? <p className="text-sm text-muted-foreground text-center py-6">ไม่มีคำขอค้างอยู่</p> : requests?.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{r.category}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.priority === 'urgent' && <Badge variant="destructive">เร่งด่วน</Badge>}
                    <Badge variant={r.status === 'in_progress' ? 'info' : 'warning'}>{r.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>แขก Check-in วันนี้</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {!(arrivals?.length) ? <p className="text-sm text-muted-foreground text-center py-6">ไม่มีการ check-in วันนี้</p> : arrivals?.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{r.guests?.first_name} {r.guests?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{r.room_types?.name} {r.special_requests ? '· มีความต้องการพิเศษ' : ''}</p>
                  </div>
                  {r.special_requests && <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  // ── Security ────────────────────────────────────────────────────────────────
  if (role === 'security') {
    const [openIncidents, activeVisitors, criticalInc] = await Promise.all([
      count(supabase.from('security_incidents').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).in('status', ['open','investigating'])),
      count(supabase.from('visitor_log').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).is('checked_out_at', null)),
      count(supabase.from('security_incidents').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).in('severity', ['high','critical']).in('status', ['open','investigating'])),
    ]);
    const { data: incidents } = await supabase.from('security_incidents').select('id,type,title,severity,status,location,created_at').eq('hotel_id', hotel.id).in('status', ['open','investigating']).order('created_at', { ascending: false }).limit(6);
    const { data: visitors } = await supabase.from('visitor_log').select('id,visitor_name,visiting_room,visiting_guest,purpose,checked_in_at').eq('hotel_id', hotel.id).is('checked_out_at', null).order('checked_in_at', { ascending: false }).limit(8);

    return (
      <main className="space-y-6 p-6 md:p-8">
        <section className="flex items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-2">Security</Badge>
            <h1 className="font-display text-2xl font-semibold">{hotel.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">สถานะความปลอดภัย {formatDate(today)}</p>
          </div>
          <Button asChild><Link href="/dashboard/security">เปิด Security Center</Link></Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'เหตุการณ์ที่เปิดอยู่', value: openIncidents, color: openIncidents ? 'text-red-600' : 'text-green-600', icon: ShieldCheck },
            { label: 'เหตุการณ์วิกฤต', value: criticalInc, color: criticalInc ? 'text-red-700' : 'text-green-600', icon: AlertTriangle },
            { label: 'ผู้เยี่ยมในพื้นที่', value: activeVisitors, color: 'text-blue-600', icon: UserCheck },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`rounded-xl bg-muted p-3 ${s.color}`}><s.icon className="h-5 w-5" /></div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>เหตุการณ์ที่เปิดอยู่</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {!(incidents?.length) ? <p className="text-sm text-muted-foreground text-center py-6 flex items-center justify-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" /> ไม่มีเหตุการณ์ผิดปกติ</p> : incidents?.map((inc: any) => (
                <div key={inc.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{inc.title}</p>
                    <p className="text-xs text-muted-foreground">{inc.type} · {inc.location || '-'}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge variant={inc.severity === 'critical' ? 'destructive' : inc.severity === 'high' ? 'warning' : 'outline'}>{inc.severity}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>ผู้เยี่ยมในพื้นที่ ({activeVisitors})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {!(visitors?.length) ? <p className="text-sm text-muted-foreground text-center py-6">ไม่มีผู้เยี่ยมในขณะนี้</p> : visitors?.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{v.visitor_name}</p>
                    <p className="text-xs text-muted-foreground">ห้อง {v.visiting_room || '-'} · {v.purpose || '-'}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{new Date(v.checked_in_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  // ── Default / viewer / staff ─────────────────────────────────────────────────
  return (
    <main className="space-y-6 p-6 md:p-8">
      <section>
        <Badge variant="outline" className="mb-2">{role}</Badge>
        <h1 className="font-display text-2xl font-semibold">{hotel.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{formatDate(today)}</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Check-in วันนี้', value: checkIns, href: '/dashboard/front-desk', icon: CalendarCheck },
          { label: 'Check-out วันนี้', value: checkOuts, href: '/dashboard/front-desk', icon: ArrowRight },
          { label: 'Inbox เปิดอยู่', value: openInbox, href: '/dashboard/inbox', icon: MessageSquareWarning },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-xl bg-muted p-3 group-hover:bg-accent/10 transition"><s.icon className="h-5 w-5" /></div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </main>
  );
}
