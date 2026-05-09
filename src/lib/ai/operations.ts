export type OpsRecommendationInput = {
  reservations?: Array<{ id?: string; checkIn?: string; checkOut?: string; roomTypeId?: string; priority?: number }>;
  rooms?: Array<{ id?: string; roomTypeId?: string; status?: string }>;
  staff?: Array<{ id?: string; role?: string; openTasks?: number }>;
  complaints?: Array<{ id?: string; sentiment?: number; message?: string }>;
};

export function recommendRoomAssignments(input: OpsRecommendationInput) {
  const rooms = input.rooms || [];
  const reservations = input.reservations || [];
  return reservations.map((reservation, index) => {
    const match = rooms.find((room) => room.status !== 'occupied' && (!reservation.roomTypeId || room.roomTypeId === reservation.roomTypeId));
    return {
      reservationId: reservation.id || `reservation-${index + 1}`,
      roomId: match?.id || rooms[index % Math.max(rooms.length, 1)]?.id || null,
      confidence: match ? 0.86 : 0.42,
      reason: match ? 'room_type_and_status_match' : 'fallback_rotation',
    };
  });
}

export function balanceStaffWorkload(input: OpsRecommendationInput) {
  return [...(input.staff || [])]
    .sort((a, b) => (a.openTasks || 0) - (b.openTasks || 0))
    .map((member, rank) => ({ staffId: member.id || `staff-${rank + 1}`, rank: rank + 1, recommendedNextTask: rank === 0 ? 'assign_next_open_task' : 'standby_or_support' }));
}

export function detectComplaintSignals(input: OpsRecommendationInput) {
  return (input.complaints || []).map((complaint) => {
    const text = (complaint.message || '').toLowerCase();
    const severe = (complaint.sentiment ?? 0) < -0.4 || /refund|angry|dirty|unsafe|complaint|แย่|สกปรก|คืนเงิน/.test(text);
    return { complaintId: complaint.id || 'complaint', severity: severe ? 'high' : 'normal', escalate: severe };
  });
}
