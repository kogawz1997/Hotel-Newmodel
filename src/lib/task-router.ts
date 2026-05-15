// Maps work order types to the roles that can handle them
export const TASK_ROLE_MAP: Record<string, string[]> = {
  housekeeping:  ['housekeeper', 'housekeeping_manager'],
  maintenance:   ['technician', 'maintenance_manager'],
  room_service:  ['room_service_staff', 'fnb_manager'],
  concierge:     ['concierge', 'guest_relations'],
  security:      ['security_staff', 'security_manager'],
  transport:     ['transport_driver', 'concierge'],
  bellboy:       ['bellboy', 'concierge'],
  fnb:           ['kitchen_staff', 'fnb_manager'],
  spa:           ['spa_staff', 'spa_manager'],
  other:         ['front_desk', 'operations_manager'],
};

export const SLA_MINUTES: Record<string, number> = {
  housekeeping: 45,
  maintenance:  60,
  room_service: 30,
  concierge:    20,
  security:     10,
  transport:    15,
  bellboy:      10,
  fnb:          25,
  spa:          0,
  other:        30,
};

export function getSLADeadline(type: string): Date {
  const mins = SLA_MINUTES[type] ?? 30;
  const d = new Date();
  d.setMinutes(d.getMinutes() + mins);
  return d;
}

export function getRolesForType(type: string): string[] {
  return TASK_ROLE_MAP[type] ?? TASK_ROLE_MAP.other;
}
