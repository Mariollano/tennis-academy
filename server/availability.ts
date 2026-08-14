/**
 * A booked group session must remain visible to its players. An iCal block can
 * stop an unbooked session from accepting new players, but it must not make an
 * already-booked 105 Clinic disappear from the public calendar.
 */
export function shouldShowScheduledSlot(activeBookings: number, hasBlockingOverlap: boolean): boolean {
  return activeBookings > 0 || !hasBlockingOverlap;
}
