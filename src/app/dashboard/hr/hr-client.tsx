'use client';

import { useState, useCallback, useEffect } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Users,
  DollarSign,
  CalendarOff,
  BarChart2,
  BookOpen,
  ClipboardList,
  PlusCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StaffProfile {
  id: string;
  full_name: string | null;
  role: string;
  email: string | null;
  created_at: string;
}

interface PayrollPeriod {
  id: string;
  hotel_id: string;
  period_start: string;
  period_end: string;
  status: 'draft' | 'processing' | 'approved' | 'paid';
  approved_by: string | null;
  approved_at: string | null;
  total_amount: number | null;
  created_at: string;
  approver?: { id: string; full_name: string | null } | null;
}

interface PayrollItem {
  id: string;
  staff_id: string;
  base_salary: number;
  ot_hours: number;
  ot_amount: number;
  allowances: number;
  deductions: number;
  tax_amount: number;
  net_pay: number;
  attendance_days: number;
  leave_days: number;
  notes: string | null;
  staff?: { id: string; full_name: string | null; role: string } | null;
}

interface LeaveRequest {
  id: string;
  staff_id: string;
  type: string;
  start_date: string;
  end_date: string;
  days: number | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by: string | null;
  reject_note: string | null;
  created_at: string;
  staff?: { id: string; full_name: string | null; role: string } | null;
  approver?: { id: string; full_name: string | null } | null;
}

interface PerformanceReview {
  id: string;
  staff_id: string;
  reviewer_id: string;
  period: string;
  scores: Record<string, number>;
  overall: number;
  strengths: string | null;
  improvements: string | null;
  status: 'pending' | 'submitted' | 'acknowledged';
  submitted_at: string | null;
  created_at: string;
  staff?: { id: string; full_name: string | null; role: string } | null;
  reviewer?: { id: string; full_name: string | null } | null;
}

interface TrainingRecord {
  id: string;
  staff_id: string;
  course_name: string;
  category: string | null;
  trainer: string | null;
  start_date: string;
  end_date: string | null;
  hours: number | null;
  passed: boolean | null;
  certificate_url: string | null;
  notes: string | null;
  staff?: { id: string; full_name: string | null; role: string } | null;
}

interface OnboardingTask {
  id: string;
  staff_id: string;
  title: string;
  category: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  assigned_to: string | null;
  notes: string | null;
  staff?: { id: string; full_name: string | null; role: string } | null;
}

interface Props {
  hotel: { id: string; name: string };
  profile: { id: string; role: string };
  userId: string;
  staff: StaffProfile[];
  payrollPeriods: PayrollPeriod[];
  onboardingTasks: OnboardingTask[];
  leaveRequests: LeaveRequest[];
  pendingLeaveCount: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner: 'เจ้าของ',
  admin: 'แอดมิน',
  manager: 'ผู้จัดการ',
  general_manager: 'ผู้จัดการทั่วไป',
  hr_manager: 'ผู้จัดการ HR',
  hr_staff: 'เจ้าหน้าที่ HR',
  front_desk: 'พนักงานต้อนรับ',
  receptionist: 'พนักงานต้อนรับ',
  housekeeping: 'แม่บ้าน',
  housekeeper: 'แม่บ้าน',
  maintenance: 'ช่างซ่อมบำรุง',
  concierge: 'คอนเซียร์จ',
  bellboy: 'พนักงานยกกระเป๋า',
  security: 'รักษาความปลอดภัย',
  accounting: 'บัญชี',
  accounting_manager: 'ผู้จัดการบัญชี',
  purchasing_manager: 'ผู้จัดการจัดซื้อ',
  purchasing_staff: 'เจ้าหน้าที่จัดซื้อ',
  restaurant: 'พนักงานร้านอาหาร',
  kitchen: 'พ่อครัว/แม่ครัว',
  spa: 'พนักงานสปา',
  staff: 'พนักงานทั่วไป',
  viewer: 'ดูข้อมูลเท่านั้น',
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  sick: 'ลาป่วย',
  vacation: 'ลาพักร้อน',
  personal: 'ลากิจ',
  maternity: 'ลาคลอด',
  paternity: 'ลาบิดา',
  ordination: 'ลาบวช',
  unpaid: 'ลาไม่รับค่าจ้าง',
  other: 'อื่นๆ',
};

