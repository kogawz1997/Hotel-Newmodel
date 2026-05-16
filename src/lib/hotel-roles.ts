/**
 * Backward-compatibility re-exports from the central roles file.
 * New code should import directly from @/lib/auth/roles.
 * Team management APIs (team/route.ts, team/invite/route.ts etc.) use HOTEL_ROLES as a Zod enum.
 */
export { ALL_ROLES as HOTEL_ROLES, ROLE_LABEL as HOTEL_ROLE_LABEL } from '@/lib/auth/roles';
export type { StaffRole as HotelRole } from '@/lib/auth/roles';
