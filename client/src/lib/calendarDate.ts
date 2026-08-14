/**
 * Returns the calendar date shown on the device, in YYYY-MM-DD form.
 * This deliberately does not use UTC because Coach Mario's "Today" should
 * remain the Rhode Island calendar day through the evening.
 */
export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