const ONBOARDING_CATEGORIES = [
  { key: 'documents', label: 'เอกสาร' },
  { key: 'training', label: 'อบรม' },
  { key: 'it_setup', label: 'ตั้งค่า IT' },
  { key: 'orientation', label: 'ปฐมนิเทศ' },
  { key: 'general', label: 'ทั่วไป' },
];

const TRAINING_CATEGORIES = [
  'ความปลอดภัย',
  'การบริการ',
  'ภาษา',
  'คอมพิวเตอร์',
  'การจัดการ',
  'อื่นๆ',
];

const PERFORMANCE_CRITERIA = [
  { key: 'attitude', label: 'ทัศนคติ' },
  { key: 'skill', label: 'ทักษะ' },
  { key: 'punctuality', label: 'ความตรงต่อเวลา' },
  { key: 'teamwork', label: 'การทำงานเป็นทีม' },
];

const PAYROLL_STATUS_LABELS: Record<string, string> = {
  draft: 'ร่าง',
  processing: 'กำลังดำเนินการ',
  approved: 'อนุมัติแล้ว',
  paid: 'จ่ายแล้ว',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtMoney(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PayrollStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'secondary',
    processing: 'warning',
    approved: 'info',
    paid: 'success',
  };
  return (
    <Badge variant={(map[status] ?? 'secondary') as any}>
      {PAYROLL_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function LeaveStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: string }> = {
    pending: { label: 'รออนุมัติ', variant: 'warning' },
    approved: { label: 'อนุมัติแล้ว', variant: 'success' },
    rejected: { label: 'ปฏิเสธ', variant: 'destructive' },
    cancelled: { label: 'ยกเลิก', variant: 'secondary' },
  };
  const s = map[status] ?? { label: status, variant: 'secondary' };
  return <Badge variant={s.variant as any}>{s.label}</Badge>;
}

function ReviewStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: string }> = {
    pending: { label: 'รออยู่', variant: 'warning' },
    submitted: { label: 'ส่งแล้ว', variant: 'info' },
    acknowledged: { label: 'รับทราบแล้ว', variant: 'success' },
  };
  const s = map[status] ?? { label: status, variant: 'secondary' };
  return <Badge variant={s.variant as any}>{s.label}</Badge>;
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= value ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}
        />
      ))}
    </span>
  );
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'staff', label: 'พนักงาน', icon: Users },
  { key: 'payroll', label: 'เงินเดือน', icon: DollarSign },
  { key: 'leave', label: 'ลางาน', icon: CalendarOff },
  { key: 'performance', label: 'ประเมินผล', icon: BarChart2 },
  { key: 'training', label: 'อบรม', icon: BookOpen },
  { key: 'onboarding', label: 'Onboarding', icon: ClipboardList },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ─── Main Component ───────────────────────────────────────────────────────────

