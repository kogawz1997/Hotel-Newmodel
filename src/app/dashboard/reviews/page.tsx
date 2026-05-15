import { requireDashboardRole } from '@/lib/auth/page-guards';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function ReviewAggregatorPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager']);

  const { data: hotel } = await supabase.from('hotels').select('id, name, slug').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) return null;

  const { data: bookingReviews } = await supabase
    .from('booking_reviews')
    .select('id, rating, title, comment, reviewer_name, created_at, reply_text')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const avg = (bookingReviews || []).length
    ? (bookingReviews || []).reduce((s: number, r: any) => s + Number(r.rating || 0), 0) / (bookingReviews || []).length
    : 0;

  return (
    <main className="space-y-6 p-6 md:p-8">
      <section className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Review Management Aggregator</h1>
          <p className="text-sm text-muted-foreground">รวมรีวิว Booking + Google ในมุมมองเดียว (ตอนนี้รองรับ Booking ในระบบ + external links)</p>
        </div>
        <div className="flex gap-2">
          <Link href={`https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' reviews')}`} target="_blank" className="rounded-lg border px-3 py-2 text-xs">Open Google Reviews</Link>
          <Link href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name)}`} target="_blank" className="rounded-lg border px-3 py-2 text-xs">Open Booking.com</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Booking reviews</p><p className="text-2xl font-semibold">{bookingReviews?.length || 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Average score</p><p className="text-2xl font-semibold">{avg.toFixed(1)} / 5</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Unreplied reviews</p><p className="text-2xl font-semibold">{(bookingReviews || []).filter((r:any) => !r.reply_text).length}</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Booking Reviews Feed</CardTitle><CardDescription>รีวิวล่าสุดจากผู้เข้าพักที่จองผ่านระบบ</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {(bookingReviews || []).length === 0 ? <p className="text-sm text-muted-foreground">ยังไม่มีรีวิว</p> : (bookingReviews || []).map((r: any) => (
            <div key={r.id} className="rounded-xl border p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium">{r.reviewer_name || 'Guest'}</p>
                <Badge variant="outline">⭐ {Number(r.rating || 0).toFixed(1)}</Badge>
              </div>
              {r.title ? <p className="text-sm font-medium">{r.title}</p> : null}
              {r.comment ? <p className="text-sm text-muted-foreground">{r.comment}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
