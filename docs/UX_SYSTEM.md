# UX System

> Maitri Hotel OS design system. All components are in `src/components/ui/`.

## Principles

1. **Skeleton-first, not spinner** — every data-loading UI shows skeleton placeholders, not a spinner
2. **Per-component error states** — use `<ErrorBoundary>` or `<ErrorState>` inline, not a global error page
3. **Role-aware** — never show an action the current role cannot perform
4. **Thai-first** — all staff-facing labels in Thai; guest-facing supports Thai + English
5. **Mobile operations fast** — HK, maintenance, F&B actions reachable within 2 taps
6. **No empty screens** — every empty state has an icon + message + primary action

---

## Component Reference

### Loading States

```tsx
import { Skeleton, SkeletonStats, SkeletonTable, SkeletonCard, SkeletonList } from '@/components/ui/skeleton';

// KPI row (4 stat cards):
<SkeletonStats count={4} />

// Table with 5 rows and 4 columns:
<SkeletonTable rows={5} cols={4} />

// Single card:
<SkeletonCard />

// List with avatars:
<SkeletonList count={4} />

// Custom shape:
<Skeleton className="h-8 w-32" />
```

**Rule**: Use `Suspense` with skeleton fallback in every server-component page:
```tsx
<Suspense fallback={<SkeletonStats />}>
  <MyDataComponent />
</Suspense>
```

---

### Error States

```tsx
import { ErrorBoundary, ErrorState } from '@/components/ui/error-boundary';

// Wrap a risky client component:
<ErrorBoundary title="ไม่สามารถโหลดข้อมูลได้">
  <RealtimeWidget />
</ErrorBoundary>

// Inline error (e.g. after a failed fetch):
<ErrorState
  title="โหลดรายการล้มเหลว"
  message={error.message}
  onRetry={() => refetch()}
/>
```

---

### Empty States

```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { BedDouble } from 'lucide-react';

<EmptyState
  icon={BedDouble}
  title="ไม่มีห้องว่าง"
  description="ลองเปลี่ยนวันที่หรือตัวกรอง"
  action={{ label: 'ล้างตัวกรอง', onClick: clearFilters }}
/>
```

---

### Status Badges

```tsx
import { Badge } from '@/components/ui/badge';

// Reservation status:
const RESERVATION_BADGE: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800',
  confirmed:   'bg-blue-100 text-blue-700',
  checked_in:  'bg-green-100 text-green-800',
  checked_out: 'bg-gray-100 text-gray-600',
  cancelled:   'bg-red-100 text-red-700',
  no_show:     'bg-orange-100 text-orange-700',
};

// Room status:
const ROOM_BADGE: Record<string, string> = {
  available:          'bg-green-100 text-green-800',
  occupied:           'bg-blue-100 text-blue-700',
  dirty:              'bg-yellow-100 text-yellow-800',
  pending_inspection: 'bg-purple-100 text-purple-700',
  out_of_order:       'bg-red-100 text-red-700',
  maintenance:        'bg-orange-100 text-orange-700',
};

<Badge className={ROOM_BADGE[room.status]}>{room.status}</Badge>
```

---

### Approval Priority Colors

| Priority | Color class |
|---|---|
| `critical` | `bg-red-100 text-red-700` |
| `high`     | `bg-orange-100 text-orange-700` |
| `normal`   | `bg-blue-100 text-blue-700` |
| `low`      | `bg-gray-100 text-gray-600` |

---

### Toast Notifications

```tsx
import { toast } from 'sonner';

toast.success('เช็คอินสำเร็จ');
toast.error('เกิดข้อผิดพลาด: ' + error.message);
toast.loading('กำลังบันทึก...');
toast.promise(saveData(), {
  loading: 'กำลังบันทึก...',
  success: 'บันทึกสำเร็จ',
  error:   'บันทึกไม่สำเร็จ',
});
```

---

## Page Layout Patterns

### Server-rendered dashboard page

```tsx
export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { Suspense } from 'react';
import { SkeletonStats } from '@/components/ui/skeleton';

export default async function MyPage() {
  const { supabase, hotelId } = await requireDashboardRole(['manager', 'owner']);
  // ... fetch data
  return (
    <div className="space-y-6 max-w-7xl">
      <h1 className="text-2xl font-bold">หน้าเพจ</h1>
      <Suspense fallback={<SkeletonStats />}>
        {/* async sub-components */}
      </Suspense>
    </div>
  );
}
```

### Mobile-optimized operations page

- Max 2 taps to primary action
- Large touch targets (min 44×44px) → use `h-12` buttons
- Bottom action bar for primary CTA
- Status updates via realtime subscription

---

## Role-Aware UI

Never render actions the current role cannot perform:

```tsx
// In client components, use the profile from context:
const { profile } = useProfile();
const canApprove = MGMT_ROLES.includes(profile.role);

{canApprove && (
  <Button onClick={approve}>อนุมัติ</Button>
)}
```

For server components, gate at the page level with `requireDashboardRole`.

---

## Thai Language Labels

| Concept | Thai |
|---|---|
| Check-in | เช็คอิน |
| Check-out | เช็คเอาท์ |
| Available | ว่าง |
| Occupied | มีแขก |
| Dirty | รอทำความสะอาด |
| Inspection | รอตรวจ |
| Out of Order | ปิดซ่อม |
| Pending | รอดำเนินการ |
| Approved | อนุมัติแล้ว |
| Rejected | ปฏิเสธ |
| Escalated | ส่งต่อผู้บริหาร |
| High priority | เร่งด่วน |
| Overtime | โอที |
| Folio | บัญชีค่าใช้จ่าย |
| Room charge | ตัดห้อง |
