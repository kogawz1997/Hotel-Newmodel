'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Copy, Check, Bell, Shield, User, Wrench, Save, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Lang = 'th' | 'en';

const T = {
  th: {
    title: 'โปรไฟล์ของฉัน',
    saved: 'บันทึกแล้ว',
    saving: 'กำลังบันทึก...',
    save: 'บันทึก',
    tabs: {
      personal: 'ข้อมูลส่วนตัว',
      notifications: 'การแจ้งเตือน',
      security: 'ความปลอดภัย',
      department: 'การตั้งค่าแผนก',
    },
    personal: {
      title: 'ข้อมูลส่วนตัว',
      firstName: 'ชื่อ',
      lastName: 'นามสกุล',
      email: 'อีเมล',
      phone: 'เบอร์โทรศัพท์',
      emailNote: 'อีเมลไม่สามารถเปลี่ยนได้',
      role: 'ตำแหน่ง',
      language: 'ภาษาที่ต้องการ',
      langTh: 'ภาษาไทย',
      langEn: 'English',
    },
    notifications: {
      title: 'การตั้งค่าแจ้งเตือน',
      email: 'อีเมล',
      push: 'Push',
      line: 'LINE',
      events: {
        new_booking: 'การจองใหม่',
        booking_cancelled: 'ยกเลิกการจอง',
        guest_checkin: 'แขก Check-in',
        guest_checkout: 'แขก Check-out',
        message_received: 'ข้อความใหม่',
        task_assigned: 'งานที่ได้รับมอบหมาย',
        shift_reminder: 'เตือนเข้าเวร',
        urgent_alert: 'แจ้งเตือนด่วน',
      },
    },
    security: {
      title: 'ความปลอดภัย',
      changePassword: 'เปลี่ยนรหัสผ่าน',
      currentPassword: 'รหัสผ่านปัจจุบัน',
      newPassword: 'รหัสผ่านใหม่',
      confirmPassword: 'ยืนยันรหัสผ่านใหม่',
      updatePassword: 'อัปเดตรหัสผ่าน',
      twoFactor: 'การยืนยันสองขั้นตอน (2FA)',
      twoFactorDesc: 'เพิ่มความปลอดภัยให้บัญชีของคุณ',
      comingSoon: 'เร็วๆ นี้',
      sessions: 'เซสชันที่ใช้งานอยู่',
      currentSession: 'เซสชันปัจจุบัน',
      logoutAll: 'ออกจากระบบทุกเครื่อง',
    },
    roles: {
      owner: 'เจ้าของ',
      admin: 'ผู้ดูแลระบบ',
      manager: 'ผู้จัดการ',
      front_desk: 'แผนกต้อนรับ',
      receptionist: 'พนักงานต้อนรับ',
      housekeeping: 'แม่บ้าน',
      concierge: 'คอนเซียร์จ',
      accounting: 'บัญชี',
      maintenance: 'ช่างซ่อมบำรุง',
      security: 'รักษาความปลอดภัย',
      staff: 'พนักงาน',
      viewer: 'ผู้ดู',
    },
    dept: {
      front_desk: {
        title: 'ตั้งค่าแผนกต้อนรับ',
        alertTiming: 'แจ้งเตือนก่อน Check-in (นาที)',
        alertTimingDesc: 'ระบบจะแจ้งเตือนก่อนเวลา Check-in ตามที่กำหนด',
        preferredLang: 'ภาษาที่ใช้กับแขก',
        defaultView: 'หน้าเริ่มต้น',
        viewFrontDesk: 'Front Desk',
        viewReservations: 'การจอง',
        viewRooms: 'ห้องพัก',
        autoAssignRoom: 'มอบหมายห้องอัตโนมัติเมื่อ Check-in',
      },
      housekeeping: {
        title: 'ตั้งค่าแผนกแม่บ้าน',
        roomPriority: 'ลำดับความสำคัญห้อง',
        priorityCheckout: 'Check-out ก่อน',
        priorityVip: 'VIP ก่อน',
        priorityFloor: 'เรียงตามชั้น',
        notifyVacated: 'แจ้งเตือนเมื่อห้องว่าง',
        notifyVacatedDesc: 'รับแจ้งเตือนทันทีเมื่อแขก Check-out',
        notifySupervisor: 'แจ้งหัวหน้าเมื่อทำเสร็จ',
        notifySupervisorDesc: 'ส่งรายงานให้หัวหน้าเมื่อทำความสะอาดเสร็จ',
        defaultArea: 'พื้นที่รับผิดชอบ',
        areaAll: 'ทุกพื้นที่',
        areaFloor1: 'ชั้น 1',
        areaFloor2: 'ชั้น 2',
        areaFloor3: 'ชั้น 3+',
      },
      maintenance: {
        title: 'ตั้งค่าแผนกซ่อมบำรุง',
        notifyNewRequest: 'แจ้งเตือนงานใหม่',
        notifyNewRequestDesc: 'รับแจ้งเตือนทันทีเมื่อมีคำขอซ่อมบำรุงใหม่',
        urgencyThreshold: 'ระดับความเร่งด่วนที่แจ้งทันที',
        urgencyLow: 'ต่ำ (ทุกระดับ)',
        urgencyMedium: 'ปานกลางขึ้นไป',
        urgencyHigh: 'สูงขึ้นไป',
        urgencyCritical: 'วิกฤตเท่านั้น',
        preferredArea: 'พื้นที่ที่ถนัด',
        areaAll: 'ทุกพื้นที่',
        areaRooms: 'ห้องพัก',
        areaCommon: 'พื้นที่ส่วนกลาง',
        areaMechanical: 'ระบบไฟฟ้า/ประปา',
        autoAccept: 'รับงานอัตโนมัติ',
        autoAcceptDesc: 'รับงานซ่อมบำรุงอัตโนมัติเมื่อมีงานใหม่',
      },
      manager: {
        title: 'ตั้งค่าผู้จัดการ',
        dailyReportTime: 'เวลาส่งรายงานประจำวัน',
        occupancyAlert: 'แจ้งเตือนเมื่ออัตราการเข้าพักต่ำกว่า (%)',
        revenueAlert: 'แจ้งเตือนเมื่อรายได้ต่ำกว่าเป้า (%)',
        defaultDashboard: 'หน้า Dashboard เริ่มต้น',
        dashOverview: 'ภาพรวม',
        dashRevenue: 'รายได้',
        dashOccupancy: 'อัตราการเข้าพัก',
        weeklyReport: 'รับรายงานรายสัปดาห์',
        weeklyReportDesc: 'รับสรุปผลการดำเนินงานทุกวันจันทร์',
      },
      accounting: {
        title: 'ตั้งค่าบัญชี',
        autoInvoice: 'สร้างใบแจ้งหนี้อัตโนมัติ',
        autoInvoiceDesc: 'ออกใบแจ้งหนี้อัตโนมัติเมื่อ Check-out',
        reportingPeriod: 'รอบรายงาน',
        periodMonthly: 'รายเดือน',
        periodWeekly: 'รายสัปดาห์',
        periodDaily: 'รายวัน',
        exportFormat: 'รูปแบบไฟล์ Export',
        vatReminder: 'เตือนยื่น VAT',
        vatReminderDesc: 'แจ้งเตือนก่อนวันยื่น VAT ทุกเดือน',
      },
      concierge: {
        title: 'ตั้งค่าคอนเซียร์จ',
        guestLang: 'ภาษาหลักที่ใช้กับแขก',
        responseTarget: 'เป้าหมายเวลาตอบกลับ (นาที)',
        notifyNewMessage: 'แจ้งเตือนข้อความใหม่',
        notifyNewMessageDesc: 'รับแจ้งเตือนทันทีเมื่อแขกส่งข้อความ',
        showGuestHistory: 'แสดงประวัติแขก',
        showGuestHistoryDesc: 'แสดงประวัติการเข้าพักก่อนหน้าของแขก',
      },
      owner: {
        title: 'ตั้งค่าเจ้าของ/ผู้ดูแล',
        defaultDashboard: 'หน้า Dashboard เริ่มต้น',
        dashOverview: 'ภาพรวม',
        dashRevenue: 'รายได้',
        dashAnalytics: 'Analytics',
        summaryTime: 'เวลาส่งสรุปประจำวัน',
        criticalAlerts: 'แจ้งเตือนเหตุการณ์สำคัญทันที',
        criticalAlertsDesc: 'รับแจ้งเตือน SMS/LINE สำหรับเหตุการณ์วิกฤต',
        weeklyReport: 'รับรายงานประจำสัปดาห์',
        weeklyReportDesc: 'รับสรุปผลการดำเนินงานทุกวันจันทร์',
      },
      security_guard: {
        title: 'ตั้งค่ารักษาความปลอดภัย',
        notifyIncident: 'แจ้งเตือนเหตุการณ์',
        notifyIncidentDesc: 'รับแจ้งเตือนเมื่อมีเหตุการณ์ผิดปกติ',
        shiftReminder: 'เตือนก่อนเข้าเวร (นาที)',
        incidentReport: 'รายงานเหตุการณ์อัตโนมัติ',
        incidentReportDesc: 'ส่งรายงานเหตุการณ์ให้ผู้จัดการอัตโนมัติ',
      },
      default: {
        title: 'ตั้งค่าการแจ้งเตือน',
        notifyShift: 'เตือนก่อนเข้าเวร',
        notifyShiftDesc: 'รับแจ้งเตือนก่อนเวลาเข้าเวรของคุณ',
        notifyTask: 'แจ้งเตือนงานใหม่',
        notifyTaskDesc: 'รับแจ้งเตือนเมื่อได้รับมอบหมายงาน',
      },
    },
  },
  en: {
    title: 'My Profile',
    saved: 'Saved',
    saving: 'Saving...',
    save: 'Save',
    tabs: {
      personal: 'Personal Info',
      notifications: 'Notifications',
      security: 'Security',
      department: 'Department Settings',
    },
    personal: {
      title: 'Personal Information',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      emailNote: 'Email cannot be changed',
      role: 'Role',
      language: 'Preferred Language',
      langTh: 'ภาษาไทย',
      langEn: 'English',
    },
    notifications: {
      title: 'Notification Settings',
      email: 'Email',
      push: 'Push',
      line: 'LINE',
      events: {
        new_booking: 'New Booking',
        booking_cancelled: 'Booking Cancelled',
        guest_checkin: 'Guest Check-in',
        guest_checkout: 'Guest Check-out',
        message_received: 'New Message',
        task_assigned: 'Task Assigned',
        shift_reminder: 'Shift Reminder',
        urgent_alert: 'Urgent Alert',
      },
    },
    security: {
      title: 'Security',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      updatePassword: 'Update Password',
      twoFactor: 'Two-Factor Authentication (2FA)',
      twoFactorDesc: 'Add an extra layer of security to your account',
      comingSoon: 'Coming Soon',
      sessions: 'Active Sessions',
      currentSession: 'Current Session',
      logoutAll: 'Sign Out All Devices',
    },
    roles: {
      owner: 'Owner',
      admin: 'Admin',
      manager: 'Manager',
      front_desk: 'Front Desk',
      receptionist: 'Receptionist',
      housekeeping: 'Housekeeping',
      concierge: 'Concierge',
      accounting: 'Accounting',
      maintenance: 'Maintenance',
      security: 'Security',
      staff: 'Staff',
      viewer: 'Viewer',
    },
    dept: {
      front_desk: {
        title: 'Front Desk Settings',
        alertTiming: 'Check-in Alert Before (minutes)',
        alertTimingDesc: 'System will notify you before check-in time',
        preferredLang: 'Guest Interaction Language',
        defaultView: 'Default View',
        viewFrontDesk: 'Front Desk',
        viewReservations: 'Reservations',
        viewRooms: 'Rooms',
        autoAssignRoom: 'Auto-assign room on check-in',
      },
      housekeeping: {
        title: 'Housekeeping Settings',
        roomPriority: 'Room Priority Order',
        priorityCheckout: 'Check-out Rooms First',
        priorityVip: 'VIP Rooms First',
        priorityFloor: 'By Floor Order',
        notifyVacated: 'Notify When Room Vacated',
        notifyVacatedDesc: 'Instant alert when guest checks out',
        notifySupervisor: 'Notify Supervisor on Completion',
        notifySupervisorDesc: 'Send report to supervisor when cleaning is done',
        defaultArea: 'Assigned Area',
        areaAll: 'All Areas',
        areaFloor1: 'Floor 1',
        areaFloor2: 'Floor 2',
        areaFloor3: 'Floor 3+',
      },
      maintenance: {
        title: 'Maintenance Settings',
        notifyNewRequest: 'Notify on New Request',
        notifyNewRequestDesc: 'Instant alert on new maintenance requests',
        urgencyThreshold: 'Minimum Urgency for Instant Alert',
        urgencyLow: 'Low (all requests)',
        urgencyMedium: 'Medium and above',
        urgencyHigh: 'High and above',
        urgencyCritical: 'Critical only',
        preferredArea: 'Preferred Work Area',
        areaAll: 'All Areas',
        areaRooms: 'Guest Rooms',
        areaCommon: 'Common Areas',
        areaMechanical: 'Electrical / Plumbing',
        autoAccept: 'Auto-accept Requests',
        autoAcceptDesc: 'Automatically accept new maintenance assignments',
      },
      manager: {
        title: 'Manager Settings',
        dailyReportTime: 'Daily Report Time',
        occupancyAlert: 'Alert When Occupancy Below (%)',
        revenueAlert: 'Alert When Revenue Below Target (%)',
        defaultDashboard: 'Default Dashboard View',
        dashOverview: 'Overview',
        dashRevenue: 'Revenue',
        dashOccupancy: 'Occupancy',
        weeklyReport: 'Receive Weekly Report',
        weeklyReportDesc: 'Get performance summary every Monday',
      },
      accounting: {
        title: 'Accounting Settings',
        autoInvoice: 'Auto-generate Invoice',
        autoInvoiceDesc: 'Issue invoice automatically on check-out',
        reportingPeriod: 'Reporting Period',
        periodMonthly: 'Monthly',
        periodWeekly: 'Weekly',
        periodDaily: 'Daily',
        exportFormat: 'Export Format',
        vatReminder: 'VAT Filing Reminder',
        vatReminderDesc: 'Remind before monthly VAT filing date',
      },
      concierge: {
        title: 'Concierge Settings',
        guestLang: 'Primary Guest Language',
        responseTarget: 'Response Time Target (minutes)',
        notifyNewMessage: 'Notify on New Message',
        notifyNewMessageDesc: 'Instant alert when guest sends message',
        showGuestHistory: 'Show Guest History',
        showGuestHistoryDesc: 'Display guest previous stay history',
      },
      owner: {
        title: 'Owner / Admin Settings',
        defaultDashboard: 'Default Dashboard View',
        dashOverview: 'Overview',
        dashRevenue: 'Revenue',
        dashAnalytics: 'Analytics',
        summaryTime: 'Daily Summary Time',
        criticalAlerts: 'Instant Critical Alerts',
        criticalAlertsDesc: 'Receive SMS/LINE for critical events',
        weeklyReport: 'Receive Weekly Report',
        weeklyReportDesc: 'Get performance summary every Monday',
      },
      security_guard: {
        title: 'Security Settings',
        notifyIncident: 'Notify on Incident',
        notifyIncidentDesc: 'Alert when an abnormal event is reported',
        shiftReminder: 'Shift Reminder (minutes before)',
        incidentReport: 'Auto Incident Report',
        incidentReportDesc: 'Automatically send incident reports to manager',
      },
      default: {
        title: 'Notification Preferences',
        notifyShift: 'Shift Reminder',
        notifyShiftDesc: 'Get notified before your shift starts',
        notifyTask: 'Task Notifications',
        notifyTaskDesc: 'Get notified when assigned a new task',
      },
    },
  },
};

