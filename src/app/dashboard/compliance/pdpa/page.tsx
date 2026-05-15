export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PDPAPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold">PDPA Consent Management</h1>
        <p className="text-sm text-muted-foreground">จัดการการยินยอมข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล</p>
      </div>
      <div className="flex-1 p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'วัตถุประสงค์การเก็บข้อมูล', items: ['การจองห้องพัก', 'การตลาดและโปรโมชัน', 'การปรับปรุงบริการ', 'การปฏิบัติตามกฎหมาย'] },
            { label: 'สิทธิของเจ้าของข้อมูล', items: ['สิทธิในการเข้าถึงข้อมูล', 'สิทธิในการแก้ไขข้อมูล', 'สิทธิในการลบข้อมูล', 'สิทธิในการถอนความยินยอม'] },
            { label: 'ช่องทางการยินยอม', items: ['หน้า Check-in', 'Guest Portal', 'อีเมล', 'แบบฟอร์มกระดาษ'] },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border p-4 space-y-2">
              <h3 className="text-sm font-semibold">{s.label}</h3>
              <ul className="space-y-1">
                {s.items.map(i => <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4">
          <p className="text-sm font-medium text-amber-700">ℹ️ ฐานข้อมูล PDPA Consent Log จะเปิดใช้งานใน Phase 2</p>
          <p className="text-xs text-amber-600 mt-1">ขณะนี้ระบบบันทึกการยินยอมผ่าน Guest Portal และ Check-in Form</p>
        </div>
      </div>
    </div>
  );
}
