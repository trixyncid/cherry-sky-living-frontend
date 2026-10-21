/**
 * Visit slots offered to leads (WIB). The office is open 08:00–17:00, so
 * the last visit starts at 16:00 and ends before closing.
 */
export const VIEWING_TIMES = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
] as const;

/** No visits on Sundays. */
export function isViewingDayClosed(date: Date): boolean {
  return date.getDay() === 0;
}

/** Visit date + slot as a Jakarta-time ISO string for the lead. */
export function viewingDateTime(date: string, time: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  return match
    ? `${date}T${match[1].padStart(2, "0")}:${match[2]}:00+07:00`
    : date;
}
