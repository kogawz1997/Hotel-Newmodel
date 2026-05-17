import { type StaffRole } from '@/lib/auth/roles';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'suspended'
  | 'cancelled';

export type PlanCode = 'starter' | 'professional' | 'enterprise' | string;

export type TenantContext = {
  web: 'tenant';
  userId: string;
  email: string;
  /** Primary role — drives sidebar/navigation/default landing */
  role: StaffRole;
  /** Additional roles granted for this hotel — may be empty */
  additionalRoles: StaffRole[];
  /** Union of primary + additional roles — use for all permission checks */
  allRoles: StaffRole[];
  organizationId: string;
  hotelId: string;
  plan: PlanCode;
  subscriptionStatus: SubscriptionStatus;
  impersonation?: {
    realUserId: string;
    reason: string;
    expiresAt: string;
  };
};
