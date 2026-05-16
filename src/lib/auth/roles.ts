/**
 * Single source of truth for all roles, permissions, and role-based behavior.
 * All guards, middleware, sidebar, and API routes must import from here.
 */

// ─── Role Type ────────────────────────────────────────────────────────────────

export const ALL_ROLES = [
  // Core
  'owner', 'admin', 'manager', 'staff', 'viewer',
  // Executive
  'hotel_owner', 'general_manager', 'operations_manager',
  // Front Office
  'front_office_manager', 'front_desk', 'receptionist', 'reservation_agent', 'night_auditor',
  // Communications
  'chat_admin', 'guest_relations',
  // Housekeeping
  'housekeeping_manager', 'housekeeping', 'housekeeper', 'room_inspector',
  // Maintenance / Engineering
  'maintenance_manager', 'maintenance', 'technician', 'engineering',
  // F&B
  'fnb_manager', 'kitchen_staff', 'room_service_staff', 'restaurant_staff',
  // Guest Services
  'concierge', 'bellboy', 'transport_driver',
  // Revenue & Marketing
  'revenue_manager', 'marketing_staff', 'sales',
  // Accounting
  'accounting_manager', 'accounting', 'accounting_staff',
  // Purchasing
  'purchasing_manager', 'purchasing_staff', 'purchasing',
  // HR
  'hr_manager', 'hr_staff',
  // Spa
  'spa_manager', 'spa_staff',
  // Security
  'security_manager', 'security', 'security_staff',
  // IT
  'it_admin', 'it_support',
  // Platform (SaaS internal)
  'platform_owner', 'billing_admin', 'support_admin', 'platform_ops',
  'security_admin', 'sales_admin', 'product_admin', 'dev_admin',
  // Generic
  'dept_head', 'shift_supervisor',
] as const;

export type StaffRole = typeof ALL_ROLES[number];

// ─── Role Groups ──────────────────────────────────────────────────────────────

/** Platform-level SaaS admins */
export const PLATFORM_ROLES: StaffRole[] = [
  'platform_owner', 'billing_admin', 'support_admin', 'platform_ops',
  'security_admin', 'sales_admin', 'product_admin', 'dev_admin',
];

/** Hotel top management (can see everything in their org) */
export const MGMT_ROLES: StaffRole[] = [
  'owner', 'admin', 'manager',
  'hotel_owner', 'general_manager', 'operations_manager',
];

/** Front office team */
export const FRONT_ROLES: StaffRole[] = [
  ...MGMT_ROLES,
  'front_office_manager', 'front_desk', 'receptionist', 'reservation_agent', 'night_auditor',
];

/** Housekeeping team */
export const HK_ROLES: StaffRole[] = [
  ...MGMT_ROLES,
  'housekeeping_manager', 'housekeeping', 'housekeeper', 'room_inspector',
];

/** Maintenance / engineering team */
export const MAINT_ROLES: StaffRole[] = [
  ...MGMT_ROLES,
  'maintenance_manager', 'maintenance', 'technician', 'engineering',
];

/** Security team */
export const SEC_ROLES: StaffRole[] = [
  ...MGMT_ROLES,
  'security_manager', 'security', 'security_staff',
];

/** Concierge / guest services team */
export const CON_ROLES: StaffRole[] = [
  ...MGMT_ROLES,
  'concierge', 'guest_relations', 'bellboy', 'transport_driver', 'chat_admin',
];

/** Accounting team */
export const ACC_ROLES: StaffRole[] = [
  ...MGMT_ROLES,
  'accounting_manager', 'accounting', 'accounting_staff',
];

/** HR team */
export const HR_ROLES: StaffRole[] = [
  ...MGMT_ROLES,
  'hr_manager', 'hr_staff',
];

/** Revenue & marketing team */
export const REV_ROLES: StaffRole[] = [
  ...MGMT_ROLES,
  'revenue_manager', 'marketing_staff', 'sales',
];

/** Spa team */
export const SPA_ROLES: StaffRole[] = [
  ...MGMT_ROLES,
  'spa_manager', 'spa_staff',
];

/** F&B team */
export const FNB_ROLES: StaffRole[] = [
  ...MGMT_ROLES,
  'fnb_manager', 'kitchen_staff', 'room_service_staff', 'restaurant_staff',
];