export function HrClient({
  hotel,
  profile,
  userId,
  staff,
  payrollPeriods: initialPeriods,
  onboardingTasks: initialTasks,
  leaveRequests: initialLeave,
  pendingLeaveCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('staff');

  // Staff tab
  const [staffSearch, setStaffSearch] = useState('');

  // Payroll tab
  const [periods, setPeriods] = useState<PayrollPeriod[]>(initialPeriods);
  const [showCreatePeriod, setShowCreatePeriod] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [openPeriodId, setOpenPeriodId] = useState<string | null>(null);
  const [periodItems, setPeriodItems] = useState<PayrollItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [editedItems, setEditedItems] = useState<Record<string, Partial<PayrollItem>>>({});
  const [savingItems, setSavingItems] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Leave tab
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeave);
  const [leaveFilter, setLeaveFilter] = useState<string>('all');
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Performance tab
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [revStaff, setRevStaff] = useState('');
  const [revPeriod, setRevPeriod] = useState('');
  const [revStrengths, setRevStrengths] = useState('');
  const [revImprovements, setRevImprovements] = useState('');
  const [revScores, setRevScores] = useState<Record<string, number>>({
    attitude: 3,
    skill: 3,
    punctuality: 3,
    teamwork: 3,
  });
  const [creatingReview, setCreatingReview] = useState(false);

  // Training tab
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [loadingTraining, setLoadingTraining] = useState(false);
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [trStaff, setTrStaff] = useState('');
  const [trCourse, setTrCourse] = useState('');
  const [trCategory, setTrCategory] = useState('');
  const [trTrainer, setTrTrainer] = useState('');
  const [trStart, setTrStart] = useState('');
  const [trEnd, setTrEnd] = useState('');
  const [trHours, setTrHours] = useState('');
  const [trPassed, setTrPassed] = useState(false);
  const [addingTraining, setAddingTraining] = useState(false);

  // Onboarding tab
  const [tasks, setTasks] = useState<OnboardingTask[]>(initialTasks);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskStaff, setTaskStaff] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('general');
  const [taskDue, setTaskDue] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  // ── Load performance reviews on tab switch ──
  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch('/api/hr/performance');
      if (res.ok) {
        const d = await res.json();
        setReviews(d.reviews ?? []);
      }
    } catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); }
    setLoadingReviews(false);
  }, []);

  const loadTraining = useCallback(async () => {
    setLoadingTraining(true);
    try {
      const res = await fetch('/api/hr/training');
      if (res.ok) {
        const d = await res.json();
        setTrainingRecords(d.records ?? []);
      }
    } catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); }
    setLoadingTraining(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'performance') loadReviews();
    if (activeTab === 'training') loadTraining();
  }, [activeTab, loadReviews, loadTraining]);

  // ── Payroll ──────────────────────────────────────────────────────────────

  async function handleCreatePeriod(e: React.FormEvent) {
    e.preventDefault();
    if (!periodStart || !periodEnd) return;
    setCreatingPeriod(true);
    try {
      const res = await fetch('/api/hr/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_start: periodStart, period_end: periodEnd }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setPeriods((prev) => [d.period, ...prev]);
      setShowCreatePeriod(false);
      setPeriodStart('');
      setPeriodEnd('');
      toast.success('สร้างรอบเงินเดือนแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
    setCreatingPeriod(false);
  }

  async function loadPeriodItems(periodId: string) {
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/hr/payroll/${periodId}`);
      if (res.ok) {
        const d = await res.json();
        setPeriodItems(d.items ?? []);
        setEditedItems({});
      }
    } catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); }
    setLoadingItems(false);
  }

  async function generateItems(periodId: string) {
    try {
      const res = await fetch(`/api/hr/payroll/${periodId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate: true }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await loadPeriodItems(periodId);
      toast.success('สร้าง payroll items แล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  function handleItemChange(itemId: string, field: keyof PayrollItem, value: number) {
    setEditedItems((prev) => {
      const existing = prev[itemId] ?? {};
      const updated = { ...existing, [field]: value };
      // recompute net_pay
      const base = (field === 'base_salary' ? value : (existing.base_salary ?? periodItems.find((i) => i.id === itemId)?.base_salary ?? 0)) as number;
      const ot = (field === 'ot_amount' ? value : (existing.ot_amount ?? periodItems.find((i) => i.id === itemId)?.ot_amount ?? 0)) as number;
      const allow = (field === 'allowances' ? value : (existing.allowances ?? periodItems.find((i) => i.id === itemId)?.allowances ?? 0)) as number;
      const deduct = (field === 'deductions' ? value : (existing.deductions ?? periodItems.find((i) => i.id === itemId)?.deductions ?? 0)) as number;
      const tax = (field === 'tax_amount' ? value : (existing.tax_amount ?? periodItems.find((i) => i.id === itemId)?.tax_amount ?? 0)) as number;
      updated.net_pay = base + ot + allow - deduct - tax;
      return { ...prev, [itemId]: updated };
    });
  }

  async function saveItems(periodId: string) {
    if (!Object.keys(editedItems).length) return;
    setSavingItems(true);
    try {
      const items = periodItems.map((item) => ({
        id: item.id,
        staff_id: item.staff_id,
        base_salary: editedItems[item.id]?.base_salary ?? item.base_salary,
        ot_hours: editedItems[item.id]?.ot_hours ?? item.ot_hours,
        ot_amount: editedItems[item.id]?.ot_amount ?? item.ot_amount,
        allowances: editedItems[item.id]?.allowances ?? item.allowances,
        deductions: editedItems[item.id]?.deductions ?? item.deductions,
        tax_amount: editedItems[item.id]?.tax_amount ?? item.tax_amount,
        net_pay: editedItems[item.id]?.net_pay ?? item.net_pay,
        attendance_days: editedItems[item.id]?.attendance_days ?? item.attendance_days,
        leave_days: editedItems[item.id]?.leave_days ?? item.leave_days,
      }));
      const res = await fetch(`/api/hr/payroll/${periodId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await loadPeriodItems(periodId);
      toast.success('บันทึกแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
    setSavingItems(false);
  }

  async function updatePeriodStatus(periodId: string, status: string) {
    setUpdatingStatus(periodId);
    try {
      const res = await fetch(`/api/hr/payroll/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setPeriods((prev) => prev.map((p) => (p.id === periodId ? d.period : p)));
      toast.success('อัปเดตสถานะแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
    setUpdatingStatus(null);
  }

  // ── Leave ────────────────────────────────────────────────────────────────

  const filteredLeave = leaveRequests.filter((r) =>
    leaveFilter === 'all' ? true : r.status === leaveFilter
  );

  async function approveLeave(id: string) {
    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setLeaveRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: 'approved', approved_by: userId, approved_at: new Date().toISOString() }
            : r
        )
      );
      toast.success('อนุมัติใบลาแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  async function rejectLeave() {
    if (!rejectTarget) return;
    if (!rejectNote.trim()) { toast.error('กรุณาระบุเหตุผล'); return; }
    setRejecting(true);
    try {
      const res = await fetch(`/api/leave/${rejectTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reject_note: rejectNote }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setLeaveRequests((prev) =>
        prev.map((r) => (r.id === rejectTarget.id ? { ...r, status: 'rejected', reject_note: rejectNote } : r))
      );
      setRejectTarget(null);
      setRejectNote('');
      toast.success('ปฏิเสธใบลาแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
    setRejecting(false);
  }

  // ── Performance ──────────────────────────────────────────────────────────

  async function handleCreateReview(e: React.FormEvent) {
    e.preventDefault();
    if (!revStaff || !revPeriod) return;
    setCreatingReview(true);
    const avg =
      Object.values(revScores).reduce((a, b) => a + b, 0) / Object.values(revScores).length;
    try {
      const res = await fetch('/api/hr/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: revStaff,
          period: revPeriod,
          scores: revScores,
          overall: Math.round(avg * 10) / 10,
          strengths: revStrengths,
          improvements: revImprovements,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setReviews((prev) => [d.review, ...prev]);
      setShowCreateReview(false);
      setRevStaff(''); setRevPeriod(''); setRevStrengths(''); setRevImprovements('');
      setRevScores({ attitude: 3, skill: 3, punctuality: 3, teamwork: 3 });
      toast.success('สร้างการประเมินแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
    setCreatingReview(false);
  }

  async function submitReview(id: string) {
    try {
      const res = await fetch(`/api/hr/performance?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit' }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'submitted' } : r)));
      toast.success('ส่งการประเมินแล้ว');
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // ── Training ─────────────────────────────────────────────────────────────

  async function handleAddTraining(e: React.FormEvent) {
    e.preventDefault();
    if (!trStaff || !trCourse || !trStart) return;
    setAddingTraining(true);
    try {
      const res = await fetch('/api/hr/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: trStaff,
          course_name: trCourse,
          category: trCategory || null,
          trainer: trTrainer || null,
          start_date: trStart,
          end_date: trEnd || null,
          hours: trHours ? parseFloat(trHours) : null,
          passed: trPassed,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setTrainingRecords((prev) => [d.record, ...prev]);
      setShowAddTraining(false);
      setTrStaff(''); setTrCourse(''); setTrCategory(''); setTrTrainer('');
      setTrStart(''); setTrEnd(''); setTrHours(''); setTrPassed(false);
      toast.success('เพิ่มประวัติอบรมแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
    setAddingTraining(false);
  }

  // ── Onboarding ───────────────────────────────────────────────────────────

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskStaff || !taskTitle) return;
    setCreatingTask(true);
    try {
      const res = await fetch('/api/hr/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: taskStaff,
          title: taskTitle,
          category: taskCategory,
          due_date: taskDue || null,
          notes: taskNotes || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setTasks((prev) => [...prev, d.task]);
      setShowCreateTask(false);
      setTaskStaff(''); setTaskTitle(''); setTaskCategory('general'); setTaskDue(''); setTaskNotes('');
      toast.success('สร้าง task แล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
    setCreatingTask(false);
  }

  async function toggleTask(taskId: string, completed: boolean) {
    try {
      const res = await fetch(`/api/hr/onboarding?id=${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, completed, completed_at: completed ? new Date().toISOString() : null }
            : t
        )
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // ─── Grouped onboarding by staff ─────────────────────────────────────────

  const tasksByStaff = tasks.reduce<Record<string, OnboardingTask[]>>((acc, t) => {
    const key = t.staff_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  // ─── Filtered staff ───────────────────────────────────────────────────────

  const filteredStaff = staff.filter((s) => {
    const q = staffSearch.toLowerCase();
    return (
      !q ||
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q)
    );
  });

  // ─── Payroll period detail ────────────────────────────────────────────────

  const currentPeriod = periods.find((p) => p.id === openPeriodId);

  function getItemValue(item: PayrollItem, field: keyof PayrollItem): number {
    const edited = editedItems[item.id];
    if (edited && field in edited) return (edited as any)[field] as number;
    return (item as any)[field] as number;
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        title="ทรัพยากรบุคคล (HR)"
        description={hotel.name}
      />

      {/* Tab Navigation */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isPending = tab.key === 'leave' && pendingLeaveCount > 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors relative ${
                    activeTab === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {isPending && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                      {pendingLeaveCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── Staff Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">รายชื่อพนักงาน ({staff.length} คน)</h2>
              <input
                type="text"
                placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-background w-64 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium">ชื่อ</th>
                        <th className="text-left px-4 py-3 font-medium">ตำแหน่ง</th>
                        <th className="text-left px-4 py-3 font-medium">อีเมล</th>
                        <th className="text-left px-4 py-3 font-medium">วันที่เข้างาน</th>
                        <th className="text-left px-4 py-3 font-medium">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-muted-foreground py-8">
                            ไม่พบพนักงาน
                          </td>
                        </tr>
                      ) : (
                        filteredStaff.map((s) => (
                          <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{s.full_name ?? '—'}</td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary">
                                {ROLE_LABELS[s.role] ?? s.role}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{s.email ?? '—'}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {s.created_at ? fmtDate(s.created_at.slice(0, 10)) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <a
                                href={`/dashboard/team?highlight=${s.id}`}
                                className="text-primary hover:underline text-xs"
                              >
                                ดูโปรไฟล์
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Payroll Tab ───────────────────────────────────────────────── */}
        {activeTab === 'payroll' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">รอบเงินเดือน</h2>
              <Button onClick={() => setShowCreatePeriod(true)}>
                <PlusCircle size={16} className="mr-2" />
                สร้างรอบเงินเดือน
              </Button>
            </div>

            {/* Period list */}
            {periods.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  ยังไม่มีรอบเงินเดือน
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {periods.map((period) => (
                  <Card key={period.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div>
                            <div className="font-medium">
                              {fmtDate(period.period_start)} — {fmtDate(period.period_end)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ยอดรวม: ฿{fmtMoney(period.total_amount ?? 0)}
                            </div>
                          </div>
                          <PayrollStatusBadge status={period.status} />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {period.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingStatus === period.id}
                              onClick={() => updatePeriodStatus(period.id, 'processing')}
                            >
                              ส่งตรวจสอบ
                            </Button>
                          )}
                          {period.status === 'processing' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingStatus === period.id}
                              onClick={() => updatePeriodStatus(period.id, 'approved')}
                            >
                              อนุมัติ
                            </Button>
                          )}
                          {period.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingStatus === period.id}
                              onClick={() => updatePeriodStatus(period.id, 'paid')}
                            >
                              จ่ายแล้ว
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              if (openPeriodId === period.id) {
                                setOpenPeriodId(null);
                              } else {
                                setOpenPeriodId(period.id);
                                await loadPeriodItems(period.id);
                              }
                            }}
                          >
                            {openPeriodId === period.id ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Payroll items table */}
                      {openPeriodId === period.id && (
                        <div className="mt-4 border-t pt-4">
                          {loadingItems ? (
                            <div className="text-center text-muted-foreground py-4">กำลังโหลด...</div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-muted-foreground">
                                  {periodItems.length} รายการ
                                </span>
                                <div className="flex gap-2">
                                  {periodItems.length === 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => generateItems(period.id)}
                                    >
                                      สร้างรายการอัตโนมัติ
                                    </Button>
                                  )}
                                  {Object.keys(editedItems).length > 0 && (
                                    <Button
                                      size="sm"
                                      disabled={savingItems}
                                      onClick={() => saveItems(period.id)}
                                    >
                                      {savingItems ? 'กำลังบันทึก...' : 'บันทึก'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-muted/50">
                                      <th className="text-left px-2 py-2 font-medium">ชื่อพนักงาน</th>
                                      <th className="text-right px-2 py-2 font-medium">เงินเดือนพื้นฐาน</th>
                                      <th className="text-right px-2 py-2 font-medium">ชม.OT</th>
                                      <th className="text-right px-2 py-2 font-medium">ค่า OT</th>
                                      <th className="text-right px-2 py-2 font-medium">เบี้ยเลี้ยง</th>
                                      <th className="text-right px-2 py-2 font-medium">หัก</th>
                                      <th className="text-right px-2 py-2 font-medium">ภาษี</th>
                                      <th className="text-right px-2 py-2 font-medium font-bold">รับสุทธิ</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {periodItems.map((item) => (
                                      <tr key={item.id} className="border-b hover:bg-muted/20">
                                        <td className="px-2 py-2">
                                          {item.staff?.full_name ?? item.staff_id}
                                        </td>
                                        {(['base_salary', 'ot_hours', 'ot_amount', 'allowances', 'deductions', 'tax_amount'] as const).map((field) => (
                                          <td key={field} className="px-2 py-1 text-right">
                                            <input
                                              type="number"
                                              min={0}
                                              step={0.01}
                                              value={getItemValue(item, field)}
                                              onChange={(e) =>
                                                handleItemChange(item.id, field, parseFloat(e.target.value) || 0)
                                              }
                                              className="w-24 text-right border rounded px-1 py-0.5 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                              disabled={period.status === 'approved' || period.status === 'paid'}
                                            />
                                          </td>
                                        ))}
                                        <td className="px-2 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                          ฿{fmtMoney(getItemValue(item, 'net_pay'))}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Leave Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'leave' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                ใบลาพนักงาน
                {pendingLeaveCount > 0 && (
                  <Badge variant="warning" className="ml-2">
                    {pendingLeaveCount} รออนุมัติ
                  </Badge>
                )}
              </h2>
              <div className="flex gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setLeaveFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      leaveFilter === s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s === 'all' ? 'ทั้งหมด' : s === 'pending' ? 'รออนุมัติ' : s === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                  </button>
                ))}
              </div>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium">พนักงาน</th>
                        <th className="text-left px-4 py-3 font-medium">ประเภท</th>
                        <th className="text-left px-4 py-3 font-medium">วันที่</th>
                        <th className="text-left px-4 py-3 font-medium">จำนวน</th>
                        <th className="text-left px-4 py-3 font-medium">เหตุผล</th>
                        <th className="text-left px-4 py-3 font-medium">สถานะ</th>
                        <th className="text-left px-4 py-3 font-medium">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeave.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted-foreground py-8">
                            ไม่มีข้อมูลใบลา
                          </td>
                        </tr>
                      ) : (
                        filteredLeave.map((r) => (
                          <tr key={r.id} className="border-b hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <div className="font-medium">{r.staff?.full_name ?? '—'}</div>
                              <div className="text-xs text-muted-foreground">
                                {ROLE_LABELS[r.staff?.role ?? ''] ?? r.staff?.role ?? ''}
                              </div>
                            </td>
                            <td className="px-4 py-3">{LEAVE_TYPE_LABELS[r.type] ?? r.type}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {fmtDate(r.start_date)} — {fmtDate(r.end_date)}
                            </td>
                            <td className="px-4 py-3">{r.days ?? '—'} วัน</td>
                            <td className="px-4 py-3 max-w-48 truncate text-muted-foreground">
                              {r.reason ?? '—'}
                            </td>
                            <td className="px-4 py-3">
                              <LeaveStatusBadge status={r.status} />
                              {r.reject_note && (
                                <div className="text-xs text-red-500 mt-1">{r.reject_note}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {r.status === 'pending' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => approveLeave(r.id)}
                                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                    title="อนุมัติ"
                                  >
                                    <CheckCircle2 size={18} />
                                  </button>
                                  <button
                                    onClick={() => { setRejectTarget(r); setRejectNote(''); }}
                                    className="text-red-500 hover:text-red-600"
                                    title="ปฏิเสธ"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Performance Tab ───────────────────────────────────────────── */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">การประเมินผลงาน</h2>
              <Button onClick={() => setShowCreateReview(true)}>
                <PlusCircle size={16} className="mr-2" />
                สร้างการประเมิน
              </Button>
            </div>
            {loadingReviews ? (
              <div className="text-center text-muted-foreground py-8">กำลังโหลด...</div>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  ยังไม่มีการประเมิน
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((rev) => (
                  <Card key={rev.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{rev.staff?.full_name ?? '—'}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            รอบ: {rev.period}
                          </p>
                        </div>
                        <ReviewStatusBadge status={rev.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">คะแนนรวม:</span>
                        <span className="font-semibold">{rev.overall}/5</span>
                        <StarRating value={Math.round(rev.overall)} />
                      </div>
                      {PERFORMANCE_CRITERIA.map((c) => (
                        <div key={c.key} className="flex items-center gap-2 text-xs">
                          <span className="w-32 text-muted-foreground">{c.label}</span>
                          <StarRating value={rev.scores?.[c.key] ?? 0} />
                          <span className="text-muted-foreground">{rev.scores?.[c.key] ?? 0}</span>
                        </div>
                      ))}
                      {rev.strengths && (
                        <div className="text-xs">
                          <span className="font-medium">จุดแข็ง:</span>{' '}
                          <span className="text-muted-foreground">{rev.strengths}</span>
                        </div>
                      )}
                      {rev.improvements && (
                        <div className="text-xs">
                          <span className="font-medium">พัฒนา:</span>{' '}
                          <span className="text-muted-foreground">{rev.improvements}</span>
                        </div>
                      )}
                      {rev.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => submitReview(rev.id)}
                        >
                          ส่งการประเมิน
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Training Tab ─────────────────────────────────────────────── */}
        {activeTab === 'training' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">ประวัติการอบรม</h2>
              <Button onClick={() => setShowAddTraining(true)}>
                <PlusCircle size={16} className="mr-2" />
                เพิ่มประวัติอบรม
              </Button>
            </div>
            {loadingTraining ? (
              <div className="text-center text-muted-foreground py-8">กำลังโหลด...</div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium">พนักงาน</th>
                          <th className="text-left px-4 py-3 font-medium">หลักสูตร</th>
                          <th className="text-left px-4 py-3 font-medium">หมวดหมู่</th>
                          <th className="text-left px-4 py-3 font-medium">วิทยากร</th>
                          <th className="text-left px-4 py-3 font-medium">วันที่</th>
                          <th className="text-left px-4 py-3 font-medium">ชั่วโมง</th>
                          <th className="text-left px-4 py-3 font-medium">ผ่าน/ไม่ผ่าน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trainingRecords.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center text-muted-foreground py-8">
                              ไม่มีประวัติการอบรม
                            </td>
                          </tr>
                        ) : (
                          trainingRecords.map((rec) => (
                            <tr key={rec.id} className="border-b hover:bg-muted/30">
                              <td className="px-4 py-3 font-medium">{rec.staff?.full_name ?? '—'}</td>
                              <td className="px-4 py-3">{rec.course_name}</td>
                              <td className="px-4 py-3 text-muted-foreground">{rec.category ?? '—'}</td>
                              <td className="px-4 py-3 text-muted-foreground">{rec.trainer ?? '—'}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {fmtDate(rec.start_date)}
                                {rec.end_date && ` — ${fmtDate(rec.end_date)}`}
                              </td>
                              <td className="px-4 py-3">{rec.hours ?? '—'}</td>
                              <td className="px-4 py-3">
                                {rec.passed === null ? (
                                  <Badge variant="secondary">—</Badge>
                                ) : rec.passed ? (
                                  <Badge variant="success">ผ่าน</Badge>
                                ) : (
                                  <Badge variant="destructive">ไม่ผ่าน</Badge>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Onboarding Tab ────────────────────────────────────────────── */}
        {activeTab === 'onboarding' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Onboarding Tasks</h2>
              <Button onClick={() => setShowCreateTask(true)}>
                <PlusCircle size={16} className="mr-2" />
                สร้าง Task
              </Button>
            </div>
            {Object.keys(tasksByStaff).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  ยังไม่มี onboarding tasks
                </CardContent>
              </Card>
            ) : (
              Object.entries(tasksByStaff).map(([staffId, staffTasks]) => {
                const staffMember = staff.find((s) => s.id === staffId) ?? staffTasks[0]?.staff;
                const completed = staffTasks.filter((t) => t.completed).length;
                return (
                  <Card key={staffId}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {(staffMember as any)?.full_name ?? 'พนักงาน'}
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            {ROLE_LABELS[(staffMember as any)?.role ?? ''] ?? (staffMember as any)?.role ?? ''}
                          </span>
                        </CardTitle>
                        <Badge variant={completed === staffTasks.length ? 'success' : 'warning'}>
                          {completed}/{staffTasks.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {staffTasks.map((task) => {
                          const catLabel = ONBOARDING_CATEGORIES.find((c) => c.key === task.category)?.label ?? task.category;
                          return (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30"
                            >
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={(e) => toggleTask(task.id, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 accent-primary"
                              />
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.title}
                                </div>
                                <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-xs py-0">{catLabel}</Badge>
                                  {task.due_date && <span>ครบกำหนด: {fmtDate(task.due_date)}</span>}
                                </div>
                              </div>
                              {task.completed && task.completed_at && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {fmtDate(task.completed_at.slice(0, 10))}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}

      {/* Create Period Modal */}
      <Dialog open={showCreatePeriod} onOpenChange={setShowCreatePeriod}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างรอบเงินเดือน</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePeriod} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreatePeriod(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={creatingPeriod}>
                {creatingPeriod ? 'กำลังสร้าง...' : 'สร้าง'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Leave Modal */}
      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ปฏิเสธใบลา</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ระบุเหตุผลในการปฏิเสธใบลาของ{' '}
              <strong>{rejectTarget?.staff?.full_name}</strong>
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="เหตุผล..."
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={rejectLeave} disabled={rejecting}>
              {rejecting ? 'กำลังบันทึก...' : 'ปฏิเสธ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Review Modal */}
      <Dialog open={showCreateReview} onOpenChange={setShowCreateReview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>สร้างการประเมินผลงาน</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">พนักงาน</label>
              <select
                value={revStaff}
                onChange={(e) => setRevStaff(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">เลือกพนักงาน</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({ROLE_LABELS[s.role] ?? s.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">รอบการประเมิน</label>
              <input
                type="text"
                value={revPeriod}
                onChange={(e) => setRevPeriod(e.target.value)}
                placeholder="เช่น Q1/2025, มกราคม 2568"
                required
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">คะแนน (1-5)</p>
              {PERFORMANCE_CRITERIA.map((c) => (
                <div key={c.key} className="flex items-center gap-3">
                  <label className="w-36 text-sm text-muted-foreground">{c.label}</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={revScores[c.key] ?? 3}
                    onChange={(e) =>
                      setRevScores((prev) => ({ ...prev, [c.key]: parseInt(e.target.value) }))
                    }
                    className="flex-1"
                  />
                  <span className="w-8 text-center text-sm font-semibold">
                    {revScores[c.key] ?? 3}
                  </span>
                  <StarRating value={revScores[c.key] ?? 3} />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">จุดแข็ง</label>
              <textarea
                value={revStrengths}
                onChange={(e) => setRevStrengths(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">สิ่งที่ควรพัฒนา</label>
              <textarea
                value={revImprovements}
                onChange={(e) => setRevImprovements(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreateReview(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={creatingReview}>
                {creatingReview ? 'กำลังสร้าง...' : 'สร้าง'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Training Modal */}
      <Dialog open={showAddTraining} onOpenChange={setShowAddTraining}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มประวัติการอบรม</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTraining} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">พนักงาน</label>
                <select
                  value={trStaff}
                  onChange={(e) => setTrStaff(e.target.value)}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">เลือกพนักงาน</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">ชื่อหลักสูตร</label>
                <input
                  type="text"
                  value={trCourse}
                  onChange={(e) => setTrCourse(e.target.value)}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
                <select
                  value={trCategory}
                  onChange={(e) => setTrCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">เลือก</option>
                  {TRAINING_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">วิทยากร</label>
                <input
                  type="text"
                  value={trTrainer}
                  onChange={(e) => setTrTrainer(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">วันที่เริ่ม</label>
                <input
                  type="date"
                  value={trStart}
                  onChange={(e) => setTrStart(e.target.value)}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={trEnd}
                  onChange={(e) => setTrEnd(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ชั่วโมงอบรม</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={trHours}
                  onChange={(e) => setTrHours(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="trPassed"
                  checked={trPassed}
                  onChange={(e) => setTrPassed(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <label htmlFor="trPassed" className="text-sm">ผ่านการอบรม</label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowAddTraining(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={addingTraining}>
                {addingTraining ? 'กำลังบันทึก...' : 'เพิ่ม'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Onboarding Task Modal */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้าง Onboarding Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">พนักงาน</label>
              <select
                value={taskStaff}
                onChange={(e) => setTaskStaff(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">เลือกพนักงาน</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ชื่องาน</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {ONBOARDING_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ครบกำหนด</label>
                <input
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
              <textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreateTask(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={creatingTask}>
                {creatingTask ? 'กำลังสร้าง...' : 'สร้าง'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
