# Workflow Engine

> Implementation: `src/lib/workflows/`, `src/lib/approvals/`, `src/lib/sla/`

## Room Status State Machine

```
available
  ↓ check_in
occupied
  ↓ checkout
dirty
  ↓ housekeeping_done
pending_inspection
  ↓ inspection_pass      ↓ inspection_fail
available               dirty (re-queued)

Any status
  ↓ maintenance_ooo
out_of_order
  ↓ maintenance_fixed
pending_inspection
```

### Side Effects per Transition

| Trigger | Side effect |
|---|---|
| `checkout` | Create housekeeping task for room |
| `housekeeping_done` | Create inspection task, notify room_inspector |
| `inspection_pass` | Notify front_desk (room available) |
| `inspection_fail` | Re-create housekeeping task |
| `maintenance_ooo` | Block room inventory (status = out_of_order) |
| `maintenance_fixed` | Unblock room, create cleaning task |

Every transition writes:
1. `room_status_events` row (timestamp, from_status, to_status, actor)
2. `audit_logs` row (non-throwing)
3. Notification to relevant roles (non-throwing)

**Code**: `src/lib/workflows/room-status.ts`

---

## Approval Workflow

```
Request created
  ↓ createApproval()
approvals row: status=pending
  ↓ queueNotification() → approvers notified
Approver acts
  ↓ resolveApproval()
status: approved | rejected | escalated
  ↓ Requester notified
  ↓ audit_log written
```

### Approval Types and Gates

| Type | Auto-trigger | Manual-trigger |
|---|---|---|
| `refund` | `payments/refund` POST > 1,000 THB | Any manager |
| `out_of_order` | `work-orders/ooo` POST | Maintenance manager |
| `discount` | — | Front desk / manager |
| `void` | — | Accounting |
| `compensation` | — | Front desk / manager |
| `purchasing` | — | Purchasing staff |
| `leave` | — | Any staff |
| `late_checkout` | — | Front desk |
| `early_checkin` | — | Front desk |

**Code**: `src/lib/approvals/index.ts`

---

## SLA Breach Detection

`src/lib/sla/index.ts` — `checkSLABreaches(hotelId)`

Checks:
1. `work_orders` open > SLA minutes (`department_sla_rules.max_resolution_minutes`)
2. `approvals` pending > 24 hours

On breach: queues high-priority notification to MGMT_ROLES.

Intended to be called by a cron job (e.g., every 30 minutes):
```
GET /api/cron/sla-check (requires CRON_SECRET header)
```

---

## Notification System

`src/lib/notifications.ts` — `queueNotification(payload)`

1. Queries `user_profiles` for active staff with matching `role IN roles[]` at same hotel
2. Bulk inserts into `staff_notifications` table
3. Non-throwing — never crashes main flow

```typescript
await queueNotification({
  hotelId:  'uuid',
  type:     'string (event type)',
  priority: 'critical' | 'high' | 'normal' | 'low',
  roles:    StaffRole[],
  title:    'Thai title',
  body:     'Body text',
  deepLink: '/dashboard/...',
  metadata: { ... },
});
```

Staff read notifications via `GET /api/notifications?unread=true&limit=50`.

---

## Audit Log

`src/lib/audit.ts` — `writeAuditLog(entry)`

Always writes. Never throws. If insert fails, logs to console only.

Schema: `audit_logs(hotel_id, actor_id, action, entity_type, entity_id, metadata, created_at)`

---

## Database Tables (Migration 0006)

| Table | Purpose |
|---|---|
| `approvals` | Approval requests with status lifecycle |
| `approval_logs` | Immutable history of every approval action |
| `department_sla_rules` | Per-department SLA config |
| `guest_request_routes` | Routing rules for guest requests |
| `room_status_events` | Immutable log of every room status change |
| `workflow_templates` | Reusable task templates |
| `task_comments` | Comments on tasks/work orders |
| `task_attachments` | File attachments on tasks |
| `operational_incidents` | Damage reports, incidents |
| `shift_handovers` | Shift handover notes |
| `staff_notifications` | In-app notifications per staff member |

All tables have RLS policies scoped to `hotel_id` / `organization_id`.