/** IT team */
export const IT_ROLES: StaffRole[] = [
  ...MGMT_ROLES,
  'it_admin', 'it_support',
];

/** Purchasing team */
export const PURCHASING_ROLES: StaffRole[] = [
  ...MGMT_ROLES,
  'purchasing_manager', 'purchasing_staff', 'purchasing',
];

/** Frontline operational staff (see My Tasks) */
export const OPS_STAFF: StaffRole[] = [
  'housekeeper', 'room_inspector', 'technician', 'bellboy', 'transport_driver',
  'room_service_staff', 'kitchen_staff', 'concierge', 'security_staff', 'spa_staff',
  'restaurant_staff', 'guest_relations', 'chat_admin', 'receptionist',
  'reservation_agent', 'night_auditor', 'front_desk', 'front_office_manager',
  'housekeeping_manager', 'maintenance_manager', 'fnb_manager', 'security_manager',
  'spa_manager', 'hr_manager', 'hr_staff', 'purchasing_manager', 'purchasing_staff',
  'it_admin', 'it_support', 'dept_head', 'shift_supervisor',
];

/** All hotel staff (any logged-in user with hotel access) */
export const ALL_STAFF: StaffRole[] = [
  ...(new Set([...MGMT_ROLES, ...OPS_STAFF, 'staff' as StaffRole, 'viewer' as StaffRole])),
];

// ─── Route → Role Permissions (for middleware) ────────────────────────────────

export const ROUTE_ROLES: Array<{ prefix: string; roles: StaffRole[] }> = [
  // Platform-only
  { prefix: '/platform',                    roles: PLATFORM_ROLES },
  // Owner/Admin only
  { prefix: '/dashboard/audit',             roles: MGMT_ROLES },
  { prefix: '/dashboard/system',            roles: MGMT_ROLES },
  { prefix: '/dashboard/launch',            roles: MGMT_ROLES },
  { prefix: '/dashboard/go-live',           roles: MGMT_ROLES },
  { prefix: '/dashboard/branding',          roles: MGMT_ROLES },
  { prefix: '/dashboard/rbac',              roles: ['owner', 'admin'] },
  { prefix: '/dashboard/permission-simulator', roles: ['owner', 'admin'] },
  // Finance
  { prefix: '/dashboard/accounting',        roles: ACC_ROLES },
  { prefix: '/dashboard/accounting-ops',    roles: ACC_ROLES },
  // Management
  { prefix: '/dashboard/reports',           roles: MGMT_ROLES },
  { prefix: '/dashboard/rates',             roles: REV_ROLES },
  { prefix: '/dashboard/pricing',           roles: REV_ROLES },
  { prefix: '/dashboard/revenue',           roles: REV_ROLES },
  { prefix: '/dashboard/channels',          roles: [...MGMT_ROLES, 'revenue_manager'] },
  { prefix: '/dashboard/marketing',         roles: REV_ROLES },
  { prefix: '/dashboard/ota',               roles: REV_ROLES },
  { prefix: '/dashboard/settings',          roles: MGMT_ROLES },
  { prefix: '/dashboard/loyalty',           roles: MGMT_ROLES },
  { prefix: '/dashboard/crm',               roles: MGMT_ROLES },
  // Department-specific
  { prefix: '/dashboard/fb',                roles: FNB_ROLES },
  { prefix: '/dashboard/kitchen',           roles: FNB_ROLES },
  { prefix: '/dashboard/restaurant',        roles: FNB_ROLES },
  { prefix: '/dashboard/room-service',      roles: FNB_ROLES },
  { prefix: '/dashboard/menu',              roles: FNB_ROLES },
  { prefix: '/dashboard/spa',               roles: SPA_ROLES },
  { prefix: '/dashboard/maintenance',       roles: MAINT_ROLES },
  { prefix: '/dashboard/concierge',         roles: CON_ROLES },
  { prefix: '/dashboard/security',          roles: SEC_ROLES },
  { prefix: '/dashboard/hr',                roles: HR_ROLES },
  { prefix: '/dashboard/purchasing',        roles: PURCHASING_ROLES },
  { prefix: '/dashboard/it',                roles: IT_ROLES },
  // Housekeeping sub-pages
  { prefix: '/dashboard/housekeeping',      roles: HK_ROLES },
];

