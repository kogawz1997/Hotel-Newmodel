export type GuestContext = {
  web: 'guest';
  userId: string;
  guestAccountId: string;
  /** Reservation IDs the guest has verified ownership of in this session */
  verifiedReservationIds: string[];
};
