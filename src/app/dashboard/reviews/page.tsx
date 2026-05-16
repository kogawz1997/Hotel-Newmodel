import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Star, TrendingUp, MessageSquare, Send, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { ReviewActions } from '@/components/reviews/review-actions';

export const dynamic = 'force-dynamic';

export default async function ReviewAggregatorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id, name, slug').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const [{ data: bookingReviews }, { data: recentCheckouts }] = await Promise.all([
    supabase
      .from('booking_reviews')
      .select('id, rating, rating_clean, rating_service, rating_value, title, comment, reviewer_name, created_at, reply_text, platform')
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('reservations')
      .select('id, reservation_code, check_out, guests(first_name, last_name, email)')
      .eq('hotel_id', hotel.id)
      .eq('status', 'checked_out')
      .gte('check_out', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
      .order('check_out', { ascending: false })
      .limit(20),
  ]);

  const reviews = bookingReviews || [];
  const avg = reviews.length
    ? reviews.reduce((s: number, r: any) => s + Number(r.rating || 0), 0) / reviews.length
    : 0;

  const avgClean = reviews.length
    ? reviews.filter((r: any) => r.rating_clean).reduce((s: number, r: any) => s + Number(r.rating_clean), 0) / reviews.filter((r: any) => r.rating_clean).length
    : 0;
  const avgService = reviews.length
    ? reviews.filter((r: any) => r.rating_service).reduce((s: number, r: any) => s + Number(r.rating_service), 0) / reviews.filter((r: any) => r.rating_service).length
    : 0;
  const avgValue = reviews.length
    ? reviews.filter((r: any) => r.rating_value).reduce((s: number, r: any) => s + Number(r.rating_value), 0) / reviews.filter((r: any) => r.rating_value).length
    : 0;

  // Sentiment breakdown by rating
  const positive = reviews.filter((r: any) => Number(r.rating) >= 4).length;
  const neutral = reviews.filter((r: any) => Number(r.rating) >= 3 && Number(r.rating) < 4).length;
  const negative = reviews.filter((r: any) => Number(r.rating) < 3).length;
  const unreplied = reviews.filter((r: any) => !r.reply_text).length;

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter((r: any) => Math.round(Number(r.rating)) === star).length,
  }));

  return (
    <main className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
      <section className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Review Management</h1>
          <p className="text-sm text-muted-foreground">รีวิว · Sentiment · ขอรีวิวหลัง Checkout</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' reviews')}`} target="_blank" className="rounded-lg border px-3 py-2 text-xs">Google Reviews ↗</Link>
          <Link href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name)}`} target="_blank" className="rounded-lg border px-3 py-2 text-xs">Booking.com ↗</Link>
        </div>
      </section>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2"><Star className="h-3.5 w-3.5" /> คะแนนเฉลี่ย</div>
          <div className="text-3xl font-display font-medium">{avg.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">จาก {reviews.length} รีวิว</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2"><ThumbsUp className="h-3.5 w-3.5 text-emerald-500" /> Positive</div>
          <div className="text-3xl font-display font-medium text-emerald-600">{positive}</div>
          <div className="text-xs text-muted-foreground">{reviews.length ? Math.round(positive / reviews.length * 100) : 0}%</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2"><Minus className="h-3.5 w-3.5 text-amber-500" /> Neutral</div>
          <div className="text-3xl font-display font-medium text-amber-600">{neutral}</div>
          <div className="text-xs text-muted-foreground">{reviews.length ? Math.round(neutral / reviews.length * 100) : 0}%</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2"><ThumbsDown className="h-3.5 w-3.5 text-red-500" /> Negative</div>
          <div className="text-3xl font-display font-medium text-red-600">{negative}</div>
          <div className="text-xs text-muted-foreground">{reviews.length ? Math.round(negative / reviews.length * 100) : 0}%</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2"><MessageSquare className="h-3.5 w-3.5" /> รอตอบ</div>
          <div className={`text-3xl font-display font-medium ${unreplied > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{unreplied}</div>
          <div className="text-xs text-muted-foreground">รีวิว</div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating breakdown + sub-scores */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Rating Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ratingBreakdown.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-xs text-muted-foreground">{star}★</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-8 text-xs text-right text-muted-foreground">{count}</span>
              </div>
            ))}

            {(avgClean > 0 || avgService > 0 || avgValue > 0) && (
              <div className="pt-4 border-t border-border space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Sub-scores</p>
                {[
                  { label: 'ความสะอาด', score: avgClean },
                  { label: 'บริการ', score: avgService },
                  { label: 'ความคุ้มค่า', score: avgValue },
                ].filter(i => i.score > 0).map(({ label, score }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent checkouts — send review request */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4" /> ขอรีวิวหลัง Checkout</CardTitle>
            <CardDescription className="text-xs">แขกที่ Checkout ใน 7 วันที่ผ่านมา</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recentCheckouts || []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">ไม่มีแขก Checkout ล่าสุด</p>
            ) : (recentCheckouts || []).map((r: any) => (
              <ReviewActions
                key={r.id}
                reservationId={r.id}
                reservationCode={r.reservation_code}
                guestName={r.guests ? `${r.guests.first_name || ''} ${r.guests.last_name || ''}`.trim() : '—'}
                checkOut={r.check_out}
              />
            ))}
          </CardContent>
        </Card>

        {/* Recent reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">รีวิวล่าสุด</CardTitle>
            <CardDescription className="text-xs">{unreplied > 0 ? `${unreplied} รีวิวรอตอบ` : 'ตอบครบแล้ว'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">ยังไม่มีรีวิว</p>
            ) : reviews.slice(0, 10).map((r: any) => (
              <div key={r.id} className="rounded-xl border p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium truncate">{r.reviewer_name || 'Guest'}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={Number(r.rating) >= 4 ? 'success' : Number(r.rating) >= 3 ? 'warning' : 'destructive'} className="text-2xs">
                      ⭐ {Number(r.rating || 0).toFixed(1)}
                    </Badge>
                    {r.platform && r.platform !== 'direct' && (
                      <Badge variant="secondary" className="text-2xs">{r.platform}</Badge>
                    )}
                  </div>
                </div>
                {r.title && <p className="text-xs font-medium">{r.title}</p>}
                {r.comment && <p className="text-xs text-muted-foreground line-clamp-2">{r.comment}</p>}
                {r.reply_text && (
                  <div className="mt-1 pl-2 border-l-2 border-accent/50 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">ตอบ: </span>{r.reply_text}
                  </div>
                )}
                <p className="text-2xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('th-TH')}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
