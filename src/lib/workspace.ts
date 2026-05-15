// ─── Workspace Architecture ────────────────────────────────────────────────────
// กำหนด workspace แต่ละประเภทว่ามี role อะไรบ้างและแสดงอะไร

export type WorkspaceId =
  | 'front_office'
  | 'operations'
  | 'management'
  | 'marketing_web'
  | 'communications'
  | 'kitchen'
  | 'accounting'
  | 'hr'
  | 'security'
  | 'spa'
  | 'it';

export interface WorkspaceConfig {
  id: WorkspaceId;
  label: string;
  labelEn: string;
  icon: string;
  roles: string[];
  primaryNav: string[];   // dashboard page routes
  color: string;
}

export const WORKSPACES: WorkspaceConfig[] = [
  {
    id: 'management',
    label: 'Management',
    labelEn: 'Management',
    icon: 'LayoutDashboard',
    roles: ['hotel_owner', 'owner', 'general_manager', 'operations_manager', 'admin', 'manager'],
    primaryNav: ['/dashboard', '/dashboard/live-board', '/dashboard/reports', '/dashboard/analytics'],
    color: '#6366f1',
  },
  {
    id: 'front_office',
    label: 'Front Office',
    labelEn: 'Front Office',
    icon: 'ConciergeBell',
    roles: ['front_office_manager', 'front_desk', 'receptionist', 'reservation_agent', 'night_auditor'],
    primaryNav: ['/dashboard/front-desk', '/dashboard/reservations', '/dashboard/guests'],
    color: '#0ea5e9',
  },
  {
    id: 'operations',
    label: 'Operations',
    labelEn: 'Operations',
    icon: 'Wrench',
    roles: ['housekeeping_manager', 'housekeeping', 'housekeeper', 'room_inspector',
            'maintenance_manager', 'maintenance', 'technician'],
    primaryNav: ['/dashboard/housekeeping', '/dashboard/maintenance', '/dashboard/work-orders'],
    color: '#f59e0b',
  },
  {
    id: 'communications',
    label: 'Inbox',
    labelEn: 'Communications',
    icon: 'MessageSquare',
    roles: ['chat_admin', 'guest_relations'],
    primaryNav: ['/dashboard/inbox'],
    color: '#10b981',
  },
  {
    id: 'kitchen',
    label: 'Kitchen & F&B',
    labelEn: 'Kitchen & F&B',
    icon: 'ChefHat',
    roles: ['fnb_manager', 'kitchen_staff', 'room_service_staff', 'restaurant_staff'],
    primaryNav: ['/dashboard/kitchen', '/dashboard/room-service', '/dashboard/restaurant'],
    color: '#f43f5e',
  },
  {
    id: 'accounting',
    label: 'บัญชี',
    labelEn: 'Accounting',
    icon: 'Calculator',
    roles: ['accounting_manager', 'accounting', 'accounting_staff', 'night_auditor'],
    primaryNav: ['/dashboard/accounting', '/dashboard/accounting/folio'],
    color: '#8b5cf6',
  },
  {
    id: 'marketing_web',
    label: 'Marketing',
    labelEn: 'Marketing & Website',
    icon: 'Megaphone',
    roles: ['revenue_manager', 'marketing_staff', 'sales'],
    primaryNav: ['/dashboard/marketing', '/dashboard/revenue', '/dashboard/website'],
    color: '#ec4899',
  },
  {
    id: 'hr',
    label: 'HR',
    labelEn: 'Human Resources',
    icon: 'Users',
    roles: ['hr_manager', 'hr_staff'],
    primaryNav: ['/dashboard/hr', '/dashboard/attendance', '/dashboard/shift-management'],
    color: '#14b8a6',
  },
  {
    id: 'security',
    label: 'Security',
    labelEn: 'Security',
    icon: 'ShieldCheck',
    roles: ['security_manager', 'security', 'security_staff'],
    primaryNav: ['/dashboard/security'],
    color: '#64748b',
  },
  {
    id: 'spa',
    label: 'Spa',
    labelEn: 'Spa',
    icon: 'Sparkles',
    roles: ['spa_manager', 'spa_staff'],
    primaryNav: ['/dashboard/spa'],
    color: '#a78bfa',
  },
  {
    id: 'it',
    label: 'IT',
    labelEn: 'IT Support',
    icon: 'Cpu',
    roles: ['it_admin', 'it_support'],
    primaryNav: ['/dashboard/it'],
    color: '#475569',
  },
];

export function getWorkspaceForRole(role: string): WorkspaceConfig | undefined {
  return WORKSPACES.find((ws) => ws.roles.includes(role));
}

export function getWorkspacesForUser(roles: string[]): WorkspaceConfig[] {
  const seen = new Set<WorkspaceId>();
  return WORKSPACES.filter((ws) => {
    if (seen.has(ws.id)) return false;
    if (ws.roles.some((r) => roles.includes(r))) {
      seen.add(ws.id);
      return true;
    }
    return false;
  });
}
