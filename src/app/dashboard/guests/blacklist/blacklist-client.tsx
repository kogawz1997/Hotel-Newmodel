'use client';
import { useState } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export function BlacklistClient({ guests: init }: any) {
  const [guests, setGuests] = useState<any[]>(init);
  async function unblacklist(id: string) {
    const res = await fetch(`/api/guests/${id}/blacklist`, { method: 'DELETE' });
    if (!res.ok) { toast.error('ไม่สำเร็จ'); return; }
    setGuests(prev => prev.filter(g => g.id !== id));
    toast.success('ลบออกจาก blacklist แล้ว');
  }
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar title="Blacklist" description="รายชื่อ guest ที่ถูกระงับ" />
      <div className="flex-1 p-4 md:p-6 space-y-3">
        {guests.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">ไม่มีรายชื่อใน blacklist</p></div>
        ) : guests.map((g: any) => (
          <Card key={g.id}>
            <CardContent className="pt-3 pb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{g.full_name}</p>
                <p className="text-xs text-muted-foreground">{g.email} {g.phone && `• ${g.phone}`}</p>
                {g.blacklist_reason && <p className="text-xs text-red-600 mt-1">เหตุผล: {g.blacklist_reason}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => unblacklist(g.id)}>ลบออก</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
