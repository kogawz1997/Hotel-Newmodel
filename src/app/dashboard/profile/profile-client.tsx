'use client';

import { useState, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/components/providers/theme-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { type Locale, LOCALES } from '@/lib/i18n/translations';
import {
  Eye, EyeOff, Check, Save, Sun, Moon, Monitor,
  Bell, Shield, User, Wrench, Palette, Copy,
  AlertCircle, Clock, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  th: {
    title: 'โปรไฟล์ของฉัน',
    save: 'บันทึก',
    saved: 'บันทึกแล้ว',
    saving: 'กำลังบันทึก...',
    cancel: 'ยกเลิก',
    tabs: {
      personal: 'ข้อมูลส่วนตัว',
      appearance: 'การแสดงผล',
      notifications: 'การแจ้งเตือน',
      security: 'ความปลอดภัย',
      department: 'ตั้งค่าแผนก',
    },
    personal: {
      sectionInfo: 'ข้อมูลส่วนตัว',
      sectionWork: 'ข้อมูลการทำงาน',
      firstName: 'ชื่อ',
      lastName: 'นามสกุล',
      email: 'อีเมล',
      emailNote: 'ไม่สามารถเปลี่ยนอีเมลได้',
      phone: 'เบอร์โทรศัพท์',
      language: 'ภาษาที่ต้องการ',
      avatarUrl: 'URL รูปโปรไฟล์',
      avatarUrlHint: 'ใส่ URL รูปภาพที่ต้องการใช้เป็นโปรไฟล์',
      employeeId: 'รหัสพนักงาน',
      role: 'ตำแหน่ง',
      hotel: 'โรงแรม',
      joinDate: 'วันที่เริ่มงาน',
      status: 'สถานะ',
      statusActive: 'ใช้งาน',
      statusInactive: 'ระงับ',
    },
    appearance: {
      sectionTheme: 'ธีม',
      themeLight: 'สว่าง',
      themeDark: 'มืด',
      themeSystem: 'ตามระบบ',
      sectionLang: 'ภาษา',
      langDesc: 'เปลี่ยนภาษาของระบบทั้งหมด',
      sectionDensity: 'ความหนาแน่น',
      densityComfort: 'กว้าง (Comfortable)',
      densityCompact: 'แน่น (Compact)',
      densityDesc: 'ปรับขนาดช่องว่างในหน้าต่างๆ',
    },
    notifications: {
      sectionEvents: 'เหตุการณ์ที่แจ้งเตือน',
      sectionQuiet: 'ชั่วโมงเงียบ (Quiet Hours)',
      quietDesc: 'ไม่ส่งแจ้งเตือนในช่วงเวลานี้',
      quietFrom: 'ตั้งแต่',
      quietTo: 'ถึง',
      quietEnable: 'เปิดใช้ชั่วโมงเงียบ',
      channelEmail: 'อีเมล',
      channelPush: 'Push',
      channelLine: 'LINE',
      lineToken: 'LINE Notify Token',
      lineTokenHint: 'รับ token ได้ที่ notify.line.me',
      events: {
        new_booking: 'การจองใหม่',
        booking_cancelled: 'ยกเลิกการจอง',
        booking_modified: 'แก้ไขการจอง',
        guest_checkin: 'แขก Check-in',
        guest_checkout: 'แขก Check-out',
        message_received: 'ข้อความใหม่จากแขก',
        task_assigned: 'งานที่ได้รับมอบหมาย',
        task_completed: 'งานเสร็จสิ้น',
        shift_reminder: 'เตือนเข้าเวร',
        urgent_alert: 'แจ้งเตือนด่วน',
        payment_received: 'ได้รับชำระเงิน',
        low_occupancy: 'อัตราการเข้าพักต่ำ',
        maintenance_request: 'คำขอซ่อมบำรุงใหม่',
      },
    },
    security: {
      sectionPassword: 'เปลี่ยนรหัสผ่าน',
      currentPassword: 'รหัสผ่านปัจจุบัน',
      newPassword: 'รหัสผ่านใหม่',
      confirmPassword: 'ยืนยันรหัสผ่านใหม่',
      passwordMinLen: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
      passwordMismatch: 'รหัสผ่านไม่ตรงกัน',
      updatePassword: 'อัปเดตรหัสผ่าน',
      passwordUpdated: 'อัปเดตรหัสผ่านสำเร็จ',
      section2fa: 'การยืนยันสองขั้นตอน (2FA)',
      twoFactorDesc: 'เพิ่มความปลอดภัยด้วยรหัส OTP จากแอปยืนยันตัวตน',
      comingSoon: 'เร็วๆ นี้',
      sectionSessions: 'เซสชันที่ใช้งานอยู่',
      currentSession: 'เซสชันปัจจุบัน',
      lastLogin: 'เข้าสู่ระบบล่าสุด',
      logoutAll: 'ออกจากระบบทุกเครื่อง',
      logoutAllConfirm: 'ต้องการออกจากระบบทุกเครื่องใช่หรือไม่?',
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
      staff: 'พนักงานทั่วไป',
      viewer: 'ผู้ดู',
    },
    dept: {
      front_desk: {
        title: 'ตั้งค่าแผนกต้อนรับ',
        defaultView: 'หน้าเริ่มต้น',
        viewFrontDesk: 'Front Desk',
        viewReservations: 'การจอง',
        viewRooms: 'ห้องพัก',
        checkinAlertMin: 'แจ้งเตือนล่วงหน้า Check-in (นาที)',
        guestLang: 'ภาษาหลักที่ใช้กับแขก',
        autoAssignRoom: 'มอบหมายห้องอัตโนมัติเมื่อ Check-in',
        autoAssignRoomDesc: 'ระบบเลือกห้องให้อัตโนมัติถ้ายังไม่ได้กำหนด',
        showGuestNotes: 'แสดงหมายเหตุแขก',
        showGuestNotesDesc: 'แสดงบันทึกพิเศษของแขกที่หน้า Front Desk',
        printOnCheckin: 'พิมพ์ใบยืนยันเมื่อ Check-in',
      },
      housekeeping: {
        title: 'ตั้งค่าแม่บ้าน',
        roomPriority: 'ลำดับความสำคัญ',
        priorityCheckout: 'ห้อง Check-out ก่อน',
        priorityVip: 'ห้อง VIP ก่อน',
        priorityFloor: 'เรียงตามชั้น',
        assignedArea: 'พื้นที่รับผิดชอบ',
        areaAll: 'ทุกพื้นที่',
        areaFloor1: 'ชั้น 1',
        areaFloor2: 'ชั้น 2',
        areaFloor3: 'ชั้น 3+',
        notifyVacated: 'แจ้งเตือนเมื่อห้องว่าง',
        notifyVacatedDesc: 'รับแจ้งทันทีเมื่อแขก Check-out',
        notifySupervisor: 'รายงานหัวหน้าเมื่อเสร็จ',
        notifySupervisorDesc: 'ส่งสถานะให้หัวหน้าหลังทำความสะอาดเสร็จ',
        showPhotoChecklist: 'ถ่ายรูปยืนยันการทำความสะอาด',
        showPhotoChecklistDesc: 'ต้องถ่ายรูปก่อน mark ห้องว่าง',
      },
      maintenance: {
        title: 'ตั้งค่าช่างซ่อมบำรุง',
        notifyNewRequest: 'แจ้งเตือนงานใหม่ทันที',
        notifyNewRequestDesc: 'รับแจ้งเตือนทันทีเมื่อมีคำขอซ่อมใหม่',
        urgencyThreshold: 'ระดับขั้นต่ำที่จะแจ้งเตือนทันที',
        urgencyAll: 'ทุกระดับ',
        urgencyMedium: 'ปานกลางขึ้นไป',
        urgencyHigh: 'สูงขึ้นไป',
        urgencyCritical: 'วิกฤตเท่านั้น',
        preferredArea: 'พื้นที่ที่ถนัด',
        areaAll: 'ทุกพื้นที่',
        areaRooms: 'ห้องพัก',
        areaCommon: 'พื้นที่ส่วนกลาง',
        areaMechanical: 'ระบบไฟฟ้า/ประปา',
        areaPool: 'สระว่ายน้ำ/สวน',
        autoAccept: 'รับงานอัตโนมัติ',
        autoAcceptDesc: 'รับคำขอซ่อมอัตโนมัติตามพื้นที่ที่ถนัด',
        maxConcurrentJobs: 'งานสูงสุดที่รับพร้อมกัน',
      },
      manager: {
        title: 'ตั้งค่าผู้จัดการ',
        defaultDashboard: 'หน้า Dashboard เริ่มต้น',
        dashOverview: 'ภาพรวม',
        dashRevenue: 'รายได้',
        dashOccupancy: 'อัตราการเข้าพัก',
        dailyReportTime: 'เวลาส่งรายงานประจำวัน',
        occupancyAlertPct: 'แจ้งเตือนถ้า Occupancy ต่ำกว่า (%)',
        revenueAlertPct: 'แจ้งเตือนถ้ารายได้ต่ำกว่าเป้า (%)',
        weeklyDigest: 'รับสรุปรายสัปดาห์',
        weeklyDigestDesc: 'ส่งสรุปผลการดำเนินงานทุกวันจันทร์เช้า',
        requireApprovalAbove: 'ต้องขออนุมัติเมื่อส่วนลดเกิน (%)',
      },
      accounting: {
        title: 'ตั้งค่าบัญชี',
        autoInvoice: 'ออกใบแจ้งหนี้อัตโนมัติ',
        autoInvoiceDesc: 'สร้างใบแจ้งหนี้ทันทีเมื่อ Check-out',
        reportingPeriod: 'รอบรายงาน',
        periodMonthly: 'รายเดือน',
        periodWeekly: 'รายสัปดาห์',
        periodDaily: 'รายวัน',
        exportFormat: 'รูปแบบ Export',
        vatReminder: 'เตือนก่อนยื่น VAT',
        vatReminderDesc: 'แจ้งเตือนล่วงหน้า 3 วันก่อนวันยื่น VAT ของทุกเดือน',
        defaultTaxRate: 'อัตราภาษีเริ่มต้น (%)',
        requireReceiptApproval: 'ต้องอนุมัติใบเสร็จก่อนออก',
      },
      concierge: {
        title: 'ตั้งค่าคอนเซียร์จ',
        primaryGuestLang: 'ภาษาหลักที่ใช้กับแขก',
        responseTargetMin: 'เป้าหมายเวลาตอบกลับ (นาที)',
        notifyNewMessage: 'แจ้งเตือนข้อความใหม่ทันที',
        notifyNewMessageDesc: 'แจ้งเตือนทันทีเมื่อแขกส่งข้อความ',
        showGuestHistory: 'แสดงประวัติการเข้าพักของแขก',
        showGuestHistoryDesc: 'ดูประวัติและความชอบของแขกได้ง่าย',
        autoGreet: 'ส่งข้อความต้อนรับอัตโนมัติ',
        autoGreetDesc: 'ส่งข้อความต้อนรับเมื่อแขก Check-in',
      },
      owner: {
        title: 'ตั้งค่าเจ้าของ / ผู้ดูแล',
        defaultDashboard: 'หน้า Dashboard เริ่มต้น',
        dashOverview: 'ภาพรวม',
        dashRevenue: 'รายได้',
        dashAnalytics: 'Analytics',
        dailySummaryTime: 'เวลาส่งสรุปประจำวัน',
        criticalAlerts: 'แจ้งเตือนเหตุการณ์วิกฤตทันที',
        criticalAlertsDesc: 'รับ SMS/LINE เมื่อมีเหตุการณ์สำคัญ',
        weeklyReport: 'รับรายงานรายสัปดาห์',
        weeklyReportDesc: 'สรุปผลทุกวันจันทร์เช้า',
        monthlyReport: 'รับรายงานรายเดือน',
        monthlyReportDesc: 'สรุปผลประจำเดือนทุกวันที่ 1',
        multiPropertyAlert: 'แจ้งเตือนทุกสาขา',
        multiPropertyAlertDesc: 'รับแจ้งเตือนจากทุกโรงแรมในเครือ',
      },
      security: {
        title: 'ตั้งค่ารักษาความปลอดภัย',
        notifyIncident: 'แจ้งเตือนเหตุการณ์ผิดปกติ',
        notifyIncidentDesc: 'รับแจ้งเตือนทันทีเมื่อมีเหตุการณ์',
        shiftReminderMin: 'แจ้งเตือนก่อนเข้าเวร (นาที)',
        autoIncidentReport: 'รายงานเหตุการณ์อัตโนมัติ',
        autoIncidentReportDesc: 'ส่งรายงานให้ผู้จัดการอัตโนมัติ',
        patrolReminderInterval: 'เตือนออกตรวจทุก (นาที)',
      },
      staff: {
        title: 'ตั้งค่าพนักงาน',
        notifyShift: 'แจ้งเตือนก่อนเข้าเวร',
        notifyShiftDesc: 'รับแจ้งเตือนก่อนเวลาเข้าเวร',
        notifyTask: 'แจ้งเตือนงานใหม่',
        notifyTaskDesc: 'รับแจ้งเตือนเมื่อได้รับมอบหมายงาน',
        shiftReminderMin: 'แจ้งเตือนล่วงหน้า (นาที)',
      },
    },
  },
  en: {
    title: 'My Profile',
    save: 'Save',
    saved: 'Saved',
    saving: 'Saving...',
    cancel: 'Cancel',
    tabs: {
      personal: 'Personal Info',
      appearance: 'Appearance',
      notifications: 'Notifications',
      security: 'Security',
      department: 'Dept. Settings',
    },
    personal: {
      sectionInfo: 'Personal Information',
      sectionWork: 'Work Information',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      emailNote: 'Email cannot be changed',
      phone: 'Phone',
      language: 'Preferred Language',
      avatarUrl: 'Profile Picture URL',
      avatarUrlHint: 'Paste an image URL to use as your profile picture',
      employeeId: 'Employee ID',
      role: 'Role',
      hotel: 'Hotel',
      joinDate: 'Join Date',
      status: 'Status',
      statusActive: 'Active',
      statusInactive: 'Inactive',
    },
    appearance: {
      sectionTheme: 'Theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeSystem: 'System',
      sectionLang: 'Language',
      langDesc: 'Change the language across the entire system',
      sectionDensity: 'Density',
      densityComfort: 'Comfortable',
      densityCompact: 'Compact',
      densityDesc: 'Adjust spacing throughout the interface',
    },
    notifications: {
      sectionEvents: 'Notification Events',
      sectionQuiet: 'Quiet Hours',
      quietDesc: 'No notifications during this period',
      quietFrom: 'From',
      quietTo: 'To',
      quietEnable: 'Enable Quiet Hours',
      channelEmail: 'Email',
      channelPush: 'Push',
      channelLine: 'LINE',
      lineToken: 'LINE Notify Token',
      lineTokenHint: 'Get your token at notify.line.me',
      events: {
        new_booking: 'New Booking',
        booking_cancelled: 'Booking Cancelled',
        booking_modified: 'Booking Modified',
        guest_checkin: 'Guest Check-in',
        guest_checkout: 'Guest Check-out',
        message_received: 'New Guest Message',
        task_assigned: 'Task Assigned',
        task_completed: 'Task Completed',
        shift_reminder: 'Shift Reminder',
        urgent_alert: 'Urgent Alert',
        payment_received: 'Payment Received',
        low_occupancy: 'Low Occupancy Alert',
        maintenance_request: 'New Maintenance Request',
      },
    },
    security: {
      sectionPassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      passwordMinLen: 'Password must be at least 8 characters',
      passwordMismatch: 'Passwords do not match',
      updatePassword: 'Update Password',
      passwordUpdated: 'Password updated successfully',
      section2fa: 'Two-Factor Authentication (2FA)',
      twoFactorDesc: 'Add extra security with OTP from an authenticator app',
      comingSoon: 'Coming Soon',
      sectionSessions: 'Active Sessions',
      currentSession: 'Current Session',
      lastLogin: 'Last login',
      logoutAll: 'Sign Out All Devices',
      logoutAllConfirm: 'Sign out from all devices?',
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
        defaultView: 'Default View',
        viewFrontDesk: 'Front Desk',
        viewReservations: 'Reservations',
        viewRooms: 'Rooms',
        checkinAlertMin: 'Check-in Alert Before (minutes)',
        guestLang: 'Primary Guest Language',
        autoAssignRoom: 'Auto-assign Room on Check-in',
        autoAssignRoomDesc: 'System picks a room if none assigned',
        showGuestNotes: 'Show Guest Notes',
        showGuestNotesDesc: 'Display special guest notes on Front Desk view',
        printOnCheckin: 'Print Confirmation on Check-in',
      },
      housekeeping: {
        title: 'Housekeeping Settings',
        roomPriority: 'Room Priority',
        priorityCheckout: 'Check-out Rooms First',
        priorityVip: 'VIP Rooms First',
        priorityFloor: 'By Floor',
        assignedArea: 'Assigned Area',
        areaAll: 'All Areas',
        areaFloor1: 'Floor 1',
        areaFloor2: 'Floor 2',
        areaFloor3: 'Floor 3+',
        notifyVacated: 'Notify When Room Vacated',
        notifyVacatedDesc: 'Instant alert when guest checks out',
        notifySupervisor: 'Report to Supervisor on Completion',
        notifySupervisorDesc: 'Send status to supervisor after cleaning',
        showPhotoChecklist: 'Photo Verification Required',
        showPhotoChecklistDesc: 'Must take photo before marking room clean',
      },
      maintenance: {
        title: 'Maintenance Settings',
        notifyNewRequest: 'Instant Notification for New Requests',
        notifyNewRequestDesc: 'Alert immediately on new maintenance requests',
        urgencyThreshold: 'Minimum Urgency for Instant Alert',
        urgencyAll: 'All requests',
        urgencyMedium: 'Medium and above',
        urgencyHigh: 'High and above',
        urgencyCritical: 'Critical only',
        preferredArea: 'Preferred Work Area',
        areaAll: 'All Areas',
        areaRooms: 'Guest Rooms',
        areaCommon: 'Common Areas',
        areaMechanical: 'Electrical / Plumbing',
        areaPool: 'Pool / Garden',
        autoAccept: 'Auto-accept Assignments',
        autoAcceptDesc: 'Automatically accept jobs in your preferred area',
        maxConcurrentJobs: 'Max Concurrent Jobs',
      },
      manager: {
        title: 'Manager Settings',
        defaultDashboard: 'Default Dashboard',
        dashOverview: 'Overview',
        dashRevenue: 'Revenue',
        dashOccupancy: 'Occupancy',
        dailyReportTime: 'Daily Report Time',
        occupancyAlertPct: 'Alert When Occupancy Below (%)',
        revenueAlertPct: 'Alert When Revenue Below Target (%)',
        weeklyDigest: 'Weekly Digest',
        weeklyDigestDesc: 'Performance summary every Monday morning',
        requireApprovalAbove: 'Require Approval for Discounts Above (%)',
      },
      accounting: {
        title: 'Accounting Settings',
        autoInvoice: 'Auto-generate Invoice',
        autoInvoiceDesc: 'Create invoice automatically on check-out',
        reportingPeriod: 'Reporting Period',
        periodMonthly: 'Monthly',
        periodWeekly: 'Weekly',
        periodDaily: 'Daily',
        exportFormat: 'Export Format',
        vatReminder: 'VAT Filing Reminder',
        vatReminderDesc: '3-day advance notice before monthly VAT filing',
        defaultTaxRate: 'Default Tax Rate (%)',
        requireReceiptApproval: 'Require Receipt Approval Before Issue',
      },
      concierge: {
        title: 'Concierge Settings',
        primaryGuestLang: 'Primary Guest Language',
        responseTargetMin: 'Response Time Target (minutes)',
        notifyNewMessage: 'Instant Message Notification',
        notifyNewMessageDesc: 'Alert immediately when guest sends message',
        showGuestHistory: 'Show Guest History',
        showGuestHistoryDesc: 'Quick access to guest stay history and preferences',
        autoGreet: 'Auto Welcome Message',
        autoGreetDesc: 'Send welcome message when guest checks in',
      },
      owner: {
        title: 'Owner / Admin Settings',
        defaultDashboard: 'Default Dashboard',
        dashOverview: 'Overview',
        dashRevenue: 'Revenue',
        dashAnalytics: 'Analytics',
        dailySummaryTime: 'Daily Summary Time',
        criticalAlerts: 'Instant Critical Alerts',
        criticalAlertsDesc: 'Receive SMS/LINE for critical events',
        weeklyReport: 'Weekly Report',
        weeklyReportDesc: 'Summary every Monday morning',
        monthlyReport: 'Monthly Report',
        monthlyReportDesc: 'Summary on the 1st of every month',
        multiPropertyAlert: 'Multi-property Alerts',
        multiPropertyAlertDesc: 'Receive alerts from all hotels in the group',
      },
      security: {
        title: 'Security Guard Settings',
        notifyIncident: 'Incident Notifications',
        notifyIncidentDesc: 'Alert immediately on reported incidents',
        shiftReminderMin: 'Shift Reminder (minutes before)',
        autoIncidentReport: 'Auto Incident Report',
        autoIncidentReportDesc: 'Automatically send report to manager',
        patrolReminderInterval: 'Patrol Reminder Every (minutes)',
      },
      staff: {
        title: 'Staff Settings',
        notifyShift: 'Shift Reminder',
        notifyShiftDesc: 'Get notified before your shift',
        notifyTask: 'Task Notifications',
        notifyTaskDesc: 'Get notified when assigned a task',
        shiftReminderMin: 'Remind Before Shift (minutes)',
      },
    },
  },
};