// ─── Default Landing Page Per Role ────────────────────────────────────────────

export const DEFAULT_LANDING: Partial<Record<StaffRole, string>> = {
  platform_owner:      '/platform/overview',
  billing_admin:       '/platform/billing',
  support_admin:       '/platform/support',
  platform_ops:        '/platform/system-health',
  hotel_owner:         '/dashboard/reports',
  owner:               '/dashboard',
  general_manager:     '/dashboard',
  operations_manager:  '/dashboard/live-board',
  admin:               '/dashboard',
  manager:             '/dashboard',
  front_office_manager:'/dashboard/front-desk',
  front_desk:          '/dashboard/front-desk',
  receptionist:        '/dashboard/front-desk',
  reservation_agent:   '/dashboard/reservations',
  night_auditor:       '/dashboard/night-audit',
  housekeeping_manager:'/dashboard/housekeeping',
  housekeeping:        '/dashboard/my-tasks',
  housekeeper:         '/dashboard/my-tasks',
  room_inspector:      '/dashboard/housekeeping/inspect',
  maintenance_manager: '/dashboard/maintenance',
  maintenance:         '/dashboard/my-tasks',
  technician:          '/dashboard/my-tasks',
  engineering:         '/dashboard/my-tasks',
  fnb_manager:         '/dashboard/fb',
  kitchen_staff:       '/dashboard/kitchen',
  room_service_staff:  '/dashboard/room-service',
  restaurant_staff:    '/dashboard/restaurant',
  concierge:           '/dashboard/concierge',
  guest_relations:     '/dashboard/concierge',
  bellboy:             '/dashboard/bellboy',
  transport_driver:    '/dashboard/transport',
  revenue_manager:     '/dashboard/revenue',
  marketing_staff:     '/dashboard/marketing',
  sales:               '/dashboard/crm',
  accounting_manager:  '/dashboard/accounting',
  accounting:          '/dashboard/accounting-ops',
  accounting_staff:    '/dashboard/accounting-ops',
  purchasing_manager:  '/dashboard/purchasing',
  purchasing_staff:    '/dashboard/purchasing',
  purchasing:          '/dashboard/purchasing',
  hr_manager:          '/dashboard/hr',
  hr_staff:            '/dashboard/hr',
  spa_manager:         '/dashboard/spa',
  spa_staff:           '/dashboard/my-tasks',
  security_manager:    '/dashboard/security',
  security:            '/dashboard/my-tasks',
  security_staff:      '/dashboard/my-tasks',
  it_admin:            '/dashboard/system',
  it_support:          '/dashboard/system',
  chat_admin:          '/dashboard/concierge',
  dept_head:           '/dashboard',
  shift_supervisor:    '/dashboard',
  staff:               '/dashboard/my-tasks',
  viewer:              '/dashboard',
};

// ─── Department Mapping ───────────────────────────────────────────────────────

export const ROLE_DEPARTMENT: Partial<Record<StaffRole, string>> = {
  hotel_owner:          'executive',
  owner:                'executive',
  general_manager:      'executive',
  operations_manager:   'executive',
  admin:                'executive',
  manager:              'executive',
  front_office_manager: 'front_office',
  front_desk:           'front_office',
  receptionist:         'front_office',
  reservation_agent:    'front_office',
  night_auditor:        'front_office',
  housekeeping_manager: 'housekeeping',
  housekeeping:         'housekeeping',
  housekeeper:          'housekeeping',
  room_inspector:       'housekeeping',
  maintenance_manager:  'maintenance',
  maintenance:          'maintenance',
  technician:           'maintenance',
  engineering:          'maintenance',
  fnb_manager:          'fnb',
  kitchen_staff:        'fnb',
  room_service_staff:   'fnb',
  restaurant_staff:     'fnb',
  concierge:            'guest_services',
  guest_relations:      'guest_services',
  bellboy:              'guest_services',
  transport_driver:     'guest_services',
  chat_admin:           'guest_services',
  revenue_manager:      'revenue',
  marketing_staff:      'revenue',
  sales:                'revenue',
  accounting_manager:   'accounting',
  accounting:           'accounting',
  accounting_staff:     'accounting',
  purchasing_manager:   'purchasing',
  purchasing_staff:     'purchasing',
  purchasing:           'purchasing',
  hr_manager:           'hr',
  hr_staff:             'hr',
  spa_manager:          'spa',
  spa_staff:            'spa',
  security_manager:     'security',
  security:             'security',
  security_staff:       'security',
  it_admin:             'it',
  it_support:           'it',
  staff:                'general',
  viewer:               'general',
};

