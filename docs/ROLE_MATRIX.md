# Role Permission Matrix

> Source of truth: `src/lib/auth/roles.ts`
> Last updated: auto-derived from roles.ts

## Role Groups

| Group | Roles included |
|---|---|
| `MGMT_ROLES` | owner, admin, manager, hotel_owner, general_manager, operations_manager |
| `FRONT_ROLES` | +MGMT + front_office_manager, front_desk, receptionist, reservation_agent, night_auditor |
| `HK_ROLES` | +MGMT + housekeeping_manager, housekeeping, housekeeper, room_inspector |
| `MAINT_ROLES` | +MGMT + maintenance_manager, maintenance, technician, engineering |
| `SEC_ROLES` | +MGMT + security_manager, security, security_staff |
| `CON_ROLES` | +MGMT + concierge, bellboy, transport_driver, guest_relations |
| `ACC_ROLES` | +MGMT + accounting_manager, accounting, accounting_staff |
| `HR_ROLES` | +MGMT + hr_manager, hr_staff |
| `REV_ROLES` | +MGMT + revenue_manager, marketing_staff, sales |
| `SPA_ROLES` | +MGMT + spa_manager, spa_staff |
| `FNB_ROLES` | +MGMT + fnb_manager, kitchen_staff, room_service_staff, restaurant_staff |
| `IT_ROLES` | +MGMT + it_admin, it_support |
| `PURCHASING_ROLES` | +MGMT + purchasing_manager, purchasing_staff, purchasing |

## Route Protection

| Route pattern | Required roles |
|---|---|
| `/dashboard/front-desk` | FRONT_ROLES |
| `/dashboard/housekeeping` | HK_ROLES |
| `/dashboard/work-orders` | MAINT_ROLES |
| `/dashboard/accounting` | ACC_ROLES |
| `/dashboard/hr` | HR_ROLES |
| `/dashboard/revenue` | REV_ROLES |
| `/dashboard/spa` | SPA_ROLES |
| `/dashboard/fb` | FNB_ROLES |
| `/dashboard/security` | SEC_ROLES |
| `/dashboard/purchasing` | PURCHASING_ROLES |
| `/dashboard/approvals` | MGMT_ROLES + dept managers |
| `/owner/*` | owner, hotel_owner, general_manager |
| `/admin/*` | is_platform_admin = true |
| `/platform/*` | is_platform_admin = true |

## Action Permissions (ACTION_PERMISSIONS)

| Action | Allowed roles |
|---|---|
| `checkIn` | front_desk, receptionist, reservation_agent, front_office_manager, night_auditor + MGMT |
| `checkOut` | same as checkIn |
| `postCharge` | same as checkIn |
| `viewFolio` | + accounting_manager, accounting, accounting_staff |
| `editRates` | revenue_manager, front_office_manager + MGMT |
| `assignHousekeeping` | housekeeping_manager + MGMT |
| `approveWorkOrder` | maintenance_manager + MGMT |
| `viewReports` | all managers + accounting + revenue_manager |
| `manageStaff` | hr_manager + MGMT |
| `managePurchasing` | purchasing_manager + MGMT |

## Approval Permissions (APPROVAL_PERMISSIONS)

| Approval type | Who can approve |
|---|---|
| `refund` | accounting_manager, owner, admin |
| `discount` | front_office_manager, revenue_manager, manager, owner, admin |
| `void` | accounting_manager, owner, admin |
| `compensation` | manager, owner, admin |
| `out_of_order` | maintenance_manager, operations_manager, manager, owner, admin |
| `purchasing` | purchasing_manager, accounting_manager, manager, owner, admin |
| `leave` | hr_manager, manager, owner, admin |
| `late_checkout` | front_office_manager, manager, owner, admin |
| `early_checkin` | front_office_manager, manager, owner, admin |
| `other` | manager, owner, admin |

## Platform Roles

| Role | Access |
|---|---|
| `platform_owner` | is_platform_admin, full system access |
| `billing_admin` | Billing management |
| `support_admin` | Support ticket access, read-only impersonation |
| `platform_ops` | Operations, deployments |
| `security_admin` | Security audit, session management |
| `sales_admin` | CRM, leads, conversion tracking |
| `product_admin` | Feature flags, A/B tests |
| `dev_admin` | Engineering panel, error monitoring |

## How Role Checks Work

1. **API routes** — `requireHotelAccess(hotelId, roles?)` in `src/lib/auth/guards.ts`
2. **Page routes** — `requireDashboardRole(roles)` in `src/lib/auth/page-guards.ts`  
3. **Middleware** — `ROUTE_ROLES` array from `roles.ts` protects at edge
4. **Sidebar** — Each item has a `roles` array; items are filtered per logged-in role
