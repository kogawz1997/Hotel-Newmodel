import {
  canPerformActionMulti,
  canApproveMulti,
  isManagementMulti,
  getAccessibleRoutes,
  getPrimaryDisplayRole,
} from '@/lib/auth/roles';

describe('multi-role helpers', () => {
  describe('canPerformActionMulti', () => {
    it('returns true when primary role allows the action', () => {
      expect(canPerformActionMulti(['front_desk'], 'checkIn')).toBe(true);
    });

    it('returns true when an additional role allows the action', () => {
      // housekeeper primary, but also has front_desk as additional
      expect(canPerformActionMulti(['housekeeper', 'front_desk'], 'checkIn')).toBe(true);
    });

    it('returns false when no role allows the action', () => {
      expect(canPerformActionMulti(['housekeeper', 'kitchen_staff'], 'checkIn')).toBe(false);
    });

    it('returns false for empty role list', () => {
      expect(canPerformActionMulti([], 'checkIn')).toBe(false);
    });
  });

  describe('canApproveMulti', () => {
    it('returns true when one of the roles can approve refund', () => {
      // staff normally cannot, but has accounting_manager as additional
      expect(canApproveMulti(['staff', 'accounting_manager'], 'refund')).toBe(true);
    });

    it('returns false when no role can approve', () => {
      expect(canApproveMulti(['front_desk', 'kitchen_staff'], 'refund')).toBe(false);
    });
  });

  describe('isManagementMulti', () => {
    it('returns true when one of the roles is management', () => {
      expect(isManagementMulti(['housekeeper', 'manager'])).toBe(true);
    });

    it('returns false when no role is management', () => {
      expect(isManagementMulti(['housekeeper', 'kitchen_staff'])).toBe(false);
    });
  });

  describe('getAccessibleRoutes', () => {
    it('returns routes for all roles combined', () => {
      const routes = getAccessibleRoutes(['front_desk', 'housekeeping_manager']);
      // front_desk routes
      expect(routes.some(r => r.startsWith('/dashboard/front-desk') || r.startsWith('/dashboard/reservations'))).toBe(true);
      // housekeeping_manager routes
      expect(routes.some(r => r.startsWith('/dashboard/housekeeping'))).toBe(true);
    });

    it('returns no duplicate prefixes', () => {
      const routes = getAccessibleRoutes(['manager', 'manager']);
      const unique = [...new Set(routes)];
      expect(routes.length).toBe(unique.length);
    });
  });

  describe('getPrimaryDisplayRole', () => {
    it('returns the highest-priority role', () => {
      // manager appears before front_desk in ALL_ROLES
      expect(getPrimaryDisplayRole(['front_desk', 'manager'])).toBe('manager');
    });

    it('returns single role as-is', () => {
      expect(getPrimaryDisplayRole(['revenue_manager'])).toBe('revenue_manager');
    });

    it('falls back to staff for unknown roles', () => {
      expect(getPrimaryDisplayRole(['unknown_role'])).toBe('staff');
    });
  });
});