// ─── Action Permissions ───────────────────────────────────────────────────────

export const ACTION_PERMISSIONS = {
  checkIn:          FRONT_ROLES,
  checkOut:         FRONT_ROLES,
  createReservation: FRONT_ROLES,
  modifyReservation: FRONT_ROLES,
  cancelReservation: [...MGMT_ROLES, 'front_office_manager', 'reservation_agent'],
  noShow:           [...MGMT_ROLES, 'front_office_manager', 'night_auditor'],
  moveRoom:         [...MGMT_ROLES, 'front_office_manager', 'front_desk'],
  postCharge:       [...MGMT_ROLES, 'front_desk', 'accounting_staff', 'accounting'],
  postPayment:      [...MGMT_ROLES, 'accounting_manager', 'accounting_staff', 'accounting', 'front_desk'],
  printFolio:       [...MGMT_ROLES, 'front_desk', 'accounting_staff', 'accounting'],
  assignRoom:       HK_ROLES,
  startCleaning:    HK_ROLES,
  completeCleaning: HK_ROLES,
  inspectRoom:      [...MGMT_ROLES, 'housekeeping_manager', 'room_inspector'],
  createWorkOrder:  [...MGMT_ROLES, ...FRONT_ROLES, ...HK_ROLES, ...MAINT_ROLES],
  assignTechnician: MAINT_ROLES,
  oooRequest:       MAINT_ROLES,
  viewReports:      MGMT_ROLES,
  manageRates:      REV_ROLES,
  manageStaff:      HR_ROLES,
  manageSettings:   MGMT_ROLES,
} as const;

// ─── Approval Permissions ─────────────────────────────────────────────────────

export const APPROVAL_PERMISSIONS = {
  refund:         ['owner', 'admin', 'manager', 'accounting_manager'] as StaffRole[],
  discount:       ['owner', 'admin', 'manager', 'front_office_manager'] as StaffRole[],
  void:           ['owner', 'admin', 'accounting_manager'] as StaffRole[],
  compensation:   ['owner', 'admin', 'manager', 'general_manager'] as StaffRole[],
  out_of_order:   ['owner', 'admin', 'manager', 'maintenance_manager'] as StaffRole[],
  purchasing:     ['owner', 'admin', 'manager', 'purchasing_manager'] as StaffRole[],
  leave:          ['owner', 'admin', 'manager', 'hr_manager', 'dept_head'] as StaffRole[],
  late_checkout:  ['owner', 'admin', 'manager', 'front_office_manager', 'front_desk'] as StaffRole[],
  early_checkin:  ['owner', 'admin', 'manager', 'front_office_manager', 'front_desk'] as StaffRole[],
  other:          ['owner', 'admin', 'manager'] as StaffRole[],
} as const;

// ─── Mobile Role Behavior ─────────────────────────────────────────────────────

export const MOBILE_ROLE_CONFIG: Partial<Record<StaffRole, {
  primaryAction: string;
  showQrScan: boolean;
  showMyTasks: boolean;
  offlineMode: boolean;
}>> = {
  housekeeper:       { primaryAction: 'my-rooms',    showQrScan: true,  showMyTasks: true,  offlineMode: true },
  room_inspector:    { primaryAction: 'inspect',      showQrScan: true,  showMyTasks: true,  offlineMode: false },
  technician:        { primaryAction: 'my-repairs',   showQrScan: true,  showMyTasks: true,  offlineMode: true },
  maintenance:       { primaryAction: 'my-repairs',   showQrScan: true,  showMyTasks: true,  offlineMode: true },
  bellboy:           { primaryAction: 'requests',     showQrScan: false, showMyTasks: true,  offlineMode: false },
  transport_driver:  { primaryAction: 'pickups',      showQrScan: false, showMyTasks: true,  offlineMode: false },
  room_service_staff:{ primaryAction: 'orders',       showQrScan: false, showMyTasks: true,  offlineMode: false },
  kitchen_staff:     { primaryAction: 'kitchen',      showQrScan: false, showMyTasks: true,  offlineMode: false },
  security_staff:    { primaryAction: 'incidents',    showQrScan: false, showMyTasks: true,  offlineMode: false },
  front_desk:        { primaryAction: 'check-in',     showQrScan: false, showMyTasks: false, offlineMode: false },
};

