'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  Tag, Star, LayoutDashboard, Calendar, CalendarRange, MessageSquare, Users, Bed,
  Sparkles, BarChart3, Receipt, Globe2, UtensilsCrossed, Heart, Award, Megaphone,
  Settings, LogOut, ChevronDown, Building2, Shield, Settings2, Palette, CreditCard,
  Rocket, Zap, MonitorDot, Bell, Wrench, Headphones, ShieldCheck, ClipboardList,
  ListTodo, Clock, HeartHandshake, FileText, MapPin, Monitor, Tv2, Car,
  BriefcaseBusiness, ChefHat, Flower2, ShoppingCart, TrendingUp, Users2, Moon, ContactRound,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { CommandSearch, type CommandSearchItem } from '@/components/layout/command-search';
import {
  MGMT_ROLES, FRONT_ROLES, HK_ROLES, MAINT_ROLES, SEC_ROLES, CON_ROLES,
  ACC_ROLES, HR_ROLES, REV_ROLES, SPA_ROLES, FNB_ROLES, IT_ROLES,
  OPS_STAFF, ALL_STAFF,
} from '@/lib/auth/roles';

interface SidebarProps {
  hotelName: string;
  hotelId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

const OWNER_ROLES = MGMT_ROLES;

const NAV_GROUPS = [
  {
    label: 'ภาพรวม',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Overview', exact: true },
      { href: '/dashboard/live-board', icon: MonitorDot, label: 'Live Board', roles: MGMT_ROLES },
      { href: '/dashboard/inbox', icon: MessageSquare, label: 'Inbox', showUnread: true },
      { href: '/dashboard/ai-concierge', icon: Sparkles, label: 'AI Concierge' },
      { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
      { href: '/dashboard/approvals', icon: CheckSquare, label: 'ศูนย์อนุมัติ', roles: [...MGMT_ROLES, 'front_office_manager', 'accounting_manager', 'hr_manager', 'maintenance_manager', 'purchasing_manager'] },
    ],
  },
  {
    label: 'งานของฉัน',
    items: [
      { href: '/dashboard/my-tasks', icon: ListTodo, label: 'งานของฉัน', roles: OPS_STAFF },
      { href: '/dashboard/work-orders', icon: ClipboardList, label: 'Work Orders', roles: [...MGMT_ROLES, 'front_office_manager', 'housekeeping_manager', 'maintenance_manager', 'fnb_manager', 'security_manager', 'spa_manager', 'front_desk'] },
      { href: '/dashboard/attendance', icon: Clock, label: 'ลงเวลา', roles: ALL_STAFF },
      { href: '/dashboard/leave', icon: CalendarRange, label: 'ลางาน', roles: ALL_STAFF },
      { href: '/dashboard/internal-requests', icon: MessageSquare, label: 'คำร้องภายใน', roles: ALL_STAFF },
      { href: '/dashboard/shift-management', icon: Calendar, label: 'จัดกะงาน', roles: [...MGMT_ROLES, 'hr_manager', 'hr_staff', 'housekeeping_manager', 'maintenance_manager'] },
      { href: '/dashboard/bellboy', icon: BriefcaseBusiness, label: 'Porter', roles: [...MGMT_ROLES, 'concierge', 'bellboy', 'front_office_manager', 'front_desk'] },
      { href: '/dashboard/transport', icon: Car, label: 'Transport', roles: [...MGMT_ROLES, 'concierge', 'transport_driver', 'front_office_manager'] },
    ],
  },
  {
    label: 'การดำเนินงาน',
    items: [
      { href: '/dashboard/front-desk', icon: MonitorDot, label: 'Front Desk', roles: FRONT_ROLES },
      { href: '/dashboard/reservations', icon: Calendar, label: 'การจอง', roles: FRONT_ROLES },
      { href: '/dashboard/group-bookings', icon: Users, label: 'Group Booking', roles: FRONT_ROLES },
      { href: '/dashboard/rooms', icon: Bed, label: 'ห้อง', roles: [...FRONT_ROLES, ...MAINT_ROLES] },
      { href: '/dashboard/guests', icon: Users, label: 'แขก', roles: FRONT_ROLES },
      { href: '/dashboard/guests/blacklist', icon: ShieldCheck, label: 'Blacklist', roles: MGMT_ROLES },
      { href: '/dashboard/housekeeping', icon: Sparkles, label: 'แม่บ้าน', roles: HK_ROLES },
      { href: '/dashboard/maintenance', icon: Wrench, label: 'ซ่อมบำรุง', roles: MAINT_ROLES },
      { href: '/dashboard/concierge', icon: Headphones, label: 'Concierge', roles: CON_ROLES },
      { href: '/dashboard/security', icon: ShieldCheck, label: 'Security', roles: SEC_ROLES },
      { href: '/dashboard/housekeeping/inspect', icon: Sparkles, label: 'ตรวจห้อง', roles: [...MGMT_ROLES, 'housekeeping_manager', 'room_inspector'] },
      { href: '/dashboard/housekeeping/lost-found', icon: Tag, label: 'ของหาย', roles: [...MGMT_ROLES, 'housekeeping_manager', 'housekeeper', 'front_desk'] },
      { href: '/dashboard/housekeeping/laundry', icon: Sparkles, label: 'ผ้า/ซักรีด', roles: [...MGMT_ROLES, 'housekeeping_manager', 'housekeeper'] },
      { href: '/dashboard/maintenance/my-repairs', icon: Wrench, label: 'งานซ่อมของฉัน', roles: [...MGMT_ROLES, 'maintenance_manager', 'technician'] },
      { href: '/dashboard/maintenance/parts', icon: Wrench, label: 'อะไหล่', roles: [...MGMT_ROLES, 'maintenance_manager', 'technician'] },
      { href: '/dashboard/maintenance/pm', icon: Calendar, label: 'PM Schedule', roles: [...MGMT_ROLES, 'maintenance_manager'] },
      { href: '/dashboard/kitchen', icon: ChefHat, label: 'ครัว / KDS', roles: [...MGMT_ROLES, 'fnb_manager', 'kitchen_staff'] },
      { href: '/dashboard/room-service', icon: UtensilsCrossed, label: 'Room Service', roles: [...MGMT_ROLES, 'fnb_manager', 'room_service_staff'] },
      { href: '/dashboard/restaurant', icon: UtensilsCrossed, label: 'Restaurant POS', roles: [...MGMT_ROLES, 'fnb_manager', 'restaurant_staff'] },
    ],
  },
  {
    label: 'F&B',
    items: [
      { href: '/dashboard/fb', icon: UtensilsCrossed, label: 'F&B Overview', roles: FNB_ROLES },
      { href: '/dashboard/fb/orders', icon: ShoppingCart, label: 'Orders', roles: FNB_ROLES },
      { href: '/dashboard/fb/menu', icon: ChefHat, label: 'Menu', roles: [...MGMT_ROLES, 'fnb_manager'] },
    ],
  },
  {
    label: 'Spa & Wellness',
    items: [
      { href: '/dashboard/spa', icon: Flower2, label: 'Spa', roles: SPA_ROLES },
      { href: '/dashboard/spa/bookings', icon: Calendar, label: 'Spa Bookings', roles: SPA_ROLES },
      { href: '/dashboard/spa/services', icon: Heart, label: 'Services', roles: [...MGMT_ROLES, 'spa_manager'] },
    ],
  },
  {
    label: 'การจัดจำหน่าย',
    items: [
      { href: '/dashboard/channels', icon: Globe2, label: 'Channel Manager', roles: REV_ROLES },
      { href: '/dashboard/ota', icon: Globe2, label: 'OTA Sync', roles: REV_ROLES },
      { href: '/dashboard/rates', icon: CalendarRange, label: 'ปฏิทินราคา', roles: REV_ROLES },
      { href: '/dashboard/revenue', icon: TrendingUp, label: 'Revenue', roles: REV_ROLES },
      { href: '/dashboard/marketing', icon: Megaphone, label: 'Marketing', roles: REV_ROLES },
      { href: '/dashboard/marketing/promos', icon: Tag, label: 'โค้ดส่วนลด', roles: REV_ROLES },
      { href: '/dashboard/reviews', icon: Star, label: 'Reviews', roles: REV_ROLES },
      { href: '/dashboard/booking-widget', icon: Globe2, label: 'Booking Widget', roles: MGMT_ROLES },
    ],
  },
  {
    label: 'การเงิน & HR',
    items: [
      { href: '/dashboard/accounting', icon: Receipt, label: 'บัญชี & ภาษี', roles: ACC_ROLES },
      { href: '/dashboard/billing', icon: CreditCard, label: 'Billing', roles: OWNER_ROLES },
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', roles: REV_ROLES },
      { href: '/dashboard/reports', icon: BarChart3, label: 'รายงาน', roles: REV_ROLES },
      { href: '/dashboard/team', icon: Users2, label: 'ทีม & HR', roles: HR_ROLES },
      { href: '/dashboard/loyalty', icon: Award, label: 'Loyalty', roles: REV_ROLES },
    ],
  },
  {
    label: 'GM Tools',
    items: [
      { href: '/dashboard/duty-log', icon: FileText, label: 'Duty Log', roles: MGMT_ROLES },
      { href: '/dashboard/guest-recovery', icon: HeartHandshake, label: 'Guest Recovery', roles: [...MGMT_ROLES, 'guest_relations', 'front_office_manager', 'front_desk'] },
      { href: '/dashboard/night-audit', icon: Moon, label: 'Night Audit', roles: ['hotel_owner','general_manager','operations_manager','accounting_manager','night_auditor'] },
      { href: '/dashboard/crm', icon: ContactRound, label: 'CRM & Loyalty', roles: ['hotel_owner','general_manager','operations_manager','revenue_manager','marketing_staff'] },
      { href: '/dashboard/announcements', icon: Megaphone, label: 'ประกาศ', roles: ALL_STAFF },
      { href: '/dashboard/documents', icon: FileText, label: 'เอกสาร', roles: ALL_STAFF },
      { href: '/dashboard/reports/handover', icon: ClipboardList, label: 'Shift Handover', roles: FRONT_ROLES },
      { href: '/dashboard/accounting-ops', icon: Receipt, label: 'Cashier', roles: ACC_ROLES },
      { href: '/dashboard/purchasing', icon: ShoppingCart, label: 'จัดซื้อ', roles: [...MGMT_ROLES, 'purchasing_manager', 'purchasing_staff', 'accounting_manager'] },
      { href: '/dashboard/it', icon: Monitor, label: 'IT Support', roles: IT_ROLES },
      { href: '/dashboard/hr', icon: Users2, label: 'HR', roles: HR_ROLES },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { href: '/dashboard/compliance/tm30', icon: FileText, label: 'TM30', roles: FRONT_ROLES },
      { href: '/dashboard/compliance/pdpa', icon: Shield, label: 'PDPA', roles: MGMT_ROLES },
      { href: '/dashboard/audit', icon: Shield, label: 'Audit Log', roles: OWNER_ROLES },
    ],
  },
  {
    label: 'IT & ระบบ',
    items: [
      { href: '/dashboard/integrations', icon: Zap, label: 'Integrations', roles: IT_ROLES },
      { href: '/dashboard/system', icon: Settings2, label: 'ระบบ', roles: OWNER_ROLES },
      { href: '/dashboard/automation', icon: Sparkles, label: 'Automation', roles: MGMT_ROLES },
      { href: '/dashboard/setup', icon: Zap, label: 'Service Setup', roles: MGMT_ROLES },
      { href: '/dashboard/go-live', icon: Rocket, label: 'Go-Live', roles: OWNER_ROLES },
    ],
  },
  {
    label: 'ตั้งค่า',
    items: [
      { href: '/dashboard/branding', icon: Palette, label: 'Branding', roles: OWNER_ROLES },
      { href: '/dashboard/localization', icon: Globe2, label: 'Localization', roles: MGMT_ROLES },
      { href: '/dashboard/settings', icon: Settings, label: 'ตั้งค่าทั่วไป', roles: MGMT_ROLES },
    ],
  },
];

export function Sidebar({ hotelName, hotelId, userName, userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    if (!hotelId) return;

    async function loadUnread() {
      const { count } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('hotel_id', hotelId!)
        .gt('unread_count', 0)
        .eq('status', 'open');
      setUnreadCount(count || 0);
    }

    loadUnread();

    const channel = supabase
      .channel(`sidebar-unread-${hotelId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'conversations',
        filter: `hotel_id=eq.${hotelId}`,
      }, loadUnread)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hotelId, supabase]);

  const role = userRole || 'staff';

  function canSee(item: any): boolean {
    if (!item.roles) return true;
    return item.roles.includes(role);
  }

  const visibleGroups = NAV_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(canSee),
  })).filter(g => g.items.length > 0);

  const searchItems: CommandSearchItem[] = visibleGroups.flatMap(g =>
    g.items.map(item => ({
      href: item.href,
      label: item.label,
      group: g.label,
      keywords: item.href.replace('/dashboard/', ''),
    }))
  );

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path d="M4 20V4h4l4 8 4-8h4v16h-3V9l-3 6h-4L7 9v11H4z" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-display text-lg font-medium tracking-tight">Maitri</span>
        </Link>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg hover:bg-secondary transition-colors group">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium truncate flex-1">{hotelName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-3">
        <CommandSearch items={searchItems} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 mb-1 text-2xs uppercase tracking-widest text-muted-foreground/70 font-medium">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = (item as any).exact
                  ? pathname === item.href
                  : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const showBadge = (item as any).showUnread && unreadCount > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors group',
                      isActive
                        ? 'bg-secondary text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-accent')} />
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <span className="text-2xs px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-medium min-w-[1.25rem] text-center tabular-nums">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/dashboard/profile"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors',
            pathname.startsWith('/dashboard/profile') && 'bg-secondary'
          )}
        >
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
            {(userName || userEmail || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{userName || userEmail}</div>
            <div className="text-2xs text-muted-foreground truncate">{role}</div>
          </div>
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        <form action="/api/auth/logout" method="post" className="mt-1">
          <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  );
}