type Strings = (typeof T)['th'];

// ─── Notification events per role ─────────────────────────────────────────────

type EventKey = keyof Strings['notifications']['events'];

const ROLE_EVENTS: Record<string, EventKey[]> = {
  owner:        ['new_booking', 'booking_cancelled', 'guest_checkin', 'guest_checkout', 'urgent_alert', 'payment_received', 'low_occupancy'],
  admin:        ['new_booking', 'booking_cancelled', 'guest_checkin', 'guest_checkout', 'message_received', 'urgent_alert', 'payment_received'],
  manager:      ['new_booking', 'booking_cancelled', 'booking_modified', 'guest_checkin', 'guest_checkout', 'urgent_alert', 'low_occupancy'],
  front_desk:   ['new_booking', 'booking_cancelled', 'booking_modified', 'guest_checkin', 'guest_checkout', 'message_received', 'urgent_alert'],
  receptionist: ['new_booking', 'booking_cancelled', 'guest_checkin', 'guest_checkout', 'message_received'],
  housekeeping: ['guest_checkout', 'task_assigned', 'task_completed', 'shift_reminder', 'urgent_alert'],
  concierge:    ['guest_checkin', 'guest_checkout', 'message_received', 'task_assigned'],
  accounting:   ['new_booking', 'booking_cancelled', 'payment_received', 'urgent_alert'],
  maintenance:  ['maintenance_request', 'task_assigned', 'task_completed', 'shift_reminder', 'urgent_alert'],
  security:     ['urgent_alert', 'task_assigned', 'shift_reminder'],
  staff:        ['task_assigned', 'shift_reminder'],
  viewer:       ['urgent_alert'],
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  admin: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  manager: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300',
  front_desk: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300',
  receptionist: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300',
  housekeeping: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  concierge: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300',
  accounting: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
  maintenance: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
  security: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
  staff: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
  viewer: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
};