type Strings = (typeof T)['th'];

// ─── Reusable primitives ────────────────────────────────────────────────────

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 space-y-4', className)}>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none',
        'focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow',
        'disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none',
        'focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors mt-0.5',
          checked ? 'bg-primary' : 'bg-input',
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
    </div>
  );
}

function SaveBar({ saving, saved, onSave, label }: { saving: boolean; saved: boolean; onSave: () => void; label: string }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          saved
            ? 'bg-green-500/10 text-green-600 border border-green-500/20'
            : 'bg-primary text-primary-foreground hover:bg-primary/90',
          saving && 'opacity-60 cursor-not-allowed',
        )}
      >
        {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saved ? label : saving ? '...' : label}
      </button>
    </div>
  );
}

// ─── Notification events visible per role ────────────────────────────────────

const ROLE_EVENTS: Record<string, Array<keyof Strings['notifications']['events']>> = {
  owner:        ['new_booking', 'booking_cancelled', 'guest_checkin', 'guest_checkout', 'message_received', 'urgent_alert', 'shift_reminder'],
  admin:        ['new_booking', 'booking_cancelled', 'guest_checkin', 'guest_checkout', 'message_received', 'urgent_alert', 'shift_reminder'],
  manager:      ['new_booking', 'booking_cancelled', 'guest_checkin', 'guest_checkout', 'message_received', 'urgent_alert'],
  front_desk:   ['new_booking', 'booking_cancelled', 'guest_checkin', 'guest_checkout', 'message_received', 'urgent_alert'],
  receptionist: ['new_booking', 'booking_cancelled', 'guest_checkin', 'guest_checkout', 'message_received'],
  housekeeping: ['guest_checkout', 'task_assigned', 'shift_reminder', 'urgent_alert'],
  concierge:    ['guest_checkin', 'guest_checkout', 'message_received', 'task_assigned'],
  accounting:   ['new_booking', 'booking_cancelled', 'urgent_alert'],
  maintenance:  ['task_assigned', 'shift_reminder', 'urgent_alert'],
  security:     ['task_assigned', 'shift_reminder', 'urgent_alert'],
  staff:        ['task_assigned', 'shift_reminder'],
  viewer:       ['urgent_alert'],
};

