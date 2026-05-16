export const dynamic = 'force-dynamic';

import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { GraduationCap, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { TrainingFormClient } from './training-form-client';

const CATEGORY_LABEL: Record<string, string> = {
  fire_safety:      'ความปลอดภัยอัคคีภัย',
  first_aid:        'ปฐมพยาบาล',
  food_hygiene:     'สุขลักษณะอาหาร',
  customer_service: 'บริการลูกค้า',
  housekeeping:     'แม่บ้าน',
  front_office:     'แผนกต้อนรับ',
  it_security:      'ความปลอดภัย IT',
  compliance:       'กฎหมายและข้อบังคับ',
  leadership:       'ภาวะผู้นำ',
  other:            'อื่นๆ',
};

export default async function TrainingPage() {
  const { hotelId } = await requireDashboardRole([
    'owner', 'admin', 'manager', 'hr_manager', 'hr_staff', 'general_manager',
  ]);

  const admin = createAdminClient();

  const [trainingResult, staffResult] = await Promise.all([
    admin
      .from('training_records')
      .select('*, staff:staff_id(id, full_name, role, department)')
      .eq('hotel_id', hotelId)
      .order('start_date', { ascending: false })
      .limit(200),
    admin
      .from('user_profiles')
      .select('id, full_name, role')
      .eq('hotel_id', hotelId)
      .eq('active', true)
      .order('full_name'),
  ]);

  const records = trainingResult.data ?? [];
  const staff   = staffResult.data ?? [];

  const now = new Date();
  const passed  = records.filter(r => r.passed === true).length;
  const failed  = records.filter(r => r.passed === false).length;
  const pending = records.filter(r => r.passed === null).length;

  // Expiring certifications (end_date within 30 days)
  const expiringSoon = records.filter(r => {
    if (!r.end_date || r.passed !== true) return false;
    const daysLeft = differenceInDays(new Date(r.end_date), now);
    return daysLeft >= 0 && daysLeft <= 30;
  });

  // Expired
  const expired = records.filter(r => {
    if (!r.end_date || r.passed !== true) return false;
    return new Date(r.end_date) < now;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6" /> บันทึกการอบรม & ใบรับรอง
          </h1>
          <p className="text-muted-foreground text-sm">ติดตามการอบรมและใบรับรองของพนักงาน</p>
        </div>
        <TrainingFormClient hotelId={hotelId} staff={staff as any[]} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">รายการทั้งหมด</div>
            <div className="text-3xl font-bold">{records.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />ผ่าน</div>
            <div className="text-3xl font-bold text-green-600">{passed}</div>
          </CardContent>
        </Card>
        <Card className={expiringSoon.length > 0 ? 'border-yellow-400' : ''}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-500" />ใกล้หมดอายุ</div>
            <div className="text-3xl font-bold text-yellow-600">{expiringSoon.length}</div>
          </CardContent>
        </Card>
        <Card className={expired.length > 0 ? 'border-red-400' : ''}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" />หมดอายุ</div>
            <div className="text-3xl font-bold text-red-600">{expired.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <Card className="border-yellow-400 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-800 flex items-center gap-2">
              <Clock className="w-4 h-4" /> ใบรับรองใกล้หมดอายุใน 30 วัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {expiringSoon.map(r => {
                const daysLeft = differenceInDays(new Date(r.end_date!), now);
                return (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{(r.staff as any)?.full_name ?? '-'}</span>
                    <span className="text-muted-foreground">{r.course_name}</span>
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">{daysLeft} วัน</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All records table */}
      <Card>
        <CardHeader><CardTitle className="text-base">รายการอบรมทั้งหมด</CardTitle></CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <EmptyState icon={GraduationCap} title="ยังไม่มีบันทึกการอบรม" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-3">พนักงาน</th>
                    <th className="text-left py-2 pr-3">หลักสูตร</th>
                    <th className="text-left py-2 pr-3">หมวดหมู่</th>
                    <th className="text-left py-2 pr-3">วันที่อบรม</th>
                    <th className="text-left py-2 pr-3">หมดอายุ</th>
                    <th className="text-left py-2 pr-3">ชั่วโมง</th>
                    <th className="text-left py-2">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => {
                    const isExpired = r.end_date && new Date(r.end_date) < now && r.passed === true;
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3">
                          <div className="font-medium">{(r.staff as any)?.full_name ?? '-'}</div>
                          <div className="text-xs text-muted-foreground">{(r.staff as any)?.role ?? ''}</div>
                        </td>
                        <td className="py-2 pr-3 max-w-[160px]">
                          <div className="truncate">{r.course_name}</div>
                          {r.trainer && <div className="text-xs text-muted-foreground">วิทยากร: {r.trainer}</div>}
                        </td>
                        <td className="py-2 pr-3">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            {CATEGORY_LABEL[r.category] ?? r.category ?? '-'}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-xs">{r.start_date ? format(new Date(r.start_date), 'dd/MM/yy') : '-'}</td>
                        <td className="py-2 pr-3 text-xs">
                          {r.end_date ? (
                            <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                              {format(new Date(r.end_date), 'dd/MM/yy')}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2 pr-3 text-xs">{r.hours ?? '-'}</td>
                        <td className="py-2">
                          {r.passed === true && !isExpired && <Badge className="bg-green-100 text-green-800 text-xs">ผ่าน</Badge>}
                          {r.passed === true && isExpired  && <Badge className="bg-red-100 text-red-700 text-xs">หมดอายุ</Badge>}
                          {r.passed === false             && <Badge className="bg-red-100 text-red-700 text-xs">ไม่ผ่าน</Badge>}
                          {r.passed === null              && <Badge className="bg-yellow-100 text-yellow-800 text-xs">รอผล</Badge>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
