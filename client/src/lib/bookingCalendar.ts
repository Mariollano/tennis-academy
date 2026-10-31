export type BookingCalendarSlot = {
  slotDate: unknown;
  isFull?: boolean;
};

/** Converts a database slot date to a local calendar date without timezone drift. */
export function slotDateToCalendarDate(raw: unknown): Date | undefined {
  const dateKey = typeof raw === "string"
    ? raw.slice(0, 10)
    : raw instanceof Date
      ? `${raw.getUTCFullYear()}-${String(raw.getUTCMonth() + 1).padStart(2, "0")}-${String(raw.getUTCDate()).padStart(2, "0")}`
      : "";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return undefined;

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Returns the earliest date that still has a bookable slot. */
export function getFirstBookableSlotDate(slots: BookingCalendarSlot[]): Date | undefined {
  const bookableSlot = slots.find((slot) => !slot.isFull);
  return bookableSlot ? slotDateToCalendarDate(bookableSlot.slotDate) : undefined;
}