// ─── Personal Tab ─────────────────────────────────────────────────────────────

function PersonalTab({
  profile,
  user,
  s,
}: {
  profile: any;
  user: any;
  s: Strings;
}) {
  const supabase = createClient();
  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('user_profiles').update({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
    }).eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const roleKey = (profile?.role || 'staff') as keyof Strings['roles'];
  const roleLabel = s.roles[roleKey] || profile?.role || 'staff';

  return (
    <div className="space-y-4">
      <SectionCard>
        <h3 className="text-sm font-semibold text-foreground">{s.personal.title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={s.personal.firstName}>
            <Input
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              placeholder={s.personal.firstName}
            />
          </Field>
          <Field label={s.personal.lastName}>
            <Input
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              placeholder={s.personal.lastName}
            />
          </Field>
          <Field label={s.personal.email} hint={s.personal.emailNote}>
            <Input value={user.email || ''} disabled />
          </Field>
          <Field label={s.personal.phone}>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+66 8X XXX XXXX"
              type="tel"
            />
          </Field>
          <Field label={s.personal.role}>
            <Input value={roleLabel} disabled />
          </Field>
        </div>
        <SaveBar saving={saving} saved={saved} onSave={handleSave} label={s.save} />
      </SectionCard>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

type NotifState = Record<string, { email: boolean; push: boolean; line: boolean }>;

function NotificationsTab({ profile, s }: { profile: any; s: Strings }) {
  const role = profile?.role || 'staff';
  const storageKey = `maitri_staff_notif_${profile?.id}`;
  const events = ROLE_EVENTS[role] ?? ROLE_EVENTS.staff;

  const [notif, setNotif] = useState<NotifState>(() => {
    const defaults: NotifState = {};
    for (const ev of events) {
      defaults[ev] = { email: true, push: true, line: false };
    }
    return defaults;
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setNotif(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [storageKey]);

  const toggle = (ev: string, channel: 'email' | 'push' | 'line') => {
    setNotif((prev) => ({ ...prev, [ev]: { ...prev[ev], [channel]: !prev[ev]?.[channel] } }));
  };

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(notif));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <SectionCard>
        <h3 className="text-sm font-semibold text-foreground">{s.notifications.title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-medium text-muted-foreground py-2 pr-4">เหตุการณ์</th>
                <th className="text-center font-medium text-muted-foreground py-2 px-3 w-16">{s.notifications.email}</th>
                <th className="text-center font-medium text-muted-foreground py-2 px-3 w-16">{s.notifications.push}</th>
                <th className="text-center font-medium text-muted-foreground py-2 px-3 w-16">{s.notifications.line}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((ev) => (
                <tr key={ev} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-2.5 pr-4 text-foreground">
                    {s.notifications.events[ev]}
                  </td>
                  {(['email', 'push', 'line'] as const).map((ch) => (
                    <td key={ch} className="text-center py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={notif[ev]?.[ch] ?? false}
                        onChange={() => toggle(ev, ch)}
                        className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SaveBar saving={false} saved={saved} onSave={handleSave} label={s.save} />
      </SectionCard>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab({ s }: { s: Strings }) {
  const supabase = createClient();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleUpdate = async () => {
    if (form.next !== form.confirm) { setErrMsg('รหัสผ่านไม่ตรงกัน'); return; }
    if (form.next.length < 8) { setErrMsg('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    setStatus('saving');
    setErrMsg('');
    const { error } = await supabase.auth.updateUser({ password: form.next });
    if (error) { setErrMsg(error.message); setStatus('error'); return; }
    setStatus('saved');
    setForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setStatus('idle'), 3000);
  };

  const eyeBtn = (field: keyof typeof show) => (
    <button
      type="button"
      onClick={() => setShow((s) => ({ ...s, [field]: !s[field] }))}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
    >
      {show[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="space-y-4">
      <SectionCard>
        <h3 className="text-sm font-semibold text-foreground">{s.security.changePassword}</h3>
        <div className="space-y-3 max-w-sm">
          {(['current', 'next', 'confirm'] as const).map((field) => {
            const labels: Record<typeof field, string> = {
              current: s.security.currentPassword,
              next: s.security.newPassword,
              confirm: s.security.confirmPassword,
            };
            return (
              <Field key={field} label={labels[field]}>
                <div className="relative">
                  <Input
                    type={show[field] ? 'text' : 'password'}
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    className="pr-10"
                  />
                  {eyeBtn(field)}
                </div>
              </Field>
            );
          })}
          {errMsg && <p className="text-xs text-red-500">{errMsg}</p>}
          {status === 'saved' && <p className="text-xs text-green-600">{s.saved}</p>}
          <button
            onClick={handleUpdate}
            disabled={status === 'saving'}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {status === 'saving' ? s.saving : s.security.updatePassword}
          </button>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{s.security.twoFactor}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{s.security.twoFactorDesc}</p>
          </div>
          <span className="shrink-0 text-2xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
            {s.security.comingSoon}
          </span>
        </div>
      </SectionCard>

      <SectionCard>
        <h3 className="text-sm font-semibold text-foreground">{s.security.sessions}</h3>
        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
          <div>
            <div className="text-sm font-medium">{s.security.currentSession}</div>
            <div className="text-xs text-muted-foreground">Chrome · {new Date().toLocaleDateString('th-TH')}</div>
          </div>
          <span className="h-2 w-2 rounded-full bg-green-500" />
        </div>
        <button
          onClick={() => supabase.auth.signOut({ scope: 'global' })}
          className="text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          {s.security.logoutAll}
        </button>
      </SectionCard>
    </div>
  );
}

// ─── Department Tab ───────────────────────────────────────────────────────────

function DepartmentTab({ profile, s }: { profile: any; s: Strings }) {
  const role: string = profile?.role || 'staff';
  const storageKey = `maitri_dept_prefs_${profile?.id}`;

  const [prefs, setPrefs] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setPrefs(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [storageKey]);

  const set = (key: string, val: unknown) => setPrefs((p) => ({ ...p, [key]: val }));
  const get = <T,>(key: string, fallback: T): T => (prefs[key] as T) ?? fallback;

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const renderContent = () => {
    if (role === 'front_desk' || role === 'receptionist') {
      const d = s.dept.front_desk;
      return (
        <>
          <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
          <Field label={d.alertTiming} hint={d.alertTimingDesc}>
            <Select value={get('alert_minutes', '30')} onChange={(e) => set('alert_minutes', e.target.value)}>
              {[15, 30, 45, 60].map((n) => <option key={n} value={String(n)}>{n}</option>)}
            </Select>
          </Field>
          <Field label={d.preferredLang}>
            <Select value={get('guest_lang', 'th')} onChange={(e) => set('guest_lang', e.target.value)}>
              <option value="th">ภาษาไทย</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </Select>
          </Field>
          <Field label={d.defaultView}>
            <Select value={get('default_view', 'front-desk')} onChange={(e) => set('default_view', e.target.value)}>
              <option value="front-desk">{d.viewFrontDesk}</option>
              <option value="reservations">{d.viewReservations}</option>
              <option value="rooms">{d.viewRooms}</option>
            </Select>
          </Field>
          <Toggle
            checked={get('auto_assign_room', false)}
            onChange={(v) => set('auto_assign_room', v)}
            label={d.autoAssignRoom}
          />
        </>
      );
    }

    if (role === 'housekeeping') {
      const d = s.dept.housekeeping;
      return (
        <>
          <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
          <Field label={d.roomPriority}>
            <Select value={get('room_priority', 'checkout')} onChange={(e) => set('room_priority', e.target.value)}>
              <option value="checkout">{d.priorityCheckout}</option>
              <option value="vip">{d.priorityVip}</option>
              <option value="floor">{d.priorityFloor}</option>
            </Select>
          </Field>
          <Field label={d.defaultArea}>
            <Select value={get('default_area', 'all')} onChange={(e) => set('default_area', e.target.value)}>
              <option value="all">{d.areaAll}</option>
              <option value="floor1">{d.areaFloor1}</option>
              <option value="floor2">{d.areaFloor2}</option>
              <option value="floor3">{d.areaFloor3}</option>
            </Select>
          </Field>
          <Toggle
            checked={get('notify_vacated', true)}
            onChange={(v) => set('notify_vacated', v)}
            label={d.notifyVacated}
            description={d.notifyVacatedDesc}
          />
          <Toggle
            checked={get('notify_supervisor', false)}
            onChange={(v) => set('notify_supervisor', v)}
            label={d.notifySupervisor}
            description={d.notifySupervisorDesc}
          />
        </>
      );
    }

    if (role === 'maintenance') {
      const d = s.dept.maintenance;
      return (
        <>
          <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
          <Toggle
            checked={get('notify_new', true)}
            onChange={(v) => set('notify_new', v)}
            label={d.notifyNewRequest}
            description={d.notifyNewRequestDesc}
          />
          <Field label={d.urgencyThreshold}>
            <Select value={get('urgency_threshold', 'medium')} onChange={(e) => set('urgency_threshold', e.target.value)}>
              <option value="low">{d.urgencyLow}</option>
              <option value="medium">{d.urgencyMedium}</option>
              <option value="high">{d.urgencyHigh}</option>
              <option value="critical">{d.urgencyCritical}</option>
            </Select>
          </Field>
          <Field label={d.preferredArea}>
            <Select value={get('preferred_area', 'all')} onChange={(e) => set('preferred_area', e.target.value)}>
              <option value="all">{d.areaAll}</option>
              <option value="rooms">{d.areaRooms}</option>
              <option value="common">{d.areaCommon}</option>
              <option value="mechanical">{d.areaMechanical}</option>
            </Select>
          </Field>
          <Toggle
            checked={get('auto_accept', false)}
            onChange={(v) => set('auto_accept', v)}
            label={d.autoAccept}
            description={d.autoAcceptDesc}
          />
        </>
      );
    }

    if (role === 'manager') {
      const d = s.dept.manager;
      return (
        <>
          <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={d.dailyReportTime}>
              <Input
                type="time"
                value={get('report_time', '08:00')}
                onChange={(e) => set('report_time', e.target.value)}
              />
            </Field>
            <Field label={d.defaultDashboard}>
              <Select value={get('default_dashboard', 'overview')} onChange={(e) => set('default_dashboard', e.target.value)}>
                <option value="overview">{d.dashOverview}</option>
                <option value="revenue">{d.dashRevenue}</option>
                <option value="occupancy">{d.dashOccupancy}</option>
              </Select>
            </Field>
            <Field label={d.occupancyAlert}>
              <Input
                type="number"
                min={0}
                max={100}
                value={get('occupancy_alert', 60)}
                onChange={(e) => set('occupancy_alert', Number(e.target.value))}
              />
            </Field>
            <Field label={d.revenueAlert}>
              <Input
                type="number"
                min={0}
                max={100}
                value={get('revenue_alert', 80)}
                onChange={(e) => set('revenue_alert', Number(e.target.value))}
              />
            </Field>
          </div>
          <Toggle
            checked={get('weekly_report', true)}
            onChange={(v) => set('weekly_report', v)}
            label={d.weeklyReport}
            description={d.weeklyReportDesc}
          />
        </>
      );
    }

    if (role === 'accounting') {
      const d = s.dept.accounting;
      return (
        <>
          <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
          <Toggle
            checked={get('auto_invoice', true)}
            onChange={(v) => set('auto_invoice', v)}
            label={d.autoInvoice}
            description={d.autoInvoiceDesc}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={d.reportingPeriod}>
              <Select value={get('reporting_period', 'monthly')} onChange={(e) => set('reporting_period', e.target.value)}>
                <option value="monthly">{d.periodMonthly}</option>
                <option value="weekly">{d.periodWeekly}</option>
                <option value="daily">{d.periodDaily}</option>
              </Select>
            </Field>
            <Field label={d.exportFormat}>
              <Select value={get('export_format', 'pdf')} onChange={(e) => set('export_format', e.target.value)}>
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
              </Select>
            </Field>
          </div>
          <Toggle
            checked={get('vat_reminder', true)}
            onChange={(v) => set('vat_reminder', v)}
            label={d.vatReminder}
            description={d.vatReminderDesc}
          />
        </>
      );
    }

    if (role === 'concierge') {
      const d = s.dept.concierge;
      return (
        <>
          <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={d.guestLang}>
              <Select value={get('guest_lang', 'th')} onChange={(e) => set('guest_lang', e.target.value)}>
                <option value="th">ภาษาไทย</option>
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
              </Select>
            </Field>
            <Field label={d.responseTarget}>
              <Input
                type="number"
                min={1}
                max={60}
                value={get('response_target', 5)}
                onChange={(e) => set('response_target', Number(e.target.value))}
              />
            </Field>
          </div>
          <Toggle
            checked={get('notify_message', true)}
            onChange={(v) => set('notify_message', v)}
            label={d.notifyNewMessage}
            description={d.notifyNewMessageDesc}
          />
          <Toggle
            checked={get('show_guest_history', true)}
            onChange={(v) => set('show_guest_history', v)}
            label={d.showGuestHistory}
            description={d.showGuestHistoryDesc}
          />
        </>
      );
    }

    if (role === 'owner' || role === 'admin') {
      const d = s.dept.owner;
      return (
        <>
          <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={d.defaultDashboard}>
              <Select value={get('default_dashboard', 'overview')} onChange={(e) => set('default_dashboard', e.target.value)}>
                <option value="overview">{d.dashOverview}</option>
                <option value="revenue">{d.dashRevenue}</option>
                <option value="analytics">{d.dashAnalytics}</option>
              </Select>
            </Field>
            <Field label={d.summaryTime}>
              <Input
                type="time"
                value={get('summary_time', '07:00')}
                onChange={(e) => set('summary_time', e.target.value)}
              />
            </Field>
          </div>
          <Toggle
            checked={get('critical_alerts', true)}
            onChange={(v) => set('critical_alerts', v)}
            label={d.criticalAlerts}
            description={d.criticalAlertsDesc}
          />
          <Toggle
            checked={get('weekly_report', true)}
            onChange={(v) => set('weekly_report', v)}
            label={d.weeklyReport}
            description={d.weeklyReportDesc}
          />
        </>
      );
    }

    if (role === 'security') {
      const d = s.dept.security_guard;
      return (
        <>
          <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
          <Toggle
            checked={get('notify_incident', true)}
            onChange={(v) => set('notify_incident', v)}
            label={d.notifyIncident}
            description={d.notifyIncidentDesc}
          />
          <Field label={d.shiftReminder}>
            <Select value={get('shift_reminder_min', '30')} onChange={(e) => set('shift_reminder_min', e.target.value)}>
              {[15, 30, 45, 60].map((n) => <option key={n} value={String(n)}>{n}</option>)}
            </Select>
          </Field>
          <Toggle
            checked={get('auto_incident_report', false)}
            onChange={(v) => set('auto_incident_report', v)}
            label={d.incidentReport}
            description={d.incidentReportDesc}
          />
        </>
      );
    }

    // default / viewer / staff
    const d = s.dept.default;
    return (
      <>
        <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
        <Toggle
          checked={get('notify_shift', true)}
          onChange={(v) => set('notify_shift', v)}
          label={d.notifyShift}
          description={d.notifyShiftDesc}
        />
        <Toggle
          checked={get('notify_task', true)}
          onChange={(v) => set('notify_task', v)}
          label={d.notifyTask}
          description={d.notifyTaskDesc}
        />
      </>
    );
  };

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="space-y-4">
          {renderContent()}
          <SaveBar saving={false} saved={saved} onSave={handleSave} label={s.save} />
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700 border-purple-200',
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  manager: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  front_desk: 'bg-sky-100 text-sky-700 border-sky-200',
  receptionist: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  housekeeping: 'bg-green-100 text-green-700 border-green-200',
  concierge: 'bg-teal-100 text-teal-700 border-teal-200',
  accounting: 'bg-amber-100 text-amber-700 border-amber-200',
  maintenance: 'bg-orange-100 text-orange-700 border-orange-200',
  security: 'bg-red-100 text-red-700 border-red-200',
  staff: 'bg-gray-100 text-gray-700 border-gray-200',
  viewer: 'bg-gray-100 text-gray-500 border-gray-200',
};

const ROLE_DEPT_ICON: Record<string, React.ReactNode> = {
  front_desk: <User className="h-3.5 w-3.5" />,
  receptionist: <User className="h-3.5 w-3.5" />,
  housekeeping: <Wrench className="h-3.5 w-3.5" />,
  maintenance: <Wrench className="h-3.5 w-3.5" />,
  security: <Shield className="h-3.5 w-3.5" />,
};

// ─── Root Component ───────────────────────────────────────────────────────────

export function ProfileClient({
  profile,
  user,
  hotel,
}: {
  profile: any;
  user: any;
  hotel: any;
}) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('maitri_dash_lang') as Lang) || 'th';
    }
    return 'th';
  });

  const s: Strings = T[lang];

  const TABS = [
    { id: 'personal', label: s.tabs.personal, icon: User },
    { id: 'notifications', label: s.tabs.notifications, icon: Bell },
    { id: 'security', label: s.tabs.security, icon: Shield },
    { id: 'department', label: s.tabs.department, icon: Wrench },
  ] as const;

  type TabId = (typeof TABS)[number]['id'];
  const [tab, setTab] = useState<TabId>('personal');

  const role = profile?.role || 'staff';
  const roleKey = role as keyof Strings['roles'];
  const roleLabel = s.roles[roleKey] || role;
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    'User';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{displayName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium',
                  ROLE_COLORS[role] || ROLE_COLORS.staff,
                )}>
                  {ROLE_DEPT_ICON[role]}
                  {roleLabel}
                </span>
                {hotel?.name && (
                  <span className="text-xs text-muted-foreground">{hotel.name}</span>
                )}
              </div>
            </div>
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shrink-0">
            {(['th', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  localStorage.setItem('maitri_dash_lang', l);
                }}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {l === 'th' ? 'ไทย' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-1 justify-center',
                tab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'personal' && <PersonalTab profile={profile} user={user} s={s} />}
        {tab === 'notifications' && <NotificationsTab profile={profile} s={s} />}
        {tab === 'security' && <SecurityTab s={s} />}
        {tab === 'department' && <DepartmentTab profile={profile} s={s} />}
      </div>
    </div>
  );
}
