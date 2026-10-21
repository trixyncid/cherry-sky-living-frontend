import type { Lease, LeaseInvoice, LeaseStatus } from "@/lib/types/admin";

export type TenantPaymentView = {
  /** paid = everything due so far is paid (or all bills paid). */
  status: LeaseStatus;
  /** Amount to pay now / in review / paid so far. */
  amount: number;
  lateFee: number;
  daysLate: number;
  dueDate: string | null;
  /** Next bill that isn't due yet (shown once the tenant is up to date). */
  next: { amount: number; dueDate: string } | null;
};

function isDueToday(invoice: LeaseInvoice, now: Date): boolean {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return new Date(invoice.dueDate) <= today || invoice.daysLate > 0;
}

/**
 * What the tenant should see about paying: the bills due now (with late
 * fees), a receipt being checked, or "paid" plus the next bill. Falls back to
 * the lease's single-bill fields for older responses without a schedule.
 */
export function tenantPaymentView(
  lease: Lease,
  now: Date = new Date(),
): TenantPaymentView {
  const invoices = lease.invoices ?? [];
  if (!lease.billing || invoices.length === 0) {
    const paid = lease.status === "paid";
    return {
      status: lease.status,
      amount: lease.amountDue ?? 0,
      lateFee: paid ? 0 : Math.max(0, lease.lateFeeAmount ?? 0),
      daysLate: paid ? 0 : Math.max(0, lease.daysLate ?? 0),
      dueDate: lease.paymentDueDate ?? null,
      next: null,
    };
  }

  const open = invoices.filter((inv) => inv.status !== "paid");
  const dueUnpaid = open.filter(
    (inv) => inv.status === "unpaid" && isDueToday(inv, now),
  );
  const inReview = open.filter((inv) => inv.status === "waiting_for_review");
  const sum = (rows: LeaseInvoice[], pick: (inv: LeaseInvoice) => number) =>
    rows.reduce((s, inv) => s + pick(inv), 0);

  if (dueUnpaid.length > 0) {
    return {
      status: "unpaid",
      amount: sum(dueUnpaid, (inv) => inv.amount),
      lateFee: sum(dueUnpaid, (inv) => inv.lateFeeAmount),
      daysLate: Math.max(...dueUnpaid.map((inv) => inv.daysLate)),
      dueDate: dueUnpaid[0]?.dueDate ?? null,
      next: null,
    };
  }
  if (inReview.length > 0) {
    return {
      status: "waiting_for_review",
      amount: sum(inReview, (inv) => inv.amount),
      lateFee: sum(inReview, (inv) => inv.lateFeeAmount),
      daysLate: 0,
      dueDate: inReview[0]?.dueDate ?? null,
      next: null,
    };
  }
  const nextBill = open[0];
  // Move-in bill not due yet: it's still the one to pay.
  if (nextBill && lease.billing.paidCount === 0) {
    return {
      status: "unpaid",
      amount: nextBill.amount,
      lateFee: 0,
      daysLate: 0,
      dueDate: nextBill.dueDate,
      next: null,
    };
  }
  return {
    status: "paid",
    amount: lease.billing.paidAmount,
    lateFee: 0,
    daysLate: 0,
    dueDate: null,
    next: nextBill
      ? { amount: nextBill.amount, dueDate: nextBill.dueDate }
      : null,
  };
}
