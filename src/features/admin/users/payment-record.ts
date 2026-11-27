import type { Lease } from "@/lib/types/admin";

export type PaymentRecord = {
  /** Bills that were due (paid, or unpaid and past due). */
  bills: number;
  /** Paid after the due date, or still unpaid past it. */
  late: number;
  /** Late fees an admin waived, and their total. */
  waived: number;
  waivedTotal: number;
};

/** Calendar day in Jakarta: bills are dated Jakarta midnight (17:00 UTC the day before). */
const jakartaDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
});
const dayKey = (value: string | Date) => jakartaDay.format(new Date(value));

/**
 * A tenant's payment track record across their leases: how often they paid
 * late and how many late fees were waived (waived fees still count here).
 */
export function paymentRecord(
  leases: Pick<Lease, "invoices">[],
  today: Date = new Date(),
): PaymentRecord {
  const todayKey = dayKey(today);
  const record: PaymentRecord = {
    bills: 0,
    late: 0,
    waived: 0,
    waivedTotal: 0,
  };
  for (const lease of leases) {
    for (const inv of lease.invoices ?? []) {
      const due = dayKey(inv.dueDate);
      const paidLate =
        inv.status === "paid" && inv.paidAt != null && dayKey(inv.paidAt) > due;
      const overdue = inv.status !== "paid" && todayKey > due;
      if (inv.status === "paid" || overdue) record.bills++;
      if (paidLate || overdue) record.late++;
      if (inv.lateFeeWaived) {
        record.waived++;
        record.waivedTotal += inv.lateFeeWaivedAmount ?? 0;
      }
    }
  }
  return record;
}
