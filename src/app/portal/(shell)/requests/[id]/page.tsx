export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RequestTracker } from '@/components/portal/request-tracker';

export default async function RequestStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/portal" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-semibold">ติดตามคำร้อง</h1>
            <p className="text-xs text-muted-foreground">อัปเดตแบบ real-time</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-border bg-white dark:bg-card p-5">
          <RequestTracker workOrderId={id} />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">หน้านี้อัปเดตอัตโนมัติเมื่อสถานะเปลี่ยน</p>
      </div>
    </div>
  );
}