// ─── Primitives ───────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground mb-4">{children}</h3>;
}

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-shadow outline-none',
        'focus:ring-2 focus:ring-ring focus:ring-offset-1',
        'disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
}

function SelectInput({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-shadow outline-none',
        'focus:ring-2 focus:ring-ring focus:ring-offset-1',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

function Toggle({ checked, onChange, label, description }: {
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
        <span className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        )} />
      </button>
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
    </div>
  );
}

function SaveButton({ saving, saved, onClick, label }: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        saved
          ? 'bg-green-500/10 text-green-600 border border-green-500/20'
          : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
        saving && 'opacity-60 cursor-not-allowed',
      )}
    >
      {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
      {saved ? label : saving ? '...' : label}
    </button>
  );
}

function useSave() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async (fn: () => Promise<void>) => {
    setSaving(true);
    setError('');
    try {
      await fn();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, saved, error, run };
}

// ─── Tab: Personal ────────────────────────────────────────────────────────────

function PersonalTab({ profile, user, hotel, s, setLocale }: {
  profile: any; user: any; hotel: any; s: Strings;
  setLocale: (l: Locale) => void;
}) {
  const supabase = createClient();
  const { saving, saved, error, run } = useSave();

  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    last_name:  profile?.last_name  || '',
    phone:      profile?.phone      || '',
    language:   (profile?.language  || 'th') as Locale,
    avatar_url: profile?.avatar_url || '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = () => run(async () => {
    const full_name = [form.first_name, form.last_name].filter(Boolean).join(' ');
    const { error: err } = await supabase.from('user_profiles').update({
      first_name: form.first_name || null,
      last_name:  form.last_name  || null,
      full_name:  full_name       || null,
      phone:      form.phone      || null,
      language:   form.language,
      avatar_url: form.avatar_url || null,
    }).eq('id', user.id);
    if (err) throw new Error(err.message);
    setLocale(form.language);
    localStorage.setItem('maitri-locale', form.language);
  });

  const employeeId = `EMP-${(profile?.id || '').slice(0, 6).toUpperCase()}`;
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    : '-';

  const avatarSrc = form.avatar_url || null;
  const displayName = [form.first_name, form.last_name].filter(Boolean).join(' ') || user?.email || 'U';

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>{s.personal.sectionInfo}</SectionTitle>

        {/* Avatar preview */}
        <div className="flex items-center gap-4 mb-5">
          <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold shrink-0 overflow-hidden border-2 border-border">
            {avatarSrc
              ? <NextImage src={avatarSrc} alt="avatar" fill className="object-cover" unoptimized />
              : displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <Field label={s.personal.avatarUrl} hint={s.personal.avatarUrlHint}>
              <TextInput
                value={form.avatar_url}
                onChange={set('avatar_url')}
                placeholder="https://example.com/avatar.jpg"
                type="url"
              />
            </Field>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={s.personal.firstName}>
            <TextInput value={form.first_name} onChange={set('first_name')} placeholder={s.personal.firstName} />
          </Field>
          <Field label={s.personal.lastName}>
            <TextInput value={form.last_name} onChange={set('last_name')} placeholder={s.personal.lastName} />
          </Field>
          <Field label={s.personal.email} hint={s.personal.emailNote}>
            <TextInput value={user?.email || ''} disabled />
          </Field>
          <Field label={s.personal.phone}>
            <TextInput value={form.phone} onChange={set('phone')} placeholder="+66 8X XXX XXXX" type="tel" />
          </Field>
          <Field label={s.personal.language}>
            <SelectInput value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value as Locale }))}>
              {(Object.entries(LOCALES) as [Locale, { label: string; flag: string }][]).map(([code, info]) => (
                <option key={code} value={code}>{info.flag} {info.label}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
        <div className="flex justify-end pt-1">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} label={s.save} />
        </div>
      </Card>

      {/* Read-only work info */}
      <Card>
        <SectionTitle>{s.personal.sectionWork}</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            [s.personal.employeeId, employeeId],
            [s.personal.role, s.roles[(profile?.role || 'staff') as keyof Strings['roles']] || profile?.role],
            [s.personal.hotel, hotel?.name || '-'],
            [s.personal.joinDate, joinDate],
            [s.personal.status, profile?.active !== false ? s.personal.statusActive : s.personal.statusInactive],
          ].map(([label, value]) => (
            <div key={label} className="space-y-0.5">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-sm font-medium text-foreground">{value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Appearance ──────────────────────────────────────────────────────────

function AppearanceTab({ profile, user, s, theme, setTheme, locale, setLocale }: {
  profile: any; user: any; s: Strings;
  theme: string; setTheme: (t: 'light' | 'dark' | 'system') => void;
  locale: Locale; setLocale: (l: Locale) => void;
}) {
  const supabase = createClient();
  const { saving, saved, error, run } = useSave();

  const [density, setDensity] = useState<'comfortable' | 'compact'>(
    profile?.appearance_prefs?.density || 'comfortable'
  );

  const handleSave = () => run(async () => {
    const prefs = { theme, density, locale };
    const { error: err } = await supabase.from('user_profiles').update({
      appearance_prefs: prefs,
      language: locale,
    }).eq('id', user.id);
    if (err) throw new Error(err.message);
    localStorage.setItem('maitri-locale', locale);
    localStorage.setItem('maitri-density', density);
  });

  const themeOptions: { id: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }[] = [
    { id: 'light',  label: s.appearance.themeLight,  icon: <Sun className="h-4 w-4" /> },
    { id: 'dark',   label: s.appearance.themeDark,   icon: <Moon className="h-4 w-4" /> },
    { id: 'system', label: s.appearance.themeSystem, icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>{s.appearance.sectionTheme}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium',
                theme === id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>{s.appearance.sectionLang}</SectionTitle>
        <p className="text-xs text-muted-foreground mb-3">{s.appearance.langDesc}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(LOCALES) as [Locale, { label: string; flag: string }][]).map(([code, info]) => (
            <button
              key={code}
              onClick={() => { setLocale(code); localStorage.setItem('maitri-locale', code); }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                locale === code
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              <span>{info.flag}</span>
              <span className="truncate">{info.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>{s.appearance.sectionDensity}</SectionTitle>
        <p className="text-xs text-muted-foreground mb-3">{s.appearance.densityDesc}</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['comfortable', s.appearance.densityComfort],
            ['compact',     s.appearance.densityCompact],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setDensity(id)}
              className={cn(
                'p-3 rounded-xl border-2 transition-all text-sm font-medium',
                density === id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <div className="flex justify-end mt-4">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} label={s.save} />
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────

type NotifPrefs = {
  events: Record<string, { email: boolean; push: boolean; line: boolean }>;
  quiet_hours_enabled: boolean;
  quiet_from: string;
  quiet_to: string;
  line_token: string;
};

function NotificationsTab({ profile, user, s }: { profile: any; user: any; s: Strings }) {
  const supabase = createClient();
  const { saving, saved, error, run } = useSave();

  const role = profile?.role || 'staff';
  const events = ROLE_EVENTS[role] ?? ROLE_EVENTS.staff;

  const stored: Partial<NotifPrefs> = profile?.notification_prefs ?? {};

  const defaultEvents: Record<string, { email: boolean; push: boolean; line: boolean }> = {};
  for (const ev of events) {
    defaultEvents[ev] = { email: true, push: true, line: false };
  }

  const [prefs, setPrefs] = useState<NotifPrefs>({
    events: { ...defaultEvents, ...(stored.events ?? {}) },
    quiet_hours_enabled: stored.quiet_hours_enabled ?? false,
    quiet_from: stored.quiet_from ?? '22:00',
    quiet_to:   stored.quiet_to   ?? '07:00',
    line_token: stored.line_token  ?? '',
  });

  const toggleChannel = (ev: string, ch: 'email' | 'push' | 'line') => {
    setPrefs((p) => ({
      ...p,
      events: {
        ...p.events,
        [ev]: { ...p.events[ev], [ch]: !(p.events[ev]?.[ch] ?? false) },
      },
    }));
  };

  const handleSave = () => run(async () => {
    const { error: err } = await supabase.from('user_profiles').update({
      notification_prefs: prefs,
    }).eq('id', user.id);
    if (err) throw new Error(err.message);
  });

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>{s.notifications.sectionEvents}</SectionTitle>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-medium text-muted-foreground py-2 pr-4 min-w-[160px]">เหตุการณ์</th>
                {(['email', 'push', 'line'] as const).map((ch) => {
                  const chLabels = { email: s.notifications.channelEmail, push: s.notifications.channelPush, line: s.notifications.channelLine };
                  return (
                    <th key={ch} className="text-center font-medium text-muted-foreground py-2 px-3 w-16">
                      {chLabels[ch]}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((ev) => (
                <tr key={ev} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-2.5 pr-4 text-foreground">{s.notifications.events[ev]}</td>
                  {(['email', 'push', 'line'] as const).map((ch) => (
                    <td key={ch} className="text-center py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={prefs.events[ev]?.[ch] ?? false}
                        onChange={() => toggleChannel(ev, ch)}
                        className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle>{s.notifications.sectionQuiet}</SectionTitle>
        <Toggle
          checked={prefs.quiet_hours_enabled}
          onChange={(v) => setPrefs((p) => ({ ...p, quiet_hours_enabled: v }))}
          label={s.notifications.quietEnable}
          description={s.notifications.quietDesc}
        />
        {prefs.quiet_hours_enabled && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label={s.notifications.quietFrom}>
              <TextInput type="time" value={prefs.quiet_from}
                onChange={(e) => setPrefs((p) => ({ ...p, quiet_from: e.target.value }))} />
            </Field>
            <Field label={s.notifications.quietTo}>
              <TextInput type="time" value={prefs.quiet_to}
                onChange={(e) => setPrefs((p) => ({ ...p, quiet_to: e.target.value }))} />
            </Field>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>{s.notifications.lineToken}</SectionTitle>
        <Field label={s.notifications.lineToken} hint={s.notifications.lineTokenHint}>
          <TextInput
            value={prefs.line_token}
            onChange={(e) => setPrefs((p) => ({ ...p, line_token: e.target.value }))}
            placeholder="LINE Notify Token"
            type="password"
          />
        </Field>
        {error && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
        <div className="flex justify-end mt-4">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} label={s.save} />
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Security ────────────────────────────────────────────────────────────

function SecurityTab({ profile, s }: { profile: any; s: Strings }) {
  const supabase = createClient();
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [pwdStatus, setPwdStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pwdErr, setPwdErr] = useState('');
  const [copied, setCopied] = useState(false);

  const handleUpdatePwd = async () => {
    if (pwd.next.length < 8) { setPwdErr(s.security.passwordMinLen); return; }
    if (pwd.next !== pwd.confirm) { setPwdErr(s.security.passwordMismatch); return; }
    setPwdErr('');
    setPwdStatus('saving');
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    if (error) { setPwdErr(error.message); setPwdStatus('error'); return; }
    setPwdStatus('saved');
    setPwd({ current: '', next: '', confirm: '' });
    setTimeout(() => setPwdStatus('idle'), 3000);
  };

  const handleLogoutAll = async () => {
    if (!window.confirm(s.security.logoutAllConfirm)) return;
    await supabase.auth.signOut({ scope: 'global' });
    window.location.href = '/login';
  };

  const lastLogin = profile?.last_login_at
    ? new Date(profile.last_login_at).toLocaleString('th-TH')
    : '-';

  const eyeBtn = (field: 'current' | 'next' | 'confirm') => (
    <button type="button"
      onClick={() => setShow((s) => ({ ...s, [field]: !s[field] }))}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
    >
      {show[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Password */}
      <Card>
        <SectionTitle>{s.security.sectionPassword}</SectionTitle>
        <div className="space-y-3 max-w-sm">
          {(['current', 'next', 'confirm'] as const).map((field) => {
            const labels = { current: s.security.currentPassword, next: s.security.newPassword, confirm: s.security.confirmPassword };
            return (
              <Field key={field} label={labels[field]}>
                <div className="relative">
                  <TextInput
                    type={show[field] ? 'text' : 'password'}
                    value={pwd[field]}
                    onChange={(e) => setPwd((p) => ({ ...p, [field]: e.target.value }))}
                    className="pr-10"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdatePwd(); }}
                  />
                  {eyeBtn(field)}
                </div>
              </Field>
            );
          })}
          {pwdErr && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{pwdErr}</p>}
          {pwdStatus === 'saved' && <p className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3.5 w-3.5" />{s.security.passwordUpdated}</p>}
          <button
            onClick={handleUpdatePwd}
            disabled={pwdStatus === 'saving'}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {pwdStatus === 'saving' ? s.saving : s.security.updatePassword}
          </button>
        </div>
      </Card>

      {/* 2FA */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionTitle>{s.security.section2fa}</SectionTitle>
            <p className="text-sm text-muted-foreground -mt-2">{s.security.twoFactorDesc}</p>
          </div>
          <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground font-medium">
            {s.security.comingSoon}
          </span>
        </div>
      </Card>

      {/* Sessions */}
      <Card>
        <SectionTitle>{s.security.sectionSessions}</SectionTitle>
        <div className="rounded-lg border border-border bg-secondary/30 p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
              {s.security.currentSession}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {s.security.lastLogin}: {lastLogin}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <button
          onClick={handleLogoutAll}
          className="mt-3 text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          {s.security.logoutAll}
        </button>
      </Card>
    </div>
  );
}

// ─── Tab: Department ──────────────────────────────────────────────────────────

function DepartmentTab({ profile, user, s }: { profile: any; user: any; s: Strings }) {
  const supabase = createClient();
  const { saving, saved, error, run } = useSave();
  const role: string = profile?.role || 'staff';

  const [prefs, setPrefs] = useState<Record<string, unknown>>(profile?.dept_prefs ?? {});

  const set = (k: string, v: unknown) => setPrefs((p) => ({ ...p, [k]: v }));
  const get = <T,>(k: string, fallback: T): T => (prefs[k] as T) ?? fallback;

  const handleSave = () => run(async () => {
    const { error: err } = await supabase.from('user_profiles').update({
      dept_prefs: prefs,
    }).eq('id', user.id);
    if (err) throw new Error(err.message);
  });

  const langOptions = [
    { value: 'th', label: 'ภาษาไทย' },
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
  ];

  const body = () => {
    if (role === 'front_desk' || role === 'receptionist') {
      const d = s.dept.front_desk;
      return (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={d.defaultView}>
              <SelectInput value={get('default_view', 'front-desk')} onChange={(e) => set('default_view', e.target.value)}>
                <option value="front-desk">{d.viewFrontDesk}</option>
                <option value="reservations">{d.viewReservations}</option>
                <option value="rooms">{d.viewRooms}</option>
              </SelectInput>
            </Field>
            <Field label={d.checkinAlertMin}>
              <SelectInput value={get('checkin_alert_min', '30')} onChange={(e) => set('checkin_alert_min', e.target.value)}>
                {[10, 15, 30, 45, 60].map((n) => <option key={n} value={String(n)}>{n} นาที</option>)}
              </SelectInput>
            </Field>
            <Field label={d.guestLang}>
              <SelectInput value={get('guest_lang', 'th')} onChange={(e) => set('guest_lang', e.target.value)}>
                {langOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </SelectInput>
            </Field>
          </div>
          <div className="space-y-3 mt-4">
            <Toggle checked={get('auto_assign_room', false)} onChange={(v) => set('auto_assign_room', v)} label={d.autoAssignRoom} description={d.autoAssignRoomDesc} />
            <Toggle checked={get('show_guest_notes', true)} onChange={(v) => set('show_guest_notes', v)} label={d.showGuestNotes} description={d.showGuestNotesDesc} />
            <Toggle checked={get('print_on_checkin', false)} onChange={(v) => set('print_on_checkin', v)} label={d.printOnCheckin} />
          </div>
        </>
      );
    }

    if (role === 'housekeeping') {
      const d = s.dept.housekeeping;
      return (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={d.roomPriority}>
              <SelectInput value={get('room_priority', 'checkout')} onChange={(e) => set('room_priority', e.target.value)}>
                <option value="checkout">{d.priorityCheckout}</option>
                <option value="vip">{d.priorityVip}</option>
                <option value="floor">{d.priorityFloor}</option>
              </SelectInput>
            </Field>
            <Field label={d.assignedArea}>
              <SelectInput value={get('assigned_area', 'all')} onChange={(e) => set('assigned_area', e.target.value)}>
                <option value="all">{d.areaAll}</option>
                <option value="floor1">{d.areaFloor1}</option>
                <option value="floor2">{d.areaFloor2}</option>
                <option value="floor3">{d.areaFloor3}</option>
              </SelectInput>
            </Field>
          </div>
          <div className="space-y-3 mt-4">
            <Toggle checked={get('notify_vacated', true)} onChange={(v) => set('notify_vacated', v)} label={d.notifyVacated} description={d.notifyVacatedDesc} />
            <Toggle checked={get('notify_supervisor', false)} onChange={(v) => set('notify_supervisor', v)} label={d.notifySupervisor} description={d.notifySupervisorDesc} />
            <Toggle checked={get('photo_checklist', false)} onChange={(v) => set('photo_checklist', v)} label={d.showPhotoChecklist} description={d.showPhotoChecklistDesc} />
          </div>
        </>
      );
    }

    if (role === 'maintenance') {
      const d = s.dept.maintenance;
      return (
        <>
          <div className="space-y-3">
            <Toggle checked={get('notify_new', true)} onChange={(v) => set('notify_new', v)} label={d.notifyNewRequest} description={d.notifyNewRequestDesc} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label={d.urgencyThreshold}>
              <SelectInput value={get('urgency_threshold', 'medium')} onChange={(e) => set('urgency_threshold', e.target.value)}>
                <option value="all">{d.urgencyAll}</option>
                <option value="medium">{d.urgencyMedium}</option>
                <option value="high">{d.urgencyHigh}</option>
                <option value="critical">{d.urgencyCritical}</option>
              </SelectInput>
            </Field>
            <Field label={d.preferredArea}>
              <SelectInput value={get('preferred_area', 'all')} onChange={(e) => set('preferred_area', e.target.value)}>
                <option value="all">{d.areaAll}</option>
                <option value="rooms">{d.areaRooms}</option>
                <option value="common">{d.areaCommon}</option>
                <option value="mechanical">{d.areaMechanical}</option>
                <option value="pool">{d.areaPool}</option>
              </SelectInput>
            </Field>
            <Field label={d.maxConcurrentJobs}>
              <SelectInput value={get('max_jobs', '3')} onChange={(e) => set('max_jobs', e.target.value)}>
                {[1, 2, 3, 5, 10].map((n) => <option key={n} value={String(n)}>{n}</option>)}
              </SelectInput>
            </Field>
          </div>
          <div className="space-y-3 mt-4">
            <Toggle checked={get('auto_accept', false)} onChange={(v) => set('auto_accept', v)} label={d.autoAccept} description={d.autoAcceptDesc} />
          </div>
        </>
      );
    }

    if (role === 'manager') {
      const d = s.dept.manager;
      return (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={d.defaultDashboard}>
              <SelectInput value={get('default_dashboard', 'overview')} onChange={(e) => set('default_dashboard', e.target.value)}>
                <option value="overview">{d.dashOverview}</option>
                <option value="revenue">{d.dashRevenue}</option>
                <option value="occupancy">{d.dashOccupancy}</option>
              </SelectInput>
            </Field>
            <Field label={d.dailyReportTime}>
              <TextInput type="time" value={get('daily_report_time', '08:00')} onChange={(e) => set('daily_report_time', e.target.value)} />
            </Field>
            <Field label={d.occupancyAlertPct}>
              <TextInput type="number" min={0} max={100} value={get('occupancy_alert_pct', 60)} onChange={(e) => set('occupancy_alert_pct', Number(e.target.value))} />
            </Field>
            <Field label={d.revenueAlertPct}>
              <TextInput type="number" min={0} max={100} value={get('revenue_alert_pct', 80)} onChange={(e) => set('revenue_alert_pct', Number(e.target.value))} />
            </Field>
            <Field label={d.requireApprovalAbove}>
              <TextInput type="number" min={0} max={100} value={get('require_approval_pct', 20)} onChange={(e) => set('require_approval_pct', Number(e.target.value))} />
            </Field>
          </div>
          <div className="space-y-3 mt-4">
            <Toggle checked={get('weekly_digest', true)} onChange={(v) => set('weekly_digest', v)} label={d.weeklyDigest} description={d.weeklyDigestDesc} />
          </div>
        </>
      );
    }

    if (role === 'accounting') {
      const d = s.dept.accounting;
      return (
        <>
          <div className="space-y-3">
            <Toggle checked={get('auto_invoice', true)} onChange={(v) => set('auto_invoice', v)} label={d.autoInvoice} description={d.autoInvoiceDesc} />
            <Toggle checked={get('vat_reminder', true)} onChange={(v) => set('vat_reminder', v)} label={d.vatReminder} description={d.vatReminderDesc} />
            <Toggle checked={get('require_receipt_approval', false)} onChange={(v) => set('require_receipt_approval', v)} label={d.requireReceiptApproval} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label={d.reportingPeriod}>
              <SelectInput value={get('reporting_period', 'monthly')} onChange={(e) => set('reporting_period', e.target.value)}>
                <option value="monthly">{d.periodMonthly}</option>
                <option value="weekly">{d.periodWeekly}</option>
                <option value="daily">{d.periodDaily}</option>
              </SelectInput>
            </Field>
            <Field label={d.exportFormat}>
              <SelectInput value={get('export_format', 'pdf')} onChange={(e) => set('export_format', e.target.value)}>
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
              </SelectInput>
            </Field>
            <Field label={d.defaultTaxRate}>
              <TextInput type="number" min={0} max={100} step={0.1} value={get('default_tax_rate', 7)} onChange={(e) => set('default_tax_rate', Number(e.target.value))} />
            </Field>
          </div>
        </>
      );
    }

    if (role === 'concierge') {
      const d = s.dept.concierge;
      return (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={d.primaryGuestLang}>
              <SelectInput value={get('primary_guest_lang', 'th')} onChange={(e) => set('primary_guest_lang', e.target.value)}>
                {langOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </SelectInput>
            </Field>
            <Field label={d.responseTargetMin}>
              <SelectInput value={get('response_target_min', '5')} onChange={(e) => set('response_target_min', e.target.value)}>
                {[2, 5, 10, 15, 30].map((n) => <option key={n} value={String(n)}>{n} นาที</option>)}
              </SelectInput>
            </Field>
          </div>
          <div className="space-y-3 mt-4">
            <Toggle checked={get('notify_message', true)} onChange={(v) => set('notify_message', v)} label={d.notifyNewMessage} description={d.notifyNewMessageDesc} />
            <Toggle checked={get('show_guest_history', true)} onChange={(v) => set('show_guest_history', v)} label={d.showGuestHistory} description={d.showGuestHistoryDesc} />
            <Toggle checked={get('auto_greet', false)} onChange={(v) => set('auto_greet', v)} label={d.autoGreet} description={d.autoGreetDesc} />
          </div>
        </>
      );
    }

    if (role === 'owner' || role === 'admin') {
      const d = s.dept.owner;
      return (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={d.defaultDashboard}>
              <SelectInput value={get('default_dashboard', 'overview')} onChange={(e) => set('default_dashboard', e.target.value)}>
                <option value="overview">{d.dashOverview}</option>
                <option value="revenue">{d.dashRevenue}</option>
                <option value="analytics">{d.dashAnalytics}</option>
              </SelectInput>
            </Field>
            <Field label={d.dailySummaryTime}>
              <TextInput type="time" value={get('daily_summary_time', '07:00')} onChange={(e) => set('daily_summary_time', e.target.value)} />
            </Field>
          </div>
          <div className="space-y-3 mt-4">
            <Toggle checked={get('critical_alerts', true)} onChange={(v) => set('critical_alerts', v)} label={d.criticalAlerts} description={d.criticalAlertsDesc} />
            <Toggle checked={get('weekly_report', true)} onChange={(v) => set('weekly_report', v)} label={d.weeklyReport} description={d.weeklyReportDesc} />
            <Toggle checked={get('monthly_report', true)} onChange={(v) => set('monthly_report', v)} label={d.monthlyReport} description={d.monthlyReportDesc} />
            <Toggle checked={get('multi_property_alert', false)} onChange={(v) => set('multi_property_alert', v)} label={d.multiPropertyAlert} description={d.multiPropertyAlertDesc} />
          </div>
        </>
      );
    }

    if (role === 'security') {
      const d = s.dept.security;
      return (
        <>
          <div className="space-y-3">
            <Toggle checked={get('notify_incident', true)} onChange={(v) => set('notify_incident', v)} label={d.notifyIncident} description={d.notifyIncidentDesc} />
            <Toggle checked={get('auto_incident_report', false)} onChange={(v) => set('auto_incident_report', v)} label={d.autoIncidentReport} description={d.autoIncidentReportDesc} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field label={d.shiftReminderMin}>
              <SelectInput value={get('shift_reminder_min', '30')} onChange={(e) => set('shift_reminder_min', e.target.value)}>
                {[10, 15, 30, 45, 60].map((n) => <option key={n} value={String(n)}>{n} นาที</option>)}
              </SelectInput>
            </Field>
            <Field label={d.patrolReminderInterval}>
              <SelectInput value={get('patrol_interval_min', '60')} onChange={(e) => set('patrol_interval_min', e.target.value)}>
                {[30, 60, 90, 120].map((n) => <option key={n} value={String(n)}>{n} นาที</option>)}
              </SelectInput>
            </Field>
          </div>
        </>
      );
    }

    // viewer / staff / fallback
    const d = s.dept.staff;
    return (
      <>
        <div className="space-y-3">
          <Toggle checked={get('notify_shift', true)} onChange={(v) => set('notify_shift', v)} label={d.notifyShift} description={d.notifyShiftDesc} />
          <Toggle checked={get('notify_task', true)} onChange={(v) => set('notify_task', v)} label={d.notifyTask} description={d.notifyTaskDesc} />
        </div>
        <div className="mt-4">
          <Field label={d.shiftReminderMin}>
            <SelectInput value={get('shift_reminder_min', '30')} onChange={(e) => set('shift_reminder_min', e.target.value)}>
              {[10, 15, 30, 45, 60].map((n) => <option key={n} value={String(n)}>{n} นาที</option>)}
            </SelectInput>
          </Field>
        </div>
      </>
    );
  };

  const deptTitles: Record<string, keyof Strings['dept']> = {
    front_desk: 'front_desk', receptionist: 'front_desk',
    housekeeping: 'housekeeping', maintenance: 'maintenance',
    manager: 'manager', accounting: 'accounting',
    concierge: 'concierge', owner: 'owner', admin: 'owner',
    security: 'security',
  };
  const deptKey = deptTitles[role] || 'staff';
  const title = (s.dept[deptKey] as { title: string }).title;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>{title}</SectionTitle>
        {body()}
        {error && <p className="text-xs text-red-500 mt-3 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
        <div className="flex justify-end mt-4">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} label={s.save} />
        </div>
      </Card>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function ProfileClient({ profile, user, hotel }: {
  profile: any;
  user: any;
  hotel: any;
}) {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();

  const s: Strings = locale === 'th' ? T.th : T.en;

  const TABS = [
    { id: 'personal',     label: s.tabs.personal,      icon: User },
    { id: 'appearance',   label: s.tabs.appearance,    icon: Palette },
    { id: 'notifications',label: s.tabs.notifications, icon: Bell },
    { id: 'security',     label: s.tabs.security,      icon: Shield },
    { id: 'department',   label: s.tabs.department,    icon: Wrench },
  ] as const;

  type TabId = (typeof TABS)[number]['id'];
  const [tab, setTab] = useState<TabId>('personal');

  const role = profile?.role || 'staff';
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.full_name ||
    user?.email ||
    'User';
  const avatarSrc = profile?.avatar_url || null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold shrink-0 overflow-hidden border-2 border-border">
            {avatarSrc
              ? <NextImage src={avatarSrc} alt="" fill className="object-cover" unoptimized />
              : displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-foreground truncate">{displayName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={cn(
                'inline-flex items-center text-xs px-2.5 py-0.5 rounded-full border font-medium',
                ROLE_COLORS[role] || ROLE_COLORS.staff,
              )}>
                {s.roles[role as keyof Strings['roles']] || role}
              </span>
              {hotel?.name && <span className="text-xs text-muted-foreground">{hotel.name}</span>}
            </div>
          </div>
        </div>

        {/* Tab bar — scrollable on mobile */}
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1 overflow-x-auto no-scrollbar">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-1 justify-center min-w-fit',
                tab === id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'personal'      && <PersonalTab profile={profile} user={user} hotel={hotel} s={s} setLocale={setLocale} />}
        {tab === 'appearance'    && <AppearanceTab profile={profile} user={user} s={s} theme={theme} setTheme={setTheme} locale={locale} setLocale={setLocale} />}
        {tab === 'notifications' && <NotificationsTab profile={profile} user={user} s={s} />}
        {tab === 'security'      && <SecurityTab profile={profile} s={s} />}
        {tab === 'department'    && <DepartmentTab profile={profile} user={user} s={s} />}
      </div>
    </div>
  );
}