// ─── Role Labels (Thai) ───────────────────────────────────────────────────────

export const ROLE_LABEL: Record<StaffRole, string> = {
  owner:               'เจ้าของ',
  admin:               'แอดมิน',
  manager:             'ผู้จัดการ',
  staff:               'พนักงาน',
  viewer:              'ผู้ดู',
  hotel_owner:         'เจ้าของโรงแรม',
  general_manager:     'ผู้จัดการทั่วไป',
  operations_manager:  'ผู้จัดการปฏิบัติการ',
  front_office_manager:'ผู้จัดการ Front Office',
  front_desk:          'พนักงานต้อนรับ',
  receptionist:        'พนักงานต้อนรับ',
  reservation_agent:   'เจ้าหน้าที่จอง',
  night_auditor:       'เจ้าหน้าที่ Night Audit',
  chat_admin:          'แอดมิน Chat',
  guest_relations:     'Guest Relations',
  housekeeping_manager:'ผู้จัดการแม่บ้าน',
  housekeeping:        'แม่บ้าน',
  housekeeper:         'แม่บ้าน',
  room_inspector:      'ผู้ตรวจห้อง',
  maintenance_manager: 'ผู้จัดการซ่อมบำรุง',
  maintenance:         'พนักงานซ่อมบำรุง',
  technician:          'ช่างเทคนิค',
  engineering:         'วิศวกร',
  fnb_manager:         'ผู้จัดการ F&B',
  kitchen_staff:       'พนักงานครัว',
  room_service_staff:  'พนักงาน Room Service',
  restaurant_staff:    'พนักงานร้านอาหาร',
  concierge:           'คอนเซียร์จ',
  bellboy:             'พนักงานยกกระเป๋า',
  transport_driver:    'คนขับรถ',
  revenue_manager:     'ผู้จัดการรายได้',
  marketing_staff:     'พนักงานการตลาด',
  sales:               'พนักงานขาย',
  accounting_manager:  'ผู้จัดการบัญชี',
  accounting:          'พนักงานบัญชี',
  accounting_staff:    'พนักงานบัญชี',
  purchasing_manager:  'ผู้จัดการจัดซื้อ',
  purchasing_staff:    'พนักงานจัดซื้อ',
  purchasing:          'พนักงานจัดซื้อ',
  hr_manager:          'ผู้จัดการ HR',
  hr_staff:            'พนักงาน HR',
  spa_manager:         'ผู้จัดการสปา',
  spa_staff:           'พนักงานสปา',
  security_manager:    'ผู้จัดการรักษาความปลอดภัย',
  security:            'รปภ.',
  security_staff:      'รปภ.',
  it_admin:            'แอดมิน IT',
  it_support:          'ช่าง IT',
  platform_owner:      'Platform Owner',
  billing_admin:       'Billing Admin',
  support_admin:       'Support Admin',
  platform_ops:        'Platform Ops',
  security_admin:      'Security Admin',
  sales_admin:         'Sales Admin',
  product_admin:       'Product Admin',
  dev_admin:           'Dev Admin',
  dept_head:           'หัวหน้าแผนก',
  shift_supervisor:    'หัวหน้ากะ',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isManagement(role: string): boolean {
  return MGMT_ROLES.includes(role as StaffRole);
}

export function isPlatformRole(role: string): boolean {
  return PLATFORM_ROLES.includes(role as StaffRole);
}

export function canApprove(role: string, approvalType: keyof typeof APPROVAL_PERMISSIONS): boolean {
  return APPROVAL_PERMISSIONS[approvalType].includes(role as StaffRole);
}

export function canPerformAction(role: string, action: keyof typeof ACTION_PERMISSIONS): boolean {
  return (ACTION_PERMISSIONS[action] as readonly StaffRole[]).includes(role as StaffRole);
}

export function getDefaultLanding(role: string): string {
  return DEFAULT_LANDING[role as StaffRole] ?? '/dashboard';
}
