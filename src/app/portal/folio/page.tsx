export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function FolioPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/portal" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-semibold">ใบบัญชี (Folio)</h1>
            <p className="text-xs text-muted-foreground">รายละเอียดค่าใช้จ่ายระหว่างเข้าพัก</p>
          </div>
        </div>

        {/* Placeholder charges */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground">ค่าใช้จ่าย</p>
            </div>
            {[
              { desc: 'ค่าห้องพัก (Deluxe)', date: 'วันที่เช็คอิน', amount: '2,500' },
              { desc: 'Room Service — ข้าวผัด', date: 'เมื่อวาน 20:30', amount: '280' },
              { desc: 'Minibar — น้ำดื่ม x2', date: 'เมื่อวาน', amount: '120' },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm">{c.desc}</p>
                  <p className="text-xs text-muted-foreground">{c.date}</p>
                </div>
                <p className="text-sm font-medium">฿{c.amount}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border px-4 py-3 flex items-center justify-between">
            <p className="font-semibold">ยอดรวม</p>
            <p className="text-lg font-bold text-primary">฿2,900</p>
          </div>

          <Link href="/portal/folio/express-checkout" className="block w-full rounded-xl bg-primary text-primary-foreground text-center py-3 text-sm font-semibold hover:opacity-90 transition-opacity">
            Express Check-out
          </Link>
          <p className="text-xs text-muted-foreground text-center">ยอดนี้เป็นข้อมูลโดยประมาณ — ยอดสุดท้ายคำนวณ ณ วันเช็คเอาท์</p>
        </div>
      </div>
    </div>
  );
}
