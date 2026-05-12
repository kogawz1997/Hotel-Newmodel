import { requireDashboardRole } from '@/lib/auth/page-guards';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function BookingWidgetPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager']);

  const { data: hotel } = await supabase.from('hotels').select('id, slug, name').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) return null;

  const url = `${process.env.NEXT_PUBLIC_APP_URL || ''}/h/${hotel.slug || hotel.id}`;
  const iframeSnippet = `<iframe src=\"${url}\" width=\"100%\" height=\"760\" style=\"border:0;border-radius:12px;overflow:hidden\" loading=\"lazy\"></iframe>`;
  const jsSnippet = `<div id=\"maitri-booking\"></div>\n<script src=\"${process.env.NEXT_PUBLIC_APP_URL || ''}/embed/booking.js\" data-hotel=\"${hotel.slug || hotel.id}\"></script>`;

  return (
    <main className="space-y-6 p-6 md:p-8">
      <section>
        <h1 className="text-2xl font-semibold">Booking Widget</h1>
        <p className="text-sm text-muted-foreground">Embed หน้า booking บนเว็บโรงแรมด้วย iframe หรือ JS snippet</p>
      </section>

      <Card>
        <CardHeader><CardTitle>Iframe Embed</CardTitle><CardDescription>วางโค้ดนี้ในหน้าเว็บไซต์ที่ต้องการ</CardDescription></CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-xl border bg-muted p-4 text-xs"><code>{iframeSnippet}</code></pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>JavaScript Snippet</CardTitle><CardDescription>รองรับกรณีต้องการ mount ผ่าน div</CardDescription></CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-xl border bg-muted p-4 text-xs"><code>{jsSnippet}</code></pre>
        </CardContent>
      </Card>
    </main>
  );
}
