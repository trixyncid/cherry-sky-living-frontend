import { describe, expect, test } from "bun:test";
import type { Lease, LeaseInvoice } from "@/lib/types/admin";
import { tenantPaymentView } from "./payment-view";

const now = new Date(2026, 10, 11, 9); // 11 Nov 2026
function inv(
  sequence: number,
  status: LeaseInvoice["status"],
  due: Date,
  extra: Partial<LeaseInvoice> = {},
): LeaseInvoice {
  return {
    id: `inv${sequence}`,
    leaseId: "l1",
    sequence,
    periodStart: due.toISOString(),
    periodEnd: due.toISOString(),
    amount: 2_000_000,
    dueDate: due.toISOString(),
    status,
    paidAt: null,
    proofAttachmentId: null,
    lateFeePerDay: 100_000,
    lateFeeWaived: false,
    lateFeeWaiveReason: null,
    lateFeeCharged: 0,
    daysLate: 0,
    lateFeeAmount: 0,
    ...extra,
  };
}
function lease(invoices: LeaseInvoice[]): Lease {
  const paid = invoices.filter((i) => i.status === "paid");
  return {
    status: invoices[0]?.status ?? "unpaid",
    amountDue: invoices.reduce((s, i) => s + i.amount, 0),
    invoices,
    billing: {
      state: "current",
      invoiceCount: invoices.length,
      paidCount: paid.length,
      paidAmount: paid.reduce((s, i) => s + i.amount, 0),
      outstandingAmount: 0,
      overdueCount: 0,
      lateFeeAccrued: 0,
      nextInvoice: null,
    },
  } as unknown as Lease;
}

describe("tenantPaymentView", () => {
  test("overdue November on a monthly lease → that bill + its late fee, not the whole lease", () => {
    const v = tenantPaymentView(
      lease([
        inv(1, "paid", new Date(2026, 9, 5)),
        inv(2, "unpaid", new Date(2026, 10, 5), {
          daysLate: 6,
          lateFeeAmount: 600_000,
        }),
        inv(3, "unpaid", new Date(2026, 11, 5)),
      ]),
      now,
    );
    expect(v).toMatchObject({
      status: "unpaid",
      amount: 2_000_000,
      lateFee: 600_000,
      daysLate: 6,
    });
  });

  test("up to date → paid with the next bill", () => {
    const v = tenantPaymentView(
      lease([
        inv(1, "paid", new Date(2026, 10, 5)),
        inv(2, "unpaid", new Date(2026, 11, 5)),
      ]),
      now,
    );
    expect(v.status).toBe("paid");
    expect(v.next?.amount).toBe(2_000_000);
  });

  test("move-in bill not due yet is still the one to pay", () => {
    const v = tenantPaymentView(
      lease([inv(1, "unpaid", new Date(2026, 11, 5))]),
      now,
    );
    expect(v).toMatchObject({
      status: "unpaid",
      amount: 2_000_000,
      daysLate: 0,
    });
  });

  test("receipt sent → in review", () => {
    const v = tenantPaymentView(
      lease([
        inv(1, "paid", new Date(2026, 9, 5)),
        inv(2, "waiting_for_review", new Date(2026, 10, 5)),
      ]),
      now,
    );
    expect(v.status).toBe("waiting_for_review");
  });
});
